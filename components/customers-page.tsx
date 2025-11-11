"use client"

import { useState, useEffect } from "react"
import {
  Filter,
  Plus,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  Eye,
  Edit,
  Car,
  Building,
  Lock,
  CheckCircle2,
  Download,
  Search,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { type UserRole, hasPermission, getModuleLabel } from "@/lib/role-config"
import { FILE_TYPES, getFileTypeConfig, type FileType, type DocumentType as FileDocType } from "@/lib/file-types-config"
import { DocumentCard, type DocumentType } from "./document-card"
import { DocumentUploadModal } from "./document-upload-modal"
import { useCustomers } from "@/hooks/use-customers"
import { customerApi, fileTypeApi, documentApi } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

// Application status types
type ApplicationStatus =
  | "İnceleniyor"
  | "Başvuru Aşamasında"
  | "Dava Aşamasında"
  | "Onaylandı"
  | "Tamamlandı"
  | "Beklemede"
  | "Evrak Aşamasında" // Added for initial state of new files

// Customer data structure
interface Customer {
  id: string
  ad_soyad: string
  tc_no: string
  telefon: string
  email: string
  plaka: string
  hasar_tarihi: string
  başvuru_durumu: ApplicationStatus
  ödemeler: Payment[]
  evraklar: Document[]
  bağlı_bayi_id: string
  bağlı_bayi_adı: string
  notlar: Note[]
  son_güncelleme: string
  evrak_durumu: "Tamam" | "Eksik"
  eksik_evraklar?: string[]
  dosya_kilitli?: boolean // Added to track if file is closed/locked
  dosya_tipi?: FileType
  yüklenen_evraklar?: FileDocType[]
}

interface Payment {
  id: string
  tarih: string
  tutar: string
  açıklama: string
  durum: "Ödendi" | "Bekliyor"
}

interface Document {
  id: string
  tip: string
  dosya_adı: string
  yüklenme_tarihi: string
  durum: "Onaylandı" | "Beklemede" | "Reddedildi"
}

interface Note {
  id: string
  yazar: string
  tarih: string
  içerik: string
}

interface CustomerData {
  id: string
  dosya_tipi?: FileType
  yüklenen_evraklar?: FileDocType[]
}

// Note: customersData is no longer used - data comes from API

interface CustomersPageProps {
  userRole?: UserRole
}

export function CustomersPage({ userRole = "superadmin" }: CustomersPageProps) {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [newNote, setNewNote] = useState("")
  const [showDocUploadModal, setShowDocUploadModal] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | undefined>()
  const [canDelete] = useState(false)
  const [showCloseFileModal, setShowCloseFileModal] = useState(false)
  const [closeFileReason, setCloseFileReason] = useState("")
  const [showNewFileModal, setShowNewFileModal] = useState(false)
  const [newFileData, setNewFileData] = useState({
    ad_soyad: "",
    tc_no: "",
    telefon: "",
    email: "",
    plaka: "",
    hasar_tarihi: "",
    dosya_tipi_id: "",
  })
  const [newFileUploadedDocs, setNewFileUploadedDocs] = useState<FileDocType[]>([])
  const [fileTypes, setFileTypes] = useState<Array<{ id: number; name: string; label: string; color: string }>>([])

  useEffect(() => {
    // Fetch file types from API
    const fetchFileTypes = async () => {
      try {
        const types = await fileTypeApi.getAll()
        setFileTypes(types)
      } catch (error) {
        console.error("Error fetching file types:", error)
      }
    }
    fetchFileTypes()
  }, [])

  const canCreate = hasPermission(userRole, "customer-management", "canCreate")
  const canEdit = hasPermission(userRole, "customer-management", "canEdit")
  const canViewAll = hasPermission(userRole, "customer-management", "canViewAll")
  const canViewOwn = hasPermission(userRole, "customer-management", "canViewOwn")
  const moduleLabel = getModuleLabel(userRole, "customer-management")

  // Use API hook
  const { customers, isLoading: customersLoading, createCustomer, updateCustomer, closeFile } = useCustomers({
    search: searchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  })

  // Get current dealer/customer IDs from user
  const currentDealerId = user?.dealer?.id?.toString() || null
  const currentCustomerId = user?.tc_no || null

  // Get status badge color
  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case "İnceleniyor":
        return "bg-gray-100 text-gray-800 border-gray-300"
      case "Başvuru Aşamasında":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "Dava Aşamasında":
        return "bg-red-100 text-red-800 border-red-300"
      case "Onaylandı":
        return "bg-green-100 text-green-800 border-green-300"
      case "Tamamlandı":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "Beklemede":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "Evrak Aşamasında": // Added for new file initial state
        return "bg-purple-100 text-purple-800 border-purple-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  // Transform API data to match component interface
  const transformCustomer = (apiCustomer: any): Customer => {
    return {
      id: apiCustomer.id.toString(),
      ad_soyad: apiCustomer.ad_soyad,
      tc_no: apiCustomer.tc_no,
      telefon: apiCustomer.telefon,
      email: apiCustomer.email || "",
      plaka: apiCustomer.plaka,
      hasar_tarihi: apiCustomer.hasar_tarihi,
      başvuru_durumu: apiCustomer.başvuru_durumu as ApplicationStatus,
      evrak_durumu: apiCustomer.evrak_durumu,
      dosya_kilitli: apiCustomer.dosya_kilitli || false,
      bağlı_bayi_id: apiCustomer.bağlı_bayi_id?.toString() || apiCustomer.dealer?.id?.toString() || "",
      bağlı_bayi_adı: apiCustomer.dealer?.dealer_name || "",
      ödemeler: (apiCustomer.payments || []).map((p: any) => ({
        id: p.id.toString(),
        tarih: p.date,
        tutar: `₺${p.amount.toLocaleString('tr-TR')}`,
        açıklama: p.description || "",
        durum: p.durum,
      })),
      evraklar: (apiCustomer.documents || []).map((d: any) => ({
        id: d.id.toString(),
        tip: d.tip,
        dosya_adı: d.dosya_adı,
        yüklenme_tarihi: d.yüklenme_tarihi,
        durum: d.durum,
      })),
      notlar: (apiCustomer.notes || []).map((n: any) => ({
        id: n.id?.toString?.() ?? String(n.id ?? ''),
        yazar: n.author?.name || n.yazar || n.user?.name || 'Sistem',
        tarih: n.created_at,
        içerik: n.note || n.içerik || n.content || n.message || '',
      })).filter((note: any) => Boolean(note.içerik?.trim())),
      son_güncelleme: apiCustomer.son_güncelleme || apiCustomer.updated_at,
      dosya_tipi: apiCustomer.file_type?.name as FileType,
      yüklenen_evraklar: (apiCustomer.documents || []).map((d: any) => d.tip as FileDocType),
    }
  }

  const filteredCustomers = customers.map(transformCustomer)

  // Check if dealer info should be shown (NOT for operasyon or admin)
  const shouldShowDealerInfo = userRole === "bayi" || userRole === "superadmin"

  // Check if user can update status
  const canUpdateStatus = userRole === "superadmin" || userRole === "operasyon" || userRole === "admin"

  const handleDocumentUpload = async (file: File, type: DocumentType) => {
    if (!selectedCustomer) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('customer_id', selectedCustomer.id)
      formData.append('document_type', type)

      await documentApi.upload(formData)
      
      toast({
        title: "Başarılı",
        description: "Evrak başarıyla yüklendi",
      })

      setShowDocUploadModal(false)
      
      // Refresh customer details
      if (selectedCustomer) {
        const updated = await customerApi.getById(selectedCustomer.id)
        setSelectedCustomer(transformCustomer(updated))
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Evrak yüklenemedi",
        variant: "destructive",
      })
    }
  }

  const handleDocUploadClick = (docType?: DocumentType) => {
    setSelectedDocType(docType)
    setShowDocUploadModal(true)
  }

  const handleCloseFile = async () => {
    if (!selectedCustomer) return
    try {
      await closeFile(parseInt(selectedCustomer.id), closeFileReason)
      setShowCloseFileModal(false)
      setCloseFileReason("")
      // Refresh customer details
      if (selectedCustomer) {
        const updated = await customerApi.getById(selectedCustomer.id)
        setSelectedCustomer(transformCustomer(updated))
      }
    } catch (error) {
      console.error("Error closing file:", error)
    }
  }

  const handleCreateNewFile = async () => {
    try {
      const customerData = {
        ad_soyad: newFileData.ad_soyad,
        tc_no: newFileData.tc_no,
        telefon: newFileData.telefon,
        email: newFileData.email || undefined,
        plaka: newFileData.plaka,
        hasar_tarihi: newFileData.hasar_tarihi,
        dosya_tipi_id: newFileData.dosya_tipi_id ? parseInt(newFileData.dosya_tipi_id) : undefined,
        bağlı_bayi_id: user?.dealer_id || undefined,
      }

      await createCustomer(customerData)
      setShowNewFileModal(false)
      setNewFileData({
        ad_soyad: "",
        tc_no: "",
        telefon: "",
        email: "",
        plaka: "",
        hasar_tarihi: "",
        dosya_tipi_id: "",
      })
      setNewFileUploadedDocs([])
    } catch (error) {
      console.error("Error creating file:", error)
    }
  }

  // Show loading state
  if (customersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#0B3D91] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  // CUSTOMER VIEW (musteri role) - Single card dashboard
  if (userRole === "musteri" && filteredCustomers.length > 0) {
    const customer = filteredCustomers[0]

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#0B3D91" }}>
            {moduleLabel}
          </h1>
          <p className="text-muted-foreground font-medium mt-2">Başvurunuzun güncel durumunu görüntüleyin</p>
        </div>

        {/* Status Card */}
        <Card className="rounded-3xl border-2 shadow-lg bg-gradient-to-br from-white to-slate-50">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              Başvuru Durumu
              {customer.dosya_kilitli && customer.başvuru_durumu === "Tamamlandı" && (
                <Badge className="bg-green-100 text-green-800 border-green-300 rounded-xl flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Tamamlandı
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Şu anki durum</p>
                <Badge className={cn("text-lg px-4 py-2 rounded-xl border-2", getStatusColor(customer.başvuru_durumu))}>
                  {customer.başvuru_durumu}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Son Güncelleme</p>
                <p className="font-semibold">{customer.son_güncelleme}</p>
              </div>
            </div>

            {/* Document Status Alert */}
            {customer.evrak_durumu === "Eksik" && customer.eksik_evraklar && (
              <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-900">Eksik Evrak Var</p>
                  <p className="text-sm text-orange-800 mt-1">
                    Lütfen şu evrakları yükleyin: {customer.eksik_evraklar.join(", ")}
                  </p>
                </div>
              </div>
            )}

            {customer.evrak_durumu === "Tamam" && (
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-2xl flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Tüm Evraklar Tamamlandı</p>
                  <p className="text-sm text-green-800 mt-1">Evrak kontrolü tamamlanmıştır.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payments Card */}
        <Card className="rounded-3xl border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Ödemelerim
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer.ödemeler.length > 0 ? (
              <div className="space-y-3">
                {customer.ödemeler.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-semibold">{payment.açıklama}</p>
                      <p className="text-sm text-muted-foreground">{payment.tarih}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg" style={{ color: "#F57C00" }}>
                        {payment.tutar}
                      </p>
                      <Badge
                        className={cn(
                          "rounded-xl",
                          payment.durum === "Ödendi"
                            ? "bg-green-100 text-green-800 border-green-300"
                            : "bg-yellow-100 text-yellow-800 border-yellow-300",
                        )}
                      >
                        {payment.durum}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Henüz ödeme kaydı bulunmuyor.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-2 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Sonuç Evrakları
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {customer.evraklar.map((doc) => (
                <Card key={doc.id} className="rounded-2xl hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <p className="font-semibold text-sm">{doc.tip}</p>
                      </div>
                      <Badge
                        className={cn(
                          "rounded-xl text-xs",
                          doc.durum === "Onaylandı" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800",
                        )}
                      >
                        {doc.durum}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{doc.dosya_adı}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl flex-1 bg-transparent"
                        onClick={() => console.log("[v0] Viewing:", doc)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Görüntüle
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl flex-1 bg-transparent"
                        onClick={() => console.log("[v0] Downloading:", doc)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        İndir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {customer.evraklar.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Henüz evrak yüklenmemiş.</p>
            )}
          </CardContent>
        </Card>

        <DocumentUploadModal
          open={showDocUploadModal}
          onOpenChange={setShowDocUploadModal}
          onUpload={handleDocumentUpload}
          preselectedType={selectedDocType}
        />
      </div>
    )
  }

  // DEALER & ADMIN/OPERATIONS VIEW - List view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#0B3D91" }}>
            {moduleLabel}
          </h1>
          <p className="text-muted-foreground font-medium mt-2">Toplam {filteredCustomers.length} kayıt gösteriliyor</p>
        </div>
        {canCreate && (
          <Button
            className="rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all px-6"
            style={{ backgroundColor: "#F57C00", color: "white" }}
            onClick={() => setShowNewFileModal(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            {userRole === "bayi" ? "Yeni Müşteri Ekle" : "Yeni Dosya Oluştur"}
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="rounded-3xl border-2 shadow-lg bg-gradient-to-r from-white to-slate-50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 text-muted-foreground -translate-y-1/2" />
              <Input
                type="search"
                placeholder="İsim, plaka veya TC ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 rounded-2xl border-2 font-medium"
              />
            </div>

            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] rounded-2xl border-2 font-medium">
                  <SelectValue placeholder="Durum Filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="İnceleniyor">İnceleniyor</SelectItem>
                  <SelectItem value="Başvuru Aşamasında">Başvuru Aşamasında</SelectItem>
                  <SelectItem value="Dava Aşamasında">Dava Aşamasında</SelectItem>
                  <SelectItem value="Onaylandı">Onaylandı</SelectItem>
                  <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                  <SelectItem value="Beklemede">Beklemede</SelectItem>
                  <SelectItem value="Evrak Aşamasında">Evrak Aşamasında</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="rounded-2xl border-2 font-medium bg-transparent">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer List Table */}
      <Card className="rounded-3xl border-2 shadow-lg">
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left p-4 font-semibold">Müşteri Adı Soyadı</th>
                  <th className="text-left p-4 font-semibold">Plaka</th>
                  <th className="text-left p-4 font-semibold">Başvuru Durumu</th>
                  <th className="text-left p-4 font-semibold">Evrak Durumu</th>
                  <th className="text-left p-4 font-semibold">Son Güncelleme</th>
                  {shouldShowDealerInfo && <th className="text-left p-4 font-semibold">Bayi</th>}
                  <th className="text-right p-4 font-semibold">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback style={{ backgroundColor: "#0B3D91", color: "white" }}>
                            {customer.ad_soyad
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{customer.ad_soyad}</p>
                          <p className="text-sm text-muted-foreground">{customer.telefon}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{customer.plaka}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={cn("rounded-xl border", getStatusColor(customer.başvuru_durumu))}>
                        {customer.başvuru_durumu}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge
                        className={cn(
                          "rounded-xl border",
                          customer.evrak_durumu === "Tamam"
                            ? "bg-green-100 text-green-800 border-green-300"
                            : "bg-orange-100 text-orange-800 border-orange-300",
                        )}
                      >
                        {customer.evrak_durumu}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {customer.son_güncelleme}
                      </div>
                    </td>
                    {shouldShowDealerInfo && (
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{customer.bağlı_bayi_adı}</span>
                        </div>
                      </td>
                    )}
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl"
                          onClick={async () => {
                            try {
                              const customerData = await customerApi.getById(customer.id)
                              setSelectedCustomer(transformCustomer(customerData))
                              setShowDetailsModal(true)
                            } catch (error) {
                              toast({
                                title: "Hata",
                                description: "Müşteri detayları yüklenemedi",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canEdit && (
                          <Button variant="ghost" size="icon" className="rounded-xl">
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Kayıt bulunamadı.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2" style={{ color: "#0B3D91" }}>
              {selectedCustomer?.ad_soyad} - Detaylı Bilgiler
              {selectedCustomer?.dosya_kilitli && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 rounded-xl flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Dosya Kapalı
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <Tabs defaultValue="info" className="w-full">
              {/* <TabsList> updated to include new tab */}
              <TabsList className="grid w-full grid-cols-5 rounded-2xl">
                <TabsTrigger value="info" className="rounded-xl">
                  Temel Bilgiler
                </TabsTrigger>
                <TabsTrigger value="documents" className="rounded-xl">
                  Evraklar
                </TabsTrigger>
                {(userRole === "admin" || userRole === "operasyon" || userRole === "superadmin") && (
                  <TabsTrigger value="result-documents" className="rounded-xl">
                    Sonuç Evrakları
                  </TabsTrigger>
                )}
                <TabsTrigger value="status" className="rounded-xl">
                  Durum
                </TabsTrigger>
                <TabsTrigger value="payments" className="rounded-xl">
                  Ödemeler
                </TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="info" className="space-y-4 mt-6">
                <Card className="rounded-2xl">
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Ad Soyad</p>
                        <p className="font-semibold">{selectedCustomer.ad_soyad}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">TC Kimlik No</p>
                        <p className="font-semibold">{selectedCustomer.tc_no}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Telefon</p>
                        <p className="font-semibold">{selectedCustomer.telefon}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-semibold">{selectedCustomer.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Plaka</p>
                        <p className="font-semibold">{selectedCustomer.plaka}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Hasar Tarihi</p>
                        <p className="font-semibold">{selectedCustomer.hasar_tarihi}</p>
                      </div>
                    </div>

                    {shouldShowDealerInfo && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground">Bağlı Bayi</p>
                        <p className="font-semibold">{selectedCustomer.bağlı_bayi_adı}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-4 mt-6">
                <div className="flex justify-end mb-4">
                  {canCreate && (
                    <Button
                      className="rounded-2xl"
                      style={{ backgroundColor: "#F57C00", color: "white" }}
                      onClick={() => handleDocUploadClick()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Yeni Evrak Yükle
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {selectedCustomer.evraklar.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={{
                        id: doc.id,
                        tip: doc.tip as DocumentType,
                        dosya_adı: doc.dosya_adı,
                        yüklenme_tarihi: doc.yüklenme_tarihi,
                        durum: doc.durum as any,
                      }}
                      userRole={userRole}
                      canUpload={canCreate}
                      canDelete={canDelete}
                      showDealerInfo={shouldShowDealerInfo}
                      onView={(doc) => console.log("[v0] Viewing:", doc)}
                      onDownload={(doc) => console.log("[v0] Downloading:", doc)}
                      onDelete={(doc) => console.log("[v0] Deleting:", doc)}
                      onUpload={handleDocUploadClick}
                    />
                  ))}
                </div>
              </TabsContent>

              {(userRole === "admin" || userRole === "operasyon" || userRole === "superadmin") && (
                <TabsContent value="result-documents" className="space-y-4 mt-6">
                  <Card className="rounded-2xl">
                    <CardContent className="p-6 space-y-6">
                      {/* Status Dropdown */}
                      <div>
                        <Label className="text-sm font-semibold mb-2">Başvuru Durumu</Label>
                        <Select
                          value={selectedCustomer.başvuru_durumu}
                          onValueChange={async (value) => {
                            try {
                              await updateCustomer(parseInt(selectedCustomer.id), {
                                başvuru_durumu: value,
                              })
                              setSelectedCustomer((prev) => (prev ? { ...prev, başvuru_durumu: value as ApplicationStatus } : null))
                            } catch (error) {
                              console.error("Error updating status:", error)
                            }
                          }}
                          disabled={selectedCustomer.dosya_kilitli}
                        >
                          <SelectTrigger className="w-full rounded-2xl border-2 mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="İnceleniyor">İnceleniyor</SelectItem>
                            <SelectItem value="Başvuru Aşamasında">Başvuru Aşamasında</SelectItem>
                            <SelectItem value="Dava Aşamasında">Dava Aşamasında</SelectItem>
                            <SelectItem value="Onaylandı">Onaylandı</SelectItem>
                            <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                            <SelectItem value="Beklemede">Beklemede</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Result Documents List */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Label className="text-sm font-semibold">Sonuç Evrakları</Label>
                          {!selectedCustomer.dosya_kilitli && canCreate && (
                            <Button
                              size="sm"
                              className="rounded-xl"
                              style={{ backgroundColor: "#F57C00", color: "white" }}
                              onClick={() => handleDocUploadClick()}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Yükle
                            </Button>
                          )}
                        </div>

                        <div className="space-y-3">
                          {selectedCustomer.evraklar.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <div>
                                  <p className="font-semibold text-sm">{doc.tip}</p>
                                  <p className="text-xs text-muted-foreground">{doc.dosya_adı}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={cn(
                                    "rounded-xl text-xs",
                                    doc.durum === "Onaylandı"
                                      ? "bg-green-100 text-green-800"
                                      : doc.durum === "Beklemede"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800",
                                  )}
                                >
                                  {doc.durum === "Onaylandı" ? "Yüklendi" : "Bekliyor"}
                                </Badge>
                                <Button size="sm" variant="ghost" className="rounded-xl">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Close File Button */}
                      {!selectedCustomer.dosya_kilitli && (userRole === "admin" || userRole === "superadmin") && (
                        <div className="pt-4 border-t">
                          <Button
                            variant="outline"
                            className="rounded-2xl border-2 border-red-300 text-red-700 hover:bg-red-50 bg-transparent"
                            onClick={() => setShowCloseFileModal(true)}
                          >
                            <Lock className="mr-2 h-4 w-4" />
                            Dosyayı Kapat
                          </Button>
                        </div>
                      )}

                      {selectedCustomer.dosya_kilitli && (
                        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-start gap-3">
                          <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-semibold text-blue-900">Dosya Kapatılmış</p>
                            <p className="text-sm text-blue-800 mt-1">
                              Bu dosya tamamlanmış ve kilitlenmiştir. Değişiklik yapılamaz.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* Status Tab */}
              <TabsContent value="status" className="space-y-4 mt-6">
                <Card className="rounded-2xl">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Başvuru Durumu</p>
                      {canUpdateStatus ? (
                        <Select
                          value={selectedCustomer.başvuru_durumu}
                          onValueChange={async (value) => {
                            try {
                              await updateCustomer(parseInt(selectedCustomer.id), {
                                başvuru_durumu: value,
                              })
                              setSelectedCustomer((prev) => (prev ? { ...prev, başvuru_durumu: value as ApplicationStatus } : null))
                            } catch (error) {
                              console.error("Error updating status:", error)
                            }
                          }}
                          disabled={selectedCustomer.dosya_kilitli}
                        >
                          <SelectTrigger className="w-full rounded-2xl border-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="İnceleniyor">İnceleniyor</SelectItem>
                            <SelectItem value="Başvuru Aşamasında">Başvuru Aşamasında</SelectItem>
                            <SelectItem value="Dava Aşamasında">Dava Aşamasında</SelectItem>
                            <SelectItem value="Onaylandı">Onaylandı</SelectItem>
                            <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                            <SelectItem value="Beklemede">Beklemede</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          className={cn(
                            "text-lg px-4 py-2 rounded-xl border",
                            getStatusColor(selectedCustomer.başvuru_durumu),
                          )}
                        >
                          {selectedCustomer.başvuru_durumu}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Durum Değişikliği Notu Ekle</p>
                      <Textarea
                        placeholder="Not ekleyin..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="rounded-2xl"
                        rows={4}
                        disabled={selectedCustomer.dosya_kilitli}
                      />
                      <Button
                        className="mt-2 rounded-2xl"
                        style={{ backgroundColor: "#0B3D91", color: "white" }}
                        disabled={selectedCustomer.dosya_kilitli || !newNote.trim()}
                        onClick={async () => {
                          if (!selectedCustomer || !newNote.trim()) return
                          try {
                            await customerApi.addNote(selectedCustomer.id, newNote)
                            toast({
                              title: "Başarılı",
                              description: "Not eklendi",
                            })
                            setNewNote("")
                            // Refresh customer details
                            const updated = await customerApi.getById(selectedCustomer.id)
                            setSelectedCustomer(transformCustomer(updated))
                          } catch (error) {
                            toast({
                              title: "Hata",
                              description: "Not eklenemedi",
                              variant: "destructive",
                            })
                          }
                        }}
                      >
                        Not Ekle
                      </Button>
                    </div>

                    <div>
                      <p className="font-semibold mb-3">İç Notlar</p>
                      <div className="space-y-3">
                        {selectedCustomer.notlar.map((note) => (
                          <div key={note.id} className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-semibold text-sm">{note.yazar}</p>
                              <p className="text-xs text-muted-foreground">{note.tarih}</p>
                            </div>
                            <p className="text-sm">{note.içerik}</p>
                          </div>
                        ))}
                        {selectedCustomer.notlar.length === 0 && (
                          <p className="text-center text-muted-foreground py-4">Henüz not eklenmemiş.</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments" className="space-y-4 mt-6">
                <div className="space-y-3">
                  {selectedCustomer.ödemeler.map((payment) => (
                    <Card key={payment.id} className="rounded-2xl">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{payment.açıklama}</p>
                            <p className="text-sm text-muted-foreground">{payment.tarih}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl" style={{ color: "#F57C00" }}>
                            {payment.tutar}
                          </p>
                          <Badge
                            className={cn(
                              "rounded-xl mt-1",
                              payment.durum === "Ödendi"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800",
                            )}
                          >
                            {payment.durum}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {selectedCustomer.ödemeler.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Henüz ödeme kaydı bulunmuyor.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCloseFileModal} onOpenChange={setShowCloseFileModal}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Dosyayı Kapat</DialogTitle>
            <DialogDescription>
              Bu dosyayı kapatmak üzeresiniz. Kapatılan dosyalar kilitlenir ve değişiklik yapılamaz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="close-reason" className="text-sm font-semibold mb-2">
                Kapatma Nedeni (Opsiyonel)
              </Label>
              <Textarea
                id="close-reason"
                placeholder="Dosya kapatma nedenini yazın..."
                value={closeFileReason}
                onChange={(e) => setCloseFileReason(e.target.value)}
                className="rounded-2xl mt-2"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseFileModal(false)} className="rounded-2xl">
              İptal
            </Button>
            <Button
              onClick={handleCloseFile}
              className="rounded-2xl"
              style={{ backgroundColor: "#0B3D91", color: "white" }}
            >
              Dosyayı Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewFileModal} onOpenChange={setShowNewFileModal}>
        <DialogContent className="rounded-3xl max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Yeni Dosya Oluştur</DialogTitle>
            <DialogDescription>
              Yeni müşteri dosyası oluşturun. Dosya tipi seçildikten sonra gerekli evrak alanları görünecektir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ad_soyad" className="text-sm font-semibold mb-2">
                  Ad Soyad *
                </Label>
                <Input
                  id="ad_soyad"
                  placeholder="Ahmet Yılmaz"
                  value={newFileData.ad_soyad}
                  onChange={(e) => setNewFileData({ ...newFileData, ad_soyad: e.target.value })}
                  className="rounded-2xl mt-2"
                />
              </div>
              <div>
                <Label htmlFor="tc_no" className="text-sm font-semibold mb-2">
                  TC Kimlik No *
                </Label>
                <Input
                  id="tc_no"
                  placeholder="12345678901"
                  value={newFileData.tc_no}
                  onChange={(e) => setNewFileData({ ...newFileData, tc_no: e.target.value })}
                  className="rounded-2xl mt-2"
                />
              </div>
              <div>
                <Label htmlFor="telefon" className="text-sm font-semibold mb-2">
                  Telefon *
                </Label>
                <Input
                  id="telefon"
                  placeholder="+90 532 123 4567"
                  value={newFileData.telefon}
                  onChange={(e) => setNewFileData({ ...newFileData, telefon: e.target.value })}
                  className="rounded-2xl mt-2"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-semibold mb-2">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ahmet@email.com"
                  value={newFileData.email}
                  onChange={(e) => setNewFileData({ ...newFileData, email: e.target.value })}
                  className="rounded-2xl mt-2"
                />
              </div>
              <div>
                <Label htmlFor="plaka" className="text-sm font-semibold mb-2">
                  Plaka *
                </Label>
                <Input
                  id="plaka"
                  placeholder="34 ABC 123"
                  value={newFileData.plaka}
                  onChange={(e) => setNewFileData({ ...newFileData, plaka: e.target.value })}
                  className="rounded-2xl mt-2"
                />
              </div>
              <div>
                <Label htmlFor="hasar_tarihi" className="text-sm font-semibold mb-2">
                  Hasar Tarihi *
                </Label>
                <Input
                  id="hasar_tarihi"
                  type="date"
                  value={newFileData.hasar_tarihi}
                  onChange={(e) => setNewFileData({ ...newFileData, hasar_tarihi: e.target.value })}
                  className="rounded-2xl mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dosya_tipi" className="text-sm font-semibold mb-2">
                Dosya Tipi *
              </Label>
              <Select
                value={newFileData.dosya_tipi_id}
                onValueChange={(value) => {
                  setNewFileData({ ...newFileData, dosya_tipi_id: value })
                  setNewFileUploadedDocs([]) // Reset uploaded docs when file type changes
                }}
              >
                <SelectTrigger className="w-full rounded-2xl border-2 mt-2">
                  <SelectValue placeholder="Dosya tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {fileTypes.length > 0 ? (
                    fileTypes.map((fileType) => (
                      <SelectItem key={fileType.id} value={fileType.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full")} style={{ backgroundColor: fileType.color }} />
                          {fileType.label}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    FILE_TYPES.map((fileType) => (
                      <SelectItem key={fileType.id} value={fileType.id}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", fileType.color)} />
                          {fileType.label}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {newFileData.dosya_tipi_id &&
              (() => {
                const selectedFileType = fileTypes.find((ft) => ft.id.toString() === newFileData.dosya_tipi_id)
                const fileTypeConfig = selectedFileType ? getFileTypeConfig(selectedFileType.name as FileType) : null
                if (!fileTypeConfig) return null

                return (
                  <div className="space-y-4">
                    <div
                      className="p-4 border-2 rounded-2xl"
                      style={{
                        borderColor: selectedFileType?.color ? `${selectedFileType.color}40` : '#e5e7eb',
                        backgroundColor: selectedFileType?.color ? `${selectedFileType.color}10` : '#f9fafb',
                      }}
                    >
                      <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedFileType?.color || '#000' }} />
                        Zorunlu Belgeler (Yükleme Alanları):
                      </p>
                      <div className="space-y-3">
                        {fileTypeConfig.requiredDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-white rounded-xl border"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{doc.label}</p>
                                {doc.minCount && (
                                  <p className="text-xs text-muted-foreground">Minimum {doc.minCount} adet</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {newFileUploadedDocs.includes(doc.id) ? (
                                <Badge className="bg-green-100 text-green-800 border-green-300 rounded-xl text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Yüklendi
                                </Badge>
                              ) : (
                                <Badge className="bg-orange-100 text-orange-800 border-orange-300 rounded-xl text-xs">
                                  Eksik
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl h-8 bg-transparent"
                                onClick={() => {
                                  // Toggle document upload status (for demo)
                                  if (newFileUploadedDocs.includes(doc.id)) {
                                    setNewFileUploadedDocs(newFileUploadedDocs.filter((d) => d !== doc.id))
                                  } else {
                                    setNewFileUploadedDocs([...newFileUploadedDocs, doc.id])
                                  }
                                }}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                Yükle
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Dosya Durumu Önizlemesi:</p>
                      <p className="text-sm text-blue-800">
                        {fileTypeConfig.requiredDocuments.every((doc) => newFileUploadedDocs.includes(doc.id))
                          ? "✅ Tüm zorunlu evraklar tamamlandı → Dosya durumu: Başvuru Aşamasında"
                          : "⚠️ Eksik zorunlu belge var → Dosya durumu: Evrak Aşamasında"}
                      </p>
                    </div>
                  </div>
                )
              })()}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewFileModal(false)
                setNewFileUploadedDocs([]) // Reset uploaded docs when modal closes
              }}
              className="rounded-2xl"
            >
              İptal
            </Button>
            <Button
              onClick={handleCreateNewFile}
              className="rounded-2xl"
              style={{ backgroundColor: "#F57C00", color: "white" }}
              disabled={
                !newFileData.ad_soyad ||
                !newFileData.tc_no ||
                !newFileData.telefon ||
                !newFileData.plaka ||
                !newFileData.hasar_tarihi ||
                !newFileData.dosya_tipi_id
              }
            >
              Dosya Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DocumentUploadModal
        open={showDocUploadModal}
        onOpenChange={setShowDocUploadModal}
        onUpload={handleDocumentUpload}
        preselectedType={selectedDocType}
      />
    </div>
  )
}
