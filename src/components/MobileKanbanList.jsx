import React, { useState, useRef, useCallback } from 'react'
import {
    DndContext,
    DragOverlay,
    closestCenter,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    useDroppable,
} from '@dnd-kit/core'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTheme } from '../context/ThemeContext'
import { useProject } from '../context/ProjectContext'
import MemberAvatar from './MemberAvatar'

/* ──────────────────────────────────────────────
   CONSTANTS
   ────────────────────────────────────────────── */

const STATUSES = ['todo', 'in-progress', 'done']
const STATUS_META = {
    todo: { label: 'To Do', emoji: '📝', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', glow: '0 0 16px rgba(167,139,250,0.4)' },
    'in-progress': { label: 'In Progress', emoji: '⏳', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', glow: '0 0 16px rgba(96,165,250,0.4)' },
    done: { label: 'Done', emoji: '✅', color: '#34d399', bg: 'rgba(52,211,153,0.15)', glow: '0 0 16px rgba(52,211,153,0.4)' },
}
const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }

/* ──────────────────────────────────────────────
   SWIPEABLE TASK CARD (mobile list view)
   ────────────────────────────────────────────── */

function SwipeableTaskCard({ task, onEdit, onStatusChange, isDraggingAny }) {
    const { theme } = useTheme()
    const { getAllMembers, projects } = useProject()
    const allMembers = getAllMembers()

    const swipeStartX = useRef(null)
    const swipeStartY = useRef(null)
    const cardRef = useRef(null)
    const [swipeOffset, setSwipeOffset] = useState(0)
    const [swipeDir, setSwipeDir] = useState(null) // 'right' | 'left'
    const [isAnimating, setIsAnimating] = useState(false)

    const {
        attributes, listeners, setNodeRef, transform, transition, isDragging,
    } = useSortable({ id: task.id, data: { type: 'task', task } })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 200ms ease',
        opacity: isDragging ? 0 : 1,
        zIndex: isDragging ? 50 : 1,
    }

    const assignedMember = task.assigned_user_id
        ? allMembers.find(m => m.userId === task.assigned_user_id)
        : null
    const project = task.project_id ? projects.find(p => p.id === task.project_id) : null
    const isOverdue = task.due_date && new Date(task.due_date + 'T00:00:00') < new Date(new Date().toDateString()) && task.status !== 'done'
    const meta = STATUS_META[task.status] || STATUS_META.todo

    const formatDate = (d) => {
        if (!d) return null
        return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    // ── Swipe gesture handlers ──
    const handleTouchStart = (e) => {
        swipeStartX.current = e.touches[0].clientX
        swipeStartY.current = e.touches[0].clientY
        setSwipeOffset(0)
        setSwipeDir(null)
    }

    const handleTouchMove = (e) => {
        if (isDraggingAny) return
        const dx = e.touches[0].clientX - swipeStartX.current
        const dy = Math.abs(e.touches[0].clientY - swipeStartY.current)
        if (dy > 20) return // vertical scroll, don't intercept

        if (Math.abs(dx) > 10) {
            e.stopPropagation()
            setSwipeOffset(Math.max(-90, Math.min(90, dx)))
            setSwipeDir(dx > 0 ? 'right' : 'left')
        }
    }

    const handleTouchEnd = () => {
        if (Math.abs(swipeOffset) > 55) {
            setIsAnimating(true)
            const targetStatus = swipeDir === 'right' ? 'in-progress' : 'done'
            if (targetStatus !== task.status) {
                onStatusChange(task.id, targetStatus)
            }
            setTimeout(() => { setSwipeOffset(0); setIsAnimating(false); setSwipeDir(null) }, 350)
        } else {
            setSwipeOffset(0)
            setSwipeDir(null)
        }
    }

    // Swipe hint background colors
    const swipeHintBg = swipeDir === 'right'
        ? `rgba(96,165,250,${Math.min(Math.abs(swipeOffset) / 90, 1) * 0.3})`
        : swipeDir === 'left'
            ? `rgba(52,211,153,${Math.min(Math.abs(swipeOffset) / 90, 1) * 0.3})`
            : 'transparent'

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, position: 'relative', overflow: 'hidden', borderRadius: '12px' }}
            {...attributes}
            {...listeners}
        >
            {/* Swipe hint layer */}
            {swipeDir && (
                <div style={{
                    position: 'absolute', inset: 0, borderRadius: '12px',
                    background: swipeHintBg,
                    display: 'flex', alignItems: 'center',
                    justifyContent: swipeDir === 'right' ? 'flex-start' : 'flex-end',
                    padding: '0 16px',
                    pointerEvents: 'none', zIndex: 0,
                    transition: 'background 0.1s',
                }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: swipeDir === 'right' ? '#60a5fa' : '#34d399' }}>
                        {swipeDir === 'right' ? '⏳ In Progress' : 'Done ✅'}
                    </span>
                </div>
            )}

            {/* Card itself */}
            <div
                ref={cardRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => onEdit(task)}
                style={{
                    position: 'relative', zIndex: 1,
                    transform: `translateX(${swipeOffset}px)`,
                    transition: isAnimating ? 'transform 0.3s cubic-bezier(0.4,0,0.2,1)' : 'transform 0.08s',
                    background: theme.bgCard,
                    border: `1px solid ${theme.border}`,
                    borderLeft: `3px solid ${meta.color}`,
                    borderRadius: '12px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    boxShadow: `0 2px 8px ${theme.shadow}`,
                }}
            >
                {/* Top row: priority dot + project + assignee */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium, flexShrink: 0 }} />
                    {project && (
                        <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: theme.accentBg, color: theme.accentLight, textTransform: 'uppercase', letterSpacing: '0.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90px' }}>{project.name}</span>
                    )}
                    {!project && (
                        <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: theme.name === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: theme.textMuted }}>Personal</span>
                    )}
                    <div style={{ flex: 1 }} />
                    {/* Status pill */}
                    <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', background: meta.bg, color: meta.color, whiteSpace: 'nowrap' }}>
                        {meta.emoji} {meta.label}
                    </span>
                    {assignedMember && <MemberAvatar name={assignedMember.display_name} email={assignedMember.email} avatarUrl={assignedMember.avatar_url} size={20} />}
                </div>

                {/* Title */}
                <div style={{ fontSize: '13px', fontWeight: 600, color: theme.text, lineHeight: 1.4, marginBottom: task.description ? '3px' : 0 }}>
                    {task.title}
                </div>

                {/* Description preview */}
                {task.description && (
                    <div style={{ fontSize: '11px', color: theme.textMuted, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                        {task.description}
                    </div>
                )}

                {/* Bottom: due date + priority */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '7px' }}>
                    {task.due_date && (
                        <span style={{ fontSize: '10px', color: isOverdue ? theme.danger : theme.textMuted, fontWeight: 500 }}>
                            📅 {formatDate(task.due_date)}{isOverdue ? ' · Overdue' : ''}
                        </span>
                    )}
                    <span style={{ fontSize: '10px', fontWeight: 700, color: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium, textTransform: 'uppercase', letterSpacing: '0.04em', marginLeft: 'auto' }}>
                        {task.priority}
                    </span>
                </div>

                {/* Swipe hint text */}
                {!isDraggingAny && (
                    <div style={{ fontSize: '9px', color: theme.textMuted, marginTop: '4px', opacity: 0.5, textAlign: 'center' }}>
                        swipe → in-progress · ← done · hold to drag
                    </div>
                )}
            </div>
        </div>
    )
}

