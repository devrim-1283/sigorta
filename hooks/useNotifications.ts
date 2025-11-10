import { useState, useEffect } from 'react'
import { notificationApi } from '@/lib/api-client'

export interface Notification {
  id: number
  baslik: string
  icerik: string
  tur: 'bilgi' | 'uyari' | 'hata' | 'basari'
  is_read: boolean
  created_at: string
  updated_at?: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await notificationApi.getAll()
      setNotifications(data || [])
    } catch (err) {
      console.error('Notifications fetch error:', err)
      setError('Bildirimler yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id.toString())
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      )
    } catch (err) {
      console.error('Mark as read error:', err)
      throw err
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      )
    } catch (err) {
      console.error('Mark all as read error:', err)
      throw err
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  }
}