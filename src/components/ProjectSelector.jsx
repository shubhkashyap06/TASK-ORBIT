import React, { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useProject } from '../context/ProjectContext'
import { MemberAvatarStack } from './MemberAvatar'

export default function CollabPanel({ isOpen, onClose, isMobile }) {
    const { theme } = useTheme()
    const { projects, getMembersForProject, createProject, joinProject, updateProject, removeMember } = useProject()
    const [mode, setMode] = useState(null) // 'create' | 'join' | project-id
    const [name, setName] = useState('')
    const [desc, setDesc] = useState('')
    const [code, setCode] = useState('')
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [copied, setCopied] = useState(false)

    if (!isOpen) return null

    const selectedProject = typeof mode === 'string' && !['create', 'join'].includes(mode)
        ? projects.find(p => p.id === mode) : null
    const selectedMembers = selectedProject ? getMembersForProject(selectedProject.id) : []

    const handleCreate = async () => {
        if (!name.trim()) return
        setSaving(true); setError('')
        const { error: e } = await createProject(name.trim(), desc.trim())
        setSaving(false)
        if (e) { setError(typeof e === 'string' ? e : e.message || 'Error'); return }
        setName(''); setDesc(''); setMode(null)
    }

    const handleJoin = async () => {
        if (!code.trim()) return
        setSaving(true); setError('')
        const { error: e } = await joinProject(code.trim())
        setSaving(false)
        if (e) { setError(typeof e === 'string' ? e : e.message || 'Error'); return }
        setCode(''); setMode(null)
    }

    const handleCopy = (inviteCode) => {
        navigator.clipboard.writeText(inviteCode)
        setCopied(true); setTimeout(() => setCopied(false), 2000)
    }

    const inputStyle = {
        width: '100%', padding: '8px 10px', background: theme.bgInput,
        border: `1px solid ${theme.border}`, borderRadius: '6px',
        color: theme.text, fontSize: '13px', fontFamily: 'Outfit', outline: 'none', boxSizing: 'border-box',
    }

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 150, animation: 'fadeInOverlay 0.15s ease' }} />
            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: isMobile ? '100%' : '380px', zIndex: 151,
                background: theme.bgSecondary, borderLeft: `1px solid ${theme.border}`,
                boxShadow: `-4px 0 24px ${theme.shadow}`,
                display: 'flex', flexDirection: 'column', fontFamily: 'Outfit',
                animation: 'slideInRight 0.2s ease',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 18px', borderBottom: `1px solid ${theme.border}`,
                }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: theme.text }}>
                        {selectedProject ? `📁 ${selectedProject.name}` : '👥 Collaboration'}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {selectedProject && (
                            <button onClick={() => setMode(null)}
                                style={{
                                    padding: '6px 10px', borderRadius: '6px', background: theme.bgInput,
                                    border: `1px solid ${theme.border}`, color: theme.textMuted,
                                    fontSize: '11px', cursor: 'pointer', fontFamily: 'Outfit',
                                }}>← Back</button>
                        )}
                        <button onClick={onClose} aria-label="Close"
                            style={{
                                width: '30px', height: '30px', borderRadius: '6px',
                                background: theme.bgInput, border: `1px solid ${theme.border}`,
                                color: theme.textMuted, fontSize: '14px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit',
                            }}>✕</button>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
                    {/* ═══ PROJECT LIST ═══ */}
                    {!mode && (
                        <>
                            {projects.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '32px 16px', color: theme.textMuted, fontSize: '13px' }}>
                                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>🤝</div>
                                    No projects yet. Create one to collaborate!
                                </div>
                            )}

                            {projects.map(p => {
                                const pMembers = getMembersForProject(p.id)
                                return (
                                    <button key={p.id} onClick={() => setMode(p.id)}
                                        style={{
                                            width: '100%', padding: '12px 14px', marginBottom: '8px',
                                            background: theme.bgInput, border: `1px solid ${theme.border}`,
                                            borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            transition: 'background 0.15s, border-color 0.15s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = theme.bgHover; e.currentTarget.style.borderColor = theme.borderHover }}
                                        onMouseLeave={e => { e.currentTarget.style.background = theme.bgInput; e.currentTarget.style.borderColor = theme.border }}
                                    >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: theme.text }}>{p.name}</div>
                                            {p.description && <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>}
                                            <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '4px' }}>{p.myRole} · {pMembers.length} member{pMembers.length !== 1 ? 's' : ''}</div>
                                        </div>
                                        <MemberAvatarStack members={pMembers} max={3} size={24} />
                                    </button>
                                )
                            })}

                            <div style={{ borderTop: `1px solid ${theme.border}`, margin: '12px 0' }} />

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => { setMode('create'); setError('') }}
                                    style={{
                                        flex: 1, padding: '10px', background: theme.accent, color: '#fff',
                                        border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                                        fontFamily: 'Outfit', cursor: 'pointer',
                                    }}>➕ Create Project</button>
                                <button onClick={() => { setMode('join'); setError('') }}
                                    style={{
                                        flex: 1, padding: '10px', background: theme.accentBg,
                                        border: `1px solid ${theme.border}`, borderRadius: '8px',
                                        color: theme.accentLight, fontSize: '12px', fontWeight: 600,
                                        fontFamily: 'Outfit', cursor: 'pointer',
                                    }}>🔗 Join Project</button>
                            </div>
                        </>
                    )}

                    {/* ═══ CREATE ═══ */}
                    {mode === 'create' && (
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: theme.text, marginBottom: '12px' }}>New Project</div>
                            <input placeholder="Project name" value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle, marginBottom: '8px' }} autoFocus />
                            <input placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} />
                            {error && <div style={{ fontSize: '11px', color: theme.danger, marginBottom: '6px' }}>{error}</div>}
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={handleCreate} disabled={saving || !name.trim()} style={{ flex: 1, padding: '10px', background: theme.accent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, fontFamily: 'Outfit', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Creating...' : 'Create'}</button>
                                <button onClick={() => setMode(null)} style={{ padding: '10px 14px', background: theme.bgInput, border: `1px solid ${theme.border}`, borderRadius: '6px', color: theme.textMuted, fontSize: '12px', fontFamily: 'Outfit', cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {/* ═══ JOIN ═══ */}
                    {mode === 'join' && (
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: theme.text, marginBottom: '12px' }}>Join Project</div>
                            <input placeholder="Paste invite code..." value={code} onChange={e => setCode(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} autoFocus />
                            {error && <div style={{ fontSize: '11px', color: theme.danger, marginBottom: '6px' }}>{error}</div>}
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={handleJoin} disabled={saving || !code.trim()} style={{ flex: 1, padding: '10px', background: theme.accent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, fontFamily: 'Outfit', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Joining...' : 'Join'}</button>
                                <button onClick={() => setMode(null)} style={{ padding: '10px 14px', background: theme.bgInput, border: `1px solid ${theme.border}`, borderRadius: '6px', color: theme.textMuted, fontSize: '12px', fontFamily: 'Outfit', cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {/* ═══ PROJECT DETAILS ═══ */}
                    {selectedProject && (
                        <div>
                            {/* Invite Code */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '11px', color: theme.textSecondary, marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invite Code</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <code style={{
                                        flex: 1, padding: '10px 12px', background: theme.bgInput,
                                        border: `1px solid ${theme.border}`, borderRadius: '8px',
                                        color: theme.accentLight, fontSize: '14px', fontFamily: 'monospace', letterSpacing: '0.1em',
                                    }}>{selectedProject.invite_code}</code>
                                    <button onClick={() => handleCopy(selectedProject.invite_code)}
                                        style={{
                                            padding: '10px 14px', background: theme.accentBg, border: `1px solid ${theme.border}`,
                                            borderRadius: '8px', color: theme.accentLight, fontSize: '12px', fontWeight: 600,
                                            fontFamily: 'Outfit', cursor: 'pointer', whiteSpace: 'nowrap',
                                        }}>{copied ? '✅ Copied' : '📋 Copy'}</button>
                                </div>
                                <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '4px' }}>Share this code with teammates</div>
                            </div>

                            {/* Members */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '11px', color: theme.textSecondary, marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Members ({selectedMembers.length})
                                </label>
                                {selectedMembers.map(m => (
                                    <div key={m.userId} style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '8px 10px', borderRadius: '8px', background: theme.bgInput, marginBottom: '4px',
                                    }}>
                                        <div style={{
                                            width: 30, height: 30, borderRadius: '50%',
                                            background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0,
                                        }}>{(m.display_name || m.email || '?').slice(0, 2).toUpperCase()}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.display_name || m.email}</div>
                                            <div style={{ fontSize: '10px', color: theme.textMuted }}>{m.role}</div>
                                        </div>
                                        {selectedProject.myRole === 'owner' && m.role !== 'owner' && (
                                            <button onClick={() => { if (window.confirm('Remove?')) removeMember(selectedProject.id, m.userId) }}
                                                style={{
                                                    padding: '4px 8px', background: theme.dangerBg, border: 'none',
                                                    borderRadius: '4px', color: theme.danger, fontSize: '10px', fontWeight: 600,
                                                    fontFamily: 'Outfit', cursor: 'pointer',
                                                }}>Remove</button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {selectedProject.description && (
                                <div style={{ padding: '10px', background: theme.bgInput, borderRadius: '8px', fontSize: '12px', color: theme.textMuted, lineHeight: 1.5 }}>
                                    {selectedProject.description}
                                </div>
                            )}
                        </div>
                    )}
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
