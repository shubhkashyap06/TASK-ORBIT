import React, { useState, useMemo, useRef } from 'react'
import {
    DndContext,
    DragOverlay,
    closestCorners,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import KanbanColumn from './KanbanColumn'
import TaskCard from './TaskCard'
import { useTheme } from '../context/ThemeContext'

const STATUSES = ['todo', 'in-progress', 'done']
const COLUMN_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' }

export default function KanbanBoard({ tasks, onEditTask, onCreateTask, reorderTasks, isMobile }) {
    const [activeTask, setActiveTask] = useState(null)
    const [activeColumn, setActiveColumn] = useState(0)
    const { theme } = useTheme()
    const scrollRef = useRef(null)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
    )

    const tasksByStatus = useMemo(() => {
        const grouped = {}
        STATUSES.forEach(s => {
            grouped[s] = tasks
                .filter(t => t.status === s)
                .sort((a, b) => a.position - b.position)
        })
        return grouped
    }, [tasks])

    const findContainer = (id) => {
        if (STATUSES.includes(id)) return id
        for (const s of STATUSES) {
            if (tasksByStatus[s].some(t => t.id === id)) return s
        }
        return null
    }

    const handleDragStart = ({ active }) => {
        setActiveTask(tasks.find(t => t.id === active.id))
    }

    const handleDragOver = ({ active, over }) => {
        if (!over) return
        const from = findContainer(active.id)
        const to = findContainer(over.id)
        if (!from || !to || from === to) return
        reorderTasks(tasks.map(t => t.id === active.id ? { ...t, status: to } : t))
    }

    const handleDragEnd = ({ active, over }) => {
        setActiveTask(null)
        if (!over) return
        const from = findContainer(active.id)
        const to = findContainer(over.id)
        if (!from || !to) return

        if (from === to) {
            const col = [...tasksByStatus[from]]
            const oi = col.findIndex(t => t.id === active.id)
            const ni = col.findIndex(t => t.id === over.id)
            if (oi !== -1 && ni !== -1 && oi !== ni) {
                const reordered = arrayMove(col, oi, ni)
                reorderTasks(tasks.map(t => {
                    const idx = reordered.findIndex(r => r.id === t.id)
                    return idx !== -1 ? { ...t, position: idx } : t
                }))
            }
        } else {
            const dest = tasks.filter(t => t.status === to).sort((a, b) => a.position - b.position)
            reorderTasks(tasks.map(t => {
                if (t.status === to) {
                    const idx = dest.findIndex(d => d.id === t.id)
                    return { ...t, position: idx >= 0 ? idx : 0 }
                }
                return t
            }))
        }
    }

    // Track which column is visible on mobile scroll
    const handleScroll = () => {
        if (!scrollRef.current || !isMobile) return
        const { scrollLeft, clientWidth } = scrollRef.current
        const idx = Math.round(scrollLeft / clientWidth)
        setActiveColumn(Math.min(idx, STATUSES.length - 1))
    }

    const scrollToColumn = (idx) => {
        if (!scrollRef.current) return
        const colWidth = scrollRef.current.clientWidth
        scrollRef.current.scrollTo({ left: idx * colWidth * 0.92, behavior: 'smooth' })
        setActiveColumn(idx)
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCorners}
            onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}
        >
            {/* Mobile column tab switcher */}
            {isMobile && (
                <div style={{
                    display: 'flex', gap: '6px', padding: '8px 12px 4px',
                    borderBottom: `1px solid ${theme.border}`, flexShrink: 0,
                    background: theme.bgSecondary,
                }}>
                    {STATUSES.map((s, i) => {
                        const count = tasksByStatus[s].length
                        const isActive = i === activeColumn
                        return (
                            <button key={s} onClick={() => scrollToColumn(i)}
                                style={{
                                    flex: 1, padding: '7px 4px', borderRadius: '8px',
                                    border: 'none', fontFamily: 'Outfit', fontSize: '11px', fontWeight: 700,
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    background: isActive ? theme.accent : theme.bgInput,
                                    color: isActive ? '#fff' : theme.textMuted,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                }}>
                                {COLUMN_LABELS[s]}
                                <span style={{
                                    fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '6px',
                                    background: isActive ? 'rgba(255,255,255,0.25)' : theme.accentBg,
                                    color: isActive ? '#fff' : theme.accentLight,
                                }}>{count}</span>
                            </button>
                        )
                    })}
                </div>
            )}

            <div
                ref={scrollRef}
                onScroll={handleScroll}
                style={{
                    display: 'flex',
                    gap: isMobile ? '0' : '16px',
                    padding: isMobile ? '12px' : '16px 20px',
                    overflowX: 'auto',
                    flex: 1,
                    alignItems: 'flex-start',
                    WebkitOverflowScrolling: 'touch',
                    scrollSnapType: isMobile ? 'x mandatory' : 'none',
                    scrollBehavior: 'smooth',
                    msOverflowStyle: 'none',
                }}
            >
                {STATUSES.map(s => (
                    <KanbanColumn key={s} status={s} tasks={tasksByStatus[s]}
                        onEditTask={onEditTask} onCreateTask={onCreateTask}
                        isMobile={isMobile} />
                ))}
            </div>

            {/* Mobile: scroll position dots */}
            {isMobile && (
                <div style={{
                    display: 'flex', justifyContent: 'center', gap: '6px',
                    padding: '6px 0 2px', flexShrink: 0,
                }}>
                    {STATUSES.map((_, i) => (
                        <div key={i} onClick={() => scrollToColumn(i)}
                            style={{
                                width: i === activeColumn ? '18px' : '6px',
                                height: '6px', borderRadius: '3px',
                                background: i === activeColumn ? theme.accent : theme.border,
                                transition: 'width 0.3s, background 0.3s',
                                cursor: 'pointer',
                            }} />
                    ))}
                </div>
            )}

            <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
                {activeTask ? (
                    <div style={{ width: isMobile ? 280 : 310, opacity: 0.9, transform: 'rotate(2deg)' }}>
                        <TaskCard task={activeTask} onEdit={() => { }} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
