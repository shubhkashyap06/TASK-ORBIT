import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useProject } from '../context/ProjectContext'

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const startOfDay = (d = new Date()) => { const r = new Date(d); r.setHours(0, 0, 0, 0); return r }
const addDays = (d, n) => new Date(d.getTime() + n * 86400000)

function getWeekBounds(weeksAgo = 0) {
    const now = new Date()
    // Monday as week start
    const day = now.getDay() === 0 ? 7 : now.getDay()
    const monday = startOfDay(addDays(now, -(day - 1) - weeksAgo * 7))
    const sunday = addDays(monday, 7)
    return { start: monday, end: sunday }
}

function getMonthBounds(monthsAgo = 0) {
    const now = new Date()
    const year = now.getMonth() < monthsAgo
        ? now.getFullYear() - Math.ceil((monthsAgo - now.getMonth()) / 12)
        : now.getFullYear()
    const month = ((now.getMonth() - monthsAgo) % 12 + 12) % 12
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0, 23, 59, 59)
    return { start, end, year, month }
}

function scoreFromStats({ completed, created, overdue }) {
    if (created === 0) return 0
    const base = (completed / Math.max(created, 1)) * 100
    const penalty = (overdue / Math.max(completed + overdue, 1)) * 30
    return Math.max(0, Math.min(100, Math.round(base - penalty)))
}

