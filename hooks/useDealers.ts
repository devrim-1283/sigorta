import { useState, useEffect } from 'react'
import { dealerApi } from '@/lib/api-client'
import { toast } from 'sonner'

export interface Dealer {
  id: number
  bayi_kodu: string
  bayi_adi: string
  yetkili_kisi: string
  telefon: string
  email: string
  adres: string
  il: string
  ilce: string
  vergi_dairesi: string
  vergi_no: string
  aktif: boolean
  created_at: string
  updated_at?: string
}

export function useDealers() {
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDealers()
  }, [])

  const fetchDealers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await dealerApi.getAll()
      setDealers(data || [])
    } catch (err) {
      console.error('Dealers fetch error:', err)
      setError('Bayiler yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const createDealer = async (dealerData: Partial<Dealer>) => {
    try {
      const newDealer = await dealerApi.create(dealerData)
      setDealers(prev => [...prev, newDealer])
      toast.success('Bayi başarıyla oluşturuldu')
      return newDealer
    } catch (err) {
      console.error('Create dealer error:', err)
      toast.error('Bayi oluşturulurken bir hata oluştu')
      throw err
    }
  }

  const updateDealer = async (id: number, dealerData: Partial<Dealer>) => {
    try {
      const updatedDealer = await dealerApi.update(id.toString(), dealerData)
      setDealers(prev =>
        prev.map(dealer =>
          dealer.id === id ? { ...dealer, ...updatedDealer } : dealer
        )
      )
      toast.success('Bayi bilgileri güncellendi')
      return updatedDealer
    } catch (err) {
      console.error('Update dealer error:', err)
      toast.error('Bayi güncellenirken bir hata oluştu')
      throw err
    }
  }

  const deleteDealer = async (id: number) => {
    try {
      await dealerApi.delete(id.toString())
      setDealers(prev => prev.filter(dealer => dealer.id !== id))
      toast.success('Bayi başarıyla silindi')
    } catch (err) {
      console.error('Delete dealer error:', err)
      toast.error('Bayi silinirken bir hata oluştu')
      throw err
    }
  }

  const toggleDealerStatus = async (id: number) => {
    try {
      const dealer = dealers.find(d => d.id === id)
      if (!dealer) return

      const updatedDealer = await updateDealer(id, { aktif: !dealer.aktif })
      return updatedDealer
    } catch (err) {
      console.error('Toggle dealer status error:', err)
      throw err
    }
  }

  return {
    dealers,
    loading,
    error,
    createDealer,
    updateDealer,
    deleteDealer,
    toggleDealerStatus,
    refetch: fetchDealers,
  }
}