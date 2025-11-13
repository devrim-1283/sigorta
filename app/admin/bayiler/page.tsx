"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import type { UserRole } from "@/lib/role-config"
import { canCreateDealer } from "@/lib/permissions"

import { dealerApi } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import {
  Building2,
  Edit,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Star,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
} from "lucide-react"

export const dynamic = "force-dynamic"

interface Dealer {
  id: number
  dealer_name: string
  contact_person?: string | null
  phone: string
  email?: string | null
  city?: string | null
  address?: string | null
  tax_number?: string | null
  status: string
  customers_count: number
  created_at?: string
}

interface ConfirmDialogConfig {
  open: boolean
  title: string
  description: string
  confirmLabel: string
}

const statusLabels: Record<string, string> = {
  active: "Aktif",
  passive: "Pasif",
  pending: "Beklemede",
}

function formatStatus(status: string) {
  return statusLabels[status] || status
}

export default function DealersPage() {
  const { isAuthenticated, user, isLoading, logout } = useAuth()
  const router = useRouter()
  const userRole: UserRole = (user?.role?.name as UserRole) || "superadmin"

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null)

  const [formData, setFormData] = useState({
    dealer_name: "",
    contact_person: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    tax_number: "",
    status: "active",
    password: "",
  })
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogConfig>({
    open: false,
    title: "",
    description: "",
    confirmLabel: "Onayla",
  })
  const confirmActionRef = useRef<null | (() => Promise<void> | void)>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const fetchDealers = async () => {
    try {
      setLoading(true)
      const data = await dealerApi.list({ search, status })
      const mapped: Dealer[] = (Array.isArray(data) ? data : []).map((dealer: any) => ({
        id: Number(dealer.id),
        dealer_name: dealer.dealer_name || "Belirtilmemiş",
        contact_person: dealer.contact_person,
        phone: dealer.phone || "-",
        email: dealer.email || "-",
        city: dealer.city || dealer.address || "Belirtilmemiş",
        address: dealer.address || "",
        tax_number: dealer.tax_number || "",
        status: dealer.status || "active",
        customers_count: dealer.customers_count ?? dealer._count?.customers ?? 0,
        created_at: dealer.created_at || dealer.createdAt || undefined,
      }))
      setDealers(mapped)
      setError("")
    } catch (err: any) {
      setError(err.message || "Bayiler yüklenemedi")
    } finally {
      setLoading(false)
    }
  }

  const filteredDealers = useMemo(() => {
    return dealers.filter((dealer) => {
      const matchesSearch =
        !search ||
        dealer.dealer_name?.toLowerCase().includes(search.toLowerCase()) ||
        dealer.contact_person?.toLowerCase?.().includes(search.toLowerCase()) ||
        dealer.city?.toLowerCase?.().includes(search.toLowerCase()) ||
        dealer.tax_number?.toLowerCase?.().includes(search.toLowerCase())

      const matchesStatus = !status || dealer.status === status
      return matchesSearch && matchesStatus
    })
  }, [dealers, search, status])

  useEffect(() => {
    if (isAuthenticated) {
      fetchDealers()
    }
  }, [isAuthenticated, search, status])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormError("")
  }

  const resetForm = () => {
    setFormData({
      dealer_name: "",
      contact_person: "",
      phone: "",
      email: "",
      city: "",
      address: "",
      tax_number: "",
      status: "active",
      password: "",
    })
    setFormError("")
    setShowPassword(false)
    setSelectedDealer(null)
  }

  const generateStrongPassword = () => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz"
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const digits = "0123456789"
    const symbols = "!@#$%^&*()-_=+[]{}<>?,."
    const allChars = lowercase + uppercase + digits + symbols
    const length = 14

    const getRandomChar = (charset: string) => {
      if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
        const array = new Uint32Array(1)
        window.crypto.getRandomValues(array)
        return charset[array[0] % charset.length]
      }

      return charset[Math.floor(Math.random() * charset.length)]
    }

    const guarantee = [
      getRandomChar(lowercase),
      getRandomChar(uppercase),
      getRandomChar(digits),
      getRandomChar(symbols),
    ]

    const remainingLength = Math.max(length - guarantee.length, 0)
    for (let i = 0; i < remainingLength; i++) {
      guarantee.push(getRandomChar(allChars))
    }

    // Shuffle to avoid predictable positions
    for (let i = guarantee.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[guarantee[i], guarantee[j]] = [guarantee[j], guarantee[i]]
    }

    return guarantee.join("")
  }

  const handleGeneratePassword = async () => {
    const password = generateStrongPassword()
    // Update state immediately
    setFormData((prev) => {
      const updated = { ...prev, password }
      return updated
    })

    // Use setTimeout to ensure state is updated before showing toast
    setTimeout(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(password)
        toast({
          title: "Şifre oluşturuldu",
          description: "Yeni şifre panoya kopyalandı.",
        })
      } else {
        throw new Error("Clipboard API not available")
      }
    } catch (error) {
      console.error("Password copy failed:", error)
      toast({
          title: "Şifre oluşturuldu",
        description: `Yeni şifre: ${password}`,
        })
      }
    }, 0)
  }

  const handleCopyPassword = async () => {
    if (!formData.password) {
      toast({
        title: "Uyarı",
        description: "Kopyalanacak şifre yok",
        variant: "default",
        duration: 3000,
      })
      return
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(formData.password)
        toast({
          title: "Kopyalandı",
          description: "Şifre panoya kopyalandı.",
        })
      } else {
        throw new Error("Clipboard API not available")
      }
    } catch (error) {
      console.error("Password copy failed:", error)
      toast({
        title: "Uyarı",
        description: "Şifre kopyalanamadı",
        variant: "default",
        duration: 4000,
      })
    }
  }

  const handleAddDealer = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError("")

    const trimmedEmail = formData.email.trim()
    const password = formData.password.trim()

    if (!trimmedEmail) {
      setFormError("Bayi kullanıcı hesabı için e-posta adresi gereklidir.")
      return
    }

    if (password.length < 8) {
      setFormError("Şifre en az 8 karakter olmalıdır.")
      return
    }

    setSubmitting(true)

    try {
      await dealerApi.create({
        dealer_name: formData.dealer_name,
        contact_person: formData.contact_person || null,
        phone: formData.phone,
        email: trimmedEmail,
        city: formData.city || null,
        address: formData.address || null,
        tax_number: formData.tax_number || null,
        status: formData.status,
        password,
      })

      setShowAddModal(false)
      resetForm()
      await fetchDealers()
    } catch (err: any) {
      setFormError(err.message || "Bayi eklenemedi. Lütfen tekrar deneyin.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditDealer = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedDealer) return

    setFormError("")

    const trimmedPassword = formData.password.trim()

    if (trimmedPassword && trimmedPassword.length < 8) {
      setFormError("Yeni şifre en az 8 karakter olmalıdır.")
      return
    }

    setSubmitting(true)

    try {
      const payload: any = {
        dealer_name: formData.dealer_name,
        contact_person: formData.contact_person || null,
        phone: formData.phone,
        email: formData.email || null,
        city: formData.city || null,
        address: formData.address || null,
        tax_number: formData.tax_number || null,
        status: formData.status,
      }

      if (trimmedPassword) {
        payload.password = trimmedPassword
      }

      await dealerApi.update(selectedDealer.id, payload)

      setShowEditModal(false)
      resetForm()
      await fetchDealers()
    } catch (err: any) {
      setFormError(err.message || "Bayi güncellenemedi. Lütfen tekrar deneyin.")
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (dealer: Dealer) => {
    setSelectedDealer(dealer)
    setFormData({
      dealer_name: dealer.dealer_name || "",
      contact_person: dealer.contact_person || "",
      phone: dealer.phone || "",
      email: dealer.email || "",
      city: dealer.city || "",
      address: dealer.address || "",
      tax_number: dealer.tax_number || "",
      status: dealer.status || "active",
      password: "",
    })
    setFormError("")
    setShowPassword(false)
    setShowEditModal(true)
  }

  const openConfirmDialog = ({
    title,
    description,
    confirmLabel = "Onayla",
    action,
  }: {
    title: string
    description: string
    confirmLabel?: string
    action: () => Promise<void> | void
  }) => {
    confirmActionRef.current = action
    setConfirmDialog({
      open: true,
      title,
      description,
      confirmLabel: confirmLabel ?? "Onayla",
    })
  }

  const handleConfirmDialogClose = () => {
    if (confirmLoading) return
    setConfirmDialog((prev) => ({ ...prev, open: false }))
    confirmActionRef.current = null
  }

  const handleConfirmDialogAction = async () => {
    if (!confirmActionRef.current) {
      handleConfirmDialogClose()
      return
    }

    try {
      setConfirmLoading(true)
      await confirmActionRef.current()
    } catch (error) {
      console.error("Confirm dialog action error:", error)
    } finally {
      setConfirmLoading(false)
      handleConfirmDialogClose()
    }
  }

  const handleDeleteDealer = (dealer: Dealer) => {
    openConfirmDialog({
      title: "Bayiyi Sil",
      description: `${dealer.dealer_name} bayisini silmek istediğinizden emin misiniz?`,
      confirmLabel: "Evet, Sil",
      action: async () => {
        try {
          await dealerApi.delete(dealer.id.toString())
          await fetchDealers()
        } catch (err: any) {
          setError(err.message || "Bayi silinemedi")
          throw err
        }
      },
    })
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const confirmDialogElement = (
    <AlertDialog
      open={confirmDialog.open}
      onOpenChange={(open) => {
        if (!open) {
          handleConfirmDialogClose()
        }
      }}
    >
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold">
            {confirmDialog.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {confirmDialog.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              className="rounded-2xl"
              disabled={confirmLoading}
              onClick={(event) => {
                event.preventDefault()
                handleConfirmDialogClose()
              }}
            >
              Vazgeç
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              className="rounded-2xl bg-red-600 hover:bg-red-700 text-white"
              disabled={confirmLoading}
              onClick={async (event) => {
                event.preventDefault()
                await handleConfirmDialogAction()
              }}
            >
              {confirmLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  İşleniyor...
                </span>
              ) : (
                confirmDialog.confirmLabel || "Onayla"
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  if (isLoading) {
    return (
      <>
        {confirmDialogElement}
        <main className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-[#0B3D91] border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600">Yükleniyor...</p>
          </div>
        </main>
      </>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      {confirmDialogElement}
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto p-6">
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
                    <option value="pending">Beklemede</option>
                  </select>
                </div>
                {canCreateDealer(userRole) && (
                  <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                    <DialogTrigger asChild>
                      <Button className="rounded-2xl" style={{ backgroundColor: "#F57C00", color: "white" }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Bayi
                      </Button>
                    </DialogTrigger>
                <DialogContent className="rounded-3xl max-w-2xl w-[95vw]">
                    <DialogHeader>
                      <DialogTitle>Yeni Bayi Ekle</DialogTitle>
                    </DialogHeader>
                  <form onSubmit={handleAddDealer} className="space-y-6">
                      {formError && (
                        <Alert className="rounded-xl border-red-200 bg-red-50">
                          <AlertDescription className="text-red-700">
                            {formError}
                          </AlertDescription>
                        </Alert>
                      )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dealer_name">Bayi Adı *</Label>
                        <Input
                          id="dealer_name"
                          name="dealer_name"
                          value={formData.dealer_name}
                          onChange={handleInputChange}
                          className="rounded-xl"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contact_person">Yetkili Kişi</Label>
                        <Input
                          id="contact_person"
                          name="contact_person"
                          value={formData.contact_person}
                          onChange={handleInputChange}
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefon *</Label>
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
                        <Label htmlFor="email">E-posta *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="rounded-xl"
                          required
                        />
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="password_add">Bayi Şifresi *</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                          <Input
                            id="password_add"
                            name="password"
                              type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleInputChange}
                              className="rounded-xl pr-10"
                            required
                            minLength={8}
                            placeholder="En az 8 karakter"
                            autoComplete="new-password"
                          />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-500" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-500" />
                              )}
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            onClick={handleGeneratePassword}
                            title="Rastgele şifre üret ve kopyala"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Üret
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            onClick={handleCopyPassword}
                            disabled={!formData.password}
                            title="Şifreyi kopyala"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Oluşturulan şifre otomatik olarak panoya kopyalanır. En az 8 karakter olmalıdır.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">Şehir</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tax_number">Vergi No</Label>
                        <Input
                          id="tax_number"
                          name="tax_number"
                          value={formData.tax_number}
                          onChange={handleInputChange}
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="address">Adres</Label>
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-2 sm:col-span-2">
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
                          <option value="pending">Beklemede</option>
                        </select>
                      </div>
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
                          {submitting ? "Ekleniyor..." : "Ekle"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="rounded-3xl border-2 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{loading ? "..." : dealers.length}</span>
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
                    {loading
                      ? "..."
                      : dealers.length > 0
                        ? (dealers.reduce((acc: number, d: Dealer) => acc + (d.customers_count || 0), 0) / dealers.length).toFixed(0)
                        : "0"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Ortalama Müşteri Sayısı</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-2 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    {loading ? "..." : dealers.filter((d) => d.status === "active").length}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Aktif Bayi</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="rounded-3xl border-2 shadow-lg animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 w-3/4 bg-slate-200 rounded mb-4" />
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-slate-200 rounded" />
                      <div className="h-4 w-5/6 bg-slate-200 rounded" />
                      <div className="h-4 w-2/3 bg-slate-200 rounded" />
                    </div>
                    <div className="mt-6 h-10 w-full bg-slate-200 rounded-xl" />
                  </CardContent>
                </Card>
              ))
            ) : filteredDealers.length > 0 ? (
              filteredDealers.map((dealer) => (
                <Card key={dealer.id} className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0B3D91] text-white font-semibold">
                            {dealer.dealer_name?.substring(0, 2).toUpperCase() || "BY"}
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold text-slate-800">{dealer.dealer_name}</h2>
                            {dealer.contact_person && (
                              <p className="text-sm text-slate-500">Yetkili: {dealer.contact_person}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <MapPin className="h-4 w-4 text-[#F57C00]" />
                          <span>{dealer.city || "Belirtilmemiş"}</span>
                        </div>
                        {dealer.tax_number && (
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <span>Vergi No: {dealer.tax_number}</span>
                          </div>
                        )}
                      </div>
                      <Badge
                        className={
                          dealer.status === "active"
                            ? "bg-green-100 text-green-700 border-green-200 rounded-xl"
                            : dealer.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-200 rounded-xl"
                              : "bg-slate-200 text-slate-700 border-slate-300 rounded-xl"
                        }
                      >
                        {formatStatus(dealer.status)}
                      </Badge>
                    </div>

                    <div className="space-y-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#0B3D91]" />
                        <span>{dealer.phone || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[#0B3D91]" />
                        <span>{dealer.email || "-"}</span>
                      </div>
                      {dealer.address && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[#0B3D91]" />
                          <span>{dealer.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-[#0B3D91]" />
                        <span>Müşteri sayısı: {dealer.customers_count}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button
                        variant="outline"
                        className="rounded-xl flex-1"
                        onClick={() => openEditModal(dealer)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Düzenle
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-xl text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                        onClick={() => handleDeleteDealer(dealer)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Sil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="rounded-3xl border-2 shadow-lg">
                <CardContent className="p-10 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">Bayi bulunamadı</h3>
                  {canCreateDealer(userRole) && (
                    <>
                      <p className="text-sm text-slate-500 mb-6">Yeni bir bayi eklemek için "Yeni Bayi" butonunu kullanın.</p>
                      <Button
                        onClick={() => setShowAddModal(true)}
                        className="rounded-2xl"
                        style={{ backgroundColor: "#F57C00", color: "white" }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Bayi Ekle
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="rounded-3xl max-w-2xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>Bayi Bilgilerini Güncelle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditDealer} className="space-y-6">
            {formError && (
              <Alert className="rounded-xl border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {formError}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dealer_name_edit">Bayi Adı *</Label>
                <Input
                  id="dealer_name_edit"
                  name="dealer_name"
                  value={formData.dealer_name}
                  onChange={handleInputChange}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person_edit">Yetkili Kişi</Label>
                <Input
                  id="contact_person_edit"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleInputChange}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_edit">Telefon *</Label>
                <Input
                  id="phone_edit"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_edit">E-posta</Label>
                <Input
                  id="email_edit"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="rounded-xl"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="password_edit_field">Yeni Şifre</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                  <Input
                    id="password_edit_field"
                    name="password"
                      type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                      className="rounded-xl pr-10"
                    minLength={8}
                    placeholder="Boş bırakılırsa değişmez"
                    autoComplete="new-password"
                  />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={handleGeneratePassword}
                    title="Rastgele şifre üret ve kopyala"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Üret
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={handleCopyPassword}
                    disabled={!formData.password}
                    title="Şifreyi kopyala"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Boş bırakırsanız mevcut şifre korunur. Oluşturulan şifre otomatik olarak panoya kopyalanır.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city_edit">Şehir</Label>
                <Input
                  id="city_edit"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_number_edit">Vergi No</Label>
                <Input
                  id="tax_number_edit"
                  name="tax_number"
                  value={formData.tax_number}
                  onChange={handleInputChange}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address_edit">Adres</Label>
                <Input
                  id="address_edit"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="status_edit">Durum</Label>
                <select
                  id="status_edit"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-[#F57C00] focus:outline-none"
                >
                  <option value="active">Aktif</option>
                  <option value="passive">Pasif</option>
                  <option value="pending">Beklemede</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false)
                  resetForm()
                }}
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
                {submitting ? "Güncelleniyor..." : "Güncelle"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
