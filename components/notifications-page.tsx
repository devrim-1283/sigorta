"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Bell, Upload, FileText, User, Clock, CheckCircle2, Info, Search, Trash2, RefreshCw } from "lucide-react"
import type { UserRole } from "@/lib/role-config"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/hooks/useNotifications"

interface NotificationsPageProps {
  userRole?: UserRole
}

export function NotificationsPage({ userRole = "superadmin" }: NotificationsPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "bilgi" | "uyari" | "hata" | "basari">("all")
  const {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch,
  } = useNotifications()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "bilgi":
        return <Info className="h-5 w-5" />
      case "uyari":
        return <Bell className="h-5 w-5" />
      case "hata":
        return <Info className="h-5 w-5" />
      case "basari":
        return <CheckCircle2 className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "bilgi":
        return "#0B3D91"
      case "uyari":
        return "#F57C00"
      case "hata":
        return "#dc2626"
      case "basari":
        return "#10b981"
      default:
        return "#64748b"
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "bilgi":
        return <Badge className="bg-blue-100 text-blue-800 rounded-xl">Bilgi</Badge>
      case "uyari":
        return <Badge className="bg-yellow-100 text-yellow-800 rounded-xl">Uyarı</Badge>
      case "hata":
        return <Badge className="bg-red-100 text-red-800 rounded-xl">Hata</Badge>
      case "basari":
        return <Badge className="bg-green-100 text-green-800 rounded-xl">Başarı</Badge>
      default:
        return null
    }
  }

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.baslik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.icerik.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === "all" || notification.tur === filterType
    return matchesSearch && matchesFilter
  })

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id)
      toast.success('Bildirim okundu olarak işaretlendi')
    } catch (error) {
      toast.error('İşlem başarısız oldu')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      toast.success('Tüm bildirimler okundu olarak işaretlendi')
    } catch (error) {
      toast.error('İşlem başarısız oldu')
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Az önce'
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce`
    return `${Math.floor(diffInMinutes / 1440)} gün önce`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: "#0B3D91" }}>
            Bildirim Merkezi
          </h2>
          <p className="text-muted-foreground mt-1">
            {loading ? 'Yükleniyor...' : 'Sistem aktiviteleri ve kullanıcı işlemleri'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="rounded-2xl bg-transparent"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl bg-transparent"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || loading}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Tümünü Okundu İşaretle
          </Button>
          <Badge className="rounded-2xl px-4 py-2 text-base" style={{ backgroundColor: "#F57C00", color: "white" }}>
            {unreadCount} Okunmamış
          </Badge>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="rounded-3xl border-2 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-800">
              <Info className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card className="rounded-3xl border-2">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Bildirim ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)} className="w-full md:w-auto">
              <TabsList className="grid grid-cols-5 rounded-2xl">
                <TabsTrigger value="all" className="rounded-xl">
                  Tümü
                </TabsTrigger>
                <TabsTrigger value="bilgi" className="rounded-xl">
                  Bilgi
                </TabsTrigger>
                <TabsTrigger value="uyari" className="rounded-xl">
                  Uyarı
                </TabsTrigger>
                <TabsTrigger value="hata" className="rounded-xl">
                  Hata
                </TabsTrigger>
                <TabsTrigger value="basari" className="rounded-xl">
                  Başarı
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card className="rounded-3xl border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" style={{ color: "#0B3D91" }} />
            Bildirimler ({filteredNotifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={`skeleton-${index}`} className="flex items-start gap-4 p-4 rounded-2xl border-2">
                    <div className="h-12 w-12 bg-gray-200 rounded-2xl animate-pulse"></div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-8 bg-gray-200 rounded-xl animate-pulse"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded-xl animate-pulse"></div>
                    </div>
                  </div>
                ))
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery || filterType !== "all"
                      ? "Eşleşen bildirim bulunamadı"
                      : "Henüz bildirim bulunmuyor"}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-2xl border-2 transition-all hover:shadow-md",
                      !notification.is_read ? "bg-blue-50 border-blue-200" : "bg-white",
                    )}
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl flex-shrink-0"
                      style={{ backgroundColor: getNotificationColor(notification.tur) }}
                    >
                      <div className="text-white">{getNotificationIcon(notification.tur)}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base">{notification.baslik}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{notification.icerik}</p>
                        </div>
                        {getTypeBadge(notification.tur)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(notification.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          ID: #{notification.id}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="rounded-xl"
                          title="Okundu işaretle"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
