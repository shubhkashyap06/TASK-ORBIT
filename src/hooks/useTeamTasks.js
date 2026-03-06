import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useProject } from '../context/ProjectContext'

/**
 * Fetches all tasks for all members across all of the user's projects.
 * Returns memberTaskMap: { [userId]: { member, tasks[] } }
 */
export function useTeamTasks() {
    const { user } = useAuth()
    const { projects, getMembersForProject } = useProject()
    const [memberTaskMap, setMemberTaskMap] = useState({})
    const [loading, setLoading] = useState(true)
    const channelRef = useRef(null)

    const fetchTeamTasks = useCallback(async () => {
        if (!user || projects.length === 0) { setLoading(false); return }

        setLoading(true)

        const projectIds = projects.map(p => p.id)

        // Fetch all tasks across all projects
        const { data: allTasks } = await supabase
            .from('tasks')
            .select('*')
            .in('project_id', projectIds)
            .order('created_at', { ascending: false })

        // Gather all unique members across all projects
        const allMembersMap = {} // userId -> member
        for (const p of projects) {
            const members = getMembersForProject(p.id)
            for (const m of members) {
                if (!allMembersMap[m.userId]) {
                    allMembersMap[m.userId] = m
                }
            }
        }

        // Group tasks by assignee (or creator if unassigned)
        const map = {}
        for (const memberId of Object.keys(allMembersMap)) {
            map[memberId] = {
                member: allMembersMap[memberId],
                tasks: []
            }
        }

        for (const task of (allTasks || [])) {
            const targetId = task.assigned_user_id || task.user_id || task.created_by
            if (targetId && map[targetId]) {
                map[targetId].tasks.push(task)
            }
        }

        setMemberTaskMap(map)
        setLoading(false)
    }, [user, projects, getMembersForProject])

    useEffect(() => { fetchTeamTasks() }, [fetchTeamTasks])

    // Realtime: refresh when tasks change
    useEffect(() => {
        if (!user || projects.length === 0) return

        const channel = supabase
            .channel('team-tasks-realtime')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                () => { fetchTeamTasks() }
            )
            .subscribe()

        channelRef.current = channel
        return () => { supabase.removeChannel(channel) }
    }, [user, projects, fetchTeamTasks])

    return { memberTaskMap, loading, refetch: fetchTeamTasks }
}
