"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import {
  Search,
  Filter,
  Plus,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  Eye,
  EyeOff,
  Copy,
  Edit,
  Car,
  Building,
  Lock,
  CheckCircle2,
  Download,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { type UserRole, hasPermission, getModuleLabel } from "@/lib/role-config"
import { FILE_TYPES, getFileTypeConfig, type FileType, type DocumentType as FileDocType } from "@/lib/file-types-config"
import { DocumentCard, type DocumentType, type DocumentStatus } from "@/components/document-card"
import { DocumentUploadModal } from "@/components/document-upload-modal"
import { customerApi, documentApi, dealerApi } from "@/lib/api-client"

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sigorta.test/api/v1'

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

interface ConfirmDialogConfig {
  open: boolean
  title: string
  description: string
  confirmLabel: string
}

export default function CustomersPage() {
  const { isAuthenticated, user, isLoading, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const userRole: UserRole = (user?.role?.name as UserRole) || "superadmin"

  // State management
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Modal states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'bilgiler' | 'evraklar' | 'durum'>('bilgiler')
  const [showDocUploadModal, setShowDocUploadModal] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | undefined>()
  const [showCloseFileModal, setShowCloseFileModal] = useState(false)
  const [closeFileReason, setCloseFileReason] = useState("")
  const [closeFilePayment, setCloseFilePayment] = useState("")
  const [closeFileExpenses, setCloseFileExpenses] = useState("")
  const [closeFileDealerCommission, setCloseFileDealerCommission] = useState("")
  const [closeFileNetProfit, setCloseFileNetProfit] = useState("")
  const [closeFileExpenseFiles, setCloseFileExpenseFiles] = useState<File[]>([])
  const [showNewFileModal, setShowNewFileModal] = useState(false)
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

  // Form states
  const [newNote, setNewNote] = useState("")
  const [newFileData, setNewFileData] = useState<{
    ad_soyad: string
    tc_no: string
    telefon: string
    email: string
    plaka: string
    hasar_tarihi: string
    dosya_tipi: number | ""
    dealer_id: string
    password: string
  }>({
    ad_soyad: "",
    tc_no: "",
    telefon: "",
    email: "",
    plaka: "",
    hasar_tarihi: "",
    dosya_tipi: "",
    dealer_id: "none",
    password: "",
  })
  const [showNewFilePassword, setShowNewFilePassword] = useState(false)
  const [newFileUploadedDocs, setNewFileUploadedDocs] = useState<FileDocType[]>([])
  const [currentUploadingDocType, setCurrentUploadingDocType] = useState<FileDocType | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File }>({})
  const [dealerOptions, setDealerOptions] = useState<Array<{ id: string; name: string }>>([
    { id: "none", name: "Belirtilmemiş / Bilinmiyor" },
  ])
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogConfig>({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Onayla',
  })
  const confirmActionRef = useRef<null | (() => Promise<void> | void)>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const openConfirmDialog = ({
    title,
    description,
    confirmLabel = 'Onayla',
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
      confirmLabel: confirmLabel ?? 'Onayla',
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
      // Success is handled by the action itself (toast notifications)
      } catch (error: any) {
        console.error('Confirm dialog action error:', error)
        toast({
          title: 'Uyarı',
          description: error?.message || 'İşlem gerçekleştirilemedi',
          variant: 'default',
          duration: 5000,
        })
      } finally {
      setConfirmLoading(false)
      handleConfirmDialogClose()
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
                  Siliniyor...
                </span>
              ) : (
                confirmDialog.confirmLabel || 'Onayla'
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  // Permissions
  const canCreate = hasPermission(userRole, "customer-management", "canCreate")
  const canEdit = hasPermission(userRole, "customer-management", "canEdit")
  const canDelete = hasPermission(userRole, "customer-management", "canDelete")
  const moduleLabel = getModuleLabel(userRole, "customer-management")

  // Simulate current dealer ID for bayi role
  // Get actual dealer_id or customer_id from user
  const currentDealerId = userRole === "bayi" && user?.dealer_id ? String(user.dealer_id) : null
  const currentCustomerId = userRole === "musteri" && user?.id ? String(user.id) : null
  
  console.log('[Auth Debug] User role:', userRole)
  console.log('[Auth Debug] Current dealer ID:', currentDealerId)
  console.log('[Auth Debug] Current customer ID:', currentCustomerId)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const data = await customerApi.list({ search: searchTerm, status: statusFilter })

      console.log('[Müşteri Listesi] API Response:', data)
      console.log('[Müşteri Listesi] Müşteri sayısı:', data.customers?.length || 0)

      // Transform API data to Customer interface
      const transformedCustomers: Customer[] = (data.customers || []).map((item: any) => {
        console.log('[Müşteri Transform] Raw item:', item)
        
        return {
          id: String(item.id), // Convert to string
          ad_soyad: item.ad_soyad || item.name || 'Bilinmeyen',
          tc_no: item.tc_no || '',
          telefon: item.telefon || item.phone || '',
          email: item.email || '',
          plaka: item.plaka || '',
          hasar_tarihi: item.hasar_tarihi || item.damage_date || new Date().toISOString().split('T')[0],
          başvuru_durumu: (item.başvuru_durumu || 'İnceleniyor') as ApplicationStatus,
          ödemeler: (item.payments || item.ödemeler || []).map((p: any) => ({
            id: String(p.id),
            tarih: p.date || p.tarih || new Date().toLocaleDateString('tr-TR'),
            tutar: p.amount ? `₺${p.amount.toLocaleString('tr-TR')}` : (p.tutar || '₺0'),
            açıklama: p.description || p.açıklama || '',
            durum: (p.durum || 'Bekliyor') as "Ödendi" | "Bekliyor",
          })),
          evraklar: (item.documents || item.evraklar || []).map((d: any) => ({
            id: String(d.id),
            tip: d.tip || d.type || 'Belge',
            dosya_adı: d.dosya_adı || d.file_name || 'dosya',
            yüklenme_tarihi: d.yüklenme_tarihi || d.uploaded_at || new Date().toLocaleDateString('tr-TR'),
            durum: (d.durum || 'Beklemede') as "Onaylandı" | "Beklemede" | "Reddedildi",
          })),
          bağlı_bayi_id: item.dealer_id ? String(item.dealer_id) : (item.bağlı_bayi_id || ''),
          bağlı_bayi_adı: item.dealer?.dealer_name || item.bağlı_bayi_adı || 'Belirtilmemiş',
          notlar: (item.notes || item.notlar || []).map((n: any) => ({
            id: String(n.id),
            yazar: n.author?.name || n.user?.name || n.yazar || 'Sistem',
            tarih: n.created_at || n.tarih || new Date().toLocaleDateString('tr-TR'),
            içerik: n.note || n.içerik || n.content || n.message || '',
          })).filter((note: any) => Boolean(note.içerik?.trim())),
          son_güncelleme: item.updated_at ? new Date(item.updated_at).toLocaleDateString('tr-TR') : (item.son_güncelleme || new Date().toLocaleDateString('tr-TR')),
          evrak_durumu: (item.evrak_durumu || 'Eksik') as "Tamam" | "Eksik",
          eksik_evraklar: item.eksik_evraklar || [],
          dosya_kilitli: item.dosya_kilitli || false,
          dosya_tipi: (item.file_type?.name || item.dosya_tipi) as FileType,
          yüklenen_evraklar: (item.documents || item.evraklar || []).map((d: any) => d.tip || d.type) as FileDocType[],
        }
      })

      console.log('[Müşteri Listesi] Transformed customers:', transformedCustomers.length)
      console.log('[Müşteri Listesi] First customer sample:', transformedCustomers[0])
      setCustomers(transformedCustomers)
      setError("")
    } catch (err: any) {
      console.error('Fetch customers error:', err)
      setError('Müşteriler yüklenemedi. Lütfen API bağlantısını kontrol edin.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomers()
    }
  }, [isAuthenticated, searchTerm, statusFilter])

  useEffect(() => {
    const fetchDealers = async () => {
      try {
        const dealers = await dealerApi.list({ status: "active" })
        const mapped =
          Array.isArray(dealers)
            ? dealers
                .map((dealer: any) => ({
                  id: dealer.id?.toString?.() ?? "",
                  name: dealer.dealer_name || "Belirtilmemiş",
                }))
                .filter((dealer) => dealer.id)
            : []

        // Remove duplicates
        const unique = mapped.filter(
          (dealer, index, arr) => arr.findIndex((d) => d.id === dealer.id) === index,
        )

        // Reset dealer options to avoid duplicates
        const baseOption = { id: "none", name: "Belirtilmemiş / Bilinmiyor" }
        setDealerOptions([baseOption, ...unique])
      } catch (error) {
        console.error("Bayi listesi alınamadı:", error)
      }
    }

    fetchDealers()
  }, [])

  useEffect(() => {
    if (user?.dealer_id) {
      const dealerId = String(user.dealer_id)
      setDealerOptions((prev) => {
        if (prev.some((dealer) => dealer.id === dealerId)) {
          return prev
        }
        return [...prev, { id: dealerId, name: user?.dealer?.dealer_name || "Bağlı Bayi" }]
      })

      setNewFileData((prev) => (prev.dealer_id === "none" ? { ...prev, dealer_id: dealerId } : prev))
    }
  }, [user?.dealer_id, user?.dealer?.dealer_name])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

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
      case "Evrak Aşamasında":
        return "bg-purple-100 text-purple-800 border-purple-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  // Filter customers based on role and search
  const getFilteredCustomers = () => {
    let filteredCustomers = customers

    // Role-based filtering
    if (userRole === "musteri" && currentCustomerId) {
      filteredCustomers = filteredCustomers.filter((c) => c.id === currentCustomerId)
    } else if (userRole === "bayi" && currentDealerId) {
      filteredCustomers = filteredCustomers.filter((c) => c.bağlı_bayi_id === currentDealerId)
    }

    // Status filter
    if (statusFilter !== "all") {
      filteredCustomers = filteredCustomers.filter((c) => c.başvuru_durumu === statusFilter)
    }

    return filteredCustomers
  }

  const filteredCustomers = getFilteredCustomers()
  
  const mapDocuments = (docs: any[] = []) => {
    if (!Array.isArray(docs)) {
      console.warn('mapDocuments: docs is not an array:', docs)
      return []
    }
    
    return docs.map((d) => {
      const docId = d.id?.toString?.() ?? String(d.id ?? '')
      const docTip = d.tip || d.document_type || 'Belge'
      const docDosyaAdi = d.dosya_adı || d.belge_adi || d.file_name || 'Belge'
      const docDosyaYolu = d.dosya_yolu || d.file_path
      const docMimeType = d.mime_type || d.mimeType
      
      // Handle date - try multiple possible field names
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
  
  console.log('[Müşteri Listesi] Total customers:', customers.length)
  console.log('[Müşteri Listesi] Filtered customers:', filteredCustomers.length)
  console.log('[Müşteri Listesi] Search term:', searchTerm)
  console.log('[Müşteri Listesi] Status filter:', statusFilter)
  console.log('[Müşteri Listesi] User role:', userRole)

  // Check if dealer info should be shown
  const shouldShowDealerInfo = userRole === "bayi" || userRole === "superadmin"

  // Check if user can update status
  const canUpdateStatus = userRole === "superadmin" || userRole === "operasyon" || userRole === "admin"

  // Document handlers
  const handleDocumentUpload = async (file: File, type: DocumentType) => {
    if (!selectedCustomer) return

    try {
      console.log('Starting document upload:', { fileName: file.name, type, customerId: selectedCustomer.id })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('tip', type)
      formData.append('document_type', type)
      formData.append('original_name', file.name)
      formData.append('customer_id', selectedCustomer.id.toString())
      formData.append('is_result_document', '0')  // Default to false for regular documents

      const result = await documentApi.upload(formData)
      console.log('Upload successful:', result)

      setShowDocUploadModal(false)

      // Refresh the selected customer data to show new documents
      if (selectedCustomer) {
        try {
          // Ensure customer ID is a number
          const customerId = typeof selectedCustomer.id === 'string' 
            ? parseInt(selectedCustomer.id, 10) 
            : Number(selectedCustomer.id)
          
          if (isNaN(customerId)) {
            throw new Error('Geçersiz müşteri ID')
          }
          
          const response = await customerApi.getById(customerId)
          console.log('Raw updated customer data:', response)
          console.log('Documents from API:', response.documents)

          // Transform the customer data - ensure documents are properly mapped
          const documents = response.documents || response.evraklar || []
          console.log('Documents to map:', documents)
          
          const mappedDocuments = mapDocuments(documents)
          console.log('Mapped documents:', mappedDocuments)

          const transformedCustomer = {
            id: String(response.id),
            ad_soyad: response.ad_soyad || response.name || 'Bilinmeyen',
            tc_no: response.tc_no || '',
            telefon: response.telefon || response.phone || '',
            email: response.email || '',
            plaka: response.plaka || '',
            hasar_tarihi: response.hasar_tarihi || response.damage_date || '',
            başvuru_durumu: response.başvuru_durumu || 'İnceleniyor',
            ödemeler: (response.payments || response.ödemeler || []).map((p: any) => ({
              id: String(p.id),
              tarih: p.tarih || p.date || new Date().toLocaleDateString('tr-TR'),
              tutar: p.tutar ? `₺${Number(p.tutar).toLocaleString('tr-TR')}` : (p.amount ? `₺${Number(p.amount).toLocaleString('tr-TR')}` : '₺0'),
              açıklama: p.açıklama || p.description || '',
              durum: (p.durum || 'Bekliyor') as "Ödendi" | "Bekliyor",
            })),
            evraklar: mappedDocuments,
            bağlı_bayi_id: String(response.dealer_id || response.bağlı_bayi_id || ''),
            bağlı_bayi_adı: response.dealer?.dealer_name || response.bağlı_bayi_adı || 'Belirtilmemiş',
            notlar: (response.notes || response.notlar || []).map((n: any) => ({
              id: String(n.id),
              yazar: n.author?.name || n.user?.name || 'Sistem',
              tarih: n.created_at || new Date().toLocaleDateString('tr-TR'),
              içerik: n.content || n.içerik || n.note || '',
            })).filter((note: any) => Boolean(note.içerik?.trim())),
            son_güncelleme: response.updated_at || response.son_güncelleme || new Date().toLocaleDateString('tr-TR'),
            evrak_durumu: response.evrak_durumu || 'Eksik',
            eksik_evraklar: response.eksik_evraklar || [],
            dosya_kilitli: response.dosya_kilitli || false,
            dosya_tipi: response.file_type?.name || response.dosya_tipi || 'deger-kaybi',
            yüklenen_evraklar: mappedDocuments.map((d: any) => d.tip) || [],
          }

          console.log('Final transformed customer:', transformedCustomer)
          setSelectedCustomer(transformedCustomer)
        } catch (error) {
          console.error('Failed to refresh customer data:', error)
          toast({
            title: "Uyarı",
            description: "Müşteri verileri yenilenirken bir sorun oluştu. Sayfayı yenileyin.",
            variant: "default",
            duration: 5000,
          })
        }
      }

      fetchCustomers() // Refresh the main list
      
      toast({
        title: "Başarılı",
        description: "Evrak başarıyla yüklendi",
      })
    } catch (error: any) {
      console.error('Document upload error:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      })
      
      // Show user-friendly warning message
      const errorMessage = error.message || 'Evrak yüklenirken bir sorun oluştu'
      toast({
        title: "Uyarı",
        description: errorMessage,
        variant: "default",
        duration: 5000,
      })
    }
  }

  const handleDocUploadClick = (docType?: DocumentType) => {
    setSelectedDocType(docType)
    setShowDocUploadModal(true)
  }

  // New file document upload handler
  const handleNewFileDocumentUpload = async (file: File, docType: FileDocType) => {
    try {
      console.log('New file document upload:', { fileName: file.name, docType })

      // Store the actual uploaded file for later use during customer creation
      setUploadedFiles(prev => ({
        ...prev,
        [docType]: file
      }))

      // Add to uploaded documents list
      if (!newFileUploadedDocs.includes(docType)) {
        setNewFileUploadedDocs([...newFileUploadedDocs, docType])
      }

      // Show success message (optional)
      console.log('Document marked as uploaded for new file creation')

    } catch (error: any) {
      console.error('New file document upload error:', error)
      // Show error message (optional)
      // You could add a toast notification here
    }
  }

  // Handle new file upload button click
  const handleNewFileUploadClick = (docType: FileDocType) => {
    setCurrentUploadingDocType(docType)
    setSelectedDocType(docType as DocumentType)
    setShowDocUploadModal(true)
  }

  // Universal document upload handler that works for both regular uploads and new file creation
  const handleUniversalDocumentUpload = async (file: File, type: DocumentType) => {
    // If we're in new file creation mode (currentUploadingDocType is set)
    if (currentUploadingDocType) {
      await handleNewFileDocumentUpload(file, currentUploadingDocType)
      setCurrentUploadingDocType(null) // Reset after upload
    } else {
      // Regular document upload for existing customers
      await handleDocumentUpload(file, type)
    }
  }

  // Handle document upload modal close
  const handleDocUploadModalClose = (open: boolean) => {
    if (!open) {
      setCurrentUploadingDocType(null) // Reset when modal is closed
    }
    setShowDocUploadModal(open)
  }

  // Document action handlers
  const handleViewDocument = async (doc: any) => {
    await handleDownloadDocument(doc, true)
  }

  const handleDownloadDocument = async (doc: any, inline = false) => {
    try {
      const result = await documentApi.download(doc.id)
      if (result?.url) {
        const url = inline ? `${result.url}?inline=1` : result.url
        window.open(url, '_blank')
      } else {
        console.error('Download url missing')
      }
    } catch (error: any) {
      console.error('Download error:', error)
    }
  }

  // Download all documents as zip
  const handleDownloadAllDocuments = async (customer: Customer) => {
    if (!customer || !customer.evraklar || customer.evraklar.length === 0) {
      toast({
        title: "Uyarı",
        description: "İndirilecek evrak bulunamadı",
        variant: "default",
        duration: 3000,
      })
      return
    }

    try {
      toast({
        title: "Bilgi",
        description: `${customer.evraklar.length} evrak indiriliyor...`,
        duration: 2000,
      })

      // Download each document and create zip
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      for (const doc of customer.evraklar) {
        try {
          const result = await documentApi.download(doc.id)
          if (result?.url) {
            const response = await fetch(result.url)
            const blob = await response.blob()
            const fileName = doc.dosya_adı || `evrak-${doc.id}.pdf`
            zip.file(fileName, blob)
          }
        } catch (error) {
          console.error(`Failed to download document ${doc.id}:`, error)
        }
      }

      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${customer.ad_soyad.replace(/\s+/g, '_')}_evraklar_${Date.now()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Başarılı",
        description: "Tüm evraklar zip dosyası olarak indirildi",
      })
    } catch (error: any) {
      console.error('Download all documents error:', error)
      toast({
        title: "Uyarı",
        description: error.message || "Evraklar indirilemedi",
        variant: "default",
        duration: 5000,
      })
    }
  }

  const handleDeleteDocument = (doc: any) => {
    openConfirmDialog({
      title: "Evrakı Sil",
      description: "Bu evrağı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
      confirmLabel: "Evet, Sil",
      action: async () => {
        try {
          // Ensure ID is a number
          const documentId = typeof doc.id === 'string' ? parseInt(doc.id, 10) : doc.id
          if (isNaN(documentId)) {
            throw new Error('Geçersiz evrak ID')
          }

          await documentApi.delete(documentId)

          // Show success toast
          toast({
            title: "Başarılı",
            description: "Evrak başarıyla silindi",
          })

          // Refresh customer data to update document list
          if (selectedCustomer) {
            try {
              const response = await customerApi.getById(selectedCustomer.id)

              const transformedCustomer = {
                id: response.id,
                ad_soyad: response.ad_soyad || response.name || 'Bilinmeyen',
                tc_no: response.tc_no || '',
                telefon: response.telefon || response.phone || '',
                email: response.email || '',
                plaka: response.plaka || '',
                hasar_tarihi: response.hasar_tarihi || response.damage_date || '',
                başvuru_durumu: response.başvuru_durumu || 'İnceleniyor',
                ödemeler: response.ödemeler || [],
                evraklar: mapDocuments(response.evraklar || response.documents || []),
                bağlı_bayi_id: response.bağlı_bayi_id || '',
                bağlı_bayi_adı: response.bağlı_bayi_adı || 'Belirtilmemiş',
                notlar: response.notlar || response.notes || [],
                son_güncelleme: response.son_güncelleme || new Date().toLocaleDateString('tr-TR'),
                evrak_durumu: response.evrak_durumu || 'Eksik',
                eksik_evraklar: response.eksik_evraklar || [],
                dosya_kilitli: response.dosya_kilitli || false,
                dosya_tipi: response.dosya_tipi || 'deger-kaybi',
                yüklenen_evraklar: response.yüklenen_evraklar || [],
              }

              setSelectedCustomer(transformedCustomer)
            } catch (error) {
              console.error('Failed to refresh customer data:', error)
              // Don't throw - document was deleted successfully, just refresh failed
            }
          }

          // Refresh customers list
          await fetchCustomers()
        } catch (error: any) {
          console.error('Delete error:', error)
          // Error toast will be shown by handleConfirmDialogAction
          throw error
        }
      },
    })
  }

  const handleDeleteCustomer = (customer: Customer) => {
    openConfirmDialog({
      title: "Müşteri Kaydını Sil",
      description: `${customer.ad_soyad} adlı müşteriyi silmek istediğinizden emin misiniz?`,
      confirmLabel: "Evet, Sil",
      action: async () => {
        try {
          await customerApi.delete(customer.id)
          await fetchCustomers()
        } catch (error: any) {
          console.error('Customer delete error:', error)
          setError(error?.message || 'Müşteri silinemedi')
          throw error
        }
      },
    })
  }

  // File closing handler
  const handleCloseFile = async () => {
    if (!selectedCustomer) return

    try {
      // Calculate net profit if all values are provided
      let calculatedNetProfit: number | undefined
      const payment = parseFloat(closeFilePayment.toString() || '0')
      const expenses = parseFloat(closeFileExpenses.toString() || '0')
      const dealerCommission = parseFloat(closeFileDealerCommission.toString() || '0')
      
      if (payment > 0 || expenses > 0 || dealerCommission > 0) {
        calculatedNetProfit = payment - expenses - dealerCommission
        setCloseFileNetProfit(calculatedNetProfit.toString())
      }

      await customerApi.closeFile(selectedCustomer.id, closeFileReason, {
        customerPayment: closeFilePayment || undefined,
        expenses: closeFileExpenses || undefined,
        dealerCommission: closeFileDealerCommission || undefined,
        netProfit: calculatedNetProfit || closeFileNetProfit || undefined,
      })
      
      setShowCloseFileModal(false)
      setCloseFileReason("")
      setCloseFilePayment("")
      setCloseFileExpenses("")
      setCloseFileDealerCommission("")
      setCloseFileNetProfit("")
      setCloseFileExpenseFiles([])
      
      toast({
        title: "Başarılı",
        description: "Dosya başarıyla kapatıldı ve muhasebe kayıtları oluşturuldu",
      })
      
      fetchCustomers() // Refresh data
    } catch (err: any) {
      console.error('Close file error:', err)
      toast({
        title: "Uyarı",
        description: err.message || 'Dosya kapatılamadı',
        variant: "default",
        duration: 5000,
      })
    }
  }

  // New file creation handler
  const handleCreateNewFile = async () => {
    try {
      // Client-side validation before API call
      const tcNoDigits = newFileData.tc_no.replace(/\D/g, '')
      
      // If more than 11 digits, auto-trim to 11
      if (tcNoDigits.length > 11) {
        const trimmed = tcNoDigits.slice(0, 11)
        setNewFileData({ ...newFileData, tc_no: trimmed })
        toast({
          title: 'Uyarı',
          description: 'TC Kimlik No 11 haneli olmalıdır. Fazla karakterler kaldırıldı.',
          variant: 'default',
          duration: 3000,
        })
        // Continue with trimmed value instead of returning
      }
      
      // Final check with trimmed value
      const finalTcNo = tcNoDigits.length > 11 ? tcNoDigits.slice(0, 11) : tcNoDigits
      
      if (finalTcNo.length < 11 && finalTcNo.length > 0) {
        toast({
          title: 'Uyarı',
          description: 'TC Kimlik No 11 haneli olmalıdır. Lütfen eksik haneleri tamamlayın.',
          variant: 'default',
          duration: 4000,
        })
        return
      }
      
      if (finalTcNo.length === 0) {
        toast({
          title: 'Uyarı',
          description: 'TC Kimlik No boş bırakılamaz.',
          variant: 'default',
          duration: 4000,
        })
        return
      }
      
      // Validate and normalize phone number
      const phoneDigits = newFileData.telefon.replace(/\D/g, '')
      if (phoneDigits.length > 12) {
        // Auto-trim to 12 digits
        const trimmedPhone = phoneDigits.slice(0, 12)
        // Try to preserve format
        let formattedPhone = trimmedPhone
        if (newFileData.telefon.includes('+')) {
          formattedPhone = '+' + trimmedPhone
        }
        setNewFileData({ ...newFileData, telefon: formattedPhone })
        toast({
          title: 'Uyarı',
          description: 'Telefon numarası en fazla 12 rakam olabilir. Fazla karakterler kaldırıldı.',
          variant: 'default',
          duration: 3000,
        })
        // Continue with trimmed value instead of returning
      }

      const fileTypeConfig = newFileData.dosya_tipi ? getFileTypeConfig(Number(newFileData.dosya_tipi)) : null
      let initialStatus: ApplicationStatus = "İnceleniyor"

      if (fileTypeConfig) {
        const allRequiredUploaded = fileTypeConfig.requiredDocuments.every((doc) => 
          newFileUploadedDocs.some(uploaded => uploaded === doc.name)
        )
        initialStatus = allRequiredUploaded ? "Başvuru Aşamasında" : "Evrak Aşamasında"
      }

  
      let result;
      try {
        // Prepare customer data with proper field mapping for backend
        const selectedDealerId =
          newFileData.dealer_id && newFileData.dealer_id !== "none"
            ? parseInt(newFileData.dealer_id as string)
            : user?.dealer_id
              ? Number(user.dealer_id)
              : null

        const customerData: any = {
          ad_soyad: newFileData.ad_soyad,
          tc_no: newFileData.tc_no,
          telefon: newFileData.telefon,
          email: newFileData.email || null,
          plaka: newFileData.plaka,
          hasar_tarihi: newFileData.hasar_tarihi,
          dosya_tipi_id: newFileData.dosya_tipi ? parseInt(newFileData.dosya_tipi as string) : null,
          başvuru_durumu: initialStatus,
          evrak_durumu: "Eksik", // Start with Eksik, will update after uploads
          dealer_id: selectedDealerId,
        };

        // Include password if provided
        if (newFileData.password && newFileData.password.trim()) {
          customerData.password = newFileData.password.trim()
        }

        console.log('Creating customer with data:', customerData);

        // First create customer with basic info (no documents yet)
        result = await customerApi.create(customerData);

        console.log('Customer created successfully:', result)

        // If customer creation successful and there are documents to upload
        if (result && result.id && newFileUploadedDocs.length > 0) {
          console.log('Starting to upload documents for customer:', result.id)

          // Upload each document separately
          for (const docType of newFileUploadedDocs) {
            try {
              // Use the actual uploaded file if available
              const fileToUpload = uploadedFiles[docType] || new File(['mock content'], `${docType}.pdf`, { type: 'application/pdf' })

              const formData = new FormData()
              formData.append('file', fileToUpload)
              formData.append('tip', docType)
              formData.append('document_type', docType)
              formData.append('original_name', fileToUpload.name)
              formData.append('customer_id', result.id.toString())
              formData.append('is_result_document', '0')

              const uploadResult = await documentApi.upload(formData)
              console.log(`Document ${docType} uploaded successfully:`, uploadResult)
            } catch (uploadError) {
              console.error(`Failed to upload document ${docType}:`, uploadError)
              // Continue with other documents even if one fails
            }
          }

          // Refresh customer data to get updated documents
          await fetchCustomers()
        }

      } catch (error: any) {
        console.error('[handleCreateNewFile] API Error:', error)
        
        let errorMessage = 'Bilinmeyen hata oluştu'
        let toastTitle = 'Hata'
        
        // Extract error message from various error formats
        if (error?.message) {
          errorMessage = error.message
        } else if (error?.error) {
          errorMessage = error.error
        } else if (typeof error === 'string') {
          errorMessage = error
        } else if (error?.toString && typeof error.toString === 'function') {
          errorMessage = error.toString()
        }
        
        // Remove "Server Components render" prefix if present
        if (errorMessage.includes('Server Components render')) {
          // Try to extract the actual error message from digest or other sources
          if (error?.digest) {
            // Try to get meaningful message from error object
            const errorString = JSON.stringify(error)
            const match = errorString.match(/"message":"([^"]+)"/)
            if (match && match[1]) {
              errorMessage = match[1]
            } else {
              errorMessage = 'Müşteri oluşturulurken bir hata oluştu. Lütfen bilgileri kontrol edin.'
            }
          } else {
            errorMessage = 'Müşteri oluşturulurken bir hata oluştu. Lütfen bilgileri kontrol edin.'
          }
        }
        
        // Normalize error message for checking
        const normalized = errorMessage.toLowerCase()
        const isAlreadyExists =
          normalized.includes('zaten var') ||
          normalized.includes('kayıtlı') ||
          normalized.includes('unique') ||
          normalized.includes('benzersiz') ||
          normalized.includes('mevcut kaydı') ||
          normalized.includes('mevcut') ||
          normalized.includes('duplicate') ||
          normalized.includes('çakışan')
        
        const isTCError = 
          normalized.includes('tc kimlik') ||
          normalized.includes('tc no') ||
          normalized.includes('11 haneli')
        
        const isPhoneError = 
          normalized.includes('telefon numarası') ||
          normalized.includes('telefon:')
        
        // Determine toast title and improve message
        if (isAlreadyExists) {
          toastTitle = 'Uyarı: Müşteri Zaten Kayıtlı'
          // If message already contains details, use it as is
          if (!errorMessage.includes('Mevcut kayıt:') && !errorMessage.includes('Çakışan bilgiler:')) {
            // Try to make message more user-friendly
            if (normalized.includes('tc')) {
              errorMessage = 'Bu TC Kimlik Numarası ile kayıtlı bir müşteri zaten mevcut. Lütfen mevcut kaydı düzenleyin veya farklı bilgiler girin.'
            } else if (normalized.includes('telefon')) {
              errorMessage = 'Bu telefon numarası ile kayıtlı bir müşteri zaten mevcut. Lütfen mevcut kaydı düzenleyin veya farklı bilgiler girin.'
            } else {
              errorMessage = 'Bu bilgiler ile kayıtlı bir müşteri zaten mevcut. Lütfen mevcut kaydı düzenleyin veya farklı bilgiler girin.'
            }
          }
        } else if (isTCError) {
          toastTitle = 'Uyarı: TC Kimlik No'
        } else if (isPhoneError) {
          toastTitle = 'Uyarı: Telefon Numarası'
        } else {
          toastTitle = 'Uyarı'
        }
        
        // Show toast notification with improved message (as warning, not error)
        toast({
          title: toastTitle,
          description: errorMessage,
          variant: 'default',
          duration: 6000, // Show for 6 seconds for better readability
        })
        
        setError("") // Clear error state
        return // Exit early if API fails
      }

      setShowNewFileModal(false)
      setError("") // Clear error after successful creation
      
      // Show success toast
      toast({
        title: 'Başarılı',
        description: 'Müşteri başarıyla oluşturuldu',
      })
      
      setNewFileData({
        ad_soyad: "",
        tc_no: "",
        telefon: "",
        email: "",
        plaka: "",
        hasar_tarihi: "",
        dosya_tipi: "",
        dealer_id: user?.dealer_id ? String(user.dealer_id) : "none",
        password: "",
      })
      setShowNewFilePassword(false)
      setNewFileUploadedDocs([])
      setUploadedFiles({}) // Clear uploaded files
      fetchCustomers() // Refresh data
    } catch (err: any) {
      const errorMessage = err?.message || 'Dosya oluşturulamadı'
      toast({
        title: 'Uyarı',
        description: errorMessage,
        variant: 'default',
        duration: 5000,
      })
      setError("") // Clear error state
    }
  }

  // Edit customer handler
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

  const handleGeneratePassword = async (forNewFile: boolean = false) => {
    const password = generateStrongPassword()
    
    // Update state immediately
    if (forNewFile) {
      setNewFileData((prev) => {
        const updated = { ...prev, password }
        // Force re-render by ensuring state update
        return updated
      })
    } else {
      setEditFormData((prev) => {
        const updated = { ...prev, password }
        // Force re-render by ensuring state update
        return updated
      })
    }

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

  const handleCopyNewFilePassword = async () => {
    if (!newFileData.password) {
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
        await navigator.clipboard.writeText(newFileData.password)
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

  const handleCopyPassword = async () => {
    if (!editFormData.password) {
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
        await navigator.clipboard.writeText(editFormData.password)
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

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditFormData({
      ad_soyad: customer.ad_soyad,
      tc_no: customer.tc_no,
      telefon: customer.telefon,
      email: customer.email,
      plaka: customer.plaka,
      hasar_tarihi: customer.hasar_tarihi,
      başvuru_durumu: customer.başvuru_durumu,
      dealer_id: customer.bağlı_bayi_id || 'none',
      password: '', // Don't show existing password for security
    })
    setShowPassword(false)
    // Ensure dealer is in options without duplicates
    if (customer.bağlı_bayi_id && customer.bağlı_bayi_id !== 'none') {
      const dealerExists = dealerOptions.some((dealer) => dealer.id === customer.bağlı_bayi_id)
      if (!dealerExists) {
        setDealerOptions((prev) => {
          // Check if already exists to avoid duplicates
          const exists = prev.some((d) => d.id === customer.bağlı_bayi_id)
          if (exists) return prev
          return [
            ...prev,
            {
              id: customer.bağlı_bayi_id,
              name: customer.bağlı_bayi_adı || "Belirtilmemiş",
            },
          ]
        })
      }
    }
    setShowEditModal(true)
  }

  const handleEditCustomer = async () => {
    if (!selectedCustomer) return

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

      await customerApi.update(selectedCustomer.id, payload)
      
      toast({
        title: "Başarılı",
        description: "Müşteri bilgileri güncellendi",
      })

      setShowEditModal(false)
      setSelectedCustomer(null)
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
      fetchCustomers() // Refresh data
    } catch (err: any) {
      console.error('Edit customer error:', err)
      toast({
        title: "Uyarı",
        description: err.message || 'Müşteri güncellenemedi',
        variant: "default",
        duration: 5000,
      })
    }
  }

  // Status update handler
  const handleStatusUpdate = async (newStatus: ApplicationStatus) => {
    if (!selectedCustomer) return

    try {
      await customerApi.update(selectedCustomer.id, { başvuru_durumu: newStatus })
      setSelectedCustomer({ ...selectedCustomer, başvuru_durumu: newStatus })
      
      // Refresh customer data to get latest info
      try {
        const updatedCustomer = await customerApi.getById(selectedCustomer.id)
        if (updatedCustomer) {
          // Transform the updated customer data
          const transformedCustomer: Customer = {
            id: String(updatedCustomer.id),
            ad_soyad: updatedCustomer.ad_soyad || 'Bilinmeyen',
            tc_no: updatedCustomer.tc_no || '',
            telefon: updatedCustomer.telefon || '',
            email: updatedCustomer.email || '',
            plaka: updatedCustomer.plaka || '',
            hasar_tarihi: updatedCustomer.hasar_tarihi || new Date().toISOString().split('T')[0],
            başvuru_durumu: (updatedCustomer.başvuru_durumu || 'İnceleniyor') as ApplicationStatus,
            ödemeler: (updatedCustomer.payments || []).map((p: any) => ({
              id: String(p.id),
              tarih: p.tarih || new Date().toLocaleDateString('tr-TR'),
              tutar: p.tutar ? `₺${typeof p.tutar === 'string' ? p.tutar : p.tutar.toLocaleString('tr-TR')}` : '₺0',
              açıklama: p.açıklama || '',
              durum: (p.durum || 'Bekliyor') as "Ödendi" | "Bekliyor",
            })),
            evraklar: (updatedCustomer.documents || []).map((d: any) => ({
              id: String(d.id),
              tip: d.tip || 'Belge',
              dosya_adı: d.dosya_adı || 'dosya',
              yüklenme_tarihi: d.created_at ? new Date(d.created_at).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR'),
              durum: (d.durum || 'Beklemede') as "Onaylandı" | "Beklemede" | "Reddedildi",
            })),
            bağlı_bayi_id: updatedCustomer.dealer_id ? String(updatedCustomer.dealer_id) : '',
            bağlı_bayi_adı: updatedCustomer.dealer?.dealer_name || 'Belirtilmemiş',
            notlar: (updatedCustomer.notes || []).map((n: any) => ({
              id: String(n.id),
              yazar: n.author?.name || 'Sistem',
              tarih: n.created_at ? new Date(n.created_at).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR'),
              içerik: n.content || '',
            })).filter((note: any) => Boolean(note.içerik?.trim())),
            son_güncelleme: updatedCustomer.updated_at ? new Date(updatedCustomer.updated_at).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR'),
            evrak_durumu: (updatedCustomer.evrak_durumu || 'Eksik') as "Tamam" | "Eksik",
            eksik_evraklar: updatedCustomer.eksik_evraklar || [],
            dosya_kilitli: updatedCustomer.dosya_kilitli || false,
            dosya_tipi: (updatedCustomer.file_type?.name || 'deger-kaybi') as FileType,
          }
          setSelectedCustomer(transformedCustomer)
        }
      } catch (refreshError) {
        console.error('Failed to refresh customer data:', refreshError)
      }
      
      toast({
        title: "Başarılı",
        description: "Başvuru durumu güncellendi",
      })
      
      fetchCustomers() // Refresh customer list
    } catch (err: any) {
      console.error('Status update error:', err)
      toast({
        title: "Uyarı",
        description: err.message || 'Durum güncellenemedi',
        variant: "default",
        duration: 5000,
      })
    }
  }

  // Note addition handler
  const handleAddNote = async () => {
    if (!selectedCustomer || !newNote.trim()) return

    try {
      await customerApi.addNote(selectedCustomer.id, newNote)
      setNewNote("")

      // Refresh selected customer data to show new note
      try {
        const response = await customerApi.getById(selectedCustomer.id)

        const transformedCustomer = {
          id: response.id,
          ad_soyad: response.ad_soyad || response.name || 'Bilinmeyen',
          tc_no: response.tc_no || '',
          telefon: response.telefon || response.phone || '',
          email: response.email || '',
          plaka: response.plaka || '',
          hasar_tarihi: response.hasar_tarihi || response.damage_date || '',
          başvuru_durumu: response.başvuru_durumu || 'İnceleniyor',
          ödemeler: response.ödemeler || [],
          evraklar: mapDocuments(response.evraklar || response.documents || []),
          bağlı_bayi_id: response.bağlı_bayi_id || '',
          bağlı_bayi_adı: response.bağlı_bayi_adı || 'Belirtilmemiş',
          notlar: response.notlar || response.notes || [],
          son_güncelleme: response.son_güncelleme || new Date().toLocaleDateString('tr-TR'),
          evrak_durumu: response.evrak_durumu || 'Eksik',
          eksik_evraklar: response.eksik_evraklar || [],
          dosya_kilitli: response.dosya_kilitli || false,
          dosya_tipi: response.dosya_tipi || 'deger-kaybi',
          yüklenen_evraklar: response.yüklenen_evraklar || [],
        }

        setSelectedCustomer(transformedCustomer)
      } catch (error) {
        console.error('Failed to refresh customer data after adding note:', error)
      }

      fetchCustomers() // Refresh the main list
    } catch (err: any) {
      setError(err.message || 'Not eklenemedi')
    }
  }

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

  // CUSTOMER VIEW (musteri role) - Single card dashboard
  if (userRole === "musteri" && filteredCustomers.length > 0) {
    const customer = filteredCustomers[0]

    return (
      <>
        {confirmDialogElement}
        <main className="p-6">
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
                {customer.evraklar && customer.evraklar.length > 0 ? customer.evraklar.map((doc) => (
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
                          onClick={() => handleViewDocument(doc)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Görüntüle
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl flex-1 bg-transparent"
                          onClick={() => handleDownloadDocument(doc)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          İndir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <p className="text-center text-muted-foreground py-8">Henüz evrak yüklenmemiş.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <DocumentUploadModal
            open={showDocUploadModal}
            onOpenChange={handleDocUploadModalClose}
            onUpload={handleUniversalDocumentUpload}
            preselectedType={selectedDocType}
          />
          </div>
        </main>
      </>
    )
  }

  // DEALER & ADMIN/OPERATIONS VIEW - List view
  return (
    <>
      {confirmDialogElement}
      <main className="p-4 md:p-6 pb-20 md:pb-6">
        <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#0B3D91" }}>
              {moduleLabel}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground font-medium mt-1 md:mt-2">
              Toplam {filteredCustomers.length} kayıt gösteriliyor
            </p>
          </div>
          {canCreate && (
            <Button
              className="rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all px-6 w-full md:w-auto"
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
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 md:left-4 top-1/2 h-4 md:h-5 w-4 md:w-5 text-muted-foreground -translate-y-1/2" />
                <Input
                  type="search"
                  placeholder="İsim, plaka veya TC ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 md:pl-12 pr-4 py-2 md:py-3 rounded-2xl border-2 font-medium text-sm md:text-base"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] rounded-2xl border-2 font-medium text-sm md:text-base">
                    <SelectValue placeholder="Durum Filtrele" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} className="max-h-[300px] overflow-y-auto">
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

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Customer List - Desktop Table View */}
        <Card className="rounded-3xl border-2 shadow-lg hidden md:block">
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-[#0B3D91] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
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
                      <tr 
                        key={customer.id} 
                        className="border-b hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={(e) => {
                          // Don't trigger if clicking on action buttons
                          if ((e.target as HTMLElement).closest('button')) return
                          setSelectedCustomer(customer)
                          setShowCustomerModal(true)
                          setActiveTab('bilgiler')
                        }}
                      >
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
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedCustomer(customer)
                                setShowCustomerModal(true)
                                setActiveTab('bilgiler')
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-xl"
                                onClick={() => openEditModal(customer)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-xl text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteCustomer(customer)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Kayıt bulunamadı.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer List - Mobile Card View */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <Card className="rounded-3xl border-2 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-[#0B3D91] border-t-transparent rounded-full animate-spin" />
                </div>
              </CardContent>
            </Card>
          ) : filteredCustomers.length === 0 ? (
            <Card className="rounded-3xl border-2 shadow-lg">
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Kayıt bulunamadı.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredCustomers.map((customer) => (
              <Card 
                key={customer.id} 
                className="rounded-3xl border-2 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={(e) => {
                  // Don't trigger if clicking on action buttons
                  if ((e.target as HTMLElement).closest('button')) return
                  setSelectedCustomer(customer)
                  setShowCustomerModal(true)
                  setActiveTab('bilgiler')
                }}
              >
                <CardContent className="p-5">
                  <div className="space-y-4">
                    {/* Header with Avatar and Name */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback style={{ backgroundColor: "#0B3D91", color: "white" }}>
                            {customer.ad_soyad
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-base">{customer.ad_soyad}</p>
                          <p className="text-sm text-muted-foreground">{customer.telefon}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl -mt-2 -mr-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCustomer(customer)
                          setShowCustomerModal(true)
                          setActiveTab('bilgiler')
                        }}
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{customer.plaka}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{customer.son_güncelleme}</span>
                      </div>
                    </div>

                    {shouldShowDealerInfo && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{customer.bağlı_bayi_adı}</span>
                      </div>
                    )}

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge className={cn("rounded-xl border", getStatusColor(customer.başvuru_durumu))}>
                        {customer.başvuru_durumu}
                      </Badge>
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
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t">
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl flex-1"
                          onClick={() => openEditModal(customer)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Düzenle
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteCustomer(customer)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>


        {/* Close File Modal */}
        <Dialog open={showCloseFileModal} onOpenChange={setShowCloseFileModal}>
          <DialogContent className="rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Dosyayı Kapat</DialogTitle>
              <DialogDescription>
                Bu dosyayı kapatmak üzeresiniz. Kapatılan dosyalar kilitlenir ve değişiklik yapılamaz. Muhasebe bilgilerini girebilirsiniz.
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
                  rows={3}
                />
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="text-lg font-semibold">Muhasebe Bilgileri</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="close-payment" className="text-sm font-semibold mb-2">
                      Müşteriye Yatacak Ödeme (₺)
                    </Label>
                    <Input
                      id="close-payment"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={closeFilePayment}
                      onChange={(e) => setCloseFilePayment(e.target.value)}
                      className="rounded-2xl mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="close-expenses" className="text-sm font-semibold mb-2">
                      Yapılan Harcamalar (₺)
                    </Label>
                    <Input
                      id="close-expenses"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={closeFileExpenses}
                      onChange={(e) => setCloseFileExpenses(e.target.value)}
                      className="rounded-2xl mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="close-dealer-commission" className="text-sm font-semibold mb-2">
                      Bayi Primi (₺)
                    </Label>
                    <Input
                      id="close-dealer-commission"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={closeFileDealerCommission}
                      onChange={(e) => setCloseFileDealerCommission(e.target.value)}
                      className="rounded-2xl mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="close-net-profit" className="text-sm font-semibold mb-2">
                      Net Kâr (₺) {closeFilePayment && (closeFileExpenses || closeFileDealerCommission) && (
                        <span className="text-xs text-muted-foreground">
                          (Otomatik: {(
                            parseFloat(closeFilePayment.toString() || '0') - 
                            parseFloat(closeFileExpenses.toString() || '0') - 
                            parseFloat(closeFileDealerCommission.toString() || '0')
                          ).toFixed(2)})
                        </span>
                      )}
                    </Label>
                    <Input
                      id="close-net-profit"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={
                        closeFilePayment && (closeFileExpenses || closeFileDealerCommission)
                          ? (
                              parseFloat(closeFilePayment.toString() || '0') - 
                              parseFloat(closeFileExpenses.toString() || '0') - 
                              parseFloat(closeFileDealerCommission.toString() || '0')
                            ).toFixed(2)
                          : closeFileNetProfit || '0.00'
                      }
                      onChange={(e) => setCloseFileNetProfit(e.target.value)}
                      className="rounded-2xl mt-2"
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="close-expense-files" className="text-sm font-semibold mb-2">
                    Harcama Belgeleri (Toplu Yükleme)
                  </Label>
                  <Input
                    id="close-expense-files"
                    type="file"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setCloseFileExpenseFiles(Array.from(e.target.files))
                      }
                    }}
                    className="rounded-2xl mt-2"
                  />
                  {closeFileExpenseFiles.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {closeFileExpenseFiles.length} dosya seçildi
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowCloseFileModal(false)
                setCloseFileReason("")
                setCloseFilePayment("")
                setCloseFileExpenses("")
                setCloseFileDealerCommission("")
                setCloseFileNetProfit("")
                setCloseFileExpenseFiles([])
              }} className="rounded-2xl">
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

        {/* New File Modal */}
        <Dialog open={showNewFileModal} onOpenChange={setShowNewFileModal}>
          <DialogContent className="rounded-3xl max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw]">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl font-bold">Yeni Dosya Oluştur</DialogTitle>
              <DialogDescription className="text-sm">
                Yeni müşteri dosyası oluşturun. Dosya tipi seçildikten sonra gerekli evrak alanları görünecektir.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    TC Kimlik No * {newFileData.tc_no && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({newFileData.tc_no.replace(/\D/g, '').length}/11)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="tc_no"
                    placeholder="12345678901"
                    value={newFileData.tc_no}
                    onChange={(e) => {
                      // Only allow digits
                      const digitsOnly = e.target.value.replace(/\D/g, '')
                      
                      // If more than 11 digits, show warning but allow typing
                      if (digitsOnly.length > 11) {
                        // Auto-trim to 11 digits
                        const trimmed = digitsOnly.slice(0, 11)
                        setNewFileData({ ...newFileData, tc_no: trimmed })
                        toast({
                          title: 'Uyarı',
                          description: 'TC Kimlik No 11 haneli olmalıdır. Fazla karakterler kaldırıldı.',
                          variant: 'default',
                          duration: 3000,
                        })
                      } else {
                        setNewFileData({ ...newFileData, tc_no: digitsOnly })
                      }
                    }}
                    maxLength={15}
                    className="rounded-2xl mt-2"
                  />
                  {newFileData.tc_no && newFileData.tc_no.replace(/\D/g, '').length !== 11 && newFileData.tc_no.replace(/\D/g, '').length > 0 && (
                    <p className={`text-xs mt-1 ${newFileData.tc_no.replace(/\D/g, '').length > 11 ? 'text-orange-600' : 'text-red-600'}`}>
                      {newFileData.tc_no.replace(/\D/g, '').length > 11 
                        ? 'TC Kimlik No 11 haneli olmalıdır. Fazla karakterler otomatik kaldırılacak.' 
                        : 'TC Kimlik No 11 haneli olmalıdır'}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="telefon" className="text-sm font-semibold mb-2">
                    Telefon * {newFileData.telefon && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({newFileData.telefon.replace(/\D/g, '').length} rakam)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="telefon"
                    placeholder="+90 532 123 4567 veya 0532 123 4567"
                    value={newFileData.telefon}
                    onChange={(e) => {
                      const value = e.target.value
                      const digitsOnly = value.replace(/\D/g, '')
                      
                      // Telefon numarası maksimum 12 rakam olabilir (90 + 10 haneli numara)
                      // Ama kullanıcı daha fazla girerse uyarı ver ve düzelt
                      if (digitsOnly.length > 12) {
                        // İlk 12 rakamı al
                        const trimmed = value.replace(/\D/g, '').slice(0, 12)
                        // Formatı korumaya çalış (eğer +90 ile başlıyorsa)
                        let formatted = trimmed
                        if (value.includes('+') && trimmed.length >= 2) {
                          formatted = '+' + trimmed
                        } else if (trimmed.length > 0) {
                          formatted = trimmed
                        }
                        
                        setNewFileData({ ...newFileData, telefon: formatted })
                        toast({
                          title: 'Uyarı',
                          description: 'Telefon numarası en fazla 12 rakam olabilir. Fazla karakterler kaldırıldı.',
                          variant: 'default',
                          duration: 3000,
                        })
                      } else {
                        setNewFileData({ ...newFileData, telefon: value })
                      }
                    }}
                    maxLength={20}
                    className="rounded-2xl mt-2"
                  />
                  {newFileData.telefon && newFileData.telefon.replace(/\D/g, '').length > 12 && (
                    <p className="text-xs text-orange-600 mt-1">
                      Telefon numarası en fazla 12 rakam olabilir. Fazla karakterler otomatik kaldırılacak.
                    </p>
                  )}
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
                <div className="md:col-span-2">
                  <Label htmlFor="new_dealer" className="text-sm font-semibold mb-2">
                    Bayi
                  </Label>
                  <Select
                    value={newFileData.dealer_id}
                    onValueChange={(value) => setNewFileData({ ...newFileData, dealer_id: value })}
                  >
                    <SelectTrigger id="new_dealer" className="w-full rounded-2xl border-2 mt-2">
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
                  <p className="text-xs text-muted-foreground mt-2">
                    Seçilmezse müşteri "Belirtilmemiş / Bilinmiyor" bayi ile kaydedilir.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="new_password" className="text-sm font-semibold mb-2">
                    Müşteri Şifresi
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <div className="relative flex-1">
                      <Input
                        id="new_password"
                        type={showNewFilePassword ? "text" : "password"}
                        value={newFileData.password || ""}
                        onChange={(e) => setNewFileData((prev) => ({ ...prev, password: e.target.value }))}
                        placeholder="Şifre belirleyin veya otomatik üretin"
                        className="rounded-2xl pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowNewFilePassword(!showNewFilePassword)}
                      >
                        {showNewFilePassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleGeneratePassword(true)}
                      className="rounded-2xl"
                      title="Rastgele şifre üret ve kopyala"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Üret
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopyNewFilePassword}
                      disabled={!newFileData.password}
                      className="rounded-2xl"
                      title="Şifreyi kopyala"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Şifre belirlenirse müşteri hesabı bu şifre ile oluşturulur. Boş bırakılırsa otomatik şifre üretilir.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="dosya_tipi" className="text-sm font-semibold mb-2">
                  Dosya Tipi *
                </Label>
                <Select
                  value={newFileData.dosya_tipi ? String(newFileData.dosya_tipi) : ""}
                  onValueChange={(value) => {
                    setNewFileData({ ...newFileData, dosya_tipi: Number(value) as any })
                    setNewFileUploadedDocs([])
                  }}
                >
                  <SelectTrigger className="w-full rounded-2xl border-2 mt-2">
                    <SelectValue placeholder="Dosya tipi seçin" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} className="max-h-[300px] overflow-y-auto z-[100]">
                    {FILE_TYPES.map((fileType) => (
                      <SelectItem key={fileType.id} value={String(fileType.id)}>
                        <div className="flex flex-col">
                          <span className="font-semibold">{fileType.name}</span>
                          <span className="text-xs text-muted-foreground">{fileType.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newFileData.dosya_tipi &&
                (() => {
                  const fileTypeConfig = getFileTypeConfig(Number(newFileData.dosya_tipi))
                  if (!fileTypeConfig) return null

                  return (
                    <div className="space-y-4">
                      <div
                        className="p-4 border-2 rounded-2xl bg-slate-50 border-slate-200"
                      >
                        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          Zorunlu Belgeler (Yükleme Alanları):
                        </p>
                        <div className="space-y-3">
                          {fileTypeConfig.requiredDocuments.map((doc, index) => (
                            <div
                              key={`${doc.name}-${index}`}
                              className="flex items-center justify-between p-3 bg-white rounded-xl border"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">{doc.name}</p>
                                  {doc.required && (
                                    <p className="text-xs text-muted-foreground">Zorunlu</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {newFileUploadedDocs.includes(doc.name) ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-300 rounded-xl text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {uploadedFiles[doc.name] ? uploadedFiles[doc.name].name.slice(0, 15) + '...' : 'Yüklendi'}
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
                                    if (newFileUploadedDocs.includes(doc.name)) {
                                      setNewFileUploadedDocs(newFileUploadedDocs.filter((d) => d !== doc.name))
                                    } else {
                                      handleNewFileUploadClick(doc.name)
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
                          {fileTypeConfig.requiredDocuments.every((doc) => newFileUploadedDocs.includes(doc.name))
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
                  setNewFileUploadedDocs([])
                  setUploadedFiles({})
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
                  !newFileData.dosya_tipi
                }
              >
                Dosya Oluştur
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DocumentUploadModal
          open={showDocUploadModal}
          onOpenChange={handleDocUploadModalClose}
          onUpload={handleUniversalDocumentUpload}
          preselectedType={selectedDocType}
        />

        {/* Customer Detail Modal */}
        <Dialog 
          open={showCustomerModal} 
          onOpenChange={(open) => {
            setShowCustomerModal(open)
            if (!open) {
              setSelectedCustomer(null)
              setActiveTab('bilgiler')
            } else if (selectedCustomer) {
              // Refresh customer data when modal opens
              customerApi.getById(selectedCustomer.id).then((updatedCustomer) => {
                if (updatedCustomer) {
                  const transformedCustomer: Customer = {
                    id: String(updatedCustomer.id),
                    ad_soyad: updatedCustomer.ad_soyad || 'Bilinmeyen',
                    tc_no: updatedCustomer.tc_no || '',
                    telefon: updatedCustomer.telefon || '',
                    email: updatedCustomer.email || '',
                    plaka: updatedCustomer.plaka || '',
                    hasar_tarihi: updatedCustomer.hasar_tarihi || new Date().toISOString().split('T')[0],
                    başvuru_durumu: (updatedCustomer.başvuru_durumu || 'İnceleniyor') as ApplicationStatus,
                    ödemeler: (updatedCustomer.payments || []).map((p: any) => ({
                      id: String(p.id),
                      tarih: p.tarih || new Date().toLocaleDateString('tr-TR'),
                      tutar: p.tutar ? `₺${typeof p.tutar === 'string' ? p.tutar : p.tutar.toLocaleString('tr-TR')}` : '₺0',
                      açıklama: p.açıklama || '',
                      durum: (p.durum || 'Bekliyor') as "Ödendi" | "Bekliyor",
                    })),
                    evraklar: (updatedCustomer.documents || []).map((d: any) => ({
                      id: String(d.id),
                      tip: d.tip || 'Belge',
                      dosya_adı: d.dosya_adı || 'dosya',
                      yüklenme_tarihi: d.created_at ? new Date(d.created_at).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR'),
                      durum: (d.durum || 'Beklemede') as "Onaylandı" | "Beklemede" | "Reddedildi",
                    })),
                    bağlı_bayi_id: updatedCustomer.dealer_id ? String(updatedCustomer.dealer_id) : '',
                    bağlı_bayi_adı: updatedCustomer.dealer?.dealer_name || 'Belirtilmemiş',
                    notlar: (updatedCustomer.notes || []).map((n: any) => ({
                      id: String(n.id),
                      yazar: n.author?.name || 'Sistem',
                      tarih: n.created_at ? new Date(n.created_at).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR'),
                      içerik: n.content || '',
                    })).filter((note: any) => Boolean(note.içerik?.trim())),
                    son_güncelleme: updatedCustomer.updated_at ? new Date(updatedCustomer.updated_at).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR'),
                    evrak_durumu: (updatedCustomer.evrak_durumu || 'Eksik') as "Tamam" | "Eksik",
                    eksik_evraklar: updatedCustomer.eksik_evraklar || [],
                    dosya_kilitli: updatedCustomer.dosya_kilitli || false,
                    dosya_tipi: (updatedCustomer.file_type?.name || 'deger-kaybi') as FileType,
                  }
                  setSelectedCustomer(transformedCustomer)
                }
              }).catch((error) => {
                console.error('Failed to refresh customer data:', error)
              })
            }
          }}
        >
          <DialogContent className="rounded-3xl max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {selectedCustomer?.ad_soyad || 'Müşteri Detayları'}
              </DialogTitle>
            </DialogHeader>
            
            {selectedCustomer && (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'bilgiler' | 'evraklar' | 'durum')} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-3 rounded-2xl mb-4">
                  <TabsTrigger value="bilgiler" className="rounded-xl">Bilgiler</TabsTrigger>
                  <TabsTrigger value="evraklar" className="rounded-xl">Evraklar</TabsTrigger>
                  <TabsTrigger value="durum" className="rounded-xl">Durum</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="bilgiler" className="space-y-4 mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">Ad Soyad</Label>
                        <p className="text-base font-medium mt-1">{selectedCustomer.ad_soyad}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">TC Kimlik No</Label>
                        <p className="text-base font-medium mt-1">{selectedCustomer.tc_no}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">Telefon</Label>
                        <p className="text-base font-medium mt-1">{selectedCustomer.telefon}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">Email</Label>
                        <p className="text-base font-medium mt-1">{selectedCustomer.email || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">Plaka</Label>
                        <p className="text-base font-medium mt-1">{selectedCustomer.plaka}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">Hasar Tarihi</Label>
                        <p className="text-base font-medium mt-1">{selectedCustomer.hasar_tarihi}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">Dosya Tipi</Label>
                        <p className="text-base font-medium mt-1">{selectedCustomer.dosya_tipi || '-'}</p>
                      </div>
                      {shouldShowDealerInfo && (
                        <div>
                          <Label className="text-sm font-semibold text-muted-foreground">Bayi</Label>
                          <p className="text-base font-medium mt-1">{selectedCustomer.bağlı_bayi_adı}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="evraklar" className="space-y-4 mt-0">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Yüklenen Evraklar</h3>
                      {selectedCustomer.evraklar && selectedCustomer.evraklar.length > 0 && (
                        <Button
                          onClick={() => handleDownloadAllDocuments(selectedCustomer)}
                          className="rounded-xl"
                          variant="outline"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Tümünü İndir (ZIP)
                        </Button>
                      )}
                    </div>
                    
                    {selectedCustomer.evraklar && selectedCustomer.evraklar.length > 0 ? (
                      <div className="space-y-2">
                        {selectedCustomer.evraklar.map((doc) => (
                          <Card key={doc.id} className="rounded-2xl">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{doc.dosya_adı || doc.tip}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {doc.tip} • {doc.yüklenme_tarihi}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleViewDocument(doc)}
                                    className="rounded-xl"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDownloadDocument(doc)}
                                    className="rounded-xl"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Henüz evrak yüklenmemiş</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="durum" className="space-y-4 mt-0">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold mb-2">Başvuru Durumu</Label>
                        {canUpdateStatus ? (
                          <Select
                            value={selectedCustomer.başvuru_durumu}
                            onValueChange={(value) => handleStatusUpdate(value as ApplicationStatus)}
                            disabled={selectedCustomer.dosya_kilitli}
                          >
                            <SelectTrigger className="w-full rounded-2xl mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="İnceleniyor">İnceleniyor</SelectItem>
                              <SelectItem value="Başvuru Aşamasında">Başvuru Aşamasında</SelectItem>
                              <SelectItem value="Dava Aşamasında">Dava Aşamasında</SelectItem>
                              <SelectItem value="Onaylandı">Onaylandı</SelectItem>
                              <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                              <SelectItem value="Beklemede">Beklemede</SelectItem>
                              <SelectItem value="Evrak Aşamasında">Evrak Aşamasında</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={cn("rounded-xl border mt-2", getStatusColor(selectedCustomer.başvuru_durumu))}>
                            {selectedCustomer.başvuru_durumu}
                          </Badge>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-semibold mb-2">Evrak Durumu</Label>
                        <Badge
                          className={cn(
                            "rounded-xl border mt-2",
                            selectedCustomer.evrak_durumu === "Tamam"
                              ? "bg-green-100 text-green-800 border-green-300"
                              : "bg-orange-100 text-orange-800 border-orange-300",
                          )}
                        >
                          {selectedCustomer.evrak_durumu}
                        </Badge>
                      </div>

                      {selectedCustomer.ödemeler && selectedCustomer.ödemeler.length > 0 && (
                        <div>
                          <Label className="text-sm font-semibold mb-2">Ödemeler</Label>
                          <div className="space-y-2 mt-2">
                            {selectedCustomer.ödemeler.map((payment) => (
                              <Card key={payment.id} className="rounded-2xl">
                                <CardContent className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium">{payment.açıklama || 'Ödeme'}</p>
                                      <p className="text-sm text-muted-foreground">{payment.tarih}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-lg" style={{ color: "#F57C00" }}>
                                        {payment.tutar}
                                      </p>
                                      <Badge
                                        className={cn(
                                          "rounded-xl mt-1",
                                          payment.durum === "Ödendi"
                                            ? "bg-green-100 text-green-800 border-green-300"
                                            : "bg-yellow-100 text-yellow-800 border-yellow-300",
                                        )}
                                      >
                                        {payment.durum}
                                      </Badge>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {canDelete && !selectedCustomer.dosya_kilitli && (
                        <div className="pt-4 border-t">
                          <Button
                            onClick={() => {
                              setShowCloseFileModal(true)
                              setShowCustomerModal(false)
                            }}
                            variant="destructive"
                            className="rounded-2xl w-full"
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Dosyayı Kapat
                          </Button>
                        </div>
                      )}

                      {selectedCustomer.dosya_kilitli && (
                        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl">
                          <div className="flex items-start gap-3">
                            <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="font-semibold text-blue-900">Dosya Kilitli</p>
                              <p className="text-sm text-blue-800 mt-1">
                                Bu dosya kapatıldığı için değişiklik yapılamaz.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Customer Modal */}
        <Dialog open={showEditModal} onOpenChange={(open) => {
          setShowEditModal(open)
          if (!open) {
            // Reset form and dealer options when modal closes
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
            // Reload dealer options to avoid duplicates
            const fetchDealers = async () => {
              try {
                const dealers = await dealerApi.list({ status: "active" })
                setDealerOptions([
                  { id: "none", name: "Belirtilmemiş / Bilinmiyor" },
                  ...dealers.map((d: any) => ({
                    id: String(d.id),
                    name: d.dealer_name || d.name || 'Bilinmeyen Bayi',
                  })),
                ])
              } catch (error) {
                console.error('Failed to fetch dealers:', error)
              }
            }
            fetchDealers()
          }
        }}>
          <DialogContent className="rounded-3xl max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl font-bold">Müşteri Düzenle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_ad_soyad" className="text-sm font-semibold mb-2">
                    Ad Soyad *
                  </Label>
                  <Input
                    id="edit_ad_soyad"
                    value={editFormData.ad_soyad}
                    onChange={(e) => setEditFormData({ ...editFormData, ad_soyad: e.target.value })}
                    className="rounded-2xl mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_tc_no" className="text-sm font-semibold mb-2">
                    TC Kimlik No * {editFormData.tc_no && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({editFormData.tc_no.replace(/\D/g, '').length}/11)
                      </span>
                    )}
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
                    Telefon * {editFormData.telefon && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({editFormData.telefon.replace(/\D/g, '').length} rakam)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="edit_telefon"
                    placeholder="+90 532 123 4567 veya 0532 123 4567"
                    value={editFormData.telefon}
                    onChange={(e) => {
                      const value = e.target.value
                      const digitsOnly = value.replace(/\D/g, '')
                      
                      // Telefon numarası maksimum 12 rakam olabilir (90 + 10 haneli numara)
                      // Ama kullanıcı daha fazla girerse uyarı ver ve düzelt
                      if (digitsOnly.length > 12) {
                        // İlk 12 rakamı al
                        const trimmed = value.replace(/\D/g, '').slice(0, 12)
                        // Formatı korumaya çalış (eğer +90 ile başlıyorsa)
                        let formatted = trimmed
                        if (value.includes('+') && trimmed.length >= 2) {
                          formatted = '+' + trimmed
                        } else if (trimmed.length > 0) {
                          formatted = trimmed
                        }
                        
                        setEditFormData({ ...editFormData, telefon: formatted })
                        toast({
                          title: 'Uyarı',
                          description: 'Telefon numarası en fazla 12 rakam olabilir. Fazla karakterler kaldırıldı.',
                          variant: 'default',
                          duration: 3000,
                        })
                      } else {
                        setEditFormData({ ...editFormData, telefon: value })
                      }
                    }}
                    maxLength={20}
                    className="rounded-2xl mt-2"
                  />
                  {editFormData.telefon && editFormData.telefon.replace(/\D/g, '').length > 12 && (
                    <p className="text-xs text-orange-600 mt-1">
                      Telefon numarası en fazla 12 rakam olabilir. Fazla karakterler otomatik kaldırılacak.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit_email" className="text-sm font-semibold mb-2">
                    Email
                  </Label>
                  <Input
                    id="edit_email"
                    type="email"
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
                <div className="md:col-span-2">
                  <Label htmlFor="edit_dealer" className="text-sm font-semibold mb-2">
                    Bayi
                  </Label>
                  <Select
                    value={editFormData.dealer_id}
                    onValueChange={(value) => setEditFormData({ ...editFormData, dealer_id: value })}
                    disabled={selectedCustomer?.dosya_kilitli}
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
                    Müşteri Şifresi
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <div className="relative flex-1">
                      <Input
                        id="edit_password"
                        type={showPassword ? "text" : "password"}
                        value={editFormData.password || ""}
                        onChange={(e) => setEditFormData((prev) => ({ ...prev, password: e.target.value }))}
                        placeholder="Şifre belirleyin veya otomatik üretin"
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
                    Şifre belirlenirse müşteri hesabı güncellenir. Boş bırakılırsa şifre değişmez.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="edit_basvuru_durumu" className="text-sm font-semibold mb-2">
                  Başvuru Durumu
                </Label>
                <Select
                  value={editFormData.başvuru_durumu}
                  onValueChange={(value) => setEditFormData({ ...editFormData, başvuru_durumu: value as ApplicationStatus })}
                  disabled={selectedCustomer?.dosya_kilitli}
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
                    <SelectItem value="Evrak Aşamasında">Evrak Aşamasında</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedCustomer?.dosya_kilitli && (
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-start gap-3">
                  <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">Dosya Kilitli</p>
                    <p className="text-sm text-blue-800 mt-1">
                      Bu dosya kilitlendiği için sadece başvuru durumu güncellenebilir.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="rounded-2xl"
              >
                İptal
              </Button>
              <Button
                onClick={handleEditCustomer}
                className="rounded-2xl"
                style={{ backgroundColor: "#0B3D91", color: "white" }}
              >
                Güncelle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </main>
    </>
  )
}