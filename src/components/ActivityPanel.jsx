import React, { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useProject } from '../context/ProjectContext'
import { supabase } from '../lib/supabase'
import MemberAvatar from './MemberAvatar'

export default function ActivityPanel({ isOpen, onClose, isMobile }) {
    const { theme } = useTheme()
    const { projects } = useProject()
    const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '')
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(false)

    const fetchActivities = useCallback(async () => {
        if (!selectedProjectId) { setActivities([]); return }
        setLoading(true)
        const { data } = await supabase
            .from('activity_log')
            .select('*, profiles:user_id(display_name, avatar_url, email)')
            .eq('project_id', selectedProjectId)
            .order('created_at', { ascending: false })
            .limit(50)
        if (data) setActivities(data)
        setLoading(false)
    }, [selectedProjectId])

    useEffect(() => { fetchActivities() }, [fetchActivities])

    if (!isOpen) return null

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return 'just now'
        if (mins < 60) return `${mins}m ago`
        const hrs = Math.floor(mins / 60)
        if (hrs < 24) return `${hrs}h ago`
        return `${Math.floor(hrs / 24)}d ago`
    }

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 150, animation: 'fadeInOverlay 0.15s ease' }} />
            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: isMobile ? '100%' : '360px', zIndex: 151,
                background: theme.bgSecondary, borderLeft: `1px solid ${theme.border}`,
                boxShadow: `-4px 0 24px ${theme.shadow}`,
                display: 'flex', flexDirection: 'column', fontFamily: 'Outfit',
                animation: 'slideInRight 0.2s ease',
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 18px', borderBottom: `1px solid ${theme.border}`,
                }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: theme.text }}>📊 Activity</span>
                    <button onClick={onClose} aria-label="Close"
                        style={{
                            width: '30px', height: '30px', borderRadius: '6px',
                            background: theme.bgInput, border: `1px solid ${theme.border}`,
                            color: theme.textMuted, fontSize: '14px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit',
                        }}>✕</button>
                </div>

                {/* Project selector */}
                {projects.length > 0 && (
                    <div style={{ padding: '10px 18px', borderBottom: `1px solid ${theme.border}` }}>
                        <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}
                            style={{
                                width: '100%', padding: '8px 10px', background: theme.bgInput,
                                border: `1px solid ${theme.border}`, borderRadius: '6px',
                                color: theme.text, fontSize: '12px', fontFamily: 'Outfit', outline: 'none', cursor: 'pointer',
                            }}>
                            {projects.map(p => <option key={p.id} value={p.id}>📁 {p.name}</option>)}
                        </select>
                    </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px' }}>
                    {projects.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '32px', color: theme.textMuted, fontSize: '12px' }}>
                            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📭</div>
                            Join or create a project to see activity
                        </div>
                    )}

                    {loading && <div style={{ textAlign: 'center', padding: '24px', color: theme.textMuted, fontSize: '12px' }}>Loading...</div>}

                    {!loading && activities.length === 0 && projects.length > 0 && (
                        <div style={{ textAlign: 'center', padding: '32px', color: theme.textMuted, fontSize: '12px' }}>
                            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📭</div>
                            No activity yet
                        </div>
                    )}

                    {activities.map(a => (
                        <div key={a.id} style={{
                            display: 'flex', gap: '10px', padding: '10px 0', borderBottom: `1px solid ${theme.border}`,
                        }}>
                            <MemberAvatar name={a.profiles?.display_name} email={a.profiles?.email} avatarUrl={a.profiles?.avatar_url} size={28} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '12px', color: theme.text, lineHeight: 1.4 }}>
                                    <strong>{a.profiles?.display_name || a.profiles?.email || 'Someone'}</strong>
                                    {' '}{a.action}
                                    {a.metadata?.title && <span style={{ color: theme.accentLight }}> "{a.metadata.title}"</span>}
                                </div>
                                <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '2px' }}>{timeAgo(a.created_at)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </>
    )
}
