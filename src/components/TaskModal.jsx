import React, { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useProject } from '../context/ProjectContext'
import MemberAvatar from './MemberAvatar'

export default function TaskModal({ task, onSave, onClose, onDelete, isMobile }) {
    const { theme } = useTheme()
    const { projects, getMembersForProject } = useProject()
    const isEditing = !!task
    const [title, setTitle] = useState(task?.title || '')
    const [description, setDescription] = useState(task?.description || '')
    const [priority, setPriority] = useState(task?.priority || 'medium')
    const [dueDate, setDueDate] = useState(task?.due_date || '')
    const [projectId, setProjectId] = useState(task?.project_id || '')
    const [assignedUserId, setAssignedUserId] = useState(task?.assigned_user_id || '')
    const [saving, setSaving] = useState(false)

    // Members for the selected project
    const projectMembers = projectId ? getMembersForProject(projectId) : []

    // Reset assignee when project changes
    const handleProjectChange = (newProjectId) => {
        setProjectId(newProjectId)
        if (!newProjectId) setAssignedUserId('')
        else {
            const newMembers = getMembersForProject(newProjectId)
            if (!newMembers.find(m => m.userId === assignedUserId)) {
                setAssignedUserId('')
            }
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!title.trim()) return
        setSaving(true)
        await onSave({
            title: title.trim(),
            description: description.trim(),
            priority,
            due_date: dueDate || null,
            project_id: projectId || null,
            assigned_user_id: assignedUserId || null,
        })
        setSaving(false)
    }

    const handleDelete = async () => {
        if (window.confirm('Delete this task?')) await onDelete(task.id)
    }

    const inputStyle = {
        width: '100%', padding: isMobile ? '12px 14px' : '10px 12px',
        background: theme.bgInput, border: `1px solid ${theme.border}`,
        borderRadius: '8px', color: theme.text, fontSize: isMobile ? '16px' : '14px',
        fontFamily: 'Outfit, sans-serif', outline: 'none', transition: 'border-color 0.15s',
        boxSizing: 'border-box',
    }
    const handleFocus = (e) => e.target.style.borderColor = theme.accentLight
    const handleBlur = (e) => e.target.style.borderColor = theme.border

    const priorities = [
        { key: 'low', label: 'Low', color: '#22c55e' },
        { key: 'medium', label: 'Medium', color: '#f59e0b' },
        { key: 'high', label: 'High', color: '#ef4444' },
    ]

    return (
        <div onClick={onClose} role="dialog" aria-modal="true"
            aria-label={isEditing ? 'Edit task' : 'Create new task'}
            style={{
                position: 'fixed', inset: 0, zIndex: 100,
                display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.5)', fontFamily: 'Outfit, sans-serif',
                animation: 'fadeInOverlay 0.2s ease',
            }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: theme.bgSecondary, border: `1px solid ${theme.border}`,
                borderRadius: isMobile ? '18px 18px 0 0' : '14px',
                boxShadow: `0 16px 48px ${theme.shadow}`,
                padding: isMobile ? '24px 20px 32px' : '28px',
                width: isMobile ? '100%' : 'min(460px, 92vw)',
                maxHeight: isMobile ? '92vh' : '90vh', overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                animation: isMobile ? 'slideUpModal 0.3s ease' : 'none',
            }}>
                {isMobile && <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: theme.border, margin: '0 auto 16px' }} />}

                <h2 style={{ fontSize: isMobile ? '20px' : '18px', fontWeight: 700, color: theme.text, marginBottom: '20px' }}>
                    {isEditing ? 'Edit Task' : 'New Task'}
                </h2>

                <form onSubmit={handleSubmit}>
                    {/* Title */}
                    <div style={{ marginBottom: '14px' }}>
                        <label htmlFor="task-title" style={{ display: 'block', fontSize: '12px', color: theme.textSecondary, marginBottom: '4px', fontWeight: 600 }}>Title</label>
                        <input id="task-title" type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Task title..." style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} autoFocus={!isMobile} />
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: '14px' }}>
                        <label htmlFor="task-desc" style={{ display: 'block', fontSize: '12px', color: theme.textSecondary, marginBottom: '4px', fontWeight: 600 }}>Description</label>
                        <textarea id="task-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description..." rows={3} style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} onFocus={handleFocus} onBlur={handleBlur} />
                    </div>

                    {/* Priority */}
                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', color: theme.textSecondary, marginBottom: '6px', fontWeight: 600 }}>Priority</label>
                        <div style={{ display: 'flex', gap: '6px' }} role="radiogroup" aria-label="Task priority">
                            {priorities.map(p => (
                                <button key={p.key} type="button" onClick={() => setPriority(p.key)}
                                    role="radio" aria-checked={priority === p.key}
                                    style={{
                                        flex: 1, padding: isMobile ? '10px 0' : '8px 0', borderRadius: '6px',
                                        fontSize: '12px', fontWeight: 600, fontFamily: 'Outfit', cursor: 'pointer',
                                        transition: 'all 0.15s', border: 'none',
                                        background: priority === p.key ? p.color + '22' : theme.bgInput,
                                        color: priority === p.key ? p.color : theme.textMuted,
                                        outline: priority === p.key ? `2px solid ${p.color}` : 'none', minHeight: '40px',
                                    }}>{p.label}</button>
                            ))}
                        </div>
                    </div>

                    {/* Project (optional) */}
                    <div style={{ marginBottom: '14px' }}>
                        <label htmlFor="task-project" style={{ display: 'block', fontSize: '12px', color: theme.textSecondary, marginBottom: '4px', fontWeight: 600 }}>
                            Project <span style={{ fontWeight: 400, color: theme.textMuted }}>(optional)</span>
                        </label>
                        <select id="task-project" value={projectId} onChange={e => handleProjectChange(e.target.value)}
                            style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}>
                            <option value="">Personal (no project)</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>📁 {p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Assignee (only if project selected) */}
                    {projectId && projectMembers.length > 0 && (
                        <div style={{ marginBottom: '14px' }}>
                            <label htmlFor="task-assignee" style={{ display: 'block', fontSize: '12px', color: theme.textSecondary, marginBottom: '4px', fontWeight: 600 }}>
                                Assign To
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <select id="task-assignee" value={assignedUserId} onChange={e => setAssignedUserId(e.target.value)}
                                    style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}>
                                    <option value="">Unassigned</option>
                                    {projectMembers.map(m => (
                                        <option key={m.userId} value={m.userId}>{m.display_name || m.email}</option>
                                    ))}
                                </select>
                                {assignedUserId && (() => {
                                    const m = projectMembers.find(mb => mb.userId === assignedUserId)
                                    return m ? <MemberAvatar name={m.display_name} email={m.email} avatarUrl={m.avatar_url} size={30} /> : null
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Due Date */}
                    <div style={{ marginBottom: '22px' }}>
                        <label htmlFor="task-due" style={{ display: 'block', fontSize: '12px', color: theme.textSecondary, marginBottom: '4px', fontWeight: 600 }}>Due Date</label>
                        <input id="task-due" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...inputStyle, colorScheme: theme.name }} onFocus={handleFocus} onBlur={handleBlur} />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', flexDirection: isMobile ? 'column' : 'row' }}>
                        <button type="submit" disabled={saving || !title.trim()}
                            style={{
                                flex: 1, padding: isMobile ? '14px' : '10px', background: theme.accent,
                                color: '#fff', border: 'none', borderRadius: '8px',
                                fontSize: isMobile ? '15px' : '13px', fontWeight: 600, fontFamily: 'Outfit',
                                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
                                transition: 'opacity 0.15s', minHeight: '44px',
                            }}>{saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}</button>

                        {isEditing && onDelete && (
                            <button type="button" onClick={handleDelete}
                                style={{
                                    padding: isMobile ? '14px 16px' : '10px 16px', background: theme.dangerBg,
                                    border: 'none', borderRadius: '8px', color: theme.danger,
                                    fontSize: isMobile ? '15px' : '13px', fontWeight: 600, fontFamily: 'Outfit',
                                    cursor: 'pointer', minHeight: '44px',
                                }}>Delete</button>
                        )}

                        <button type="button" onClick={onClose}
                            style={{
                                padding: isMobile ? '14px 16px' : '10px 16px', background: theme.bgInput,
                                border: `1px solid ${theme.border}`, borderRadius: '8px',
                                color: theme.textSecondary, fontSize: isMobile ? '15px' : '13px',
                                fontWeight: 500, fontFamily: 'Outfit', cursor: 'pointer', minHeight: '44px',
                            }}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
