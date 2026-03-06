import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'
import { useTheme } from '../context/ThemeContext'

const COLUMN_META = {
    'todo': { emoji: '📝', label: 'To Do', color: '#a78bfa' },
    'in-progress': { emoji: '⏳', label: 'In Progress', color: '#60a5fa' },
    'done': { emoji: '✅', label: 'Done', color: '#34d399' },
}

export default function KanbanColumn({ status, tasks, onEditTask, onCreateTask, isMobile }) {
    const { theme } = useTheme()
    const { setNodeRef, isOver } = useDroppable({ id: status })
    const meta = COLUMN_META[status]

    return (
        <div
            ref={setNodeRef}
            role="region"
            aria-label={`${meta.label} column — ${tasks.length} tasks`}
            style={{
                flex: isMobile ? '0 0 85vw' : '0 0 320px',
                minWidth: isMobile ? '260px' : '280px',
                maxWidth: isMobile ? '85vw' : 'none',
                background: isOver ? theme.bgHover : theme.columnBg,
                border: `1px solid ${isOver ? theme.borderHover : theme.border}`,
                borderRadius: '14px',
                padding: isMobile ? '10px' : '14px',
                display: 'flex',
                flexDirection: 'column',
                transition: 'background 0.15s, border-color 0.15s',
                maxHeight: isMobile ? 'calc(100vh - 160px)' : 'calc(100vh - 120px)',
                scrollSnapAlign: isMobile ? 'start' : 'none',
            }}
        >
            {/* Column header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
                padding: '8px 10px',
                borderRadius: '8px',
                background: theme.name === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>{meta.emoji}</span>
                    <span style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: theme.text,
                        letterSpacing: '0.02em',
                    }}>{meta.label}</span>
                    <span style={{
                        background: theme.accentBg,
                        borderRadius: '10px',
                        padding: '1px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: theme.accentLight,
                        minWidth: '20px',
                        textAlign: 'center',
                    }}>{tasks.length}</span>
                </div>

                {status === 'todo' && (
                    <button
                        onClick={onCreateTask}
                        aria-label="Add new task"
                        style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px',
                            background: theme.accentBg,
                            border: 'none',
                            color: theme.accentLight,
                            fontSize: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.15s',
                            fontFamily: 'Outfit, sans-serif',
                            lineHeight: 1,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = theme.accentBg}
                        title="Add new task"
                    >+</button>
                )}
            </div>

            {/* Task list */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingRight: '2px',
                WebkitOverflowScrolling: 'touch',
            }}>
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <TaskCard key={task.id} task={task} onEdit={onEditTask} />
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <div style={{
                        padding: '20px 14px',
                        border: `1px dashed ${theme.border}`,
                        borderRadius: '10px',
                        textAlign: 'center',
                        color: theme.textMuted,
                        fontSize: '12px',
                    }}>
                        {status === 'todo' ? 'Tap + to add a task' : 'Drag tasks here'}
                    </div>
                )}
            </div>
        </div>
    )
}
