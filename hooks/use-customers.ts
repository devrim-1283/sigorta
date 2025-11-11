import { useState, useEffect } from 'react'
import { customerApi } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'

interface Customer {
  id: number
  ad_soyad: string
  tc_no: string
  telefon: string
  email?: string
  plaka: string
  hasar_tarihi: string
  başvuru_durumu: string
  evrak_durumu: "Tamam" | "Eksik"
  dosya_kilitli: boolean
  bağlı_bayi_id?: number
  dealer?: {
    id: number
    dealer_name: string
  }
  file_type?: {
    id: number
    name: string
    label: string
  }
  documents?: Array<{
    id: number
    tip: string
    dosya_adı: string
    durum: string
    yüklenme_tarihi: string
  }>
  payments?: Array<{
    id: number
    tarih: string
    tutar: string
    açıklama?: string
    durum: string
    amount: number
    date: string
    description?: string
  }>
  notes?: Array<{
    id: number
    içerik: string
    yazar: string
    created_at: string
  }>
  son_güncelleme?: string
}

export function useCustomers(params?: { search?: string; status?: string; per_page?: number }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [params?.search, params?.status])

  const fetchCustomers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await customerApi.getAll(params)

      // Ensure response exists and handle different response formats
      if (!response) {
        setCustomers([])
        return
      }

      // Handle paginated response
      let customersData: Customer[] = []

      if (response.data) {
        if (Array.isArray(response.data)) {
          customersData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Laravel pagination format
          customersData = response.data.data
        }
      } else if (Array.isArray(response)) {
        customersData = response
      }

      // Ensure we have an array before setting
      setCustomers(Array.isArray(customersData) ? customersData : [])
    } catch (err: any) {
      setError(err.message || 'Müşteriler yüklenemedi')
      console.error('Fetch customers error:', err)
      setCustomers([]) // Ensure we always have an array
      toast({
        title: 'Hata',
        description: err.message || 'Müşteriler yüklenemedi',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createCustomer = async (data: any) => {
    try {
      console.log('[useCustomers] Creating customer with data:', data)
      const newCustomer = await customerApi.create(data)
      console.log('[useCustomers] Customer created:', newCustomer)
      // Refresh the customers list after successful creation
      await fetchCustomers()
      toast({
        title: 'Başarılı',
        description: 'Müşteri başarıyla oluşturuldu',
      })
      return newCustomer
    } catch (err: any) {
      console.error('[useCustomers] Create error:', err)
      
      // Extract user-friendly error message
      let errorMessage = 'Müşteri oluşturulamadı'
      
      if (err?.message) {
        errorMessage = err.message
      } else if (err?.error) {
        errorMessage = err.error
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err?.toString && typeof err.toString === 'function') {
        errorMessage = err.toString()
      }
      
      // Normalize error message for checking
      const normalized = errorMessage.toLowerCase()
      const isAlreadyExists =
        normalized.includes('zaten var') ||
        normalized.includes('kayıtlı') ||
        normalized.includes('unique') ||
        normalized.includes('benzersiz') ||
        normalized.includes('mevcut kaydı')

      // Show appropriate toast based on error type
      if (isAlreadyExists) {
        toast({
          title: 'Müşteri Zaten Kayıtlı',
          description: errorMessage,
          variant: 'destructive',
        })
        // Return null instead of throwing to avoid breaking UI flow
        return null
      } else {
        // Show validation or other errors
        toast({
          title: 'Hata',
          description: errorMessage,
          variant: 'destructive',
        })
        // Still throw for error handling in calling code
        throw new Error(errorMessage)
      }
    }
  }

  const updateCustomer = async (id: number, data: any) => {
    try {
      const updated = await customerApi.update(id.toString(), data)
      await fetchCustomers()
      toast({
        title: 'Başarılı',
        description: 'Müşteri güncellendi',
      })
      return updated
    } catch (err: any) {
      toast({
        title: 'Hata',
        description: err.message || 'Müşteri güncellenemedi',
        variant: 'destructive',
      })
      throw err
    }
  }

  const closeFile = async (id: number, reason?: string) => {
    try {
      await customerApi.closeFile(id.toString(), reason)
      await fetchCustomers()
      toast({
        title: 'Başarılı',
        description: 'Dosya kapatıldı',
      })
    } catch (err: any) {
      toast({
        title: 'Hata',
        description: err.message || 'Dosya kapatılamadı',
        variant: 'destructive',
      })
      throw err
    }
  }

  return {
    customers,
    isLoading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    closeFile,
  }
}

export function useCustomer(id: string | number) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchCustomer()
    }
  }, [id])

  const fetchCustomer = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await customerApi.getById(id.toString())
      setCustomer(data)
    } catch (err: any) {
      setError(err.message || 'Müşteri yüklenemedi')
      toast({
        title: 'Hata',
        description: err.message || 'Müşteri yüklenemedi',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    customer,
    isLoading,
    error,
    refetch: fetchCustomer,
  }
}

