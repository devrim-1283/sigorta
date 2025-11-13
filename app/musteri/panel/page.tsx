"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  Eye,
  Upload,
  FileText,
  DollarSign,
  Download,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  CheckCircle,
  LogOut,
  User,
} from "lucide-react"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { DocumentCard, type DocumentType, type DocumentStatus } from "@/components/document-card"
import { DocumentUploadModal } from "@/components/document-upload-modal"
import { customerApi, documentApi, resultDocumentsApi } from "@/lib/api-client"

// Application status types
type ApplicationStatus =
  | "EVRAK AŞAMASINDA"
  | "BAŞVURU AŞAMASINDA"
  | "BAŞVURU YAPILDI"
  | "İCRA AŞAMASINDA"
  | "TAHKİM BAŞVURUSU YAPILDI"
  | "TAHKİM AŞAMASINDA"
  | "DOSYA KAPATILDI"

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
  sigortadan_yatan_tutar?: number
  musteri_hakedisi?: number
  bayi_odeme_tutari?: number
  ödemeler: Payment[]
  evraklar: Document[]
  süreç_evraklari: Document[]
  bağlı_bayi_id: string
  bağlı_bayi_adı: string
  notlar: Note[]
  son_güncelleme: string
  evrak_durumu: "Tamam" | "Eksik"
  eksik_evraklar?: string[]
  dosya_kilitli?: boolean
  dosya_tipi?: string
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
  durum: DocumentStatus
  yükleme_tarihi?: string
  url?: string
}

interface Note {
  id: string
  yazar: string
  tarih: string
  içerik: string
}

