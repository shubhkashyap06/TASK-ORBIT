import React, { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useProject } from '../context/ProjectContext'
import MemberAvatar from './MemberAvatar'

export default function ProjectSettingsModal({ onClose, isMobile }) {
    const { theme } = useTheme()
    const { activeProject, members, updateProject, removeMember } = useProject()
    const [name, setName] = useState(activeProject?.name || '')
    const [desc, setDesc] = useState(activeProject?.description || '')
    const [saving, setSaving] = useState(false)
    const [copied, setCopied] = useState(false)

    if (!activeProject) return null

    const isOwner = activeProject.myRole === 'owner'
    const inviteCode = activeProject.invite_code || ''

    const handleSave = async () => {
        if (!name.trim()) return
        setSaving(true)
        await updateProject(activeProject.id, { name: name.trim(), description: desc.trim() })
        setSaving(false)
        onClose()
    }

    const handleCopyCode = () => {
        navigator.clipboard.writeText(inviteCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleRemoveMember = async (userId) => {
        if (window.confirm('Remove this member from the project?')) {
            await removeMember(activeProject.id, userId)
        }
    }

    const inputStyle = {
        width: '100%', padding: '10px 12px', background: theme.bgInput,
        border: `1px solid ${theme.border}`, borderRadius: '8px',
        color: theme.text, fontSize: '14px', fontFamily: 'Outfit, sans-serif',
        outline: 'none', boxSizing: 'border-box',
    }

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)', fontFamily: 'Outfit, sans-serif',
            animation: 'fadeInOverlay 0.2s ease',
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: theme.bgSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: isMobile ? '18px 18px 0 0' : '14px',
                boxShadow: `0 16px 48px ${theme.shadow}`,
                padding: isMobile ? '24px 20px 32px' : '28px',
                width: isMobile ? '100%' : 'min(480px, 92vw)',
                maxHeight: isMobile ? '90vh' : '85vh',
                overflowY: 'auto',
                animation: isMobile ? 'slideUpModal 0.3s ease' : 'none',
            }}>
                {isMobile && (
                    <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: theme.border, margin: '0 auto 16px' }} />
                )}

                <h2 style={{ fontSize: '18px', fontWeight: 700, color: theme.text, marginBottom: '20px' }}>
                    ⚙️ Project Settings
                </h2>

                {/* Name & Description */}
                {isOwner && (
                    <>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: theme.textSecondary, marginBottom: '4px', fontWeight: 600 }}>
                                Project Name
                            </label>
                            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: theme.textSecondary, marginBottom: '4px', fontWeight: 600 }}>
                                Description
                            </label>
                            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional description" style={inputStyle} />
                        </div>
                    </>
                )}

                {/* Invite Code */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: theme.textSecondary, marginBottom: '6px', fontWeight: 600 }}>
                        Invite Code
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <code style={{
                            flex: 1, padding: '10px 12px', background: theme.bgInput,
                            border: `1px solid ${theme.border}`, borderRadius: '8px',
                            color: theme.accentLight, fontSize: '14px', fontFamily: 'monospace',
                            letterSpacing: '0.1em',
                        }}>{inviteCode}</code>
                        <button onClick={handleCopyCode}
                            style={{
                                padding: '10px 14px', background: theme.accentBg, border: `1px solid ${theme.border}`,
                                borderRadius: '8px', color: theme.accentLight, fontSize: '12px', fontWeight: 600,
                                fontFamily: 'Outfit', cursor: 'pointer', whiteSpace: 'nowrap',
                            }}>{copied ? '✅ Copied!' : '📋 Copy'}</button>
                    </div>
                    <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '4px' }}>
                        Share this code with teammates to let them join the project
                    </div>
                </div>

                {/* Members */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: theme.textSecondary, marginBottom: '8px', fontWeight: 600 }}>
                        Members ({members.length})
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {members.map(m => (
                            <div key={m.userId} style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '8px 10px', borderRadius: '8px',
                                background: theme.bgInput,
                            }}>
                                <MemberAvatar name={m.display_name} email={m.email} avatarUrl={m.avatar_url} size={30} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {m.display_name || m.email}
                                    </div>
                                    <div style={{ fontSize: '10px', color: theme.textMuted }}>{m.role}</div>
                                </div>
                                {isOwner && m.role !== 'owner' && (
                                    <button onClick={() => handleRemoveMember(m.userId)}
                                        style={{
                                            padding: '4px 8px', background: theme.dangerBg, border: 'none',
                                            borderRadius: '4px', color: theme.danger, fontSize: '10px', fontWeight: 600,
                                            fontFamily: 'Outfit', cursor: 'pointer',
                                        }}>Remove</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexDirection: isMobile ? 'column' : 'row' }}>
                    {isOwner && (
                        <button onClick={handleSave} disabled={saving || !name.trim()}
                            style={{
                                flex: 1, padding: '10px', background: theme.accent, color: '#fff', border: 'none',
                                borderRadius: '8px', fontSize: '13px', fontWeight: 600, fontFamily: 'Outfit',
                                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
                            }}>{saving ? 'Saving...' : 'Save Changes'}</button>
                    )}
                    <button onClick={onClose}
                        style={{
                            flex: isOwner ? 'none' : 1, padding: '10px 16px', background: theme.bgInput,
                            border: `1px solid ${theme.border}`, borderRadius: '8px',
                            color: theme.textSecondary, fontSize: '13px', fontWeight: 500, fontFamily: 'Outfit', cursor: 'pointer',
                        }}>Close</button>
                </div>
            </div>
        </div>
    )
}
