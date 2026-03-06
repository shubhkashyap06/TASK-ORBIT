import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useTasks() {
    const { user } = useAuth()
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const channelRef = useRef(null)

    // Fetch ALL tasks the user can see: personal + all projects they belong to
    const fetchTasks = useCallback(async () => {
        if (!user) return
        setLoading(true)

        // Get all project IDs for this user
        const { data: memberships } = await supabase
            .from('project_members')
            .select('project_id')
            .eq('user_id', user.id)

        const projectIds = (memberships || []).map(m => m.project_id)

        // Fetch personal tasks (no project)
        const personalPromise = supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .is('project_id', null)
            .order('position', { ascending: true })

        // Fetch project tasks
        let projectPromise = null
        if (projectIds.length > 0) {
            projectPromise = supabase
                .from('tasks')
                .select('*')
                .in('project_id', projectIds)
                .order('position', { ascending: true })
        }

        const [personalResult, projectResult] = await Promise.all([
            personalPromise,
            projectPromise || Promise.resolve({ data: [] }),
        ])

        const allTasks = [
            ...(personalResult.data || []),
            ...(projectResult.data || []),
        ]

        // Deduplicate (just in case)
        const seen = new Set()
        const unique = allTasks.filter(t => {
            if (seen.has(t.id)) return false
            seen.add(t.id)
            return true
        })

        setTasks(unique)
        setLoading(false)
    }, [user])

    useEffect(() => { fetchTasks() }, [fetchTasks])

    // Realtime — listen for changes on tasks the user owns or belongs to
    useEffect(() => {
        if (!user) return

        const channel = supabase
            .channel(`tasks-user-${user.id}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setTasks(prev => {
                            if (prev.some(t => t.id === payload.new.id)) return prev
                            return [...prev, payload.new]
                        })
                    } else if (payload.eventType === 'UPDATE') {
                        setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t))
                    } else if (payload.eventType === 'DELETE') {
                        setTasks(prev => prev.filter(t => t.id !== payload.old.id))
                    }
                }
            )
            .subscribe()

        channelRef.current = channel
        return () => { supabase.removeChannel(channel) }
    }, [user])

    const createTask = async (task) => {
        if (!user) return { error: 'Not authenticated' }

        const todoTasks = tasks.filter(t => t.status === 'todo')
        const maxPos = todoTasks.length > 0
            ? Math.max(...todoTasks.map(t => t.position)) + 1
            : 0

        const newTask = {
            user_id: user.id,
            created_by: user.id,
            project_id: task.project_id || null,
            title: task.title,
            description: task.description || '',
            status: 'todo',
            priority: task.priority || 'medium',
            due_date: task.due_date || null,
            assigned_user_id: task.assigned_user_id || null,
            position: maxPos,
        }

        const { data, error } = await supabase
            .from('tasks')
            .insert(newTask)
            .select()
            .single()

        if (!error && data) {
            setTasks(prev => {
                if (prev.some(t => t.id === data.id)) return prev
                return [...prev, data]
            })

            // Log activity if project task
            if (data.project_id) {
                await supabase.from('activity_log').insert({
                    project_id: data.project_id,
                    user_id: user.id,
                    action: 'created task',
                    entity_type: 'task',
                    entity_id: data.id,
                    metadata: { title: data.title },
                })
            }

            // Notify assigned user
            if (task.assigned_user_id && task.assigned_user_id !== user.id) {
                await supabase.from('notifications').insert({
                    user_id: task.assigned_user_id,
                    type: 'assignment',
                    message: `You were assigned to "${task.title}"`,
                })
            }
        }
        return { data, error }
    }

    const updateTask = async (id, updates) => {
        const oldTask = tasks.find(t => t.id === id)

        // Auto-track completed_at for auto-archive
        const enrichedUpdates = { ...updates }
        if (updates.status === 'done' && oldTask?.status !== 'done') {
            enrichedUpdates.completed_at = new Date().toISOString()
        } else if (updates.status && updates.status !== 'done' && oldTask?.status === 'done') {
            enrichedUpdates.completed_at = null
        }

        const { data, error } = await supabase
            .from('tasks')
            .update(enrichedUpdates)
            .eq('id', id)
            .select()
            .single()

        if (!error && data) {
            setTasks(prev => prev.map(t => t.id === id ? data : t))

            // Log activity if project task
            if (data.project_id && user) {
                let action = 'updated task'
                if (updates.status && oldTask && updates.status !== oldTask.status) {
                    action = `moved task to ${updates.status}`
                }
                if (updates.assigned_user_id && oldTask && updates.assigned_user_id !== oldTask.assigned_user_id) {
                    action = 'assigned task'
                }

                await supabase.from('activity_log').insert({
                    project_id: data.project_id,
                    user_id: user.id,
                    action,
                    entity_type: 'task',
                    entity_id: id,
                    metadata: { title: data.title },
                })
            }

            // Notify on assignment change
            if (updates.assigned_user_id && updates.assigned_user_id !== user?.id
                && (!oldTask || updates.assigned_user_id !== oldTask.assigned_user_id)) {
                await supabase.from('notifications').insert({
                    user_id: updates.assigned_user_id,
                    type: 'assignment',
                    message: `You were assigned to "${data.title}"`,
                })
            }
        }
        return { data, error }
    }

    const deleteTask = async (id) => {
        const task = tasks.find(t => t.id === id)
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id)

        if (!error) {
            setTasks(prev => prev.filter(t => t.id !== id))

            if (task?.project_id && user) {
                await supabase.from('activity_log').insert({
                    project_id: task.project_id,
                    user_id: user.id,
                    action: 'deleted task',
                    entity_type: 'task',
                    entity_id: id,
                    metadata: { title: task.title },
                })
            }
        }
        return { error }
    }

    const moveTask = async (taskId, newStatus, newPosition) => {
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) return { ...t, status: newStatus, position: newPosition }
            return t
        }))

        await supabase
            .from('tasks')
            .update({ status: newStatus, position: newPosition })
            .eq('id', taskId)
    }

    const reorderTasks = async (updatedTasks) => {
        setTasks(updatedTasks)

        const promises = updatedTasks.map(t =>
            supabase
                .from('tasks')
                .update({ status: t.status, position: t.position })
                .eq('id', t.id)
        )
        await Promise.all(promises)
    }

    const getTasksByStatus = useCallback((status) => {
        return tasks
            .filter(t => t.status === status)
            .sort((a, b) => a.position - b.position)
    }, [tasks])

    return {
        tasks,
        loading,
        fetchTasks,
        createTask,
        updateTask,
        deleteTask,
        moveTask,
        reorderTasks,
        getTasksByStatus,
    }
}
