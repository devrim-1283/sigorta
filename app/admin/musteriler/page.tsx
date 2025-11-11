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
  Edit,
  Car,
  Building,
  Lock,
  CheckCircle2,
  Download,
  Trash2,
  Loader2,
} from "lucide-react"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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
import { DocumentCard, type DocumentType } from "@/components/document-card"
import { DocumentUploadModal } from "@/components/document-upload-modal"
import { customerApi, documentsApi, documentApi, dealerApi } from "@/lib/api-client"

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
  const userRole: UserRole = (user?.role?.name as UserRole) || "superadmin"

  // State management
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Modal states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDocUploadModal, setShowDocUploadModal] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | undefined>()
  const [showCloseFileModal, setShowCloseFileModal] = useState(false)
  const [closeFileReason, setCloseFileReason] = useState("")
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
  })

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
  }>({
    ad_soyad: "",
    tc_no: "",
    telefon: "",
    email: "",
    plaka: "",
    hasar_tarihi: "",
    dosya_tipi: "",
    dealer_id: "none",
  })
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
    } catch (error) {
      console.error('Confirm dialog action error:', error)
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

        setDealerOptions((prev) => {
          const baseOption = prev[0]
          const unique = mapped.filter(
            (dealer, index, arr) => arr.findIndex((d) => d.id === dealer.id) === index,
          )
          return [baseOption, ...unique]
        })
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

      const result = await documentsApi.upload(formData)
      console.log('Upload successful:', result)

      setShowDocUploadModal(false)

      // Refresh the selected customer data to show new documents
      if (selectedCustomer) {
        try {
          const response = await customerApi.getById(selectedCustomer.id)
          console.log('Raw updated customer data:', response)

          // Transform the customer data
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
            evraklar: response.evraklar || response.documents || [],
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
          console.log('Transformed updated customer data:', transformedCustomer)
        } catch (error) {
          console.error('Failed to refresh customer data:', error)
        }
      }

      fetchCustomers() // Refresh the main list
    } catch (error: any) {
      console.error('Document upload error:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      })
      // You could add toast notification here if needed
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

  const handleDeleteDocument = (doc: any) => {
    openConfirmDialog({
      title: "Evrakı Sil",
      description: "Bu evrağı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
      confirmLabel: "Evet, Sil",
      action: async () => {
        try {
          await documentApi.delete(doc.id)

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
                evraklar: response.evraklar || response.documents || [],
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
            }
          }

          await fetchCustomers()
        } catch (error) {
          console.error('Delete error:', error)
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
      await customerApi.closeFile(selectedCustomer.id, closeFileReason)
      setShowCloseFileModal(false)
      setCloseFileReason("")
      fetchCustomers() // Refresh data
    } catch (err: any) {
      setError(err.message || 'Dosya kapatılamadı')
    }
  }

  // New file creation handler
  const handleCreateNewFile = async () => {
    try {
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

        const customerData = {
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

              const uploadResult = await documentsApi.upload(formData)
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
        console.error('[handleCreateNewFile] Error type:', typeof error)
        console.error('[handleCreateNewFile] Error keys:', Object.keys(error))
        console.error('[handleCreateNewFile] Error message:', error?.message)
        console.error('[handleCreateNewFile] Error stack:', error?.stack)
        
        let errorMessage = 'Bilinmeyen hata oluştu'
        
        if (error?.message) {
          errorMessage = error.message
        } else if (error?.error) {
          errorMessage = error.error
        } else if (typeof error === 'string') {
          errorMessage = error
        } else if (error?.toString && typeof error.toString === 'function') {
          errorMessage = error.toString()
        }
        
        setError(`Müşteri oluşturulamadı: ${errorMessage}`)
        return // Exit early if API fails
      }

      setShowNewFileModal(false)
      setError("") // Clear error after successful creation
      setNewFileData({
        ad_soyad: "",
        tc_no: "",
        telefon: "",
        email: "",
        plaka: "",
        hasar_tarihi: "",
        dosya_tipi: "",
        dealer_id: user?.dealer_id ? String(user.dealer_id) : "none",
      })
      setNewFileUploadedDocs([])
      setUploadedFiles({}) // Clear uploaded files
      fetchCustomers() // Refresh data
    } catch (err: any) {
      setError(err.message || 'Dosya oluşturulamadı')
    }
  }

  // Edit customer handler
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
    })
  if (customer.bağlı_bayi_id && !dealerOptions.some((dealer) => dealer.id === customer.bağlı_bayi_id)) {
    setDealerOptions((prev) => [
      ...prev,
      {
        id: customer.bağlı_bayi_id,
        name: customer.bağlı_bayi_adı || "Belirtilmemiş",
      },
    ])
  }
    setShowEditModal(true)
  }

  const handleEditCustomer = async () => {
    if (!selectedCustomer) return

    try {
      const payload = {
        ...editFormData,
        dealer_id:
          editFormData.dealer_id && editFormData.dealer_id !== 'none'
            ? parseInt(editFormData.dealer_id)
            : null,
      }

      await customerApi.update(selectedCustomer.id, payload)
      setShowEditModal(false)
      setSelectedCustomer(null)
      fetchCustomers() // Refresh data
    } catch (err: any) {
      setError(err.message || 'Müşteri güncellenemedi')
    }
  }

  // Status update handler
  const handleStatusUpdate = async (newStatus: ApplicationStatus) => {
    if (!selectedCustomer) return

    try {
      await customerApi.update(selectedCustomer.id, { başvuru_durumu: newStatus })
      setSelectedCustomer({ ...selectedCustomer, başvuru_durumu: newStatus })
      fetchCustomers() // Refresh data
    } catch (err: any) {
      setError(err.message || 'Durum güncellenemedi')
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
          evraklar: response.evraklar || response.documents || [],
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
                              onClick={() => {
                                setSelectedCustomer(customer)
                                setShowDetailsModal(true)
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
              <Card key={customer.id} className="rounded-3xl border-2 shadow-md hover:shadow-lg transition-shadow">
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
                        onClick={() => {
                          setSelectedCustomer(customer)
                          setShowDetailsModal(true)
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

        {/* Customer Detail Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl w-[95vw]">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-2xl font-bold flex flex-col md:flex-row md:items-center gap-2" style={{ color: "#0B3D91" }}>
                <span className="break-words">{selectedCustomer?.ad_soyad}</span>
                <span className="hidden md:inline">-</span>
                <span className="text-sm md:text-2xl">Detaylı Bilgiler</span>
                {selectedCustomer?.dosya_kilitli && (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-300 rounded-xl flex items-center gap-1 w-fit">
                    <Lock className="h-3 w-3" />
                    Dosya Kapalı
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            {selectedCustomer && (
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
                <TabsContent value="info" className="space-y-4 mt-6">
                  <Card className="rounded-2xl">
                    <CardContent className="p-4 md:p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        onView={handleViewDocument}
                        onDownload={handleDownloadDocument}
                        onDelete={handleDeleteDocument}
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
                            onValueChange={(value) => {
                              handleStatusUpdate(value as ApplicationStatus)
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
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="rounded-xl"
                                    onClick={() => handleViewDocument(doc)}
                                  >
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
                            onValueChange={(value) => {
                              handleStatusUpdate(value as ApplicationStatus)
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
                          disabled={selectedCustomer.dosya_kilitli}
                          onClick={handleAddNote}
                        >
                          Not Ekle
                        </Button>
                      </div>

                      <div>
                        <p className="font-semibold mb-3">İç Notlar</p>
                        <div className="space-y-3">
                          {(selectedCustomer.notlar || selectedCustomer.notes || []).length > 0 ? (
                            (selectedCustomer.notlar || selectedCustomer.notes || []).map((note) => {
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
                    <SelectContent>
                      {dealerOptions.map((dealer) => (
                        <SelectItem key={dealer.id} value={dealer.id}>
                          {dealer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Seçilmezse müşteri “Belirtilmemiş / Bilinmiyor” bayi ile kaydedilir.
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
                  <SelectContent>
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

        {/* Edit Customer Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
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
                    TC Kimlik No *
                  </Label>
                  <Input
                    id="edit_tc_no"
                    value={editFormData.tc_no}
                    onChange={(e) => setEditFormData({ ...editFormData, tc_no: e.target.value })}
                    className="rounded-2xl mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_telefon" className="text-sm font-semibold mb-2">
                    Telefon *
                  </Label>
                  <Input
                    id="edit_telefon"
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
                    <SelectContent>
                      {dealerOptions.map((dealer) => (
                        <SelectItem key={dealer.id} value={dealer.id}>
                          {dealer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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