/* ──────────────────────────────────────────────
   TOP DROP ZONE (one of the 3 status slots)
   ────────────────────────────────────────────── */

function TopDropZone({ status, isDraggingAny, count }) {
    const { theme } = useTheme()
    const { setNodeRef, isOver } = useDroppable({ id: `drop-${status}` })
    const meta = STATUS_META[status]

    return (
        <div
            ref={setNodeRef}
            style={{
                flex: 1,
                padding: isDraggingAny ? '14px 6px' : '10px 6px',
                borderRadius: '12px',
                border: `2px solid ${isOver ? meta.color : isDraggingAny ? meta.color + '55' : theme.border}`,
                background: isOver ? meta.bg : isDraggingAny ? meta.bg.replace('0.15', '0.06') : theme.bgInput,
                textAlign: 'center',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: isOver ? meta.glow : isDraggingAny ? `0 0 8px ${meta.color}22` : 'none',
                transform: isOver ? 'scale(1.04)' : 'scale(1)',
                cursor: isDraggingAny ? 'copy' : 'default',
                minHeight: isDraggingAny ? '72px' : '52px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px',
            }}
        >
            <span style={{ fontSize: isDraggingAny ? '20px' : '14px', transition: 'font-size 0.25s', lineHeight: 1 }}>
                {meta.emoji}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: isOver ? meta.color : isDraggingAny ? meta.color : theme.textSecondary, transition: 'color 0.2s' }}>
                {meta.label}
            </span>
            <span style={{ fontSize: '9px', color: isOver ? meta.color : theme.textMuted, fontWeight: 600 }}>
                {count} task{count !== 1 ? 's' : ''}
            </span>
        </div>
    )
}

/* ──────────────────────────────────────────────
   STATUS SECTION HEADER (in the task list)
   ────────────────────────────────────────────── */

function SectionHeader({ status, count, theme }) {
    const meta = STATUS_META[status]
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 2px 6px',
        }}>
            <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: meta.color, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {meta.label}
            </span>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '8px', background: meta.bg, color: meta.color }}>{count}</span>
            <div style={{ flex: 1, height: '1px', background: meta.color + '33', borderRadius: '1px' }} />
        </div>
    )
}

/* ──────────────────────────────────────────────
   MAIN MOBILE KANBAN LIST VIEW
   ────────────────────────────────────────────── */

