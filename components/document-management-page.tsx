"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Upload, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { type UserRole, hasPermission, getModuleLabel } from "@/lib/role-config"
import { DocumentCard, type DocumentData, type DocumentType } from "./document-card"
import { DocumentUploadModal } from "./document-upload-modal"
import { useDocuments } from "@/hooks/use-documents"
import { documentApi, customerApi } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"

interface DocumentManagementPageProps {
  userRole?: UserRole
}

export function DocumentManagementPage({ userRole = "superadmin" }: DocumentManagementPageProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | undefined>()
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [customerOptions, setCustomerOptions] = useState<Array<{ id: string; name: string }>>([])

  const canCreate = hasPermission(userRole, "document-management", "canCreate")
  const canDelete = hasPermission(userRole, "document-management", "canDelete")
  const moduleLabel = getModuleLabel(userRole, "document-management")
  const shouldShowDealerInfo = userRole === "bayi" || userRole === "superadmin"

  // Fetch customers for selection
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customers = await customerApi.getAll({ perPage: 1000 })
        const customersList = Array.isArray(customers) ? customers : (customers?.data || [])
        const mapped = customersList.map((customer: any) => ({
          id: customer.id?.toString() || '',
          name: `${customer.ad_soyad || customer.name || 'Bilinmeyen'} - ${customer.plaka || ''} (${customer.tc_no || ''})`
        })).filter((c: any) => c.id)
        setCustomerOptions(mapped)
      } catch (error) {
        console.error('Error fetching customers:', error)
      }
    }
    fetchCustomers()
  }, [])

  // Use API hook
  const { documents, isLoading, uploadDocument, deleteDocument, refetch } = useDocuments({
    search: searchTerm || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  })

  // Transform API data to match component interface
  const transformDocument = (apiDoc: any): DocumentData => {
    const rawDate = apiDoc.yüklenme_tarihi || apiDoc.created_at
    let formattedDate: string | undefined

    if (rawDate) {
      try {
        const date = new Date(rawDate)
        if (!isNaN(date.getTime())) {
          formattedDate = date.toLocaleString('tr-TR')
        } else if (typeof rawDate === 'string') {
          formattedDate = rawDate
        }
      } catch (error) {
        if (typeof rawDate === 'string') {
          formattedDate = rawDate
        }
      }
    }

    return {
      id: apiDoc.id.toString(),
      tip: apiDoc.tip || apiDoc.document_type,
      dosya_adı: apiDoc.dosya_adı || apiDoc.file_name,
      yüklenme_tarihi: formattedDate,
      durum: apiDoc.durum || apiDoc.status,
      müşteri_adı: apiDoc.customer?.ad_soyad || apiDoc.müşteri_adı,
      bayi_adı: apiDoc.customer?.dealer?.dealer_name || apiDoc.bayi_adı,
      yükleyen: apiDoc.uploadedBy?.name || apiDoc.yükleyen,
    }
  }

  const filteredDocuments = documents.map(transformDocument)

  // Count documents by status
  const statusCounts = {
    total: filteredDocuments.length,
    approved: filteredDocuments.filter((d) => d.durum === "Onaylandı").length,
    pending: filteredDocuments.filter((d) => d.durum === "Beklemede").length,
    missing: filteredDocuments.filter((d) => d.durum === "Eksik").length,
  }

  const handleView = async (doc: DocumentData) => {
    try {
      const result = await documentApi.download(parseInt(doc.id))
      if (result?.url) {
        window.open(result.url, '_blank')
      } else {
        throw new Error('Dosya URL bulunamadı')
      }
    } catch (error: any) {
      console.error('View document error:', error)
      toast({
        title: "Hata",
        description: error.message || "Dosya görüntülenemedi",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async (doc: DocumentData) => {
    try {
      const result = await documentApi.download(parseInt(doc.id))
      if (result?.url) {
        const link = document.createElement('a')
        link.href = result.url
        link.download = result.filename || doc.dosya_adı || 'document'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast({
          title: "İndirildi",
          description: "Dosya başarıyla indirildi",
        })
      } else {
        throw new Error('Dosya URL bulunamadı')
      }
    } catch (error: any) {
      console.error('Download document error:', error)
      toast({
        title: "Hata",
        description: error.message || "Dosya indirilemedi",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (doc: DocumentData) => {
    if (!confirm("Bu evrakı silmek istediğinizden emin misiniz?")) return

    try {
      await deleteDocument(parseInt(doc.id))
    } catch (error) {
      console.error("Error deleting document:", error)
    }
  }

  const handleUpload = async (file: File, type: DocumentType) => {
    try {
      if (!selectedCustomerId) {
        toast({
          title: "Hata",
          description: "Lütfen bir müşteri seçin",
          variant: "destructive",
        })
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('tip', type)
      formData.append('document_type', type)
      formData.append('original_name', file.name)
      formData.append('customer_id', selectedCustomerId)
      formData.append('is_result_document', '0')

      await documentApi.upload(formData)
      
      toast({
        title: "Başarılı",
        description: "Evrak başarıyla yüklendi",
      })
      
      setShowUploadModal(false)
      setSelectedCustomerId("")
      
      // Refresh documents list
      if (refetch) {
        refetch()
      }
    } catch (error: any) {
      console.error("Error uploading document:", error)
      toast({
        title: "Hata",
        description: error.message || "Evrak yüklenemedi",
        variant: "destructive",
      })
    }
  }

  const handleUploadClick = () => {
    setSelectedDocType(undefined)
    setShowUploadModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#0B3D91" }}>
            {moduleLabel}
          </h1>
          <p className="text-muted-foreground font-medium mt-2">Toplam {filteredDocuments.length} evrak gösteriliyor</p>
        </div>
        {canCreate && (
          <Button
            className="rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all px-6"
            style={{ backgroundColor: "#F57C00", color: "white" }}
            onClick={() => handleUploadClick()}
          >
            <Upload className="mr-2 h-5 w-5" />
            Yeni Evrak Yükle
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Evrak</p>
                <p className="text-3xl font-bold mt-1">{statusCounts.total}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Onaylandı</p>
                <p className="text-3xl font-bold mt-1 text-green-600">{statusCounts.approved}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Beklemede</p>
                <p className="text-3xl font-bold mt-1 text-yellow-600">{statusCounts.pending}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Eksik</p>
                <p className="text-3xl font-bold mt-1 text-orange-600">{statusCounts.missing}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="rounded-3xl border-2 shadow-lg bg-gradient-to-r from-white to-slate-50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 text-muted-foreground -translate-y-1/2" />
              <Input
                type="search"
                placeholder="Müşteri adı, dosya adı veya evrak tipi ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 rounded-2xl border-2 font-medium"
              />
            </div>

            <div className="flex gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px] rounded-2xl border-2 font-medium">
                  <SelectValue placeholder="Evrak Tipi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Tipler</SelectItem>
                  <SelectItem value="Kimlik">Kimlik</SelectItem>
                  <SelectItem value="Ruhsat">Ruhsat</SelectItem>
                  <SelectItem value="Sigorta Poliçesi">Sigorta Poliçesi</SelectItem>
                  <SelectItem value="Hasar Raporu">Hasar Raporu</SelectItem>
                  <SelectItem value="Diğer">Diğer</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] rounded-2xl border-2 font-medium">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="Onaylandı">Onaylandı</SelectItem>
                  <SelectItem value="Beklemede">Beklemede</SelectItem>
                  <SelectItem value="Eksik">Eksik</SelectItem>
                  <SelectItem value="Reddedildi">Reddedildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-[#0B3D91] border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600">Yükleniyor...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              userRole={userRole}
              canUpload={canCreate}
              canDelete={canDelete}
              showDealerInfo={shouldShowDealerInfo}
              onView={handleView}
              onDownload={handleDownload}
              onDelete={handleDelete}
              onUpload={handleUploadClick}
            />
          ))}

          {filteredDocuments.length === 0 && (
            <Card className="rounded-3xl border-2">
              <CardContent className="p-12 text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                <p className="text-lg font-semibold text-muted-foreground">Evrak bulunamadı</p>
                <p className="text-sm text-muted-foreground mt-2">Arama kriterlerinizi değiştirmeyi deneyin</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <DocumentUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onUpload={handleUpload}
        preselectedType={selectedDocType}
        customerId={selectedCustomerId}
        customerOptions={customerOptions}
        onCustomerChange={setSelectedCustomerId}
        requireCustomer={true}
      />
    </div>
  )
}