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

export function useDocuments(params?: { search?: string; type?: string; status?: string }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [params?.search, params?.type, params?.status])

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await documentApi.getAll(params)
      // Handle paginated response
      if (response.data && Array.isArray(response.data)) {
        setDocuments(response.data)
      } else if (Array.isArray(response)) {
        setDocuments(response)
      } else if (response.data && Array.isArray(response.data.data)) {
        // Laravel pagination format
        setDocuments(response.data.data)
      } else {
        setDocuments([])
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
    fetchDocuments,
    uploadDocument,
    deleteDocument,
  }
}

