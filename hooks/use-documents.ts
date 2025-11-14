import { useState, useEffect } from 'react'
import { documentApi } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'

interface Document {
  id: number
  tip: string
  dosya_adı: string
  yüklenme_tarihi: string
  durum: string
  müşteri_adı?: string
  bayi_adı?: string
  yükleyen?: string
  customer?: {
    id: number
    ad_soyad: string
    dealer?: {
      dealer_name: string
    }
  }
  uploadedBy?: {
    name: string
  }
}

export function useDocuments(params?: { search?: string; type?: string; status?: string; page?: number; perPage?: number }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(params?.page || 1)

  useEffect(() => {
    fetchDocuments()
  }, [params?.search, params?.type, params?.status, params?.page, params?.perPage])

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await documentApi.list(params)
      // Response is now an object with documents array and pagination info
      if (response && typeof response === 'object' && 'documents' in response) {
        setDocuments(response.documents || [])
        setTotal(response.total || 0)
        setTotalPages(response.totalPages || 1)
        setCurrentPage(response.page || 1)
      } else if (Array.isArray(response)) {
        // Fallback for old format
        setDocuments(response)
        setTotal(response.length)
        setTotalPages(1)
      } else {
        setDocuments([])
        setTotal(0)
        setTotalPages(1)
      }
    } catch (err: any) {
      setError(err.message || 'Evraklar yüklenemedi')
      toast({
        title: 'Hata',
        description: err.message || 'Evraklar yüklenemedi',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const uploadDocument = async (formData: FormData) => {
    try {
      await documentApi.upload(formData)
      await fetchDocuments()
      toast({
        title: 'Başarılı',
        description: 'Evrak başarıyla yüklendi',
      })
    } catch (err: any) {
      toast({
        title: 'Hata',
        description: err.message || 'Evrak yüklenemedi',
        variant: 'destructive',
      })
      throw err
    }
  }

  const deleteDocument = async (id: number) => {
    try {
      await documentApi.delete(id.toString())
      await fetchDocuments()
      toast({
        title: 'Başarılı',
        description: 'Evrak silindi',
      })
    } catch (err: any) {
      toast({
        title: 'Hata',
        description: err.message || 'Evrak silinemedi',
        variant: 'destructive',
      })
      throw err
    }
  }

  return {
    documents,
    isLoading,
    error,
    total,
    totalPages,
    currentPage,
    fetchDocuments,
    refetch: fetchDocuments,
    uploadDocument,
    deleteDocument,
  }
}

