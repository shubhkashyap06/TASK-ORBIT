import React, { useState, useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useArchive } from '../hooks/useArchive'

const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }
const HOUR_OPTIONS = [
    { value: 24, label: '1 day' },
    { value: 48, label: '2 days (default)' },
    { value: 168, label: '7 days' },
    { value: 0, label: 'Never' },
]

export default function ArchivePanel({ isOpen, onClose, isMobile, onRestored }) {
    const { theme } = useTheme()
    const [search, setSearch] = useState('')
    const [restoring, setRestoring] = useState(null)
    const [deleting, setDeleting] = useState(null)
    const [showSettings, setShowSettings] = useState(false)

    const {
        archivedTasks, loading,
        archiveHours, setArchiveHours,
        restoreTask, deleteArchived,
    } = useArchive()

    const filtered = useMemo(() => {
        if (!search.trim()) return archivedTasks
        const q = search.toLowerCase()
        return archivedTasks.filter(t =>
            t.title.toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q) ||
            (t.projects?.name || '').toLowerCase().includes(q)
        )
    }, [archivedTasks, search])

    const handleRestore = async (id) => {
        setRestoring(id)
        const ok = await restoreTask(id)
        setRestoring(null)
        if (ok && onRestored) onRestored()
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Permanently delete this archived task?')) return
        setDeleting(id)
        await deleteArchived(id)
        setDeleting(null)
    }

    const formatDate = (d) => {
        if (!d) return '—'
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const panelStyle = {
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: isMobile ? '100%' : '480px',
        background: theme.bgSecondary,
        borderLeft: isMobile ? 'none' : `1px solid ${theme.border}`,
        zIndex: 200,
        display: 'flex', flexDirection: 'column',
        fontFamily: 'Outfit, sans-serif',
        animation: 'slideInRight 0.28s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.35)',
    }

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
                zIndex: 199, animation: 'fadeInOverlay 0.2s ease',
            }} />

            <div style={panelStyle} role="dialog" aria-label="Archive Panel">
                {/* ── Header ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '16px 18px',
                    borderBottom: `1px solid ${theme.border}`,
                    flexShrink: 0,
                }}>
                    <span style={{ fontSize: '20px' }}>🗄️</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: theme.text }}>Task Archive</div>
                        <div style={{ fontSize: '11px', color: theme.textMuted }}>
                            {archivedTasks.length} archived task{archivedTasks.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                    <button onClick={() => setShowSettings(!showSettings)}
                        style={{
                            padding: '6px 10px', borderRadius: '7px', border: `1px solid ${theme.border}`,
                            background: showSettings ? theme.accentBg : theme.bgInput, cursor: 'pointer',
                            color: showSettings ? theme.accentLight : theme.textSecondary, fontSize: '13px', fontFamily: 'Outfit',
                        }}>⚙️</button>
                    <button onClick={onClose} aria-label="Close Archive"
                        style={{
                            width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                            background: theme.bgInput, cursor: 'pointer', color: theme.textSecondary, fontSize: '18px', lineHeight: 1,
                        }}>×</button>
                </div>

                {/* ── Settings section ── */}
                {showSettings && (
                    <div style={{
                        padding: '14px 18px',
                        borderBottom: `1px solid ${theme.border}`,
                        background: theme.bgInput,
                        flexShrink: 0,
                        animation: 'slideUpModal 0.2s ease',
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: theme.text, marginBottom: '10px' }}>
                            ⏱️ Auto-archive completed tasks after:
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {HOUR_OPTIONS.map(opt => (
                                <button key={opt.value} onClick={() => setArchiveHours(opt.value)}
                                    style={{
                                        padding: '7px 14px', borderRadius: '20px', border: 'none',
                                        cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                                        fontFamily: 'Outfit',
                                        background: archiveHours === opt.value ? theme.accent : theme.bgCard,
                                        color: archiveHours === opt.value ? '#fff' : theme.textSecondary,
                                        border: `1px solid ${archiveHours === opt.value ? theme.accent : theme.border}`,
                                        transition: 'all 0.15s',
                                    }}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '8px' }}>
                            {archiveHours === 0
                                ? '⚠️ Auto-archive is disabled. Tasks stay in Done forever.'
                                : `✅ Tasks in Done for more than ${archiveHours}h will be archived automatically.`}
                        </div>
                    </div>
                )}

                {/* ── Search ── */}
                <div style={{ padding: '12px 18px', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
                    <div style={{ position: 'relative' }}>
                        <span style={{
                            position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                            fontSize: '13px', color: theme.textMuted, pointerEvents: 'none',
                        }}>🔍</span>
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search archived tasks..."
                            style={{
                                width: '100%', padding: '8px 12px 8px 32px',
                                background: theme.bgInput, border: `1px solid ${theme.border}`,
                                borderRadius: '8px', color: theme.text, fontSize: '13px',
                                fontFamily: 'Outfit', outline: 'none',
                            }} />
                    </div>
                </div>

                {/* ── Task List ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px', WebkitOverflowScrolling: 'touch' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted, fontSize: '13px' }}>
                            <div style={{ width: '24px', height: '24px', border: `2px solid ${theme.border}`, borderTop: `2px solid ${theme.accent}`, borderRadius: '50%', animation: 'spinSlow 0.7s linear infinite', margin: '0 auto 10px' }} />
                            Loading archive...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 20px', color: theme.textMuted }}>
                            <div style={{ fontSize: '40px', marginBottom: '10px' }}>
                                {search ? '🔍' : '🗄️'}
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: theme.text, marginBottom: '5px' }}>
                                {search ? 'No results found' : 'Archive is empty'}
                            </div>
                            <div style={{ fontSize: '12px' }}>
                                {search ? 'Try a different search term' : 'Completed tasks will appear here after 2 days'}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {filtered.map(task => (
                                <div key={task.id} style={{
                                    background: theme.bgCard,
                                    border: `1px solid ${theme.border}`,
                                    borderLeft: `3px solid #34d399`,
                                    borderRadius: '10px',
                                    padding: '12px 14px',
                                    transition: 'box-shadow 0.15s',
                                }}>
                                    {/* Header row */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: theme.text, marginBottom: '2px' }}>
                                                {task.title}
                                            </div>
                                            {task.description && (
                                                <div style={{ fontSize: '11px', color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {task.description}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium, marginTop: '4px', flexShrink: 0 }} />
                                    </div>

                                    {/* Meta row */}
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                        {task.projects?.name && (
                                            <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'rgba(124,58,237,0.12)', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                                📁 {task.projects.name}
                                            </span>
                                        )}
                                        {task.completed_at && (
                                            <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 500 }}>
                                                ✅ Completed {formatDate(task.completed_at)}
                                            </span>
                                        )}
                                        <span style={{ fontSize: '10px', color: theme.textMuted }}>
                                            🗄️ Archived {formatDate(task.archived_at)}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '7px' }}>
                                        <button
                                            onClick={() => handleRestore(task.id)}
                                            disabled={restoring === task.id}
                                            style={{
                                                flex: 1, padding: '7px', borderRadius: '7px', border: 'none',
                                                background: theme.accentBg, color: theme.accentLight,
                                                fontSize: '11px', fontWeight: 700, fontFamily: 'Outfit',
                                                cursor: restoring === task.id ? 'not-allowed' : 'pointer',
                                                opacity: restoring === task.id ? 0.6 : 1,
                                                transition: 'opacity 0.15s',
                                                minHeight: '32px',
                                            }}>
                                            {restoring === task.id ? '...' : '↩️ Restore'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(task.id)}
                                            disabled={deleting === task.id}
                                            style={{
                                                padding: '7px 12px', borderRadius: '7px', border: 'none',
                                                background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                                                fontSize: '11px', fontWeight: 600, fontFamily: 'Outfit',
                                                cursor: deleting === task.id ? 'not-allowed' : 'pointer',
                                                opacity: deleting === task.id ? 0.6 : 1,
                                                minHeight: '32px',
                                            }}>
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
