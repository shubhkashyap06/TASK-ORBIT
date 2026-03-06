import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTheme } from '../context/ThemeContext'
import { useProject } from '../context/ProjectContext'
import MemberAvatar from './MemberAvatar'

const PRIORITY_CONFIG = {
    low: { dot: '#22c55e', label: 'Low' },
    medium: { dot: '#f59e0b', label: 'Medium' },
    high: { dot: '#ef4444', label: 'High' },
}

export default function TaskCard({ task, onEdit }) {
    const { theme } = useTheme()
    const { getAllMembers, projects } = useProject()
    const allMembers = getAllMembers()
    const {
        attributes, listeners, setNodeRef, transform, transition, isDragging,
    } = useSortable({ id: task.id, data: { type: 'task', task } })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 200ms ease',
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : 1,
    }

    const pri = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium

    const formatDate = (d) => {
        if (!d) return null
        return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const isOverdue = task.due_date && new Date(task.due_date + 'T00:00:00') < new Date(new Date().toDateString()) && task.status !== 'done'
    const assignedMember = task.assigned_user_id
        ? allMembers.find(m => m.userId === task.assigned_user_id)
        : null
    const project = task.project_id ? projects.find(p => p.id === task.project_id) : null

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}
            onClick={() => onEdit(task)} role="button" tabIndex={0}
            aria-label={`Task: ${task.title}, Priority: ${pri.label}${isOverdue ? ', Overdue' : ''}`}
        >
            <div style={{
                background: theme.bgCard,
                border: `1px solid ${isDragging ? theme.borderHover : theme.border}`,
                borderRadius: '10px', padding: '12px 14px', cursor: 'grab',
                transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
                userSelect: 'none',
                boxShadow: isDragging ? `0 12px 28px ${theme.shadow}` : `0 1px 3px ${theme.shadow}`,
            }}
                onMouseEnter={e => { if (!isDragging) { e.currentTarget.style.borderColor = theme.borderHover; e.currentTarget.style.background = theme.bgHover } }}
                onMouseLeave={e => { if (!isDragging) { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.background = theme.bgCard } }}
            >
                {/* Project badge + priority */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: pri.dot, flexShrink: 0 }} />
                    {project && (
                        <span style={{
                            fontSize: '9px', fontWeight: 700, padding: '2px 6px',
                            borderRadius: '4px', background: theme.accentBg,
                            color: theme.accentLight, textTransform: 'uppercase',
                            letterSpacing: '0.03em', maxWidth: '100px',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{project.name}</span>
                    )}
                    {!project && (
                        <span style={{
                            fontSize: '9px', fontWeight: 600, padding: '2px 6px',
                            borderRadius: '4px', background: theme.name === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                            color: theme.textMuted,
                        }}>Personal</span>
                    )}
                    <div style={{ flex: 1 }} />
                    {assignedMember && (
                        <MemberAvatar name={assignedMember.display_name} email={assignedMember.email}
                            avatarUrl={assignedMember.avatar_url} size={20} />
                    )}
                </div>

                {/* Title */}
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: theme.text, lineHeight: 1.4, marginBottom: '2px' }}>
                    {task.title}
                </h4>

                {/* Description */}
                {task.description && (
                    <p style={{
                        fontSize: '12px', color: theme.textMuted, lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        margin: '4px 0 0',
                    }}>{task.description}</p>
                )}

                {/* Bottom row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                        {task.due_date && (
                            <span style={{
                                fontSize: '11px', fontWeight: 500,
                                color: isOverdue ? theme.danger : theme.textMuted, whiteSpace: 'nowrap',
                            }}>📅 {formatDate(task.due_date)}{isOverdue ? ' · Overdue' : ''}</span>
                        )}
                        {assignedMember && (
                            <span style={{ fontSize: '10px', color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                → {assignedMember.display_name || assignedMember.email}
                            </span>
                        )}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: pri.dot, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                        {pri.label}
                    </span>
                </div>
            </div>
        </div>
    )
}
