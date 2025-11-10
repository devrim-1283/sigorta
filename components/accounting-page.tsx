"use client"

import { useState } from "react"
import {
  DollarSign,
  Plus,
  Search,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/role-config"
import { usePayments } from "@/hooks/usePayments"
import { toast } from "sonner"

interface AccountingPageProps {
  userRole?: UserRole
}

export function AccountingPage({ userRole = "superadmin" }: AccountingPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterDateRange, setFilterDateRange] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    musteri_id: "",
    odeme_turu: "",
    tutar: "",
    aciklama: "",
    odeme_tarihi: new Date().toISOString().split('T')[0],
  })

  const {
    payments,
    loading,
    error,
    createPayment,
    deletePayment,
    getTotalAmount,
    getPaymentsByType,
    getPaymentsByStatus,
    refetch,
  } = usePayments({
    type: filterType !== "all" ? filterType : undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
  })

  const filteredPayments = payments.filter((payment) =>
    payment.musteri_ad?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.aciklama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.tutar.toString().includes(searchQuery)
  )

  const totalAmount = getTotalAmount()
  const paymentsByType = getPaymentsByType()
  const paymentsByStatus = getPaymentsByStatus()

  const handleCreatePayment = async () => {
    try {
      await createPayment({
        ...formData,
        musteri_id: parseInt(formData.musteri_id),
        tutar: parseFloat(formData.tutar),
      })
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const resetForm = () => {
    setFormData({
      musteri_id: "",
      odeme_turu: "",
      tutar: "",
      aciklama: "",
      odeme_tarihi: new Date().toISOString().split('T')[0],
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "onaylandi":
        return "bg-green-100 text-green-800"
      case "beklemede":
        return "bg-yellow-100 text-yellow-800"
      case "iptal":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "havale":
        return "bg-blue-100 text-blue-800"
      case "eft":
        return "bg-purple-100 text-purple-800"
      case "nakit":
        return "bg-green-100 text-green-800"
      case "kredi_karti":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const canManagePayments = userRole === "superadmin" || userRole === "birincil-admin"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: "#0B3D91" }}>
            Muhasebe
          </h2>
          <p className="text-muted-foreground font-medium mt-1">
            {loading ? "Yükleniyor..." : "Ödemeleri ve finansal verileri yönetin"}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={refetch}
            disabled={loading}
            className="rounded-2xl bg-white border-2 font-semibold"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Yenile
          </Button>
          {canManagePayments && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="rounded-2xl font-semibold shadow-lg"
              style={{ backgroundColor: "#F57C00", color: "white" }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Ödeme
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="rounded-3xl border-2 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-800">
              <Trash2 className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-3xl shadow-lg"
                style={{ backgroundColor: "#0B3D91" }}
              >
                <DollarSign className="h-7 w-7 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold tracking-tight">
                {formatCurrency(totalAmount)}
              </p>
              <p className="text-sm text-muted-foreground font-semibold">Toplam Ödeme</p>
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
              <Badge className="bg-green-100 text-green-800 rounded-xl">
                Onaylı
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold tracking-tight">
                {paymentsByStatus.onaylandi || 0}
              </p>
              <p className="text-sm text-muted-foreground font-semibold">Onaylı Ödeme</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-3xl bg-yellow-600 shadow-lg"
              >
                <DollarSign className="h-7 w-7 text-white" />
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 rounded-xl">
                Beklemede
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold tracking-tight">
                {paymentsByStatus.beklemede || 0}
              </p>
              <p className="text-sm text-muted-foreground font-semibold">Bekleyen Ödeme</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-red-600 shadow-lg">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
              <Badge className="bg-red-100 text-red-800 rounded-xl">
                İptal
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold tracking-tight">
                {paymentsByStatus.iptal || 0}
              </p>
              <p className="text-sm text-muted-foreground font-semibold">İptal Ödeme</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="rounded-3xl border-2 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
              <Input
                placeholder="Müşteri, açıklama veya tutar ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-2xl"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Ödeme Türü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Türler</SelectItem>
                  <SelectItem value="havale">Havale</SelectItem>
                  <SelectItem value="eft">EFT</SelectItem>
                  <SelectItem value="nakit">Nakit</SelectItem>
                  <SelectItem value="kredi_karti">Kredi Kartı</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="beklemede">Beklemede</SelectItem>
                  <SelectItem value="onaylandi">Onaylandı</SelectItem>
                  <SelectItem value="iptal">İptal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="rounded-3xl border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Ödemeler ({filteredPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-bold">Müşteri</TableHead>
                  <TableHead className="font-bold">Tür</TableHead>
                  <TableHead className="font-bold">Tutar</TableHead>
                  <TableHead className="font-bold">Tarih</TableHead>
                  <TableHead className="font-bold">Durum</TableHead>
                  <TableHead className="font-bold">Açıklama</TableHead>
                  <TableHead className="font-bold text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <div className="h-8 w-8 bg-gray-200 rounded-xl animate-pulse"></div>
                          <div className="h-8 w-8 bg-gray-200 rounded-xl animate-pulse"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchQuery || filterType !== "all" || filterStatus !== "all"
                        ? "Eşleşen ödeme bulunamadı"
                        : "Henüz ödeme kaydı bulunmuyor"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.musteri_ad || "-"}</p>
                          <p className="text-xs text-muted-foreground">#{payment.musteri_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("rounded-xl", getTypeColor(payment.odeme_turu))}>
                          {payment.odeme_turu}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-lg" style={{ color: "#F57C00" }}>
                          {formatCurrency(payment.tutar)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(payment.odeme_tarihi).toLocaleDateString("tr-TR")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("rounded-xl", getStatusColor(payment.durum))}>
                          {payment.durum}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground max-w-xs truncate">
                          {payment.aciklama || "-"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            title="Görüntüle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canManagePayments && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deletePayment(payment.id)}
                              className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Payment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold" style={{ color: "#0B3D91" }}>
              Yeni Ödeme
            </DialogTitle>
            <DialogDescription>Ödeme kaydı oluşturun</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="musteri_id">Müşteri ID *</Label>
              <Input
                id="musteri_id"
                value={formData.musteri_id}
                onChange={(e) => setFormData({ ...formData, musteri_id: e.target.value })}
                placeholder="Müşteri ID"
                className="rounded-2xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="odeme_turu">Ödeme Türü *</Label>
              <Select
                value={formData.odeme_turu}
                onValueChange={(value) => setFormData({ ...formData, odeme_turu: value })}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Ödeme türü seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="havale">Havale</SelectItem>
                  <SelectItem value="eft">EFT</SelectItem>
                  <SelectItem value="nakit">Nakit</SelectItem>
                  <SelectItem value="kredi_karti">Kredi Kartı</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tutar">Tutar *</Label>
              <Input
                id="tutar"
                type="number"
                step="0.01"
                value={formData.tutar}
                onChange={(e) => setFormData({ ...formData, tutar: e.target.value })}
                placeholder="0.00"
                className="rounded-2xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="odeme_tarihi">Ödeme Tarihi *</Label>
              <Input
                id="odeme_tarihi"
                type="date"
                value={formData.odeme_tarihi}
                onChange={(e) => setFormData({ ...formData, odeme_tarihi: e.target.value })}
                className="rounded-2xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="aciklama">Açıklama</Label>
              <Input
                id="aciklama"
                value={formData.aciklama}
                onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                placeholder="Ödeme açıklaması"
                className="rounded-2xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                resetForm()
              }}
              className="rounded-2xl"
            >
              İptal
            </Button>
            <Button
              onClick={handleCreatePayment}
              className="rounded-2xl"
              style={{ backgroundColor: "#F57C00", color: "white" }}
              disabled={!formData.musteri_id || !formData.odeme_turu || !formData.tutar}
            >
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}