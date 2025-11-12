"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { BarChart3, Users, Building2, CreditCard, TrendingUp, Shield, DollarSign, AlertTriangle, Clock, Eye, Download, Plus, FileText, X } from "lucide-react"
import { dashboardApi, policyApi, claimsApi, reportsApi } from "@/lib/api-client"
import type { UserRole } from "@/lib/role-config"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function AdminDashboardPage() {
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()
  const userRole: UserRole = (user?.role?.name as UserRole) || "superadmin"
  const [stats, setStats] = useState<any>(null)
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingReport, setDownloadingReport] = useState(false)

  // Modal states for new policy
  const [showNewPolicyModal, setShowNewPolicyModal] = useState(false)
  const [formData, setFormData] = useState({
    customer_id: '',
    policy_type_id: '',
    company_id: '',
    premium: '',
    start_date: '',
    end_date: '',
    coverage_amount: '',
    status: 'active'
  })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch all data in parallel
        const [statsData, policiesData] = await Promise.all([
          dashboardApi.getStats().catch(err => {
            console.error('Failed to fetch dashboard stats:', err)
            return null
          }),
          policyApi.getRecent(6).catch(err => {
            console.error('Failed to fetch recent policies:', err)
            return []
          })
        ])

        setStats(statsData)
        // Handle both array and object response formats
        const policiesList = Array.isArray(policiesData) 
          ? policiesData 
          : (policiesData?.data || policiesData?.policies || [])
        setPolicies(policiesList)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchDashboardData()
    }
  }, [isAuthenticated])

  // Handle report download
  const handleDownloadReport = async () => {
    try {
      setDownloadingReport(true)
      const reportData = await reportsApi.generateReport({
        type: 'dashboard',
        format: 'pdf',
        date_range: 'last-30-days'
      })

      // Create download link
      if (reportData?.download_url) {
        const link = document.createElement('a')
        link.href = reportData.download_url
        link.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        alert('Rapor hazırlanıyor...')
      }
    } catch (error) {
      console.error('Failed to download report:', error)
      alert('Rapor indirilemedi. Lütfen tekrar deneyin.')
    } finally {
      setDownloadingReport(false)
    }
  }

  // Handle new policy modal
  const handleNewPolicy = () => {
    setShowNewPolicyModal(true)
    resetForm()
  }

  // Handle view policy details
  const handleViewPolicy = (policyId: string) => {
    router.push(`/admin/politice/${policyId}`)
  }

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const resetForm = () => {
    setFormData({
      customer_id: '',
      policy_type_id: '',
      company_id: '',
      premium: '',
      start_date: '',
      end_date: '',
      coverage_amount: '',
      status: 'active'
    })
    setFormError('')
  }

  const handleSubmitPolicy = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')

    try {
      // Basic validation
      if (!formData.customer_id || !formData.policy_type_id || !formData.company_id || !formData.premium) {
        throw new Error('Lütfen tüm zorunlu alanları doldurun')
      }

      // Format the data for API
      const policyData = {
        ...formData,
        premium: parseFloat(formData.premium),
        coverage_amount: formData.coverage_amount ? parseFloat(formData.coverage_amount) : null,
        start_date: formData.start_date || new Date().toISOString().split('T')[0],
        end_date: formData.end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }

      await policyApi.create(policyData)
      setShowNewPolicyModal(false)
      resetForm()

      // Refresh policies list
      const updatedPolicies = await policyApi.getRecent(6)
      setPolicies(updatedPolicies?.data || updatedPolicies || [])

      // Show success message
      alert('Poliçe başarıyla oluşturuldu!')
    } catch (err: any) {
      setFormError(err.message || 'Poliçe oluşturulamadı. Lütfen tekrar deneyin.')
    } finally {
      setSubmitting(false)
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

  // Customer role - show only status page
  if (userRole === "musteri") {
    return (
      <main className="p-6 md:p-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#0B3D91" }}>
            Ana Sayfa
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">Başvurunuzun güncel durumunu görüntüleyin</p>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Başvuru durumunuzu görmek için "Başvuru Durumum" sayfasına gidin.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6 md:p-8">
      {/* Page Header */}
      <div className="mb-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#0B3D91" }}>
            Sigorta Yönetim Sistemi
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">Profesyonel Sigorta Çözümleri</p>
        </div>
        <div className="hidden lg:flex gap-3 flex-shrink-0">
          <Button
            variant="outline"
            className="rounded-2xl bg-white border-2 font-semibold hover:bg-slate-50"
            onClick={handleDownloadReport}
            disabled={downloadingReport}
          >
            <Download className="mr-2 h-4 w-4" />
            {downloadingReport ? 'Hazırlanıyor...' : 'Rapor İndir'}
          </Button>
          <Button
            className="rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all"
            style={{ backgroundColor: "#F57C00", color: "white" }}
            onClick={handleNewPolicy}
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Poliçe
          </Button>
        </div>
      </div>

      {/* Dashboard Overview Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <Card className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-3xl shadow-lg"
                style={{ backgroundColor: "#0B3D91" }}
              >
                <Shield className="h-7 w-7 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold tracking-tight">
                {loading ? '...' : (stats?.total_policies || 0)}
              </p>
              <p className="text-sm text-muted-foreground font-semibold">Toplam Poliçe</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-3xl shadow-lg"
                style={{ backgroundColor: "#F57C00" }}
              >
                <DollarSign className="h-7 w-7 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold tracking-tight">
                {loading ? '...' : (stats?.total_premium ? `₺${(stats.total_premium / 1000000).toFixed(1)}M` : '₺2.4M')}
              </p>
              <p className="text-sm text-muted-foreground font-semibold">Toplam Prim</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-red-600 shadow-lg">
                <AlertTriangle className="h-7 w-7 text-white" />
              </div>
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold tracking-tight">
                {loading ? '...' : (stats?.pending_claims || stats?.pending_cases || 0)}
              </p>
              <p className="text-sm text-muted-foreground font-semibold">Bekleyen Hasar</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-green-600 shadow-lg">
                <Users className="h-7 w-7 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold tracking-tight">
                {loading ? '...' : (stats?.active_customers || stats?.total_customers || 0)}
              </p>
              <p className="text-sm text-muted-foreground font-semibold">Aktif Müşteri</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Policies */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: "#0B3D91" }}>
              Son Poliçeler
            </h2>
            <p className="text-muted-foreground font-medium mt-1">En son eklenen sigorta poliçeleri</p>
          </div>
          <Button variant="ghost" className="rounded-2xl font-semibold hover:bg-slate-100">
            Tümünü Gör
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {policies.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Henüz poliçe bulunmamaktadır.</p>
              <Button
                className="mt-4 rounded-2xl"
                style={{ backgroundColor: "#F57C00", color: "white" }}
                onClick={handleNewPolicy}
              >
                <Plus className="h-4 w-4 mr-2" />
                İlk Poliçeyi Oluştur
              </Button>
            </div>
          ) : (
            policies.map((policy) => (
              <Card
                key={policy.id}
                className="rounded-3xl border-2 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-br from-white to-slate-50 cursor-pointer"
                onClick={() => handleViewPolicy(policy.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      className={cn(
                        "rounded-2xl font-semibold px-3 py-1",
                        policy.status === "active" || policy.status === "Aktif"
                          ? "bg-green-100 text-green-800"
                          : policy.status === "pending" || policy.status === "Beklemede"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800",
                      )}
                    >
                      {policy.status === "active" ? "Aktif" :
                       policy.status === "pending" ? "Beklemede" :
                       policy.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-2xl hover:bg-slate-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewPolicy(policy.id)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg tracking-tight">
                      {policy.customer?.ad_soyad || policy.customer_name || policy.customerName || `${policy.customer?.name || ''} ${policy.customer?.surname || ''}`.trim() || 'Bilinmeyen Müşteri'}
                    </h3>
                    <p className="text-sm text-muted-foreground font-semibold">
                      {policy.policy_type || policy.policyType || policy.policy_type_name || 'Poliçe'}
                    </p>
                    {policy.policy_number && (
                      <p className="text-xs text-muted-foreground mt-1">No: {policy.policy_number}</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Şirket:</span>
                      <span className="font-bold">{policy.company || policy.company_name || 'Belirtilmemiş'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Prim:</span>
                      <span className="font-bold text-lg" style={{ color: "#F57C00" }}>
                        {policy.premium ? `₺${(typeof policy.premium === 'string' ? parseFloat(policy.premium) : Number(policy.premium)).toLocaleString('tr-TR')}` : 'Belirtilmemiş'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Başlangıç:</span>
                      <span className="font-bold">
                        {policy.start_date ?
                          new Date(policy.start_date).toLocaleDateString('tr-TR') :
                          'Belirtilmemiş'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Bitiş:</span>
                      <span className="font-bold">
                        {policy.end_date || policy.expiryDate ?
                          new Date(policy.end_date || policy.expiryDate).toLocaleDateString('tr-TR') :
                          'Belirtilmemiş'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Mobile Action Buttons */}
      <div className="lg:hidden flex gap-3 mt-10">
        <Button
          variant="outline"
          className="rounded-2xl bg-white border-2 font-semibold hover:bg-slate-50 flex-1"
          onClick={handleDownloadReport}
          disabled={downloadingReport}
        >
          <Download className="mr-2 h-4 w-4" />
          {downloadingReport ? 'Hazırlanıyor...' : 'Rapor İndir'}
        </Button>
        <Button
          className="rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex-1"
          style={{ backgroundColor: "#F57C00", color: "white" }}
          onClick={handleNewPolicy}
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Poliçe
        </Button>
      </div>

      {/* New Policy Modal */}
      <Dialog open={showNewPolicyModal} onOpenChange={setShowNewPolicyModal}>
        <DialogContent className="rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Poliçe Oluştur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitPolicy} className="space-y-4">
            {formError && (
              <Alert className="rounded-xl border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {formError}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_id">Müşteri ID *</Label>
                <Input
                  id="customer_id"
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleInputChange}
                  className="rounded-xl"
                  placeholder="Müşteri ID'sini girin"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="policy_type_id">Poliçe Tipi *</Label>
                <Select value={formData.policy_type_id} onValueChange={(value) => setFormData(prev => ({ ...prev, policy_type_id: value }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Poliçe tipi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Kasko Sigortası</SelectItem>
                    <SelectItem value="2">Sağlık Sigortası</SelectItem>
                    <SelectItem value="3">Konut Sigortası</SelectItem>
                    <SelectItem value="4">Trafik Sigortası</SelectItem>
                    <SelectItem value="5">DASK</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_id">Şirket *</Label>
                <Select value={formData.company_id} onValueChange={(value) => setFormData(prev => ({ ...prev, company_id: value }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Şirket seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Axa Sigorta</SelectItem>
                    <SelectItem value="2">Allianz</SelectItem>
                    <SelectItem value="3">Aksigorta</SelectItem>
                    <SelectItem value="4">Anadolu Sigorta</SelectItem>
                    <SelectItem value="5">Mapfre Sigorta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="premium">Prim Bedeli (₺) *</Label>
                <Input
                  id="premium"
                  name="premium"
                  type="number"
                  step="0.01"
                  value={formData.premium}
                  onChange={handleInputChange}
                  className="rounded-xl"
                  placeholder="Prim bedelini girin"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Başlangıç Tarihi</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Bitiş Tarihi</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverage_amount">Teminat Tutarı</Label>
                <Input
                  id="coverage_amount"
                  name="coverage_amount"
                  type="number"
                  step="0.01"
                  value={formData.coverage_amount}
                  onChange={handleInputChange}
                  className="rounded-xl"
                  placeholder="Teminat tutarını girin"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Durum</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="expired">Süresi Dolmuş</SelectItem>
                    <SelectItem value="cancelled">İptal Edilmiş</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewPolicyModal(false)}
                className="rounded-xl flex-1"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl flex-1"
                style={{ backgroundColor: "#F57C00", color: "white" }}
              >
                {submitting ? 'Oluşturuluyor...' : 'Poliçe Oluştur'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}