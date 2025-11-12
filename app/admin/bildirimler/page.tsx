"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Check, X, Filter, Trash2, User, FileText, DollarSign, Settings, Info, AlertTriangle } from "lucide-react"
import type { UserRole } from "@/lib/role-config"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function NotificationsPage() {
  const { isAuthenticated, user, isLoading, logout } = useAuth()
  const router = useRouter()
  const userRole: UserRole = (user?.role?.name as UserRole) || "superadmin"
  const [filter, setFilter] = useState("all")
  const [notifications, setNotifications] = useState<any[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  // Fetch notifications from database
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoadingNotifications(true)
        const data = await notificationApi.list()
        
        // Transform notifications to match the component's expected format
        const transformedNotifications = (data.notifications || []).map((notif: any) => ({
          id: Number(notif.id),
          type: notif.tur || 'system',
          title: notif.baslik,
          message: notif.icerik,
          time: formatTimeAgo(notif.created_at),
          read: notif.is_read,
          priority: notif.oncelik || 'normal'
        }))
        
        setNotifications(transformedNotifications)
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      } finally {
        setLoadingNotifications(false)
      }
    }

    if (isAuthenticated) {
      fetchNotifications()
    }
  }, [isAuthenticated])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return `${seconds} saniye önce`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} dakika önce`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} saat önce`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days} gün önce`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months} ay önce`
    const years = Math.floor(months / 12)
    return `${years} yıl önce`
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'customer':
        return User
      case 'payment':
        return DollarSign
      case 'document':
        return FileText
      case 'system':
        return Info
      case 'alert':
        return AlertTriangle
      case 'settings':
        return Settings
      default:
        return Bell
    }
  }

  const getNotificationColor = (type: string, priority: string) => {
    const baseColors = {
      customer: '#0B3D91',
      payment: '#10b981',
      document: '#F57C00',
      system: '#6b7280',
      alert: '#ef4444',
      settings: '#8b5cf6'
    }

    const color = baseColors[type as keyof typeof baseColors] || '#6b7280'
    return priority === 'high' ? '#ef4444' : color
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notification.read
    if (filter === 'read') return notification.read
    if (filter === 'high') return notification.priority === 'high'
    return notification.type === filter
  })

  const markAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id)
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAsUnread = async (id: number) => {
    try {
      await notificationApi.markAsUnread(id)
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, read: false } : n
      ))
    } catch (error) {
      console.error('Failed to mark as unread:', error)
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      await notificationApi.delete(id)
      setNotifications(notifications.filter(n => n.id !== id))
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      // Mark all as read in DB
      await Promise.all(
        notifications.filter(n => !n.read).map(n => notificationApi.markAsRead(n.id))
      )
      setNotifications(notifications.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const clearAllNotifications = async () => {
    try {
      // Delete all notifications
      await Promise.all(notifications.map(n => notificationApi.delete(n.id)))
      setNotifications([])
    } catch (error) {
      console.error('Failed to clear all notifications:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#0B3D91] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600">Yükleniyor...</p>
        </div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Bildirimler</h1>
            <p className="text-sm text-slate-600">Tüm bildirimlerinizi burada yönetebilirsiniz</p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="outline"
                className="rounded-2xl border-2 font-medium bg-transparent"
              >
                <Check className="h-4 w-4 mr-2" />
                Tümünü Oku
              </Button>
            )}
            <Button
              onClick={clearAllNotifications}
              variant="outline"
              className="rounded-2xl border-2 font-medium bg-transparent"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Temizle
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="rounded-2xl border-2 font-medium bg-transparent"
            >
              Çıkış Yap
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="rounded-3xl border-2 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-blue-600">{notifications.length}</span>
              </div>
              <p className="text-sm text-muted-foreground">Toplam Bildirim</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-orange-600">{unreadCount}</span>
              </div>
              <p className="text-sm text-muted-foreground">Okunmamış</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-red-600">
                  {notifications.filter(n => n.priority === 'high').length}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Yüksek Öncelikli</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => n.type === 'payment').length}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Ödeme Bildirimi</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="rounded-3xl border-2 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-slate-400" />
                <Label>Filtrele:</Label>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="rounded-xl w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü ({notifications.length})</SelectItem>
                    <SelectItem value="unread">Okunmamış ({unreadCount})</SelectItem>
                    <SelectItem value="read">Okunmuş ({notifications.length - unreadCount})</SelectItem>
                    <SelectItem value="high">Yüksek Öncelik ({notifications.filter(n => n.priority === 'high').length})</SelectItem>
                    <SelectItem value="customer">Müşteri ({notifications.filter(n => n.type === 'customer').length})</SelectItem>
                    <SelectItem value="payment">Ödeme ({notifications.filter(n => n.type === 'payment').length})</SelectItem>
                    <SelectItem value="document">Belge ({notifications.filter(n => n.type === 'document').length})</SelectItem>
                    <SelectItem value="system">Sistem ({notifications.filter(n => n.type === 'system').length})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" style={{ color: "#0B3D91" }} />
              Bildirimler
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingNotifications ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Bildirimler yükleniyor...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Bildirim bulunamadı.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type)
                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all ${
                        !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                        style={{ backgroundColor: getNotificationColor(notification.type, notification.priority) }}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-semibold ${!notification.read ? 'text-slate-900' : 'text-slate-700'}`}>
                                {notification.title}
                              </h3>
                              {notification.priority === 'high' && (
                                <Badge className="bg-red-100 text-red-800 rounded-xl text-xs">Yüksek</Badge>
                              )}
                              {!notification.read && (
                                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{notification.message}</p>
                            <p className="text-xs text-slate-500">{notification.time}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.read ? (
                              <Button
                                onClick={() => markAsRead(notification.id)}
                                variant="ghost"
                                size="sm"
                                className="rounded-xl h-8 w-8 p-0"
                                title="Okundu olarak işaretle"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                onClick={() => markAsUnread(notification.id)}
                                variant="ghost"
                                size="sm"
                                className="rounded-xl h-8 w-8 p-0"
                                title="Okunmadı olarak işaretle"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              onClick={() => deleteNotification(notification.id)}
                              variant="ghost"
                              size="sm"
                              className="rounded-xl h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}