export default function MobileKanbanList({ tasks, onEditTask, onCreateTask, reorderTasks, updateTask }) {
    const { theme } = useTheme()
    const [activeTask, setActiveTask] = useState(null)
    const [isDraggingAny, setIsDraggingAny] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 350, tolerance: 5 } })
    )

    // Group by status, preserve order
    const groupedTasks = STATUSES.reduce((acc, s) => {
        acc[s] = tasks.filter(t => t.status === s).sort((a, b) => a.position - b.position)
        return acc
    }, {})

    const allIds = tasks.map(t => t.id)

    const findContainer = (id) => {
        const dropId = String(id)
        if (dropId.startsWith('drop-')) return dropId.replace('drop-', '')
        for (const s of STATUSES) {
            if (groupedTasks[s].some(t => t.id === id)) return s
        }
        return null
    }

    const handleDragStart = ({ active }) => {
        setActiveTask(tasks.find(t => t.id === active.id) || null)
        setIsDraggingAny(true)
    }

    const handleDragEnd = ({ active, over }) => {
        setActiveTask(null)
        setIsDraggingAny(false)
        if (!over) return

        const fromStatus = findContainer(active.id)
        const toStatus = findContainer(over.id)
        if (!fromStatus || !toStatus) return

        // Status changed via drop onto top bar
        if (fromStatus !== toStatus) {
            const maxPos = groupedTasks[toStatus].length
            reorderTasks(tasks.map(t =>
                t.id === active.id ? { ...t, status: toStatus, position: maxPos } : t
            ))
        }
    }

    const handleStatusChange = useCallback((taskId, newStatus) => {
        const maxPos = groupedTasks[newStatus].length
        reorderTasks(tasks.map(t =>
            t.id === taskId ? { ...t, status: newStatus, position: maxPos } : t
        ))
    }, [tasks, reorderTasks, groupedTasks])

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
                fontFamily: 'Outfit',
            }}>
                {/* ── TOP DROP BAR ── */}
                <div style={{
                    padding: isDraggingAny ? '12px 12px 8px' : '8px 12px 4px',
                    borderBottom: `1px solid ${theme.border}`,
                    transition: 'padding 0.25s, background 0.25s',
                    background: isDraggingAny
                        ? theme.name === 'dark' ? 'rgba(124,58,237,0.08)' : 'rgba(124,58,237,0.04)'
                        : theme.bgSecondary,
                    flexShrink: 0,
                    zIndex: 10,
                }}>
                    {isDraggingAny && (
                        <div style={{ textAlign: 'center', fontSize: '11px', color: theme.accentLight, fontWeight: 600, marginBottom: '8px', animation: 'fadeIn 0.2s ease' }}>
                            🎯 Drop task into a status zone
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {STATUSES.map(s => (
                            <TopDropZone
                                key={s}
                                status={s}
                                isDraggingAny={isDraggingAny}
                                count={groupedTasks[s].length}
                            />
                        ))}
                    </div>
                </div>

                {/* ── SCROLLABLE TASK LIST ── */}
                <div style={{
                    flex: 1, overflowY: 'auto', padding: '8px 12px 80px',
                    WebkitOverflowScrolling: 'touch',
                }}>
                    <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
                        {STATUSES.map(status => {
                            const sectionTasks = groupedTasks[status]
                            if (sectionTasks.length === 0) return null
                            return (
                                <div key={status} style={{ marginBottom: '12px' }}>
                                    <SectionHeader status={status} count={sectionTasks.length} theme={theme} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {sectionTasks.map(task => (
                                            <SwipeableTaskCard
                                                key={task.id}
                                                task={task}
                                                onEdit={onEditTask}
                                                onStatusChange={handleStatusChange}
                                                isDraggingAny={isDraggingAny}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </SortableContext>

                    {tasks.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '48px 20px', color: theme.textMuted }}>
                            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎯</div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: theme.text, marginBottom: '6px' }}>No tasks yet</div>
                            <div style={{ fontSize: '12px' }}>Tap the <strong style={{ color: theme.accentLight }}>+</strong> button to create your first task</div>
                        </div>
                    )}
                </div>
            </div>

            <DragOverlay dropAnimation={{ duration: 160, easing: 'ease' }}>
                {activeTask ? (
                    <div style={{
                        background: theme.bgCard,
                        border: `2px solid ${theme.accent}`,
                        borderRadius: '12px',
                        padding: '12px 14px',
                        width: '280px',
                        opacity: 0.92,
                        transform: 'rotate(2deg) scale(1.04)',
                        boxShadow: `0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px ${theme.accent}44`,
                        fontFamily: 'Outfit',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: PRIORITY_COLORS[activeTask.priority] }} />
                            <span style={{ fontSize: '9px', fontWeight: 700, color: theme.accentLight, textTransform: 'uppercase', letterSpacing: '0.04em' }}>dragging</span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: theme.text }}>{activeTask.title}</div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
