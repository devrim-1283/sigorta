"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  Eye,
  Upload,
  FileText,
  DollarSign,
  Lock,
  Download,
  Trash2,
  ArrowLeft,
  Edit,
  RefreshCw,
  Copy,
  EyeOff,
} from "lucide-react"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { type UserRole } from "@/lib/role-config"
import { DocumentCard, type DocumentType, type DocumentStatus } from "@/components/document-card"
import { DocumentUploadModal } from "@/components/document-upload-modal"
import { customerApi, documentApi, dealerApi } from "@/lib/api-client"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

// Application status types
type ApplicationStatus =
  | "İnceleniyor"
  | "Başvuru Aşamasında"
  | "Dava Aşamasında"
  | "Onaylandı"
  | "Tamamlandı"
  | "Beklemede"
  | "Evrak Aşamasında"

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
  dosya_kilitli?: boolean
  dosya_tipi?: string
  notes?: Note[]
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
  tip: DocumentType
  dosya_adı: string
  yüklenme_tarihi?: string
  durum: DocumentStatus
}

interface Note {
  id: string
  yazar: string
  tarih: string
  içerik: string
  author?: string
  user?: { name: string }
  content?: string
  note?: string
  message?: string
  created_at?: string
}

export default function CustomerDetailPage() {
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const userRole: UserRole = (user?.role?.name as UserRole) || "superadmin"
  const customerId = params?.id as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDocUploadModal, setShowDocUploadModal] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | undefined>()
  const [showCloseFileModal, setShowCloseFileModal] = useState(false)
  const [closeFileReason, setCloseFileReason] = useState("")
  const [newNote, setNewNote] = useState("")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    ad_soyad: '',
    tc_no: '',
    telefon: '',
    email: '',
    plaka: '',
    hasar_tarihi: '',
    başvuru_durumu: 'İnceleniyor' as ApplicationStatus,
    dealer_id: 'none',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [dealerOptions, setDealerOptions] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (customerId && isAuthenticated) {
      fetchCustomer()
      fetchDealers()
    }
  }, [customerId, isAuthenticated])

  const fetchDealers = async () => {
    try {
      const dealers = await dealerApi.getAll()
      const options = [
        { id: "none", name: "Belirtilmemiş / Bilinmiyor" },
        ...dealers.map((d: any) => ({
          id: String(d.id),
          name: d.dealer_name || d.name || 'Bilinmeyen',
        })),
      ]
      setDealerOptions(options)
    } catch (error) {
      console.error('Failed to fetch dealers:', error)
    }
  }

  const fetchCustomer = async () => {
    if (!customerId) return

    try {
      setLoading(true)
      // Ensure customerId is a number if needed
      const id = typeof customerId === 'string' ? parseInt(customerId, 10) : customerId
      if (isNaN(Number(id))) {
        throw new Error('Geçersiz müşteri ID')
      }
      const response = await customerApi.getById(id)
      
      const mapDocuments = (docs: any[] = []) => {
        if (!Array.isArray(docs)) return []
        return docs.map((d) => {
          const docId = d.id?.toString?.() ?? String(d.id ?? '')
          const docTip = d.tip || d.document_type || 'Belge'
          const docDosyaAdi = d.dosya_adı || d.belge_adi || d.file_name || 'Belge'
          const docDosyaYolu = d.dosya_yolu || d.file_path
          const docMimeType = d.mime_type || d.mimeType
          
          let docYuklenmeTarihi: string | undefined
          if (d.yüklenme_tarihi) {
            docYuklenmeTarihi = new Date(d.yüklenme_tarihi).toLocaleString('tr-TR')
          } else if (d.created_at) {
            docYuklenmeTarihi = new Date(d.created_at).toLocaleString('tr-TR')
          } else if (d.uploaded_at) {
            docYuklenmeTarihi = new Date(d.uploaded_at).toLocaleString('tr-TR')
          }
          
          return {
            id: docId,
            tip: docTip as DocumentType,
            dosya_adı: docDosyaAdi,
            dosya_yolu: docDosyaYolu,
            mime_type: docMimeType,
            yüklenme_tarihi: docYuklenmeTarihi,
            durum: (d.durum || d.status || 'Beklemede') as DocumentStatus,
          }
        })
      }

      const documents = response.documents || response.evraklar || []
      const mappedDocuments = mapDocuments(documents)

      const transformedCustomer: Customer = {
        id: String(response.id),
        ad_soyad: response.ad_soyad || response.name || 'Bilinmeyen',
        tc_no: response.tc_no || '',
        telefon: response.telefon || response.phone || '',
        email: response.email || '',
        plaka: response.plaka || '',
        hasar_tarihi: response.hasar_tarihi || response.damage_date || '',
        başvuru_durumu: response.başvuru_durumu || 'İnceleniyor',
        ödemeler: (response.payments || response.ödemeler || []).map((p: any) => {
          // Handle BigInt for tutar/amount
          let tutarValue = 0
          if (p.tutar) {
            tutarValue = typeof p.tutar === 'bigint' ? Number(p.tutar) : Number(p.tutar)
          } else if (p.amount) {
            tutarValue = typeof p.amount === 'bigint' ? Number(p.amount) : Number(p.amount)
          }
          
          return {
            id: String(p.id),
            tarih: p.tarih || p.date || new Date().toLocaleDateString('tr-TR'),
            tutar: `₺${tutarValue.toLocaleString('tr-TR')}`,
            açıklama: p.açıklama || p.description || '',
            durum: (p.durum || 'Bekliyor') as "Ödendi" | "Bekliyor",
          }
        }),
        evraklar: mappedDocuments,
        bağlı_bayi_id: String(response.dealer_id || response.bağlı_bayi_id || ''),
        bağlı_bayi_adı: response.dealer?.dealer_name || response.bağlı_bayi_adı || 'Belirtilmemiş',
        notlar: (response.notes || response.notlar || []).map((n: any) => {
          // Handle both 'içerik' and 'content' fields
          const content = n.içerik || n.content || n.note || ''
          return {
            id: String(n.id),
            yazar: n.author?.name || n.user?.name || n.yazar || 'Sistem',
            tarih: n.created_at || n.tarih || new Date().toLocaleDateString('tr-TR'),
            içerik: content,
          }
        }).filter((note: any) => Boolean(note.içerik?.trim())),
        son_güncelleme: response.updated_at || response.son_güncelleme || new Date().toLocaleDateString('tr-TR'),
        evrak_durumu: response.evrak_durumu || 'Eksik',
        eksik_evraklar: response.eksik_evraklar || [],
        dosya_kilitli: response.dosya_kilitli || false,
        dosya_tipi: response.file_type?.name || response.dosya_tipi || 'deger-kaybi',
      }

      setCustomer(transformedCustomer)
    } catch (error: any) {
      console.error('Failed to fetch customer:', error)
      toast({
        title: "Hata",
        description: error.message || "Müşteri bilgileri yüklenemedi",
        variant: "destructive",
      })
      router.push("/admin/musteriler")
    } finally {
      setLoading(false)
    }
  }

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
      case "Evrak Aşamasında":
        return "bg-purple-100 text-purple-800 border-purple-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const shouldShowDealerInfo = userRole === "bayi" || userRole === "superadmin"
  const canUpdateStatus = userRole === "superadmin" || userRole === "operasyon" || userRole === "admin"
  const canCreate = userRole === "superadmin" || userRole === "operasyon" || userRole === "admin" || userRole === "evrak-birimi"
  const canDelete = userRole === "superadmin" || userRole === "operasyon" || userRole === "admin"

  const handleDocumentUpload = async (file: File, type: DocumentType) => {
    if (!customer) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tip', type)
      formData.append('document_type', type)
      formData.append('original_name', file.name)
      // customer.id is already a string, but ensure it's converted properly
      formData.append('customer_id', String(customer.id))
      formData.append('is_result_document', '0')

      await documentApi.upload(formData)
      setShowDocUploadModal(false)
      await fetchCustomer()
      
      toast({
        title: "Başarılı",
        description: "Evrak başarıyla yüklendi",
      })
    } catch (error: any) {
      console.error('Document upload error:', error)
      toast({
        title: "Hata",
        description: error.message || "Evrak yüklenirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleDocUploadClick = (docType?: DocumentType) => {
    setSelectedDocType(docType)
    setShowDocUploadModal(true)
  }

  const handleViewDocument = async (doc: any) => {
    await handleDownloadDocument(doc, true)
  }

  const handleDownloadDocument = async (doc: any, inline = false) => {
    try {
      const result = await documentApi.download(doc.id)
      if (result?.url) {
        const url = inline ? `${result.url}?inline=1` : result.url
        window.open(url, '_blank')
      }
    } catch (error: any) {
      console.error('Download error:', error)
      toast({
        title: "Hata",
        description: "Dosya indirilemedi",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDocument = (doc: any) => {
    setDocumentToDelete(doc)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteDocument = async () => {
    if (!documentToDelete || !customer) return

    try {
      const documentId = typeof documentToDelete.id === 'string' ? parseInt(documentToDelete.id, 10) : documentToDelete.id
      if (isNaN(documentId)) {
        throw new Error('Geçersiz evrak ID')
      }

      await documentApi.delete(documentId)
      setDeleteConfirmOpen(false)
      setDocumentToDelete(null)
      await fetchCustomer()
      
      toast({
        title: "Başarılı",
        description: "Evrak başarıyla silindi",
      })
    } catch (error: any) {
      console.error('Delete error:', error)
      toast({
        title: "Hata",
        description: error.message || "Evrak silinemedi",
        variant: "destructive",
      })
    }
  }

  const handleStatusUpdate = async (newStatus: ApplicationStatus) => {
    if (!customer) return

    try {
      await customerApi.update(customer.id, { başvuru_durumu: newStatus })
      await fetchCustomer()
      toast({
        title: "Başarılı",
        description: "Başvuru durumu güncellendi",
      })
    } catch (error: any) {
      console.error('Status update error:', error)
      toast({
        title: "Hata",
        description: error.message || "Durum güncellenemedi",
        variant: "destructive",
      })
    }
  }

  const handleAddNote = async () => {
    if (!customer || !newNote.trim()) return

    try {
      await customerApi.addNote(customer.id, newNote)
      setNewNote("")
      await fetchCustomer()
      toast({
        title: "Başarılı",
        description: "Not eklendi",
      })
    } catch (error: any) {
      console.error('Add note error:', error)
      toast({
        title: "Hata",
        description: error.message || "Not eklenemedi",
        variant: "destructive",
      })
    }
  }

  const handleCloseFile = async () => {
    if (!customer) return

    try {
      await customerApi.closeFile(customer.id, closeFileReason)
      setShowCloseFileModal(false)
      setCloseFileReason("")
      await fetchCustomer()
      toast({
        title: "Başarılı",
        description: "Dosya kapatıldı",
      })
    } catch (error: any) {
      console.error('Close file error:', error)
      toast({
        title: "Hata",
        description: error.message || "Dosya kapatılamadı",
        variant: "destructive",
      })
    }
  }

  const openEditModal = () => {
    if (!customer) return
    setEditFormData({
      ad_soyad: customer.ad_soyad || '',
      tc_no: customer.tc_no || '',
      telefon: customer.telefon || '',
      email: customer.email || '',
      plaka: customer.plaka || '',
      hasar_tarihi: customer.hasar_tarihi || '',
      başvuru_durumu: customer.başvuru_durumu || 'İnceleniyor',
      dealer_id: customer.bağlı_bayi_id || 'none',
      password: '',
    })
    setShowPassword(false)
    setShowEditModal(true)
  }

  const handleEditCustomer = async () => {
    if (!customer) return

    try {
      const payload: any = {
        ...editFormData,
        dealer_id:
          editFormData.dealer_id && editFormData.dealer_id !== 'none'
            ? parseInt(editFormData.dealer_id)
            : null,
      }

      // Include password if provided
      if (editFormData.password && editFormData.password.trim()) {
        payload.password = editFormData.password.trim()
      }

      await customerApi.update(customer.id, payload)
      
      toast({
        title: "Başarılı",
        description: "Müşteri bilgileri güncellendi",
      })

      setShowEditModal(false)
      setEditFormData({
        ad_soyad: '',
        tc_no: '',
        telefon: '',
        email: '',
        plaka: '',
        hasar_tarihi: '',
        başvuru_durumu: 'İnceleniyor',
        dealer_id: 'none',
        password: '',
      })
      setShowPassword(false)
      await fetchCustomer() // Refresh data
    } catch (err: any) {
      console.error('Edit customer error:', err)
      toast({
        title: "Hata",
        description: err.message || 'Müşteri güncellenemedi',
        variant: "destructive",
      })
    }
  }

  const generateStrongPassword = (length: number = 12): string => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    const allChars = uppercase + lowercase + numbers + symbols
    
    let password = ''
    // Ensure at least one character from each set
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += symbols[Math.floor(Math.random() * symbols.length)]
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }

  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword(12)
    setEditFormData((prev) => ({ ...prev, password: newPassword }))
    setTimeout(() => {
      navigator.clipboard.writeText(newPassword).then(() => {
        toast({
          title: "Şifre Oluşturuldu",
          description: "Şifre panoya kopyalandı",
        })
      }).catch(() => {
        toast({
          title: "Şifre Oluşturuldu",
          description: "Şifre: " + newPassword,
        })
      })
    }, 100)
  }

  const handleCopyPassword = () => {
    if (editFormData.password) {
      navigator.clipboard.writeText(editFormData.password).then(() => {
        toast({
          title: "Kopyalandı",
          description: "Şifre panoya kopyalandı",
        })
      })
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground mb-4">Müşteri bulunamadı</p>
        <Button onClick={() => router.push("/admin/musteriler")} className="rounded-2xl">
          Geri Dön
        </Button>
      </div>
    )
  }

  const canEdit = userRole === "superadmin" || userRole === "operasyon" || userRole === "admin"

  return (
    <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <Button
              variant="ghost"
              onClick={() => router.push("/admin/musteriler")}
              className="rounded-2xl"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Geri Dön</span>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                {customer.ad_soyad}
                {customer.dosya_kilitli && (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-300 rounded-xl flex items-center gap-1 text-xs">
                    <Lock className="h-3 w-3" />
                    Dosya Kapalı
                  </Badge>
                )}
              </h1>
              <p className="text-slate-600 mt-1 text-sm md:text-base">Müşteri Detaylı Bilgileri</p>
            </div>
          </div>
          {canEdit && !customer.dosya_kilitli && (
            <Button
              onClick={openEditModal}
              className="rounded-2xl"
              style={{ backgroundColor: "#0B3D91", color: "white" }}
            >
              <Edit className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Müşteri Düzenle</span>
              <span className="sm:hidden">Düzenle</span>
            </Button>
          )}
        </div>

        {/* Customer Details */}
        {customer && (
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 rounded-2xl gap-1">
              <TabsTrigger value="info" className="rounded-xl text-xs md:text-sm">
                Bilgiler
              </TabsTrigger>
              <TabsTrigger value="documents" className="rounded-xl text-xs md:text-sm">
                Evraklar
              </TabsTrigger>
              {(userRole === "admin" || userRole === "operasyon" || userRole === "superadmin") && (
                <TabsTrigger value="result-documents" className="rounded-xl text-xs md:text-sm">
                  Sonuç
                </TabsTrigger>
              )}
              <TabsTrigger value="status" className="rounded-xl text-xs md:text-sm">
                Durum
              </TabsTrigger>
              <TabsTrigger value="payments" className="rounded-xl text-xs md:text-sm">
                Ödemeler
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="info" className="space-y-4 mt-4 md:mt-6">
              <Card className="rounded-2xl">
                <CardContent className="p-4 md:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Ad Soyad</p>
                      <p className="font-semibold">{customer.ad_soyad}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">TC Kimlik No</p>
                      <p className="font-semibold">{customer.tc_no}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefon</p>
                      <p className="font-semibold">{customer.telefon}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-semibold">{customer.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Plaka</p>
                      <p className="font-semibold">{customer.plaka}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Hasar Tarihi</p>
                      <p className="font-semibold">{customer.hasar_tarihi}</p>
                    </div>
                  </div>

                  {shouldShowDealerInfo && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">Bağlı Bayi</p>
                      <p className="font-semibold">{customer.bağlı_bayi_adı}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4 mt-4 md:mt-6">
              <div className="flex justify-end mb-4">
                {canCreate && (
                  <Button
                    className="rounded-2xl w-full sm:w-auto"
                    style={{ backgroundColor: "#F57C00", color: "white" }}
                    onClick={() => handleDocUploadClick()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Yeni Evrak Yükle
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {customer.evraklar.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={{
                      id: doc.id,
                      tip: doc.tip,
                      dosya_adı: doc.dosya_adı,
                      yüklenme_tarihi: doc.yüklenme_tarihi,
                      durum: doc.durum,
                    }}
                    userRole={userRole}
                    canUpload={canCreate}
                    canDelete={canDelete}
                    showDealerInfo={shouldShowDealerInfo}
                    onView={handleViewDocument}
                    onDownload={handleDownloadDocument}
                    onDelete={handleDeleteDocument}
                    onUpload={handleDocUploadClick}
                  />
                ))}
                {customer.evraklar.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Henüz evrak yüklenmemiş.</p>
                )}
              </div>
            </TabsContent>

            {(userRole === "admin" || userRole === "operasyon" || userRole === "superadmin") && (
              <TabsContent value="result-documents" className="space-y-4 mt-6">
                <Card className="rounded-2xl">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <Label className="text-sm font-semibold mb-2">Başvuru Durumu</Label>
                      <Select
                        value={customer.başvuru_durumu}
                        onValueChange={(value) => {
                          handleStatusUpdate(value as ApplicationStatus)
                        }}
                        disabled={customer.dosya_kilitli}
                      >
                        <SelectTrigger className="w-full rounded-2xl border-2 mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper" sideOffset={4} className="max-h-[300px] overflow-y-auto z-[100]">
                          <SelectItem value="İnceleniyor">İnceleniyor</SelectItem>
                          <SelectItem value="Başvuru Aşamasında">Başvuru Aşamasında</SelectItem>
                          <SelectItem value="Dava Aşamasında">Dava Aşamasında</SelectItem>
                          <SelectItem value="Onaylandı">Onaylandı</SelectItem>
                          <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                          <SelectItem value="Beklemede">Beklemede</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {!customer.dosya_kilitli && (userRole === "admin" || userRole === "superadmin") && (
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

                    {customer.dosya_kilitli && (
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
            <TabsContent value="status" className="space-y-4 mt-4 md:mt-6">
              <Card className="rounded-2xl">
                <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Başvuru Durumu</p>
                    {canUpdateStatus ? (
                      <Select
                        value={customer.başvuru_durumu}
                        onValueChange={(value) => {
                          handleStatusUpdate(value as ApplicationStatus)
                        }}
                        disabled={customer.dosya_kilitli}
                      >
                        <SelectTrigger className="w-full rounded-2xl border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper" sideOffset={4} className="max-h-[300px] overflow-y-auto z-[100]">
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
                          getStatusColor(customer.başvuru_durumu),
                        )}
                      >
                        {customer.başvuru_durumu}
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
                      disabled={customer.dosya_kilitli}
                    />
                    <Button
                      className="mt-2 rounded-2xl"
                      style={{ backgroundColor: "#0B3D91", color: "white" }}
                      disabled={customer.dosya_kilitli}
                      onClick={handleAddNote}
                    >
                      Not Ekle
                    </Button>
                  </div>

                  <div>
                    <p className="font-semibold mb-3">İç Notlar</p>
                    <div className="space-y-3">
                      {(customer.notlar || customer.notes || []).length > 0 ? (
                        (customer.notlar || customer.notes || []).map((note) => {
                          let formatted = note.tarih || note.created_at
                          if (formatted) {
                            try {
                              const date = new Date(formatted)
                              if (!isNaN(date.getTime())) {
                                formatted = date.toLocaleString('tr-TR', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              }
                            } catch (error) {
                              formatted = note.tarih || note.created_at
                            }
                          }
                          return (
                            <div key={note.id} className="p-4 bg-slate-50 rounded-xl">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold text-sm">{note.yazar || note.author || note.user?.name || 'Sistem'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatted || new Date().toLocaleString('tr-TR')}
                                </p>
                              </div>
                              <p className="text-sm whitespace-pre-line">{note.içerik || note.content || note.note || note.message}</p>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-center text-muted-foreground py-4">Henüz not eklenmemiş.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4 mt-4 md:mt-6">
              <div className="space-y-3">
                {customer.ödemeler.map((payment) => (
                  <Card key={payment.id} className="rounded-2xl">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{payment.açıklama}</p>
                          <p className="text-sm text-muted-foreground">{payment.tarih}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <p className="font-bold text-lg sm:text-xl" style={{ color: "#F57C00" }}>
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
                {customer.ödemeler.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Henüz ödeme kaydı bulunmuyor.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Document Upload Modal */}
        <DocumentUploadModal
          open={showDocUploadModal}
          onOpenChange={setShowDocUploadModal}
          onUpload={handleDocumentUpload}
          preselectedType={selectedDocType}
          customerId={customer?.id}
          customerOptions={customer ? [{ id: customer.id, name: customer.ad_soyad }] : []}
          requireCustomer={false}
        />

        {/* Delete Document Confirmation */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Evrakı Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu evrağı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-2xl">İptal</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteDocument}
                className="rounded-2xl bg-red-600 hover:bg-red-700"
              >
                Evet, Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Close File Modal */}
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
                className="rounded-2xl bg-red-600 hover:bg-red-700"
              >
                Dosyayı Kapat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Customer Modal */}
        <Dialog open={showEditModal} onOpenChange={(open) => {
          setShowEditModal(open)
          if (!open) {
            setEditFormData({
              ad_soyad: '',
              tc_no: '',
              telefon: '',
              email: '',
              plaka: '',
              hasar_tarihi: '',
              başvuru_durumu: 'İnceleniyor',
              dealer_id: 'none',
              password: '',
            })
            setShowPassword(false)
          }
        }}>
          <DialogContent className="rounded-3xl max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw]">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl font-bold">Müşteri Düzenle</DialogTitle>
              <DialogDescription className="text-sm">
                Müşteri bilgilerini güncelleyin.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_ad_soyad" className="text-sm font-semibold mb-2">
                    Ad Soyad *
                  </Label>
                  <Input
                    id="edit_ad_soyad"
                    placeholder="Ahmet Yılmaz"
                    value={editFormData.ad_soyad}
                    onChange={(e) => setEditFormData({ ...editFormData, ad_soyad: e.target.value })}
                    className="rounded-2xl mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_tc_no" className="text-sm font-semibold mb-2">
                    TC Kimlik No *
                  </Label>
                  <Input
                    id="edit_tc_no"
                    placeholder="12345678901"
                    value={editFormData.tc_no}
                    onChange={(e) => {
                      // Only allow digits
                      const digitsOnly = e.target.value.replace(/\D/g, '')
                      
                      // If more than 11 digits, show warning but allow typing
                      if (digitsOnly.length > 11) {
                        // Auto-trim to 11 digits
                        const trimmed = digitsOnly.slice(0, 11)
                        setEditFormData({ ...editFormData, tc_no: trimmed })
                        toast({
                          title: 'Uyarı',
                          description: 'TC Kimlik No 11 haneli olmalıdır. Fazla karakterler kaldırıldı.',
                          variant: 'default',
                          duration: 3000,
                        })
                      } else {
                        setEditFormData({ ...editFormData, tc_no: digitsOnly })
                      }
                    }}
                    maxLength={15}
                    className="rounded-2xl mt-2"
                  />
                  {editFormData.tc_no && editFormData.tc_no.replace(/\D/g, '').length !== 11 && editFormData.tc_no.replace(/\D/g, '').length > 0 && (
                    <p className={`text-xs mt-1 ${editFormData.tc_no.replace(/\D/g, '').length > 11 ? 'text-orange-600' : 'text-red-600'}`}>
                      {editFormData.tc_no.replace(/\D/g, '').length > 11 
                        ? 'TC Kimlik No 11 haneli olmalıdır. Fazla karakterler otomatik kaldırılacak.' 
                        : 'TC Kimlik No 11 haneli olmalıdır'}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit_telefon" className="text-sm font-semibold mb-2">
                    Telefon *
                  </Label>
                  <Input
                    id="edit_telefon"
                    placeholder="+90 532 123 4567"
                    value={editFormData.telefon}
                    onChange={(e) => setEditFormData({ ...editFormData, telefon: e.target.value })}
                    className="rounded-2xl mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_email" className="text-sm font-semibold mb-2">
                    Email
                  </Label>
                  <Input
                    id="edit_email"
                    type="email"
                    placeholder="ahmet@email.com"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="rounded-2xl mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_plaka" className="text-sm font-semibold mb-2">
                    Plaka *
                  </Label>
                  <Input
                    id="edit_plaka"
                    placeholder="34 ABC 123"
                    value={editFormData.plaka}
                    onChange={(e) => setEditFormData({ ...editFormData, plaka: e.target.value })}
                    className="rounded-2xl mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_hasar_tarihi" className="text-sm font-semibold mb-2">
                    Hasar Tarihi *
                  </Label>
                  <Input
                    id="edit_hasar_tarihi"
                    type="date"
                    value={editFormData.hasar_tarihi}
                    onChange={(e) => setEditFormData({ ...editFormData, hasar_tarihi: e.target.value })}
                    className="rounded-2xl mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_başvuru_durumu" className="text-sm font-semibold mb-2">
                    Başvuru Durumu
                  </Label>
                  <Select
                    value={editFormData.başvuru_durumu}
                    onValueChange={(value) => setEditFormData({ ...editFormData, başvuru_durumu: value as ApplicationStatus })}
                  >
                    <SelectTrigger id="edit_başvuru_durumu" className="w-full rounded-2xl border-2 mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4} className="max-h-[300px] overflow-y-auto z-[100]">
                      <SelectItem value="İnceleniyor">İnceleniyor</SelectItem>
                      <SelectItem value="Başvuru Aşamasında">Başvuru Aşamasında</SelectItem>
                      <SelectItem value="Dava Aşamasında">Dava Aşamasında</SelectItem>
                      <SelectItem value="Onaylandı">Onaylandı</SelectItem>
                      <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                      <SelectItem value="Beklemede">Beklemede</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_dealer" className="text-sm font-semibold mb-2">
                    Bayi
                  </Label>
                  <Select
                    value={editFormData.dealer_id}
                    onValueChange={(value) => setEditFormData({ ...editFormData, dealer_id: value })}
                  >
                    <SelectTrigger id="edit_dealer" className="w-full rounded-2xl border-2 mt-2">
                      <SelectValue placeholder="Bayi seçin (opsiyonel)" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4} className="max-h-[300px] overflow-y-auto z-[100]">
                      {dealerOptions.map((dealer) => (
                        <SelectItem key={dealer.id} value={dealer.id}>
                          {dealer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="edit_password" className="text-sm font-semibold mb-2">
                    Şifre (Değiştirmek için)
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <div className="relative flex-1">
                      <Input
                        id="edit_password"
                        type={showPassword ? "text" : "password"}
                        value={editFormData.password || ""}
                        onChange={(e) => setEditFormData((prev) => ({ ...prev, password: e.target.value }))}
                        placeholder="Yeni şifre belirleyin veya otomatik üretin"
                        className="rounded-2xl pr-10"
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
                      onClick={handleGeneratePassword}
                      className="rounded-2xl"
                      title="Rastgele şifre üret ve kopyala"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Üret
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopyPassword}
                      disabled={!editFormData.password}
                      className="rounded-2xl"
                      title="Şifreyi kopyala"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Şifre belirlenirse müşteri hesabı bu şifre ile güncellenir. Boş bırakılırsa şifre değişmez.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="rounded-2xl w-full sm:w-auto">
                İptal
              </Button>
              <Button
                onClick={handleEditCustomer}
                className="rounded-2xl w-full sm:w-auto"
                style={{ backgroundColor: "#0B3D91", color: "white" }}
              >
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}

