import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useProject } from '../context/ProjectContext'

export function useActivityLog() {
    const { activeProjectId } = useProject()
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(false)

    const fetchActivities = useCallback(async () => {
        if (!activeProjectId) { setActivities([]); return }
        setLoading(true)
        const { data } = await supabase
            .from('activity_log')
            .select('*, profiles:user_id(display_name, avatar_url, email)')
            .eq('project_id', activeProjectId)
            .order('created_at', { ascending: false })
            .limit(50)

        if (data) setActivities(data)
        setLoading(false)
    }, [activeProjectId])

    useEffect(() => { fetchActivities() }, [fetchActivities])

    // Realtime subscription
    useEffect(() => {
        if (!activeProjectId) return
        const channel = supabase
            .channel(`activity-${activeProjectId}`)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'activity_log', filter: `project_id=eq.${activeProjectId}` },
                (payload) => {
                    // Re-fetch to get joined profile data
                    fetchActivities()
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [activeProjectId, fetchActivities])

    return { activities, loading, fetchActivities }
}
