import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useProject } from '../context/ProjectContext'
import { useTasks } from '../hooks/useTasks'
import { useReminders } from '../hooks/useReminders'
import KanbanBoard from '../components/KanbanBoard'
import MobileKanbanList from '../components/MobileKanbanList'
import CalendarView from '../components/CalendarView'
import TeamView from '../components/TeamView'
import TaskModal from '../components/TaskModal'
import CollabPanel from '../components/ProjectSelector'
import NotificationBell from '../components/NotificationBell'
import ActivityPanel from '../components/ActivityPanel'
import ArchivePanel from '../components/ArchivePanel'
import { useArchive } from '../hooks/useArchive'
import ProductivityReview from '../components/ProductivityReview'

export default function Dashboard() {
    const { user, signOut } = useAuth()
    const { theme, themeName, toggleTheme } = useTheme()
    const { projects } = useProject()
    const navigate = useNavigate()
    const { tasks, loading, createTask, updateTask, deleteTask, reorderTasks } = useTasks()

    useReminders(tasks)

    const [view, setView] = useState('kanban') // 'kanban' | 'calendar' | 'team'
    const [modalOpen, setModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState(null)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [collabOpen, setCollabOpen] = useState(false)
    const [activityOpen, setActivityOpen] = useState(false)
    const [archiveOpen, setArchiveOpen] = useState(false)
    const [reviewOpen, setReviewOpen] = useState(false)
    const [archiveToast, setArchiveToast] = useState(null)
    const [projectFilter, setProjectFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [filterPriority, setFilterPriority] = useState('all')
    const [quickDate, setQuickDate] = useState('all') // 'all' | 'today' | 'upcoming' | 'overdue'

    const { runAutoArchive } = useArchive({
        onTasksArchived: (count) => {
            setArchiveToast(`🗄️ ${count} completed task${count !== 1 ? 's' : ''} auto-archived`)
            setTimeout(() => setArchiveToast(null), 4000)
        },
    })

    // Run auto-archive check once on mount
    useEffect(() => { if (user) runAutoArchive() }, [user]) // eslint-disable-line

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])

    const handleLogout = async () => { await signOut(); navigate('/') }
    const handleCreateTask = () => { setEditingTask(null); setModalOpen(true) }
    const handleEditTask = (task) => { setEditingTask(task); setModalOpen(true) }
    const handleSaveTask = async (data) => {
        if (editingTask) await updateTask(editingTask.id, data)
        else await createTask(data)
        setModalOpen(false); setEditingTask(null)
    }
    const handleDeleteTask = async (id) => { await deleteTask(id); setModalOpen(false); setEditingTask(null) }
    const handleCalendarDueDate = async (id, date) => { await updateTask(id, { due_date: date }) }

    // ═══ FOCUS MODE: Only show MY tasks (assigned to me, or personal tasks I created) ═══
    const myTasks = useMemo(() => {
        return tasks.filter(t =>
            t.assigned_user_id === user?.id ||
            (!t.assigned_user_id && t.user_id === user?.id)
        )
    }, [tasks, user])

    const filteredTasks = useMemo(() => {
        let result = myTasks

        // Project filter
        if (projectFilter === 'personal') result = result.filter(t => !t.project_id)
        else if (projectFilter !== 'all') result = result.filter(t => t.project_id === projectFilter)

        // Search
        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter(t =>
                t.title.toLowerCase().includes(q) ||
                (t.description && t.description.toLowerCase().includes(q))
            )
        }

        // Priority filter
        if (filterPriority !== 'all') result = result.filter(t => t.priority === filterPriority)

        // Quick date filter
        if (quickDate !== 'all') {
            const today = new Date(); today.setHours(0, 0, 0, 0)
            const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7)
            result = result.filter(t => {
                if (!t.due_date) return false
                const d = new Date(t.due_date + 'T00:00:00')
                if (quickDate === 'today') return d.toDateString() === today.toDateString()
                if (quickDate === 'upcoming') return d > today && d <= weekEnd
                if (quickDate === 'overdue') return d < today && t.status !== 'done'
                return true
            })
        }

        return result
    }, [myTasks, projectFilter, search, filterPriority, quickDate])

    const selectStyle = {
        padding: isMobile ? '8px 10px' : '6px 10px',
        background: theme.bgInput, border: `1px solid ${theme.border}`,
        borderRadius: '6px', color: theme.text, fontSize: '12px',
        fontFamily: 'Outfit', outline: 'none', cursor: 'pointer',
        minHeight: isMobile ? '38px' : 'auto',
    }

    const VIEWS = [
        { k: 'kanban', l: isMobile ? '📋' : '📋 My Board', title: 'Board view' },
        { k: 'calendar', l: isMobile ? '📅' : '📅 Calendar', title: 'Calendar view' },
        { k: 'team', l: isMobile ? '👥' : '👥 Team', title: 'Team view' },
    ]

    const QUICK_DATES = [
        { k: 'all', l: 'All' },
        { k: 'today', l: '📅 Today' },
        { k: 'upcoming', l: '📆 Upcoming' },
        { k: 'overdue', l: '⚠️ Overdue' },
    ]

    if (loading) return (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bg, fontFamily: 'Outfit', color: theme.textSecondary, fontSize: '14px' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '32px', height: '32px', border: `3px solid ${theme.border}`, borderTop: `3px solid ${theme.accent}`, borderRadius: '50%', animation: 'spinSlow 0.8s linear infinite', margin: '0 auto 12px' }} />
                Loading...
            </div>
        </div>
    )

    return (
        <div style={{
            position: 'fixed', inset: 0, fontFamily: 'Outfit',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            background: theme.bg, color: theme.text, transition: 'background 0.2s, color 0.2s',
        }}>
            {/* ═══════ TOP BAR ═══════ */}
            <div style={{
                display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center',
                justifyContent: 'space-between',
                padding: isMobile ? '10px 12px' : '10px 20px',
                borderBottom: `1px solid ${theme.border}`,
                background: theme.bgSecondary, flexShrink: 0, gap: isMobile ? '8px' : '12px',
            }}>
                {/* Row 1 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        {/* Logo */}
                        <span style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: 800, color: theme.text, whiteSpace: 'nowrap' }}>
                            🪐 TaskOrbit
                        </span>

                        {/* View toggle */}
                        <div style={{ display: 'flex', background: theme.bgInput, borderRadius: '8px', padding: '3px', gap: '2px' }}>
                            {VIEWS.map(v => (
                                <button key={v.k} onClick={() => setView(v.k)}
                                    aria-label={v.title}
                                    style={{
                                        padding: isMobile ? '6px 10px' : '5px 12px', borderRadius: '6px',
                                        border: 'none', fontSize: '12px', fontWeight: 600,
                                        fontFamily: 'Outfit', cursor: 'pointer', transition: 'all 0.15s',
                                        background: view === v.k ? theme.accent : 'transparent',
                                        color: view === v.k ? '#fff' : theme.textMuted, minHeight: '32px',
                                        whiteSpace: 'nowrap',
                                    }}>{v.l}</button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {view !== 'team' && (
                            <button onClick={handleCreateTask} aria-label="Create new task"
                                style={{
                                    padding: isMobile ? '8px 12px' : '7px 16px',
                                    background: `linear-gradient(135deg, ${theme.accent}, #9333ea)`,
                                    border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px',
                                    fontWeight: 700, fontFamily: 'Outfit', cursor: 'pointer',
                                    whiteSpace: 'nowrap', minHeight: '34px', boxShadow: `0 2px 10px ${theme.accent}44`,
                                }}>{isMobile ? '+ Task' : '+ New Task'}</button>
                        )}

                        {/* Collab */}
                        <button onClick={() => setCollabOpen(true)} aria-label="Team collaboration"
                            style={{
                                height: '34px', padding: '0 10px', borderRadius: '8px',
                                background: theme.accentBg, border: `1px solid ${theme.border}`,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                fontSize: '12px', fontWeight: 600, color: theme.accentLight, fontFamily: 'Outfit',
                            }}>
                            👥{!isMobile && ' Collab'}
                            {projects.length > 0 && (
                                <span style={{ background: theme.accent, color: '#fff', fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '8px', marginLeft: '2px' }}>
                                    {projects.length}
                                </span>
                            )}
                        </button>

                        {/* Archive */}
                        <button onClick={() => setArchiveOpen(true)} aria-label="Open Archive"
                            style={{
                                height: '34px', padding: '0 10px', borderRadius: '8px',
                                background: theme.bgInput, border: `1px solid ${theme.border}`,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                                fontSize: '12px', fontWeight: 600, color: theme.textSecondary, fontFamily: 'Outfit',
                            }}>
                            🗄️{!isMobile && ' Archive'}
                        </button>

                        {/* Insights */}
                        <button onClick={() => setReviewOpen(true)} aria-label="Productivity Review"
                            style={{
                                height: '34px', padding: '0 10px', borderRadius: '8px',
                                background: theme.bgInput, border: `1px solid ${theme.border}`,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                                fontSize: '12px', fontWeight: 600, color: theme.textSecondary, fontFamily: 'Outfit',
                            }}>
                            📊{!isMobile && ' Insights'}
                        </button>

                        <NotificationBell isMobile={isMobile} />

                        <button onClick={toggleTheme} aria-label="Toggle theme"
                            style={{ width: '34px', height: '34px', borderRadius: '8px', background: theme.bgInput, border: `1px solid ${theme.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: theme.text }}>
                            {themeName === 'dark' ? '☀️' : '🌙'}
                        </button>

                        <button onClick={handleLogout} aria-label="Log out"
                            style={{ padding: isMobile ? '8px 10px' : '5px 12px', background: theme.dangerBg, border: 'none', borderRadius: '8px', color: theme.danger, fontSize: '11px', fontWeight: 600, fontFamily: 'Outfit', cursor: 'pointer', minHeight: '34px' }}>
                            {isMobile ? '🚪' : 'Logout'}
                        </button>
                    </div>
                </div>

                {/* Row 2: Filters (only for kanban + calendar) */}
                {view !== 'team' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', flexShrink: 0 }}>
                        {/* Search */}
                        <div style={{ position: 'relative', flex: isMobile ? '1 1 auto' : '0 1 200px', minWidth: '120px' }}>
                            <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: theme.textMuted, pointerEvents: 'none' }}>🔍</span>
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search my tasks..." aria-label="Search tasks"
                                style={{ ...selectStyle, paddingLeft: '28px', width: '100%' }} />
                        </div>

                        {/* Quick date chips */}
                        <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                            {QUICK_DATES.map(q => (
                                <button key={q.k} onClick={() => setQuickDate(q.k)}
                                    style={{
                                        padding: isMobile ? '8px 10px' : '6px 10px',
                                        borderRadius: '6px', border: 'none', fontSize: '11px', fontWeight: 600,
                                        fontFamily: 'Outfit', cursor: 'pointer', whiteSpace: 'nowrap',
                                        background: quickDate === q.k ? theme.accent : theme.bgInput,
                                        color: quickDate === q.k ? '#fff' : theme.textMuted,
                                        minHeight: isMobile ? '38px' : 'auto',
                                    }}>{q.l}</button>
                            ))}
                        </div>

                        {/* Project filter */}
                        {projects.length > 0 && (
                            <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
                                aria-label="Filter by project" style={{ ...selectStyle, flexShrink: 0 }}>
                                <option value="all">📁 All</option>
                                <option value="personal">👤 Personal</option>
                                {projects.map(p => <option key={p.id} value={p.id}>📁 {p.name}</option>)}
                            </select>
                        )}

                        {/* Priority filter */}
                        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
                            aria-label="Filter by priority" style={{ ...selectStyle, flexShrink: 0 }}>
                            <option value="all">🎯 Priority</option>
                            <option value="high">🔴 High</option>
                            <option value="medium">🟡 Medium</option>
                            <option value="low">🟢 Low</option>
                        </select>
                    </div>
                )}
            </div>

            {/* ═══════ FOCUS MODE BANNER ═══════ */}
            {view === 'kanban' && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: isMobile ? '8px 12px' : '8px 20px',
                    background: theme.accentBg, borderBottom: `1px solid ${theme.border}`,
                    flexShrink: 0, flexWrap: 'wrap',
                }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: theme.accentLight }}>
                        🎯 Focus Mode
                    </span>
                    <span style={{ fontSize: '12px', color: theme.textSecondary }}>
                        Showing <strong style={{ color: theme.text }}>{filteredTasks.length}</strong> tasks assigned to you
                        {myTasks.length !== tasks.length && (
                            <span style={{ color: theme.textMuted }}> · {tasks.length - myTasks.length} team tasks hidden</span>
                        )}
                    </span>
                    {(search || filterPriority !== 'all' || quickDate !== 'all' || projectFilter !== 'all') && (
                        <button onClick={() => { setSearch(''); setFilterPriority('all'); setQuickDate('all'); setProjectFilter('all') }}
                            style={{ padding: '3px 10px', background: theme.bgInput, border: `1px solid ${theme.border}`, borderRadius: '4px', color: theme.textMuted, fontSize: '11px', cursor: 'pointer', fontFamily: 'Outfit' }}>
                            Clear filters
                        </button>
                    )}
                </div>
            )}

            {/* ═══════ MAIN CONTENT ═══════ */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
                {view === 'kanban' && isMobile && (
                    <MobileKanbanList
                        tasks={filteredTasks}
                        onEditTask={handleEditTask}
                        onCreateTask={handleCreateTask}
                        reorderTasks={reorderTasks}
                        updateTask={updateTask}
                    />
                )}
                {view === 'kanban' && !isMobile && (
                    <KanbanBoard tasks={filteredTasks} onEditTask={handleEditTask}
                        onCreateTask={handleCreateTask} reorderTasks={reorderTasks}
                        isMobile={false} />
                )}
                {view === 'calendar' && (
                    <CalendarView tasks={filteredTasks} onEditTask={handleEditTask}
                        onUpdateDueDate={handleCalendarDueDate} isMobile={isMobile} />
                )}
                {view === 'team' && (
                    <TeamView isMobile={isMobile} />
                )}
            </div>

            {/* ═══════ MODALS & PANELS ═══════ */}
            {modalOpen && (
                <TaskModal task={editingTask} onSave={handleSaveTask}
                    onClose={() => { setModalOpen(false); setEditingTask(null) }}
                    onDelete={editingTask ? handleDeleteTask : null}
                    isMobile={isMobile} />
            )}
            {collabOpen && <CollabPanel isOpen onClose={() => setCollabOpen(false)} isMobile={isMobile} />}
            {activityOpen && <ActivityPanel isOpen onClose={() => setActivityOpen(false)} isMobile={isMobile} />}
            {archiveOpen && (
                <ArchivePanel
                    isOpen
                    onClose={() => setArchiveOpen(false)}
                    isMobile={isMobile}
                    onRestored={() => { /* tasks will refresh via useTasks realtime */ }}
                />
            )}
            {reviewOpen && (
                <ProductivityReview
                    isOpen
                    onClose={() => setReviewOpen(false)}
                    isMobile={isMobile}
                />
            )}

            {/* ═══════ ARCHIVE TOAST ═══════ */}
            {archiveToast && (
                <div style={{
                    position: 'fixed', bottom: '80px', left: '50%',
                    transform: 'translateX(-50%)',
                    background: theme.bgCard, border: `1px solid ${theme.border}`,
                    borderRadius: '10px', padding: '10px 18px',
                    fontSize: '12px', fontWeight: 600, color: theme.text,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
                    zIndex: 300, fontFamily: 'Outfit', whiteSpace: 'nowrap',
                    animation: 'slideUpModal 0.3s ease',
                }}>
                    {archiveToast}
                </div>
            )}

            {/* ═══════ FAB — Floating Action Button (mobile only) ═══════ */}
            {isMobile && view !== 'team' && !modalOpen && (
                <button
                    onClick={handleCreateTask}
                    aria-label="Create new task"
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '20px',
                        width: '58px',
                        height: '58px',
                        borderRadius: '50%',
                        border: 'none',
                        background: `linear-gradient(135deg, #7c3aed, #4f46e5)`,
                        color: '#fff',
                        fontSize: '28px',
                        fontWeight: 300,
                        lineHeight: 1,
                        cursor: 'pointer',
                        zIndex: 90,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 24px rgba(124,58,237,0.6), 0 2px 8px rgba(0,0,0,0.3)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        fontFamily: 'Outfit',
                    }}
                    onTouchStart={e => {
                        e.currentTarget.style.transform = 'scale(0.92)'
                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(124,58,237,0.4)'
                    }}
                    onTouchEnd={e => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = '0 4px 24px rgba(124,58,237,0.6)'
                    }}
                >
                    +
                </button>
            )}
        </div>
    )
}
