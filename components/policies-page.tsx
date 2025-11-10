"use client"

import { useState } from "react"
import { Shield, Search, Plus, FileText, Download, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useCustomers } from "@/hooks/use-customers"

export function PoliciesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")

  const { customers, loading, error, refetch } = useCustomers()

  // Müşterileri poliçe olarak göster (her müşteri bir poliçe kabul edilir)
  const policies = customers.map(customer => ({
    id: customer.id,
    policy_number: `POL-${String(customer.id).padStart(6, "0")}`,
    customer_name: customer.ad_soyad,
    customer_phone: customer.telefon,
    policy_type: customer.dosya_turu || "Genel",
    company: "Sigorta Şirketi", // Backend'de yok, varsayılan
    premium: customer.tahmini_tutar ? `₺${customer.tahmini_tutar.toLocaleString('tr-TR')}` : "Belirtilmemiş",
    start_date: customer.created_at,
    expiry_date: customer.bitis_tarihi || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: customer.durum === "Kapalı" ? "Pasif" : "Aktif",
    status_color: customer.durum === "Kapalı" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800",
  }))

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      policy.policy_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.customer_phone.includes(searchQuery)
    const matchesStatus = filterStatus === "all" || policy.status === filterStatus
    const matchesType = filterType === "all" || policy.policy_type === filterType
    return matchesSearch && matchesStatus && matchesType
  })

  const activePoliciesCount = policies.filter(p => p.status === "Aktif").length
  const totalPremiumSum = policies.reduce((sum, p) => {
    const premium = p.premium.replace(/[^\d.]/g, '')
    return sum + (parseFloat(premium) || 0)
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
            Poliçe Yönetimi
          </h2>
          <p className="text-muted-foreground font-medium mt-1">
            {loading ? "Yükleniyor..." : "Tüm sigorta poliçelerini görüntüleyin ve yönetin"}
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
                <Shield className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold tracking-tight">{policies.length}</p>
              <p className="text-sm text-muted-foreground font-semibold">Toplam Poliçe</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-3xl shadow-lg"
                style={{ backgroundColor: "#10b981" }}
              >
                <Shield className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold tracking-tight">{activePoliciesCount}</p>
              <p className="text-sm text-muted-foreground font-semibold">Aktif Poliçe</p>
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
                <FileText className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold tracking-tight">
                {formatCurrency(totalPremiumSum)}
              </p>
              <p className="text-sm text-muted-foreground font-semibold">Toplam Prim</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="rounded-3xl border-2 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-800">
              <Shield className="h-5 w-5" />
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
                placeholder="Poliçe no, müşteri adı veya telefon ile ara..."
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
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Pasif">Pasif</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Poliçe Türü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Türler</SelectItem>
                  <SelectItem value="Değer Kaybı">Değer Kaybı</SelectItem>
                  <SelectItem value="Parça ve İşçilik">Parça ve İşçilik</SelectItem>
                  <SelectItem value="Araç Mahrumiyeti">Araç Mahrumiyeti</SelectItem>
                  <SelectItem value="Pert Farkı">Pert Farkı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policies Table */}
      <Card className="rounded-3xl border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Poliçeler ({filteredPolicies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-bold">Poliçe No</TableHead>
                  <TableHead className="font-bold">Müşteri</TableHead>
                  <TableHead className="font-bold">Tür</TableHead>
                  <TableHead className="font-bold">Şirket</TableHead>
                  <TableHead className="font-bold">Prim</TableHead>
                  <TableHead className="font-bold">Bitiş Tarihi</TableHead>
                  <TableHead className="font-bold">Durum</TableHead>
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
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
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
                        <div className="flex justify-end gap-2">
                          <div className="h-8 w-8 bg-gray-200 rounded-xl animate-pulse"></div>
                          <div className="h-8 w-8 bg-gray-200 rounded-xl animate-pulse"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredPolicies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchQuery || filterStatus !== "all" || filterType !== "all"
                        ? "Eşleşen poliçe bulunamadı"
                        : "Henüz poliçe bulunmuyor"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPolicies.map((policy) => (
                    <TableRow key={policy.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-2xl"
                            style={{ backgroundColor: "#0B3D91" }}
                          >
                            <Shield className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold">{policy.policy_number}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{policy.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{policy.customer_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-xl bg-blue-100 text-blue-800">
                          {policy.policy_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{policy.company}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold" style={{ color: "#F57C00" }}>
                          {policy.premium}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{policy.expiry_date}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("rounded-xl font-semibold", policy.status_color)}>
                          {policy.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            title="İndir"
                          >
                            <Download className="h-4 w-4" />
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