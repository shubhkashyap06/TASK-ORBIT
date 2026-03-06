import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useNotifications } from '../hooks/useNotifications'

export default function NotificationBell({ isMobile }) {
    const { theme } = useTheme()
    const { notifications, unreadCount, markAsRead, markAllRead, requestPermission } = useNotifications()
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    // Request permission on mount
    useEffect(() => { requestPermission() }, [])

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return 'just now'
        if (mins < 60) return `${mins}m ago`
        const hrs = Math.floor(mins / 60)
        if (hrs < 24) return `${hrs}h ago`
        return `${Math.floor(hrs / 24)}d ago`
    }

    const typeIcon = (type) => {
        switch (type) {
            case 'assignment': return '👤'
            case 'reminder': return '⏰'
            case 'update': return '📝'
            case 'invite': return '💌'
            default: return 'ℹ️'
        }
    }

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                onClick={() => setOpen(!open)}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                style={{
                    width: '34px', height: '34px', borderRadius: '6px',
                    background: theme.bgInput, border: `1px solid ${theme.border}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', transition: 'background 0.15s', color: theme.text,
                    position: 'relative',
                }}
                onMouseEnter={e => e.currentTarget.style.background = theme.bgHover}
                onMouseLeave={e => e.currentTarget.style.background = theme.bgInput}
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        background: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: 700,
                        minWidth: '16px', height: '16px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 4px', border: `2px solid ${theme.bgSecondary}`,
                    }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {open && (
                <div style={{
                    position: 'absolute', top: '100%',
                    right: 0, marginTop: '4px',
                    background: theme.bgSecondary, border: `1px solid ${theme.border}`,
                    borderRadius: '10px', boxShadow: `0 8px 24px ${theme.shadow}`,
                    width: isMobile ? '300px' : '340px', zIndex: 200,
                    maxHeight: '420px', display: 'flex', flexDirection: 'column',
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px', borderBottom: `1px solid ${theme.border}`,
                    }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: theme.text }}>Notifications</span>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead}
                                style={{
                                    background: 'none', border: 'none', color: theme.accentLight,
                                    fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit',
                                }}>Mark all read</button>
                        )}
                    </div>

                    {/* List */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '4px' }}>
                        {notifications.length === 0 && (
                            <div style={{
                                padding: '24px', textAlign: 'center',
                                color: theme.textMuted, fontSize: '12px',
                            }}>
                                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔕</div>
                                No notifications yet
                            </div>
                        )}
                        {notifications.map(n => (
                            <div key={n.id}
                                onClick={() => { if (!n.is_read) markAsRead(n.id) }}
                                style={{
                                    display: 'flex', gap: '10px', padding: '10px',
                                    borderRadius: '8px', cursor: n.is_read ? 'default' : 'pointer',
                                    background: n.is_read ? 'transparent' : theme.accentBg,
                                    transition: 'background 0.1s',
                                }}
                                onMouseEnter={e => { if (!n.is_read) e.currentTarget.style.background = theme.bgHover }}
                                onMouseLeave={e => { if (!n.is_read) e.currentTarget.style.background = theme.accentBg }}
                            >
                                <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>{typeIcon(n.type)}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '12px', color: n.is_read ? theme.textMuted : theme.text,
                                        fontWeight: n.is_read ? 400 : 500, lineHeight: 1.4,
                                    }}>{n.message}</div>
                                    <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '2px' }}>
                                        {timeAgo(n.created_at)}
                                    </div>
                                </div>
                                {!n.is_read && (
                                    <div style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: theme.accent, flexShrink: 0, marginTop: '4px',
                                    }} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
