import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const ARCHIVE_AFTER_HOURS_KEY = 'taskOrbit_archiveAfterHours'
const DEFAULT_HOURS = 48 // 2 days

export function useArchive({ onTasksArchived } = {}) {
    const { user } = useAuth()
    const [archivedTasks, setArchivedTasks] = useState([])
    const [loading, setLoading] = useState(false)
    const [archiveHours, setArchiveHoursState] = useState(() => {
        return parseInt(localStorage.getItem(ARCHIVE_AFTER_HOURS_KEY) || DEFAULT_HOURS, 10)
    })

    const setArchiveHours = (hours) => {
        setArchiveHoursState(hours)
        localStorage.setItem(ARCHIVE_AFTER_HOURS_KEY, hours)
    }

    // Fetch archived tasks for the current user
    const fetchArchived = useCallback(async () => {
        if (!user) return
        setLoading(true)
        const { data, error } = await supabase
            .from('archived_tasks')
            .select('*, projects(id, name)')
            .order('archived_at', { ascending: false })
            .limit(200)

        if (!error && data) setArchivedTasks(data)
        setLoading(false)
    }, [user])

    useEffect(() => { fetchArchived() }, [fetchArchived])

    // Run auto-archive: calls the SECURITY DEFINER RPC
    const runAutoArchive = useCallback(async () => {
        if (!user || archiveHours === 0) return 0
        const { data, error } = await supabase.rpc('archive_old_completed_tasks', {
            threshold_hours: archiveHours,
        })
        const count = data || 0
        if (!error && count > 0) {
            if (onTasksArchived) onTasksArchived(count)
            await fetchArchived()
        }
        return count
    }, [user, archiveHours, onTasksArchived, fetchArchived])

    // Restore a task from archive back to Done
    const restoreTask = useCallback(async (archivedTaskId) => {
        const { data, error } = await supabase.rpc('restore_archived_task', {
            archived_task_id: archivedTaskId,
        })
        if (!error && data) {
            setArchivedTasks(prev => prev.filter(t => t.id !== archivedTaskId))
            return true
        }
        return false
    }, [])

    // Permanently delete an archived task
    const deleteArchived = useCallback(async (archivedTaskId) => {
        const { error } = await supabase
            .from('archived_tasks')
            .delete()
            .eq('id', archivedTaskId)
        if (!error) {
            setArchivedTasks(prev => prev.filter(t => t.id !== archivedTaskId))
        }
    }, [])

    return {
        archivedTasks,
        loading,
        archiveHours,
        setArchiveHours,
        fetchArchived,
        runAutoArchive,
        restoreTask,
        deleteArchived,
    }
}
