import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useReminders(tasks) {
    const { user } = useAuth()
    const sentRef = useRef(new Set()) // track sent reminder task IDs

    useEffect(() => {
        if (!user || !tasks || tasks.length === 0) return

        const checkReminders = async () => {
            const now = new Date()
            const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)

            for (const task of tasks) {
                if (!task.due_date || task.status === 'done') continue
                if (sentRef.current.has(task.id)) continue

                // Only remind for tasks assigned to this user or created by them
                if (task.assigned_user_id !== user.id && task.created_by !== user.id && task.user_id !== user.id) continue

                const dueDate = new Date(task.due_date + 'T00:00:00')
                const timeDiff = dueDate.getTime() - now.getTime()

                // Due within 1 hour and not past
                if (timeDiff > 0 && timeDiff <= 60 * 60 * 1000) {
                    sentRef.current.add(task.id)

                    // Browser notification
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('⏰ Task Reminder', {
                            body: `"${task.title}" is due in less than 1 hour!`,
                            icon: '/vite.svg',
                        })
                    }

                    // In-app notification
                    await supabase.from('notifications').insert({
                        user_id: user.id,
                        type: 'reminder',
                        message: `Reminder: "${task.title}" is due soon!`,
                    })
                }

                // Due today (within 24 hours) - separate reminder
                if (timeDiff > 60 * 60 * 1000 && timeDiff <= 24 * 60 * 60 * 1000) {
                    const todayKey = `${task.id}-today`
                    if (!sentRef.current.has(todayKey)) {
                        sentRef.current.add(todayKey)
                    }
                }
            }
        }

        // Check immediately, then every 60 seconds
        checkReminders()
        const interval = setInterval(checkReminders, 60 * 1000)
        return () => clearInterval(interval)
    }, [user, tasks])
}
