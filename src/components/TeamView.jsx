import React, { useState, useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useProject } from '../context/ProjectContext'
import { useTeamTasks } from '../hooks/useTeamTasks'
import MemberAvatar from './MemberAvatar'

const STATUS_CONFIG = {
    todo: { label: 'To Do', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
    'in-progress': { label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    done: { label: 'Done', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
}

const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }

function WorkloadBar({ label, count, max, color, theme }) {
    const pct = max > 0 ? (count / max) * 100 : 0
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '80px', fontSize: '12px', color: theme.textSecondary, fontWeight: 600, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', flexShrink: 0 }}>
                {label}
            </div>
            <div style={{ flex: 1, height: '8px', background: theme.bgInput, borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: '4px',
                    background: color, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                }} />
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: theme.text, width: '28px', textAlign: 'right', flexShrink: 0 }}>
                {count}
            </div>
        </div>
    )
}

function MemberCard({ memberId, member, tasks, theme, isMobile, isMe }) {
    const [expanded, setExpanded] = useState(false)

    const todo = tasks.filter(t => t.status === 'todo').length
    const inProgress = tasks.filter(t => t.status === 'in-progress').length
    const done = tasks.filter(t => t.status === 'done').length
    const activeTasks = tasks.filter(t => t.status !== 'done').slice(0, 5)

    const name = member.display_name || member.email || 'Unknown'
    const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0

    return (
        <div style={{
            background: theme.bgCard,
            border: `1px solid ${isMe ? theme.accentLight + '55' : theme.border}`,
            borderRadius: '14px',
            padding: '16px 18px',
            transition: 'box-shadow 0.2s, border-color 0.2s',
            boxShadow: isMe ? `0 0 0 1px ${theme.accentLight}22` : 'none',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <MemberAvatar name={member.display_name} email={member.email}
                    avatarUrl={member.avatar_url} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: theme.text }}>{name}</span>
                        {isMe && (
                            <span style={{
                                fontSize: '9px', fontWeight: 700,
                                padding: '2px 6px', borderRadius: '4px',
                                background: theme.accentBg, color: theme.accentLight,
                            }}>YOU</span>
                        )}
                    </div>
                    <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '1px' }}>
                        {member.role} · {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                    </div>
                </div>
                {/* Completion % */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: pct === 100 ? '#22c55e' : theme.text }}>{pct}%</div>
                    <div style={{ fontSize: '10px', color: theme.textMuted }}>done</div>
                </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: '4px', background: theme.bgInput, borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: '2px',
                    background: pct === 100 ? '#22c55e' : theme.accent,
                    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                }} />
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {[
                    { label: 'Todo', count: todo, ...STATUS_CONFIG.todo },
                    { label: 'In Progress', count: inProgress, ...STATUS_CONFIG['in-progress'] },
                    { label: 'Done', count: done, ...STATUS_CONFIG.done },
                ].map(s => (
                    <div key={s.label} style={{
                        flex: 1, padding: '8px 6px', borderRadius: '8px',
                        background: s.bg, textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: s.color }}>{s.count}</div>
                        <div style={{ fontSize: '9px', fontWeight: 600, color: s.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Active tasks list */}
            {activeTasks.length > 0 && (
                <>
                    <button onClick={() => setExpanded(!expanded)}
                        style={{
                            width: '100%', padding: '7px 10px',
                            background: theme.bgInput, border: `1px solid ${theme.border}`,
                            borderRadius: '7px', cursor: 'pointer', textAlign: 'left',
                            color: theme.textSecondary, fontSize: '11px', fontWeight: 600,
                            fontFamily: 'Outfit', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                        <span>🔨 Working On ({activeTasks.length}{tasks.filter(t => t.status !== 'done').length > 5 ? '+' : ''})</span>
                        <span>{expanded ? '▲' : '▼'}</span>
                    </button>

                    {expanded && (
                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {activeTasks.map(t => (
                                <div key={t.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '6px 10px', borderRadius: '7px', background: theme.bgInput,
                                }}>
                                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.medium, flexShrink: 0 }} />
                                    <span style={{ flex: 1, fontSize: '12px', color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {t.title}
                                    </span>
                                    <span style={{
                                        fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px',
                                        background: STATUS_CONFIG[t.status]?.bg || STATUS_CONFIG.todo.bg,
                                        color: STATUS_CONFIG[t.status]?.color || STATUS_CONFIG.todo.color,
                                        whiteSpace: 'nowrap', flexShrink: 0,
                                    }}>{STATUS_CONFIG[t.status]?.label || 'To Do'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {tasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '10px', color: theme.textMuted, fontSize: '12px' }}>
                    No tasks assigned
                </div>
            )}
        </div>
    )
}

export default function TeamView({ isMobile }) {
    const { theme } = useTheme()
    const { user } = useAuth()
    const { projects } = useProject()
    const { memberTaskMap, loading } = useTeamTasks()
    const [selectedProjectId, setSelectedProjectId] = useState('all')

    const entries = useMemo(() => {
        let result = Object.entries(memberTaskMap).map(([uid, val]) => ({ uid, ...val }))

        // Filter by selected project
        if (selectedProjectId !== 'all') {
            result = result.map(entry => ({
                ...entry,
                tasks: entry.tasks.filter(t => t.project_id === selectedProjectId),
            })).filter(e => e.tasks.length > 0 || Object.keys(memberTaskMap).some(id => id === e.uid))
        }

        // Sort: current user first, then most tasks
        return result.sort((a, b) => {
            if (a.uid === user?.id) return -1
            if (b.uid === user?.id) return 1
            return b.tasks.length - a.tasks.length
        })
    }, [memberTaskMap, selectedProjectId, user])

    const maxTasks = useMemo(() => Math.max(...entries.map(e => e.tasks.length), 1), [entries])

    const totalTasks = useMemo(() => entries.reduce((sum, e) => sum + e.tasks.length, 0), [entries])
    const totalDone = useMemo(() => entries.reduce((sum, e) => sum + e.tasks.filter(t => t.status === 'done').length, 0), [entries])
    const totalInProgress = useMemo(() => entries.reduce((sum, e) => sum + e.tasks.filter(t => t.status === 'in-progress').length, 0), [entries])

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: theme.textMuted, fontSize: '13px', fontFamily: 'Outfit' }}>
                <div>
                    <div style={{ width: '28px', height: '28px', border: `2px solid ${theme.border}`, borderTop: `2px solid ${theme.accent}`, borderRadius: '50%', animation: 'spinSlow 0.7s linear infinite', margin: '0 auto 10px' }} />
                    Loading team data...
                </div>
            </div>
        )
    }

    if (projects.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: theme.textMuted, fontFamily: 'Outfit', gap: '12px', padding: '20px' }}>
                <div style={{ fontSize: '52px' }}>👥</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: theme.text }}>No Projects Yet</div>
                <div style={{ fontSize: '13px', textAlign: 'center', maxWidth: '280px' }}>
                    Create or join a project from the <strong style={{ color: theme.accentLight }}>👥 Collab</strong> button to start collaborating with your team.
                </div>
            </div>
        )
    }

    if (entries.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: theme.textMuted, fontFamily: 'Outfit', gap: '12px', padding: '20px' }}>
                <div style={{ fontSize: '52px' }}>🤝</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: theme.text }}>No teammates yet</div>
                <div style={{ fontSize: '13px', textAlign: 'center', maxWidth: '280px' }}>
                    Share your project invite code to bring teammates on board!
                </div>
            </div>
        )
    }

    return (
        <div style={{
            flex: 1, overflow: 'auto', padding: isMobile ? '12px' : '20px 24px',
            fontFamily: 'Outfit', WebkitOverflowScrolling: 'touch',
        }}>
            {/* Top stats bar + project filter */}
            <div style={{
                display: 'flex', gap: '12px', marginBottom: '20px',
                flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center',
            }}>
                {/* Summary Chips */}
                <div style={{ display: 'flex', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
                    {[
                        { label: 'Total Tasks', value: totalTasks, color: theme.text, bg: theme.bgInput },
                        { label: 'In Progress', value: totalInProgress, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
                        { label: 'Completed', value: totalDone, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
                    ].map(s => (
                        <div key={s.label} style={{
                            padding: '10px 16px', borderRadius: '10px', background: s.bg,
                            border: `1px solid ${theme.border}`, textAlign: 'center', flex: '1 1 80px',
                        }}>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: '10px', color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Project filter */}
                {projects.length > 1 && (
                    <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}
                        style={{
                            padding: '10px 14px', background: theme.bgInput, border: `1px solid ${theme.border}`,
                            borderRadius: '8px', color: theme.text, fontSize: '12px', fontFamily: 'Outfit',
                            outline: 'none', cursor: 'pointer', flexShrink: 0,
                        }}>
                        <option value="all">📁 All Projects</option>
                        {projects.map(p => <option key={p.id} value={p.id}>📁 {p.name}</option>)}
                    </select>
                )}
            </div>

            {/* Workload Chart */}
            <div style={{
                background: theme.bgCard, border: `1px solid ${theme.border}`,
                borderRadius: '14px', padding: '18px 20px', marginBottom: '20px',
            }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: theme.text, marginBottom: '14px' }}>
                    📊 Team Workload
                </div>
                {entries.map(({ uid, member, tasks }) => {
                    const colors = ['#7c3aed', '#3b82f6', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444']
                    const idx = entries.findIndex(e => e.uid === uid)
                    return (
                        <WorkloadBar
                            key={uid}
                            label={member.display_name || member.email?.split('@')[0] || 'User'}
                            count={tasks.length}
                            max={maxTasks}
                            color={uid === user?.id ? theme.accent : colors[idx % colors.length]}
                            theme={theme}
                        />
                    )
                })}
            </div>

            {/* Member Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '14px',
            }}>
                {entries.map(({ uid, member, tasks }) => (
                    <MemberCard
                        key={uid}
                        memberId={uid}
                        member={member}
                        tasks={tasks}
                        theme={theme}
                        isMobile={isMobile}
                        isMe={uid === user?.id}
                    />
                ))}
            </div>
        </div>
    )
}
