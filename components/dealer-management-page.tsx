"use client"

import { useState } from "react"
import { Building2, Mail, Phone, Plus, Search, Edit, Ban, Check, X, User, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useDealers, type Dealer } from "@/hooks/useDealers"
import { toast } from "sonner"

export function DealerManagementPage() {
  const {
    dealers,
    loading,
    error,
    createDealer,
    updateDealer,
    deleteDealer,
    toggleDealerStatus,
    refetch,
  } = useDealers()
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null)
  const [formData, setFormData] = useState({
    bayi_kodu: "",
    bayi_adi: "",
    yetkili_kisi: "",
    telefon: "",
    email: "",
    adres: "",
    il: "",
    ilce: "",
    vergi_dairesi: "",
    vergi_no: "",
    aktif: true,
  })

  const filteredDealers = dealers.filter(
    (dealer) =>
      dealer.bayi_adi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.yetkili_kisi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.telefon.includes(searchQuery),
  )

  const handleCreateDealer = async () => {
    try {
      await createDealer({
        ...formData,
        bayi_kodu: formData.bayi_kodu || `DLR-${String(dealers.length + 1).padStart(3, "0")}`,
      })
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleEditDealer = async () => {
    if (!selectedDealer) return
    try {
      await updateDealer(selectedDealer.id, formData)
      setIsEditDialogOpen(false)
      setSelectedDealer(null)
      resetForm()
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleToggleStatus = async (dealerId: number) => {
    try {
      await toggleDealerStatus(dealerId)
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const openEditDialog = (dealer: Dealer) => {
    setSelectedDealer(dealer)
    setFormData({
      bayi_kodu: dealer.bayi_kodu,
      bayi_adi: dealer.bayi_adi,
      yetkili_kisi: dealer.yetkili_kisi,
      telefon: dealer.telefon,
      email: dealer.email,
      adres: dealer.adres,
      il: dealer.il,
      ilce: dealer.ilce,
      vergi_dairesi: dealer.vergi_dairesi,
      vergi_no: dealer.vergi_no,
      aktif: dealer.aktif,
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      bayi_kodu: "",
      bayi_adi: "",
      yetkili_kisi: "",
      telefon: "",
      email: "",
      adres: "",
      il: "",
      ilce: "",
      vergi_dairesi: "",
      vergi_no: "",
      aktif: true,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: "#0B3D91" }}>
            Bayi Yönetimi
          </h2>
          <p className="text-muted-foreground font-medium mt-1">
            {loading ? 'Yükleniyor...' : 'Bayi hesaplarını oluşturun ve yönetin'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={refetch}
            disabled={loading}
            className="rounded-2xl bg-white border-2 font-semibold"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="rounded-2xl font-semibold shadow-lg"
            style={{ backgroundColor: "#F57C00", color: "white" }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Bayi Ekle
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="rounded-3xl border-2 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-800">
              <X className="h-5 w-5" />
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
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Bayi adı, sorumlu kişi veya e-posta ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-2xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dealers Table */}
      <Card className="rounded-3xl border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Bayi Listesi ({filteredDealers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-bold">Bayi Adı</TableHead>
                  <TableHead className="font-bold">Sorumlu Kişi</TableHead>
                  <TableHead className="font-bold">İletişim</TableHead>
                  <TableHead className="font-bold">Konum</TableHead>
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
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gray-200 rounded-2xl animate-pulse"></div>
                          <div className="space-y-1">
                            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="h-3 bg-gray-200 rounded w-28 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
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
                ) : filteredDealers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'Eşleşen bayi bulunamadı' : 'Henüz bayi kaydı bulunmuyor'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDealers.map((dealer) => (
                    <TableRow key={dealer.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-2xl"
                            style={{ backgroundColor: "#0B3D91" }}
                          >
                            <Building2 className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold">{dealer.bayi_adi}</p>
                            <p className="text-xs text-muted-foreground">{dealer.bayi_kodu}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{dealer.yetkili_kisi}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{dealer.telefon}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{dealer.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{dealer.il}</p>
                          <p className="text-muted-foreground">{dealer.ilce}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`rounded-2xl font-semibold ${
                            dealer.aktif ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {dealer.aktif ? (
                            <>
                              <Check className="mr-1 h-3 w-3" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <X className="mr-1 h-3 w-3" />
                              Pasif
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(dealer)}
                            className="rounded-xl"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(dealer.id)}
                            className={`rounded-xl ${
                              dealer.aktif ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"
                            }`}
                          >
                            {dealer.aktif ? <Ban className="h-4 w-4" /> : <Check className="h-4 w-4" />}
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

      {/* Create Dealer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold" style={{ color: "#0B3D91" }}>
              Yeni Bayi Ekle
            </DialogTitle>
            <DialogDescription>Yeni bayi hesabı oluşturun ve kullanıcı hesabı ile ilişkilendirin</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bayi_kodu">Bayi Kodu</Label>
                <Input
                  id="bayi_kodu"
                  value={formData.bayi_kodu}
                  onChange={(e) => setFormData({ ...formData, bayi_kodu: e.target.value })}
                  placeholder="Örn: DLR-001"
                  className="rounded-2xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bayi_adi">Bayi Adı / Ünvan *</Label>
                <Input
                  id="bayi_adi"
                  value={formData.bayi_adi}
                  onChange={(e) => setFormData({ ...formData, bayi_adi: e.target.value })}
                  placeholder="Örn: Anadolu Sigorta Acentesi"
                  className="rounded-2xl"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="yetkili_kisi">Sorumlu Kişi Adı Soyadı *</Label>
              <Input
                id="yetkili_kisi"
                value={formData.yetkili_kisi}
                onChange={(e) => setFormData({ ...formData, yetkili_kisi: e.target.value })}
                placeholder="Örn: Mehmet Yılmaz"
                className="rounded-2xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="telefon">Telefon *</Label>
                <Input
                  id="telefon"
                  value={formData.telefon}
                  onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                  placeholder="+90 5XX XXX XX XX"
                  className="rounded-2xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-posta *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ornek@email.com"
                  className="rounded-2xl"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="adres">Adres</Label>
              <Input
                id="adres"
                value={formData.adres}
                onChange={(e) => setFormData({ ...formData, adres: e.target.value })}
                placeholder="Adres bilgisi"
                className="rounded-2xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="il">İl</Label>
                <Input
                  id="il"
                  value={formData.il}
                  onChange={(e) => setFormData({ ...formData, il: e.target.value })}
                  placeholder="Örn: İstanbul"
                  className="rounded-2xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ilce">İlçe</Label>
                <Input
                  id="ilce"
                  value={formData.ilce}
                  onChange={(e) => setFormData({ ...formData, ilce: e.target.value })}
                  placeholder="Örn: Kadıköy"
                  className="rounded-2xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vergi_dairesi">Vergi Dairesi</Label>
                <Input
                  id="vergi_dairesi"
                  value={formData.vergi_dairesi}
                  onChange={(e) => setFormData({ ...formData, vergi_dairesi: e.target.value })}
                  placeholder="Vergi dairesi"
                  className="rounded-2xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vergi_no">Vergi No</Label>
                <Input
                  id="vergi_no"
                  value={formData.vergi_no}
                  onChange={(e) => setFormData({ ...formData, vergi_no: e.target.value })}
                  placeholder="Vergi numarası"
                  className="rounded-2xl"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="aktif">Durum</Label>
                <p className="text-sm text-muted-foreground">Bayi hesabını aktif olarak oluştur</p>
              </div>
              <Switch
                id="aktif"
                checked={formData.aktif}
                onCheckedChange={(checked) => setFormData({ ...formData, aktif: checked })}
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
              onClick={handleCreateDealer}
              className="rounded-2xl"
              style={{ backgroundColor: "#F57C00", color: "white" }}
              disabled={
                !formData.bayi_adi ||
                !formData.yetkili_kisi ||
                !formData.telefon ||
                !formData.email
              }
            >
              Bayi Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dealer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold" style={{ color: "#0B3D91" }}>
              Bayi Düzenle
            </DialogTitle>
            <DialogDescription>Bayi bilgilerini güncelleyin</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-bayi_kodu">Bayi Kodu</Label>
                <Input
                  id="edit-bayi_kodu"
                  value={formData.bayi_kodu}
                  onChange={(e) => setFormData({ ...formData, bayi_kodu: e.target.value })}
                  className="rounded-2xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-bayi_adi">Bayi Adı / Ünvan *</Label>
                <Input
                  id="edit-bayi_adi"
                  value={formData.bayi_adi}
                  onChange={(e) => setFormData({ ...formData, bayi_adi: e.target.value })}
                  className="rounded-2xl"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-yetkili_kisi">Sorumlu Kişi Adı Soyadı *</Label>
              <Input
                id="edit-yetkili_kisi"
                value={formData.yetkili_kisi}
                onChange={(e) => setFormData({ ...formData, yetkili_kisi: e.target.value })}
                className="rounded-2xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-telefon">Telefon *</Label>
                <Input
                  id="edit-telefon"
                  value={formData.telefon}
                  onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                  className="rounded-2xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">E-posta *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="rounded-2xl"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-adres">Adres</Label>
              <Input
                id="edit-adres"
                value={formData.adres}
                onChange={(e) => setFormData({ ...formData, adres: e.target.value })}
                className="rounded-2xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-il">İl</Label>
                <Input
                  id="edit-il"
                  value={formData.il}
                  onChange={(e) => setFormData({ ...formData, il: e.target.value })}
                  className="rounded-2xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-ilce">İlçe</Label>
                <Input
                  id="edit-ilce"
                  value={formData.ilce}
                  onChange={(e) => setFormData({ ...formData, ilce: e.target.value })}
                  className="rounded-2xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-vergi_dairesi">Vergi Dairesi</Label>
                <Input
                  id="edit-vergi_dairesi"
                  value={formData.vergi_dairesi}
                  onChange={(e) => setFormData({ ...formData, vergi_dairesi: e.target.value })}
                  className="rounded-2xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-vergi_no">Vergi No</Label>
                <Input
                  id="edit-vergi_no"
                  value={formData.vergi_no}
                  onChange={(e) => setFormData({ ...formData, vergi_no: e.target.value })}
                  className="rounded-2xl"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="edit-aktif">Durum</Label>
                <p className="text-sm text-muted-foreground">{formData.aktif ? "Bayi aktif" : "Bayi pasif"}</p>
              </div>
              <Switch
                id="edit-aktif"
                checked={formData.aktif}
                onCheckedChange={(checked) => setFormData({ ...formData, aktif: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedDealer(null)
                resetForm()
              }}
              className="rounded-2xl"
            >
              İptal
            </Button>
            <Button
              onClick={handleEditDealer}
              className="rounded-2xl"
              style={{ backgroundColor: "#F57C00", color: "white" }}
            >
              Değişiklikleri Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
