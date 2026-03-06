import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useNotifications() {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const channelRef = useRef(null)

    const fetchNotifications = useCallback(async () => {
        if (!user) return
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)

        if (data) {
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.is_read).length)
        }
    }, [user])

    useEffect(() => { fetchNotifications() }, [fetchNotifications])

    // Realtime subscription
    useEffect(() => {
        if (!user) return
        const channel = supabase
            .channel(`notifications-${user.id}`)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                (payload) => {
                    setNotifications(prev => [payload.new, ...prev])
                    setUnreadCount(prev => prev + 1)

                    // Browser notification
                    if (Notification.permission === 'granted') {
                        new Notification('TaskOrbit', {
                            body: payload.new.message,
                            icon: '/vite.svg',
                        })
                    }
                }
            )
            .subscribe()

        channelRef.current = channel
        return () => { supabase.removeChannel(channel) }
    }, [user])

    // Request browser notification permission
    const requestPermission = async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission()
        }
    }

    const markAsRead = async (id) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id)
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    const markAllRead = async () => {
        if (!user) return
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false)

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
    }

    const clearAll = async () => {
        if (!user) return
        await supabase.from('notifications').delete().eq('user_id', user.id)
        setNotifications([])
        setUnreadCount(0)
    }

    return {
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllRead,
        clearAll,
        requestPermission,
    }
}
