"use client"

import { useState } from "react"
import { AlertTriangle, Search, Plus, RefreshCw, Clock, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useCustomers } from "@/hooks/use-customers"

export function ClaimsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")

  const { customers, loading, error, refetch } = useCustomers()

  // Müşterileri hasar olarak göster (Hasar aşamasındaki müşteriler)
  const claims = customers
    .filter(customer =>
      customer.basvuru_durumu?.includes("Hasar") ||
      customer.dosya_turu?.includes("Hasar") ||
      customer.durum === "Hasar Aşamasında"
    )
    .map(customer => ({
      id: customer.id,
      claim_number: `CLAIM-${String(customer.id).padStart(6, "0")}`,
      customer_name: customer.ad_soyad,
      customer_phone: customer.telefon,
      claim_type: customer.dosya_turu || "Genel Hasar",
      description: customer.aciklama || "Hasar bildirimi",
      damage_amount: customer.tahmini_tutar ? `₺${customer.tahmini_tutar.toLocaleString('tr-TR')}` : "Belirtilmemiş",
      claim_date: customer.created_at,
      status: getClaimStatus(customer),
      status_color: getClaimStatusColor(customer),
      assigned_agent: "Atanmamış", // Backend'de yok
    }))

  function getClaimStatus(customer: any) {
    if (customer.durum === "Kapalı") return "Kapandı"
    if (customer.durum === "Hasar Aşamasında") return "İnceleniyor"
    if (customer.basvuru_durumu?.includes("Red")) return "Reddedildi"
    if (customer.durum === "Onaylandı") return "Onaylandı"
    return "Beklemede"
  }

  function getClaimStatusColor(customer: any) {
    const status = getClaimStatus(customer)
    switch (status) {
      case "Onaylandı":
        return "bg-green-100 text-green-800"
      case "İnceleniyor":
        return "bg-blue-100 text-blue-800"
      case "Beklemede":
        return "bg-yellow-100 text-yellow-800"
      case "Reddedildi":
        return "bg-red-100 text-red-800"
      case "Kapandı":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      claim.claim_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.customer_phone.includes(searchQuery) ||
      claim.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || claim.status === filterStatus
    const matchesType = filterType === "all" || claim.claim_type === filterType
    return matchesSearch && matchesStatus && matchesType
  })

  const activeClaimsCount = claims.filter(c =>
    c.status === "İnceleniyor" || c.status === "Beklemede"
  ).length

  const totalDamageSum = claims.reduce((sum, c) => {
    const amount = c.damage_amount.replace(/[^\d.]/g, '')
    return sum + (parseFloat(amount) || 0)
  }, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: "#0B3D91" }}>
            Hasar Yönetimi
          </h2>
          <p className="text-muted-foreground font-medium mt-1">
            {loading ? "Yükleniyor..." : "Hasar bildirimlerini görüntüleyin ve yönetin"}
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
          <Button
            className="rounded-2xl font-semibold shadow-lg"
            style={{ backgroundColor: "#F57C00", color: "white" }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Hasar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-3xl shadow-lg"
                style={{ backgroundColor: "#0B3D91" }}
              >
                <AlertTriangle className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold tracking-tight">{claims.length}</p>
              <p className="text-sm text-muted-foreground font-semibold">Toplam Hasar</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-600 shadow-lg"
              >
                <Clock className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold tracking-tight">{activeClaimsCount}</p>
              <p className="text-sm text-muted-foreground font-semibold">Aktif Hasar</p>
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
                <AlertTriangle className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold tracking-tight">
                {formatCurrency(totalDamageSum)}
              </p>
              <p className="text-sm text-muted-foreground font-semibold">Toplam Hasar Bedeli</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="rounded-3xl border-2 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="rounded-3xl border-2 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
              <Input
                placeholder="Hasar no, müşteri adı veya açıklama ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-2xl"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="Beklemede">Beklemede</SelectItem>
                  <SelectItem value="İnceleniyor">İnceleniyor</SelectItem>
                  <SelectItem value="Onaylandı">Onaylandı</SelectItem>
                  <SelectItem value="Reddedildi">Reddedildi</SelectItem>
                  <SelectItem value="Kapandı">Kapandı</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Hasar Türü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Türler</SelectItem>
                  <SelectItem value="Trafik Kazası">Trafik Kazası</SelectItem>
                  <SelectItem value="Hırsızlık">Hırsızlık</SelectItem>
                  <SelectItem value="Yangın">Yangın</SelectItem>
                  <SelectItem value="Sel">Sel</SelectItem>
                  <SelectItem value="Diğer">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card className="rounded-3xl border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Hasar Bildirimleri ({filteredClaims.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-bold">Hasar No</TableHead>
                  <TableHead className="font-bold">Müşteri</TableHead>
                  <TableHead className="font-bold">Tür</TableHead>
                  <TableHead className="font-bold">Hasar Bedeli</TableHead>
                  <TableHead className="font-bold">Tarih</TableHead>
                  <TableHead className="font-bold">Durum</TableHead>
                  <TableHead className="font-bold">Sorumlu</TableHead>
                  <TableHead className="font-bold text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <div className="h-8 w-8 bg-gray-200 rounded-xl animate-pulse"></div>
                          <div className="h-8 w-8 bg-gray-200 rounded-xl animate-pulse"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredClaims.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchQuery || filterStatus !== "all" || filterType !== "all"
                        ? "Eşleşen hasar bulunamadı"
                        : "Henüz hasar bildirimi bulunmuyor"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClaims.map((claim) => (
                    <TableRow key={claim.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-2xl"
                            style={{ backgroundColor: "#0B3D91" }}
                          >
                            <AlertTriangle className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold">{claim.claim_number}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{claim.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{claim.customer_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-xl bg-blue-100 text-blue-800">
                          {claim.claim_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-lg" style={{ color: "#F57C00" }}>
                          {claim.damage_amount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(claim.claim_date).toLocaleDateString("tr-TR")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("rounded-xl font-semibold", claim.status_color)}>
                            {claim.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{claim.assigned_agent}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            title="Detaylar"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
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
    </div>
  )
}