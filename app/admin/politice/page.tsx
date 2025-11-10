"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, Eye, Edit, Trash2, FileText } from "lucide-react"
import { policyApi, dashboardApi } from "@/lib/api-client"
import type { UserRole } from "@/lib/role-config"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function PoliciesPage() {
  const { isAuthenticated, user, isLoading, logout } = useAuth()
  const router = useRouter()
  const userRole: UserRole = (user?.role?.name as UserRole) || "superadmin"
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [stats, setStats] = useState<any>(null)

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
        console.error('Failed to fetch stats:', error)
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

  // Fetch policies
  const fetchPolicies = async () => {
    try {
      setLoading(true)
      const data = await policyApi.list({ search, status })
      setPolicies(Array.isArray(data) ? data : [])
      setError("")
    } catch (err: any) {
      setError(err.message || 'Poliçeler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchPolicies()
    }
  }, [isAuthenticated, search, status])

  const handleViewPolicy = (policyId: string) => {
    router.push(`/admin/politice/${policyId}`)
  }

  const handleEditPolicy = (policyId: string) => {
    router.push(`/admin/politice/${policyId}/duzenle`)
  }

  const handleDeletePolicy = async (id: string) => {
    if (!confirm('Bu poliçeyi silmek istediğinizden emin misiniz?')) return

    try {
      await policyApi.delete(id)
      await fetchPolicies()
    } catch (err: any) {
      setError(err.message || 'Poliçe silinemedi')
    }
  }

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
              <h1 className="text-3xl font-bold text-slate-800">Poliçe Yönetimi</h1>
              <p className="text-sm text-slate-600">Tüm poliçeleri burada yönetebilirsiniz</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push('/admin/dashboard')}
              variant="outline"
              className="rounded-2xl border-2 font-medium bg-transparent"
            >
              Dashboard
            </Button>
            <Button
              className="rounded-2xl"
              style={{ backgroundColor: "#F57C00", color: "white" }}
              onClick={() => router.push('/admin/politice/yeni')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Poliçe
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
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {loading ? '...' : stats?.total_policies || policies.length}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Toplam Poliçe</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {loading ? '...' : stats?.active_policies || policies.filter(p => p.status === 'active').length}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Aktif Poliçe</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-orange-600">
                  {loading ? '...' : 
                    stats?.total_premium ? 
                      `₺${parseFloat(stats.total_premium).toLocaleString('tr-TR')}` : 
                      `₺${policies.reduce((sum, p) => sum + (parseFloat(p.premium) || 0), 0).toLocaleString('tr-TR')}`
                  }
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Toplam Prim</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-purple-600">
                  {loading ? '...' : stats?.active_customers || 0}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Aktif Müşteri</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="rounded-3xl border-2 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Poliçe ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-xl border-2 border-slate-200 focus:border-[#0B3D91] focus:outline-none w-full md:w-80"
                  />
                </div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-[#0B3D91] focus:outline-none"
                >
                  <option value="">Tüm Durumlar</option>
                  <option value="active">Aktif</option>
                  <option value="pending">Beklemede</option>
                  <option value="expired">Süresi Dolmuş</option>
                  <option value="cancelled">İptal Edilmiş</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Policies List */}
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" style={{ color: "#0B3D91" }} />
              Poliçeler ({policies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-[#0B3D91] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-600">Yükleniyor...</p>
              </div>
            ) : policies.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium mb-4">Poliçe bulunamadı.</p>
                <Button
                  className="rounded-2xl"
                  style={{ backgroundColor: "#F57C00", color: "white" }}
                  onClick={() => router.push('/admin/politice/yeni')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Poliçeyi Oluştur
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Poliçe No</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Müşteri</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Poliçe Tipi</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Şirket</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Prim</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Durum</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies.map((policy) => (
                      <tr key={policy.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-4">
                          <span className="font-medium text-slate-800">
                            {policy.policy_number || `POL-${policy.id}`}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-slate-700">
                            {policy.customer_name || policy.customer?.name || `${policy.customer?.name} ${policy.customer?.surname}` || 'Bilinmeyen'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-slate-700">
                            {policy.policy_type || policy.policy_type_name || 'Belirtilmemiş'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-slate-700">
                            {policy.company || policy.company_name || 'Belirtilmemiş'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium text-slate-800" style={{ color: "#F57C00" }}>
                            {policy.premium ? `₺${policy.premium.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              policy.status === 'active' ? 'bg-green-100 text-green-800' :
                              policy.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              policy.status === 'expired' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {policy.status === 'active' ? 'Aktif' :
                             policy.status === 'pending' ? 'Beklemede' :
                             policy.status === 'expired' ? 'Süresi Dolmuş' :
                             policy.status === 'cancelled' ? 'İptal Edilmiş' :
                             policy.status || 'Belirtilmemiş'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl"
                              onClick={() => handleViewPolicy(policy.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl"
                              onClick={() => handleEditPolicy(policy.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl text-red-600 hover:text-red-700"
                              onClick={() => handleDeletePolicy(policy.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}