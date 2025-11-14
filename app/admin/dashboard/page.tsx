"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Users, Building2, FileText, Bell, ChevronRight } from "lucide-react"
import { dashboardApi, customerApi, dealerApi, documentApi, notificationApi } from "@/lib/api-client"
import type { UserRole } from "@/lib/role-config"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function AdminDashboardPage() {
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()
  const userRole: UserRole = (user?.role?.name as UserRole) || "superadmin"
  const [stats, setStats] = useState<any>(null)
  const [recentCustomers, setRecentCustomers] = useState<any[]>([])
  const [recentDealers, setRecentDealers] = useState<any[]>([])
  const [recentDocuments, setRecentDocuments] = useState<any[]>([])
  const [recentNotifications, setRecentNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch stats
        const statsData = await dashboardApi.getStats().catch(() => null)
        setStats(statsData)

        // Fetch recent data based on role
        if (userRole === 'superadmin') {
          // Superadmin sees everything
          const [customers, dealers, documents, notifications] = await Promise.all([
            customerApi.list({ page: 1, perPage: 5 }).catch(() => ({ customers: [] })),
            dealerApi.list({ page: 1, perPage: 5 }).catch(() => []),
            documentApi.list({ page: 1, perPage: 5 }).catch(() => ({ documents: [] })),
            notificationApi.list({ page: 1, perPage: 5 }).catch(() => ({ notifications: [] })),
          ])
          
          setRecentCustomers(customers.customers || [])
          setRecentDealers(Array.isArray(dealers) ? dealers : dealers.dealers || [])
          setRecentDocuments(documents.documents || [])
          setRecentNotifications(notifications.notifications || [])
        } else if (userRole === 'evrak-birimi') {
          // Evrak birimi only sees documents
          const documents = await documentApi.list({ page: 1, perPage: 5 }).catch(() => ({ documents: [] }))
          setRecentDocuments(documents.documents || [])
        } else {
          // Other admins see customers, documents, notifications (no dealers, no stats)
          const [customers, documents, notifications] = await Promise.all([
            customerApi.list({ page: 1, perPage: 5 }).catch(() => ({ customers: [] })),
            documentApi.list({ page: 1, perPage: 5 }).catch(() => ({ documents: [] })),
            notificationApi.list({ page: 1, perPage: 5 }).catch(() => ({ notifications: [] })),
          ])
          
          setRecentCustomers(customers.customers || [])
          setRecentDocuments(documents.documents || [])
          setRecentNotifications(notifications.notifications || [])
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchDashboardData()
    }
  }, [isAuthenticated, userRole])

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

  // Show only documents for evrak-birimi
  if (userRole === 'evrak-birimi') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-slate-600 mt-1">Hoş geldiniz, {user?.name}</p>
          </div>

          {/* Recent Documents */}
          <Card className="rounded-3xl border-2 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Son Evraklar
                </CardTitle>
                <Button
                  onClick={() => router.push('/admin/dokumanlar')}
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Daha Fazla <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-4 border-[#0B3D91] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : recentDocuments.length > 0 ? (
                <div className="space-y-2">
                  {recentDocuments.map((doc: any) => (
                    <div key={doc.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between hover:bg-slate-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{doc.dosya_adı || doc.file_name}</p>
                        <p className="text-sm text-slate-600">{doc.customer?.ad_soyad || 'Müşteri belirtilmemiş'}</p>
                      </div>
                      <span className="text-xs text-slate-500">{doc.tip || doc.document_type}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">Henüz evrak yok</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-600 mt-1">Hoş geldiniz, {user?.name}</p>
        </div>

        {/* Stats Cards - Only for superadmin */}
        {userRole === 'superadmin' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Toplam Müşteri */}
            <Card className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-600 shadow-lg">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-3xl font-bold tracking-tight">
                    {loading ? '...' : (stats?.total_customers || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground font-semibold">
                    Toplam Müşteri
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Toplam Bayi */}
            <Card className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-purple-600 shadow-lg">
                    <Building2 className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-3xl font-bold tracking-tight">
                    {loading ? '...' : (stats?.total_dealers || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground font-semibold">
                    Toplam Bayi
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Toplam Evrak */}
            <Card className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-green-600 shadow-lg">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-3xl font-bold tracking-tight">
                    {loading ? '...' : (stats?.total_documents || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground font-semibold">
                    Toplam Evrak
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Okunmamış Bildirimler */}
            <Card className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-orange-600 shadow-lg">
                    <Bell className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-3xl font-bold tracking-tight">
                    {loading ? '...' : (stats?.unread_notifications || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground font-semibold">
                    Okunmamış Bildirim
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Data Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Customers */}
          {recentCustomers.length > 0 && (
            <Card className="rounded-3xl border-2 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Son Müşteriler
                  </CardTitle>
                  <Button
                    onClick={() => router.push('/admin/musteriler')}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Daha Fazla <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-4 border-[#0B3D91] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentCustomers.map((customer: any) => (
                      <div
                        key={customer.id}
                        className="p-3 bg-slate-50 rounded-xl flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/musteriler/${customer.id}`)}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{customer.ad_soyad}</p>
                          <p className="text-sm text-slate-600">{customer.telefon}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Dealers - Only for superadmin */}
          {userRole === 'superadmin' && recentDealers.length > 0 && (
            <Card className="rounded-3xl border-2 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    Son Bayiler
                  </CardTitle>
                  <Button
                    onClick={() => router.push('/admin/bayiler')}
                    variant="ghost"
                    size="sm"
                    className="text-purple-600 hover:text-purple-700"
                  >
                    Daha Fazla <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-4 border-[#0B3D91] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentDealers.map((dealer: any) => (
                      <div
                        key={dealer.id}
                        className="p-3 bg-slate-50 rounded-xl flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/bayiler`)}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">
                            {userRole === 'birincil-admin' || userRole === 'ikincil-admin' 
                              ? `Bayi ID: ${dealer.id}` 
                              : dealer.dealer_name}
                          </p>
                          <p className="text-sm text-slate-600">
                            {userRole === 'superadmin' && dealer.contact_person}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Documents */}
          {recentDocuments.length > 0 && (
            <Card className="rounded-3xl border-2 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Son Evraklar
                  </CardTitle>
                  <Button
                    onClick={() => router.push('/admin/dokumanlar')}
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-700"
                  >
                    Daha Fazla <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-4 border-[#0B3D91] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentDocuments.map((doc: any) => (
                      <div key={doc.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between hover:bg-slate-100 transition-colors">
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="font-medium text-slate-800 truncate" title={doc.dosya_adı || doc.file_name}>
                            {doc.dosya_adı || doc.file_name}
                          </p>
                          <p className="text-sm text-slate-600 truncate">{doc.customer?.ad_soyad || 'Müşteri belirtilmemiş'}</p>
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">{doc.tip || doc.document_type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Notifications */}
          {recentNotifications.length > 0 && (
            <Card className="rounded-3xl border-2 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Bell className="h-5 w-5 text-orange-600" />
                    Son Bildirimler
                  </CardTitle>
                  <Button
                    onClick={() => router.push('/admin/bildirimler')}
                    variant="ghost"
                    size="sm"
                    className="text-orange-600 hover:text-orange-700"
                  >
                    Daha Fazla <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-4 border-[#0B3D91] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentNotifications.map((notif: any) => (
                      <div key={notif.id} className={cn(
                        "p-3 rounded-xl flex items-start gap-3 hover:bg-slate-100 transition-colors",
                        notif.is_read ? "bg-slate-50" : "bg-blue-50"
                      )}>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 text-sm">{notif.title}</p>
                          <p className="text-xs text-slate-600 line-clamp-1">{notif.message}</p>
                        </div>
                        {!notif.is_read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
