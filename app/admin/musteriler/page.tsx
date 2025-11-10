"use client"

import { useState, useEffect } from "react"
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
import { DocumentCard, type DocumentType } from "@/components/document-card"
import { DocumentUploadModal } from "@/components/document-upload-modal"
import { customerApi, documentsApi, documentApi } from "@/lib/api-client"

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
  })

  // Form states
  const [newNote, setNewNote] = useState("")
  const [newFileData, setNewFileData] = useState({
    ad_soyad: "",
    tc_no: "",
    telefon: "",
    email: "",
    plaka: "",
    hasar_tarihi: "",
    dosya_tipi: "" as FileType | "",
  })
  const [newFileUploadedDocs, setNewFileUploadedDocs] = useState<FileDocType[]>([])
  const [currentUploadingDocType, setCurrentUploadingDocType] = useState<FileDocType | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File }>({})

  // Permissions
  const canCreate = hasPermission(userRole, "customer-management", "canCreate")
  const canEdit = hasPermission(userRole, "customer-management", "canEdit")
  const canDelete = hasPermission(userRole, "customer-management", "canDelete")
  const moduleLabel = getModuleLabel(userRole, "customer-management")

  // Simulate current dealer ID for bayi role
  const currentDealerId = userRole === "bayi" ? "DEALER-001" : null
  const currentCustomerId = userRole === "musteri" ? "CUST-001" : null

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const data = await customerApi.getAll({ search: searchTerm, status: statusFilter })

      // Transform API data to Customer interface
      const transformedCustomers: Customer[] = (data.data || data || []).map((item: any) => ({
        id: item.id,
        ad_soyad: item.ad_soyad || item.name || 'Bilinmeyen',
        tc_no: item.tc_no || '',
        telefon: item.telefon || item.phone || '',
        email: item.email || '',
        plaka: item.plaka || '',
        hasar_tarihi: item.hasar_tarihi || item.damage_date || '',
        başvuru_durumu: item.başvuru_durumu || 'İnceleniyor',
        ödemeler: item.ödemeler || [],
        evraklar: item.evraklar || item.documents || [],  // Handle both Turkish and English field names
        bağlı_bayi_id: item.bağlı_bayi_id || '',
        bağlı_bayi_adı: item.bağlı_bayi_adı || 'Belirtilmemiş',
        notlar: item.notlar || item.notes || [],
        son_güncelleme: item.son_güncelleme || new Date().toLocaleDateString('tr-TR'),
        evrak_durumu: item.evrak_durumu || 'Eksik',
        eksik_evraklar: item.eksik_evraklar || [],
        dosya_kilitli: item.dosya_kilitli || false,
        dosya_tipi: item.dosya_tipi || 'deger-kaybi',
        yüklenen_evraklar: item.yüklenen_evraklar || [],
      }))

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
      formData.append('tip', type)  // Backend expects 'tip' not 'type'
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
    console.log('Attempting to view document:', doc)

    try {
      // Get auth token
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.error('No auth token found')
        return
      }

      console.log('Fetching document from:', `${API_BASE_URL}/documents/${doc.id}/view`)

      // Fetch the document with authentication
      const response = await fetch(`${API_BASE_URL}/documents/${doc.id}/view`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status}`)
      }

      // Create blob from response
      const blob = await response.blob()
      console.log('Blob created, size:', blob.size, 'type:', blob.type)

      const blobUrl = window.URL.createObjectURL(blob)

      // Open in new tab
      console.log('Opening blob URL in new tab:', blobUrl)
      window.open(blobUrl, '_blank')

      // Clean up blob URL after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl)
        console.log('Blob URL revoked')
      }, 1000)
    } catch (error) {
      console.error('View document error:', error)

      // Fallback: try opening direct URL
      const fallbackUrl = `${API_BASE_URL}/documents/${doc.id}/view`
      console.log('Fallback: opening direct URL:', fallbackUrl)
      window.open(fallbackUrl, '_blank')
    }
  }

  const handleDownloadDocument = async (doc: any) => {
    try {
      await documentApi.download(doc.id)
    } catch (error: any) {
      console.error('Download error:', error)
    }
  }

  const handleDeleteDocument = async (doc: any) => {
    if (!confirm('Bu evrağı silmek istediğinizden emin misiniz?')) return

    try {
      await documentApi.delete(doc.id)

      // Refresh customer data to show updated documents
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

      fetchCustomers() // Refresh the main list
    } catch (error: any) {
      console.error('Delete error:', error)
    }
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
      const fileTypeConfig = newFileData.dosya_tipi ? getFileTypeConfig(newFileData.dosya_tipi as FileType) : null
      let initialStatus: ApplicationStatus = "İnceleniyor"

      if (fileTypeConfig) {
        const allRequiredUploaded = fileTypeConfig.requiredDocuments.every((doc) => newFileUploadedDocs.includes(doc.id))
        initialStatus = allRequiredUploaded ? "Başvuru Aşamasında" : "Evrak Aşamasında"
      }

  
      let result;
      try {
        // Prepare customer data with proper field mapping for backend
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

      } catch (error) {
        console.error('API Error:', error)
        setError('Müşteri oluşturulamadı. Lütfen API bağlantısını kontrol edin ve tekrar deneyin.')
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
    })
    setShowEditModal(true)
  }

  const handleEditCustomer = async () => {
    if (!selectedCustomer) return

    try {
      await customerApi.update(selectedCustomer.id, editFormData)
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

  // CUSTOMER VIEW (musteri role) - Single card dashboard
  if (userRole === "musteri" && filteredCustomers.length > 0) {
    const customer = filteredCustomers[0]

    return (
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
    )
  }

  // DEALER & ADMIN/OPERATIONS VIEW - List view
  return (
    <main className="p-6">
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

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Customer List Table */}
        <Card className="rounded-3xl border-2 shadow-lg">
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
                                onClick={() => {
                                  if (confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
                                    customerApi.delete(customer.id)
                                      .then(() => fetchCustomers())
                                      .catch((err) => setError(err.message))
                                  }
                                }}
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
                            (selectedCustomer.notlar || selectedCustomer.notes || []).map((note) => (
                              <div key={note.id} className="p-4 bg-slate-50 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="font-semibold text-sm">{note.yazar || note.author || note.user?.name || 'Sistem'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {note.tarih || note.created_at || note.created_at || new Date().toLocaleDateString('tr-TR')}
                                  </p>
                                </div>
                                <p className="text-sm">{note.içerik || note.content || note.note || note.message}</p>
                              </div>
                            ))
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
                  value={newFileData.dosya_tipi}
                  onValueChange={(value) => {
                    setNewFileData({ ...newFileData, dosya_tipi: value as FileType })
                    setNewFileUploadedDocs([])
                  }}
                >
                  <SelectTrigger className="w-full rounded-2xl border-2 mt-2">
                    <SelectValue placeholder="Dosya tipi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_TYPES.map((fileType) => (
                      <SelectItem key={fileType.id} value={fileType.id}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", fileType.color)} />
                          {fileType.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newFileData.dosya_tipi &&
                (() => {
                  const fileTypeConfig = getFileTypeConfig(newFileData.dosya_tipi as FileType)
                  if (!fileTypeConfig) return null

                  return (
                    <div className="space-y-4">
                      <div
                        className={cn(
                          "p-4 border-2 rounded-2xl",
                          fileTypeConfig.color.replace("bg-", "border-").replace("-500", "-200"),
                          fileTypeConfig.color.replace("-500", "-50"),
                        )}
                      >
                        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", fileTypeConfig.color)} />
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
                                    {uploadedFiles[doc.id] ? uploadedFiles[doc.id].name.slice(0, 15) + '...' : 'Yüklendi'}
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
                                    if (newFileUploadedDocs.includes(doc.id)) {
                                      setNewFileUploadedDocs(newFileUploadedDocs.filter((d) => d !== doc.id))
                                    } else {
                                      handleNewFileUploadClick(doc.id)
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
          <DialogContent className="rounded-3xl max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Müşteri Düzenle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
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
  )
}