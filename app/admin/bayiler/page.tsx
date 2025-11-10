"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Search, Filter, MoreHorizontal, Building2, MapPin, Phone, Mail, Star, Edit, Trash2, X } from "lucide-react"
import { dealerApi } from "@/lib/api-client"
import type { UserRole } from "@/lib/role-config"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function DealersPage() {
  const { isAuthenticated, user, isLoading, logout } = useAuth()
  const router = useRouter()
  const userRole: UserRole = (user?.role?.name as UserRole) || "superadmin"
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [dealers, setDealers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedDealer, setSelectedDealer] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    phone: '',
    email: '',
    status: 'active'
  })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Fetch dealers
  const fetchDealers = async () => {
    try {
      setLoading(true)
      const data = await dealerApi.list({ search, status })
      // Map database fields to component fields
      const mappedData = (Array.isArray(data) ? data : []).map((dealer: any) => ({
        id: dealer.id,
        name: dealer.dealer_name,
        code: `BAY-${dealer.id.toString().padStart(4, '0')}`,
        location: dealer.city || 'Belirtilmemiş',
        phone: dealer.phone,
        email: dealer.email || '-',
        customer_count: dealer.customers_count || 0,
        rating: (4.0 + (dealer.customers_count * 0.1)).toFixed(1), // Demo rating based on customer count
        revenue: `${(dealer.customers_count * 15000).toLocaleString('tr-TR')} ₺`, // Demo revenue
        status: dealer.status,
      }))
      setDealers(mappedData)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Bayiler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  // Filter dealers based on search and status
  const filteredDealers = dealers.filter(dealer => {
    const matchesSearch = !search ||
      dealer.name?.toLowerCase().includes(search.toLowerCase()) ||
      dealer.code?.toLowerCase().includes(search.toLowerCase()) ||
      dealer.location?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = !status || dealer.status === status

    return matchesSearch && matchesStatus
  })

  useEffect(() => {
    if (isAuthenticated) {
      fetchDealers()
    }
  }, [isAuthenticated, search, status])

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      location: '',
      phone: '',
      email: '',
      status: 'active'
    })
    setFormError('')
    setSelectedDealer(null)
  }

  const handleAddDealer = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')

    try {
      await dealerApi.create(formData)
      setShowAddModal(false)
      resetForm()
      await fetchDealers()
    } catch (err: any) {
      setFormError(err.message || 'Bayi eklenemedi. Lütfen tekrar deneyin.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditDealer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDealer) return

    setSubmitting(true)
    setFormError('')

    try {
      await dealerApi.update(selectedDealer.id, formData)
      setShowEditModal(false)
      resetForm()
      await fetchDealers()
    } catch (err: any) {
      setFormError(err.message || 'Bayi güncellenemedi. Lütfen tekrar deneyin.')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (dealer: any) => {
    setSelectedDealer(dealer)
    setFormData({
      name: dealer.name || '',
      code: dealer.code || '',
      location: dealer.location || '',
      phone: dealer.phone || '',
      email: dealer.email || '',
      status: dealer.status || 'active'
    })
    setShowEditModal(true)
  }

  const handleDeleteDealer = async (id: number) => {
    if (!confirm('Bu bayiyi silmek istediğinizden emin misiniz?')) return

    try {
      await dealerApi.delete(id.toString())
      await fetchDealers()
    } catch (err: any) {
      setError(err.message || 'Bayi silinemedi')
    }
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
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
              <h1 className="text-3xl font-bold text-slate-800">Bayi Yönetimi</h1>
              <p className="text-sm text-slate-600">Tüm bayilerinizi burada yönetebilirsiniz</p>
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

        {/* Search and Filters */}
        <Card className="rounded-3xl border-2 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Bayi ara..."
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
                  <option value="passive">Pasif</option>
                </select>
              </div>
              <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogTrigger asChild>
                  <Button className="rounded-2xl" style={{ backgroundColor: "#F57C00", color: "white" }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Bayi
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl max-w-md">
                  <DialogHeader>
                    <DialogTitle>Yeni Bayi Ekle</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddDealer} className="space-y-4">
                    {formError && (
                      <Alert className="rounded-xl border-red-200 bg-red-50">
                        <AlertDescription className="text-red-700">
                          {formError}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="name">Bayi Adı</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="code">Bayi Kodu</Label>
                      <Input
                        id="code"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        className="rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Konum</Label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Durum</Label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-[#F57C00] focus:outline-none"
                      >
                        <option value="active">Aktif</option>
                        <option value="passive">Pasif</option>
                      </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddModal(false)}
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
                        {submitting ? 'Ekleniyor...' : 'Ekle'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="rounded-3xl border-2 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-blue-600">{loading ? '...' : dealers.length}</span>
              </div>
              <p className="text-sm text-muted-foreground">Toplam Bayi</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {loading ? '...' : dealers.length > 0 ? 
                    (dealers.reduce((acc: number, d: any) => acc + parseFloat(d.rating || '0'), 0) / dealers.length).toFixed(1) 
                    : '0.0'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Ortalama Puan</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-purple-600">{loading ? '...' : dealers.filter(d => d.status === 'active').length}</span>
              </div>
              <p className="text-sm text-muted-foreground">Aktif Bayi</p>
            </CardContent>
          </Card>
        </div>

        {/* Dealers List */}
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <h2 className="text-xl font-semibold">Bayiler</h2>
          </CardHeader>
          <CardContent>
            {filteredDealers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600 mb-4">Bayi bulunamadı.</p>
                <Button className="rounded-2xl" style={{ backgroundColor: "#F57C00", color: "white" }}>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Bayiyi Ekle
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Bayi Bilgileri</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">İletişim</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Müşteri Sayısı</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Puan</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Toplam Ciro</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Durum</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDealers.map((dealer) => (
                      <tr key={dealer.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-slate-800">{dealer.name}</p>
                            <p className="text-sm text-slate-600">{dealer.code}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              <span className="text-sm text-slate-600">{dealer.location}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span className="text-slate-700 text-sm">{dealer.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-slate-400" />
                              <span className="text-slate-700 text-sm">{dealer.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium text-slate-800">{dealer.customer_count}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-medium text-slate-800">{dealer.rating}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium text-slate-800">{dealer.total_revenue}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              dealer.status === 'active' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            {dealer.status === 'active' ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Button variant="ghost" size="sm" className="rounded-xl">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
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