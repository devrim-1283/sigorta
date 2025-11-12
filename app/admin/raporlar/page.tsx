"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Download, FileText, TrendingUp, Users, DollarSign, Calendar, Filter, PieChart } from "lucide-react"
import { dashboardApi, reportsApi } from "@/lib/api-client"
import type { UserRole } from "@/lib/role-config"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function ReportsPage() {
  const { isAuthenticated, user, isLoading, logout } = useAuth()
  const router = useRouter()
  const userRole: UserRole = (user?.role?.name as UserRole) || "superadmin"
  const [dateRange, setDateRange] = useState("last-30-days")
  const [reportType, setReportType] = useState("all")
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardApi.getStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchStats()
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

  // Report data from API
  const reportStats = [
    {
      title: "Toplam Müşteriler",
      value: loading ? '...' : (stats?.total_customers?.toString() || "0"),
      change: loading ? '...' : "",
      icon: Users,
      color: "#0B3D91",
    },
    {
      title: "Aktif Müşteriler",
      value: loading ? '...' : (stats?.active_customers?.toString() || "0"),
      change: loading ? '...' : "",
      icon: Users,
      color: "#F57C00",
    },
    {
      title: "Pasif Müşteriler",
      value: loading ? '...' : (stats?.passive_customers?.toString() || "0"),
      change: loading ? '...' : "",
      icon: Users,
      color: "#6b7280",
    },
    {
      title: "Toplam Gelir",
      value: loading ? '...' : `₺${parseFloat(stats?.total_payments || '0').toLocaleString('tr-TR')}`,
      change: loading ? '...' : "",
      icon: DollarSign,
      color: "#10b981",
    },
    {
      title: "Tamamlanan Dosyalar",
      value: loading ? '...' : (stats?.completed_files?.toString() || "0"),
      change: loading ? '...' : "",
      icon: TrendingUp,
      color: "#8b5cf6",
    },
  ]

  const recentReports = [
    {
      id: 1,
      name: "Aylık Performans Raporu",
      date: "15.12.2024",
      type: "Performans",
      status: "Hazır",
      size: "2.4 MB",
    },
    {
      id: 2,
      name: "Müşteri Analiz Raporu",
      date: "10.12.2024",
      type: "Analiz",
      status: "Hazır",
      size: "1.8 MB",
    },
    {
      id: 3,
      name: "Gelir-Gider Raporu",
      date: "05.12.2024",
      type: "Finansal",
      status: "Hazır",
      size: "3.2 MB",
    },
    {
      id: 4,
      name: "Dosya Durum Raporu",
      date: "01.12.2024",
      type: "Operasyonel",
      status: "Hazır",
      size: "1.5 MB",
    },
  ]

  // Get file type distribution from API
  const fileTypeStats = loading || !stats?.file_type_distribution 
    ? [] 
    : stats.file_type_distribution

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
          <div className="flex items-center gap-4">
            <img src="/oksijen-logo.png" alt="Logo" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Raporlar</h1>
              <p className="text-sm text-slate-600">Detaylı analiz ve raporlama araçları</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="rounded-2xl border-2 font-medium bg-transparent"
          >
            Çıkış Yap
          </Button>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div></div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-2xl bg-transparent">
              <Filter className="mr-2 h-4 w-4" />
              Filtrele
            </Button>
            <Button className="rounded-2xl" style={{ backgroundColor: "#F57C00", color: "white" }}>
              <Download className="mr-2 h-4 w-4" />
              Rapor İndir
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="rounded-3xl border-2 mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tarih Aralığı</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last-7-days">Son 7 Gün</SelectItem>
                    <SelectItem value="last-30-days">Son 30 Gün</SelectItem>
                    <SelectItem value="last-3-months">Son 3 Ay</SelectItem>
                    <SelectItem value="last-6-months">Son 6 Ay</SelectItem>
                    <SelectItem value="last-year">Son 1 Yıl</SelectItem>
                    <SelectItem value="custom">Özel Tarih</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rapor Tipi</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Raporlar</SelectItem>
                    <SelectItem value="performance">Performans</SelectItem>
                    <SelectItem value="financial">Finansal</SelectItem>
                    <SelectItem value="operational">Operasyonel</SelectItem>
                    <SelectItem value="analysis">Analiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dosya Tipi</Label>
                <Select defaultValue="all">
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="deger-kaybi">Değer Kaybı</SelectItem>
                    <SelectItem value="parca-iscilik">Parça ve İşçilik Farkı</SelectItem>
                    <SelectItem value="arac-mahrumiyet">Araç Mahrumiyeti</SelectItem>
                    <SelectItem value="pert-farki">Pert Farkı</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          {reportStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="rounded-3xl border-2 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: stat.color }}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="bg-green-100 text-green-800 rounded-xl">{stat.change}</Badge>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* File Type Distribution */}
        <Card className="rounded-3xl border-2 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" style={{ color: "#0B3D91" }} />
              Dosya Tipi Dağılımı
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-[#0B3D91] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-600">Yükleniyor...</p>
                </div>
              </div>
            ) : fileTypeStats.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Henüz dosya tipi verisi bulunmuyor.
              </div>
            ) : (
              <div className="space-y-4">
                {fileTypeStats.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.type}</span>
                      <span className="text-muted-foreground">
                        {item.count} dosya ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor:
                            index === 0 ? "#0B3D91" : index === 1 ? "#F57C00" : index === 2 ? "#10b981" : "#8b5cf6",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" style={{ color: "#0B3D91" }} />
              Son Oluşturulan Raporlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 rounded-2xl border-2 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: "#0B3D91" }}
                    >
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">{report.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {report.date}
                        </span>
                        <Badge variant="outline" className="rounded-xl">
                          {report.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{report.size}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    İndir
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}