export default function CustomerPanelPage() {
  const { isAuthenticated, user, isLoading: authLoading, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showDocUploadModal, setShowDocUploadModal] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | undefined>()

  // Redirect if not authenticated or not customer role
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role?.name !== "musteri")) {
      router.push("/musteri-giris")
    }
  }, [isAuthenticated, authLoading, user, router])

  // Fetch customer data
  useEffect(() => {
    if (user?.id && user?.role?.name === "musteri") {
      fetchCustomerData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchCustomerData = async () => {
    if (!user?.id || user?.role?.name !== "musteri") {
      setError("Müşteri bilgileri bulunamadı")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError("")
      
      // Use getByUserInfo for customer role to find customer by TC no, phone, or email
      const response = await customerApi.getByUserInfo()
      
      // Map documents
      const mapDocuments = (docs: any[]) => {
        return docs.map((d: any) => ({
          id: String(d.id),
          tip: d.tip || d.document_type || d.name || 'Bilinmeyen',
          dosya_adı: d.dosya_adı || d.file_name || d.original_name || 'Dosya',
          durum: (d.durum || d.status || 'Beklemede') as DocumentStatus,
          yükleme_tarihi: d.created_at || d.yükleme_tarihi,
          url: d.url || d.file_url,
        }))
      }

      const documents = response.documents || []
      const basvuruEvraklari = documents.filter((d: any) => !d.is_result_document)
      const mappedBasvuruEvraklari = mapDocuments(basvuruEvraklari)
      
      // Fetch result documents (süreç evrakları)
      let surecEvraklari: any[] = []
      try {
        const resultDocs = await resultDocumentsApi.list(String(response.id))
        surecEvraklari = mapDocuments(resultDocs || [])
      } catch (error) {
        console.error('Failed to fetch result documents:', error)
      }

      const transformedCustomer: Customer = {
        id: String(response.id),
        ad_soyad: response.ad_soyad || 'Bilinmeyen',
        tc_no: response.tc_no || '',
        telefon: response.telefon || '',
        email: response.email || '',
        plaka: response.plaka || '',
        hasar_tarihi: response.hasar_tarihi || '',
        başvuru_durumu: (response.başvuru_durumu || 'EVRAK AŞAMASINDA') as ApplicationStatus,
        sigortadan_yatan_tutar: response.sigortadan_yatan_tutar ? Number(response.sigortadan_yatan_tutar) : undefined,
        musteri_hakedisi: response.musteri_hakedisi ? Number(response.musteri_hakedisi) : undefined,
        bayi_odeme_tutari: response.bayi_odeme_tutari ? Number(response.bayi_odeme_tutari) : undefined,
        ödemeler: (response.payments || []).map((p: any) => {
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
        evraklar: mappedBasvuruEvraklari,
        süreç_evraklari: surecEvraklari,
        bağlı_bayi_id: String(response.dealer_id || ''),
        bağlı_bayi_adı: response.dealer?.dealer_name || 'Belirtilmemiş',
        notlar: (response.notes || []).map((n: any) => {
          const content = n.içerik || n.content || n.note || ''
          return {
            id: String(n.id),
            yazar: n.author?.name || n.user?.name || n.yazar || 'Sistem',
            tarih: n.created_at || n.tarih || new Date().toLocaleDateString('tr-TR'),
            içerik: content,
          }
        }).filter((note: any) => Boolean(note.içerik?.trim())),
        son_güncelleme: response.updated_at || new Date().toLocaleDateString('tr-TR'),
        evrak_durumu: ((response.evrak_durumu || 'Eksik') as "Tamam" | "Eksik"),
        eksik_evraklar: (response as any).eksik_evraklar || [],
        dosya_kilitli: response.dosya_kilitli || false,
        dosya_tipi: response.file_type?.name || 'deger-kaybi',
      }

      setCustomer(transformedCustomer)
    } catch (error: any) {
      console.error('[CustomerPanel] Failed to fetch customer:', error)
      
      // Extract error message
      let errorMessage = 'Müşteri bilgileri yüklenemedi'
      if (error?.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.toString && typeof error.toString === 'function') {
        errorMessage = error.toString()
      }
      
      // Remove "Server Components render" prefix if present
      if (errorMessage.includes('Server Components render')) {
        errorMessage = 'Müşteri bilgileri yüklenemedi. Lütfen tekrar deneyin.'
      }
      
      setError(errorMessage)
      toast({
        title: 'Hata',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: ApplicationStatus) => {
    const colors: Record<ApplicationStatus, string> = {
      "EVRAK AŞAMASINDA": "bg-yellow-100 text-yellow-800 border-yellow-300",
      "BAŞVURU AŞAMASINDA": "bg-blue-100 text-blue-800 border-blue-300",
      "BAŞVURU YAPILDI": "bg-purple-100 text-purple-800 border-purple-300",
      "İCRA AŞAMASINDA": "bg-orange-100 text-orange-800 border-orange-300",
      "TAHKİM BAŞVURUSU YAPILDI": "bg-indigo-100 text-indigo-800 border-indigo-300",
      "TAHKİM AŞAMASINDA": "bg-pink-100 text-pink-800 border-pink-300",
      "DOSYA KAPATILDI": "bg-green-100 text-green-800 border-green-300",
    }
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-300"
  }

  const handleViewDocument = (doc: Document) => {
    if (doc.url) {
      window.open(doc.url, '_blank')
    } else {
      toast({
        title: 'Uyarı',
        description: 'Dosya görüntülenemiyor',
        variant: 'destructive',
      })
    }
  }

  const handleDownloadDocument = async (doc: Document) => {
    try {
      if (doc.url) {
        const link = document.createElement('a')
        link.href = doc.url
        link.download = doc.dosya_adı
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        toast({
          title: 'Uyarı',
          description: 'Dosya indirilemiyor',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Dosya indirilemedi',
        variant: 'destructive',
      })
    }
  }

  const handleDocUploadClick = (docType: DocumentType) => {
    setSelectedDocType(docType)
    setShowDocUploadModal(true)
  }

  const handleDocUploadModalClose = () => {
    setShowDocUploadModal(false)
    setSelectedDocType(undefined)
  }

  const handleUniversalDocumentUpload = async (file: File, docType: DocumentType) => {
    if (!customer) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tip', docType)
      formData.append('document_type', docType)
      formData.append('original_name', file.name)
      formData.append('customer_id', customer.id)
      formData.append('is_result_document', '0')

      await documentApi.upload(formData)
      
      toast({
        title: 'Başarılı',
        description: 'Evrak başarıyla yüklendi',
      })
      
      // Refresh customer data
      await fetchCustomerData()
      setShowDocUploadModal(false)
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Evrak yüklenemedi',
        variant: 'destructive',
      })
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/musteri-giris")
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: "#0B3D91" }} />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role?.name !== "musteri") {
    return null
  }

  if (error && !customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Hata</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchCustomerData} className="rounded-xl">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tekrar Dene
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!customer) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ana Sayfa
              </Button>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "#0B3D91" }}>
                  Müşteri Paneli
                </h1>
                <p className="text-sm text-muted-foreground">Hoş geldiniz, {customer.ad_soyad}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCustomerData}
                className="rounded-xl"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Yenile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="rounded-xl"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="rounded-3xl border-2 shadow-lg bg-gradient-to-br from-white to-slate-50">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                Başvuru Durumu
                {customer.dosya_kilitli && customer.başvuru_durumu === "DOSYA KAPATILDI" && (
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
              {customer.evrak_durumu === "Eksik" && customer.eksik_evraklar && customer.eksik_evraklar.length > 0 && (
                <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-orange-900">Eksik Evrak Var</p>
                    <p className="text-sm text-orange-800 mt-1">
                      Lütfen şu evrakları yükleyin: {customer.eksik_evraklar.join(", ")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {customer.eksik_evraklar.map((docName) => (
                        <Button
                          key={docName}
                          size="sm"
                          variant="outline"
                          onClick={() => handleDocUploadClick(docName as DocumentType)}
                          className="rounded-xl bg-white"
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          {docName} Yükle
                        </Button>
                      ))}
                    </div>
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

          {/* Financial Information */}
          {(customer.sigortadan_yatan_tutar || customer.musteri_hakedisi || customer.bayi_odeme_tutari) && (
            <Card className="rounded-3xl border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Mali Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {customer.sigortadan_yatan_tutar !== undefined && (
                    <div className="p-4 bg-blue-50 rounded-2xl">
                      <p className="text-sm text-muted-foreground mb-1">Sigortadan Yatan Tutar</p>
                      <p className="text-2xl font-bold" style={{ color: "#0B3D91" }}>
                        ₺{customer.sigortadan_yatan_tutar.toLocaleString('tr-TR')}
                      </p>
                    </div>
                  )}
                  {customer.musteri_hakedisi !== undefined && (
                    <div className="p-4 bg-green-50 rounded-2xl">
                      <p className="text-sm text-muted-foreground mb-1">Müşteri Hakedişi</p>
                      <p className="text-2xl font-bold" style={{ color: "#F57C00" }}>
                        ₺{customer.musteri_hakedisi.toLocaleString('tr-TR')}
                      </p>
                    </div>
                  )}
                  {customer.bayi_odeme_tutari !== undefined && (
                    <div className="p-4 bg-purple-50 rounded-2xl">
                      <p className="text-sm text-muted-foreground mb-1">Bayi Ödeme Tutarı</p>
                      <p className="text-2xl font-bold" style={{ color: "#0B3D91" }}>
                        ₺{customer.bayi_odeme_tutari.toLocaleString('tr-TR')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Documents Card */}
          <Card className="rounded-3xl border-2 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Belgelerim
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {customer.evraklar && customer.evraklar.length > 0 ? (
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
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Henüz evrak yüklenmemiş.</p>
              )}
            </CardContent>
          </Card>

          {/* Process Documents Card */}
          {customer.süreç_evraklari && customer.süreç_evraklari.length > 0 && (
            <Card className="rounded-3xl border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Süreç Evrakları
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customer.süreç_evraklari.map((doc) => (
                    <Card key={doc.id} className="rounded-2xl hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-purple-600" />
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
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <DocumentUploadModal
        open={showDocUploadModal}
        onOpenChange={handleDocUploadModalClose}
        onUpload={handleUniversalDocumentUpload}
        preselectedType={selectedDocType}
      />
    </div>
  )
}