function motivationalMessage(score, pctChange) {
    if (score >= 90) return "🏆 Exceptional week! You're at the top of your game."
    if (score >= 75) return "🔥 Great productivity! Keep this momentum going."
    if (score >= 55) return "💪 Solid week. A little more focus and you'll crush it."
    if (score >= 35) return "📈 Room to grow — try batching similar tasks together."
    return "🌱 Every journey starts somewhere. Set 1 clear goal for next week."
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/* ─────────────────────────────────────────
   Main hook
───────────────────────────────────────── */
export function useProductivityStats() {
    const { user } = useAuth()
    const { projects } = useProject()
    const [allTasks, setAllTasks] = useState([])
    const [archivedTasks, setArchivedTasks] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        if (!user) return
        setLoading(true)

        // Live tasks
        const { data: live } = await supabase
            .from('tasks')
            .select('id, user_id, project_id, assigned_user_id, status, priority, due_date, completed_at, created_at')
            .or(`user_id.eq.${user.id},assigned_user_id.eq.${user.id}`)
            .order('created_at', { ascending: true })

        // Archived tasks (still count for analytics!)
        const { data: archived } = await supabase
            .from('archived_tasks')
            .select('id, user_id, project_id, assigned_user_id, priority, due_date, completed_at, archived_at')
            .eq('user_id', user.id)
            .order('completed_at', { ascending: true })

        setAllTasks(live || [])
        setArchivedTasks(archived || [])
        setLoading(false)
    }, [user])

    useEffect(() => { fetchData() }, [fetchData])

    /* ── Derive all computed stats ── */
    const stats = useMemo(() => {
        const projectIds = new Set(projects.map(p => p.id))

        // All "done" tasks (live + archived)
        const doneTasks = [
            ...allTasks.filter(t => t.status === 'done' && t.completed_at),
            ...archivedTasks.filter(t => t.completed_at),
        ]

        const isTeam = (t) => t.project_id && projectIds.has(t.project_id)
        const isPersonal = (t) => !t.project_id

        /* ── Weekly ── */
        const thisWeek = getWeekBounds(0)
        const lastWeek = getWeekBounds(1)
        const inRange = (t, start, end, field = 'completed_at') => {
            const d = t[field] ? new Date(t[field]) : null
            return d && d >= start && d < end
        }

        const completedThisWeek = doneTasks.filter(t => inRange(t, thisWeek.start, thisWeek.end))
        const completedLastWeek = doneTasks.filter(t => inRange(t, lastWeek.start, lastWeek.end))
        const createdThisWeek = allTasks.filter(t => inRange(t, thisWeek.start, thisWeek.end, 'created_at'))

        const overdueThisWeek = allTasks.filter(t => {
            if (!t.due_date) return false
            const due = new Date(t.due_date + 'T00:00:00')
            return due >= thisWeek.start && due < thisWeek.end && t.status !== 'done' && due < new Date()
        })

        const pctChange = completedLastWeek.length === 0
            ? (completedThisWeek.length > 0 ? 100 : 0)
            : Math.round(((completedThisWeek.length - completedLastWeek.length) / completedLastWeek.length) * 100)

        const weekScore = scoreFromStats({ completed: completedThisWeek.length, created: createdThisWeek.length, overdue: overdueThisWeek.length })

        // Tasks per weekday (this week)
        const byDay = WEEKDAYS.map((day, i) => {
            const dayStart = addDays(thisWeek.start, i)
            const dayEnd = addDays(thisWeek.start, i + 1)
            return { day, completed: doneTasks.filter(t => inRange(t, dayStart, dayEnd)).length }
        })

        // Most productive day
        const busiestDay = [...byDay].sort((a, b) => b.completed - a.completed)[0]

        /* ── Monthly ── */
        const thisMonth = getMonthBounds(0)
        const lastMonth = getMonthBounds(1)
        const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        const completedThisMonth = doneTasks.filter(t => inRange(t, thisMonth.start, thisMonth.end))
        const completedLastMonth = doneTasks.filter(t => inRange(t, lastMonth.start, lastMonth.end))
        const createdThisMonth = allTasks.filter(t => inRange(t, thisMonth.start, thisMonth.end, 'created_at'))

        // Per-week breakdown within current month (4 weeks)
        const monthlyWeeks = Array.from({ length: 4 }, (_, wi) => {
            const wStart = addDays(thisMonth.start, wi * 7)
            const wEnd = addDays(wStart, 7)
            return {
                name: `Wk ${wi + 1}`,
                completed: completedThisMonth.filter(t => inRange(t, wStart, wEnd)).length,
            }
        })

        const mostProductiveWeek = [...monthlyWeeks].sort((a, b) => b.completed - a.completed)[0]

        // Avg completion time (completed_at - created_at in days)
        const completionTimes = completedThisMonth
            .filter(t => t.created_at)
            .map(t => (new Date(t.completed_at) - new Date(t.created_at)) / 86400000)
        const avgCompletionDays = completionTimes.length
            ? +(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length).toFixed(1)
            : null

        // Priority distribution
        const priorityDist = ['high', 'medium', 'low'].map(p => ({
            name: p.charAt(0).toUpperCase() + p.slice(1),
            value: completedThisMonth.filter(t => t.priority === p).length,
        })).filter(p => p.value > 0)

        // Status distribution of live tasks
        const statusDist = [
            { name: 'To Do', value: allTasks.filter(t => t.status === 'todo').length, fill: '#a78bfa' },
            { name: 'In Progress', value: allTasks.filter(t => t.status === 'in-progress').length, fill: '#60a5fa' },
            { name: 'Done', value: allTasks.filter(t => t.status === 'done').length, fill: '#34d399' },
        ]

        // Last 6 months trend
        const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
            const b = getMonthBounds(5 - i)
            return {
                name: MONTH_NAMES[b.month],
                completed: doneTasks.filter(t => inRange(t, b.start, b.end)).length,
            }
        })

        // Personal vs team
        const personalDone = completedThisMonth.filter(isPersonal).length
        const teamDone = completedThisMonth.filter(isTeam).length

        // Overdue % this month
        const overdueMonth = allTasks.filter(t => {
            if (!t.due_date) return false
            const due = new Date(t.due_date + 'T00:00:00')
            return due >= thisMonth.start && due < thisMonth.end && t.status !== 'done' && due < new Date()
        })
        const overduePercent = createdThisMonth.length > 0
            ? Math.round((overdueMonth.length / createdThisMonth.length) * 100)
            : 0

        return {
            weekly: {
                completed: completedThisWeek.length,
                created: createdThisWeek.length,
                overdue: overdueThisWeek.length,
                pctChange,
                score: weekScore,
                byDay,
                busiestDay: busiestDay?.day || '—',
                personalDone: completedThisWeek.filter(isPersonal).length,
                teamDone: completedThisWeek.filter(isTeam).length,
                motivation: motivationalMessage(weekScore, pctChange),
            },
            monthly: {
                completed: completedThisMonth.length,
                completedLastMonth: completedLastMonth.length,
                created: createdThisMonth.length,
                overdue: overdueMonth.length,
                overduePercent,
                avgCompletionDays,
                weeklyBreakdown: monthlyWeeks,
                mostProductiveWeek: mostProductiveWeek?.name || 'Week 1',
                priorityDist,
                statusDist,
                trend: monthlyTrend,
                personalDone,
                teamDone,
                monthName: MONTH_NAMES[thisMonth.month],
            },
        }
    }, [allTasks, archivedTasks, projects])

    return { stats, loading, refetch: fetchData }
}
