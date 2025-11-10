import { useState, useEffect } from 'react'
import { paymentApi } from '@/lib/api-client'
import { toast } from 'sonner'

export interface Payment {
  id: number
  musteri_id: number
  musteri_ad?: string
  bayi_id?: number
  bayi_ad?: string
  odeme_turu: 'havale' | 'eft' | 'nakit' | 'kredi_karti'
  tutar: number
  aciklama?: string
  odeme_tarihi: string
  durum: 'beklemede' | 'onaylandi' | 'iptal'
  file_path?: string
  created_at: string
  updated_at?: string
}

interface UsePaymentsOptions {
  date_from?: string
  date_to?: string
  type?: string
  status?: string
  dealer_id?: string
  file_type_id?: string
}

export function usePayments(options: UsePaymentsOptions = {}) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPayments()
  }, [options.date_from, options.date_to, options.type, options.status, options.dealer_id, options.file_type_id])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (options.date_from) params.append('date_from', options.date_from)
      if (options.date_to) params.append('date_to', options.date_to)
      if (options.type) params.append('type', options.type)
      if (options.status) params.append('status', options.status)
      if (options.dealer_id) params.append('dealer_id', options.dealer_id)
      if (options.file_type_id) params.append('file_type_id', options.file_type_id)

      const queryString = params.toString()
      const data = await paymentApi.getAll(queryString ? `?${queryString}` : '')
      setPayments(data || [])
    } catch (err) {
      console.error('Payments fetch error:', err)
      setError('Ödemeler yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const createPayment = async (paymentData: Partial<Payment>) => {
    try {
      const newPayment = await paymentApi.create(paymentData)
      setPayments(prev => [newPayment, ...prev])
      toast.success('Ödeme başarıyla oluşturuldu')
      return newPayment
    } catch (err) {
      console.error('Create payment error:', err)
      toast.error('Ödeme oluşturulurken bir hata oluştu')
      throw err
    }
  }

  const updatePayment = async (id: number, paymentData: Partial<Payment>) => {
    try {
      const updatedPayment = await paymentApi.update(id.toString(), paymentData)
      setPayments(prev =>
        prev.map(payment =>
          payment.id === id ? { ...payment, ...updatedPayment } : payment
        )
      )
      toast.success('Ödeme bilgileri güncellendi')
      return updatedPayment
    } catch (err) {
      console.error('Update payment error:', err)
      toast.error('Ödeme güncellenirken bir hata oluştu')
      throw err
    }
  }

  const deletePayment = async (id: number) => {
    try {
      await paymentApi.delete(id.toString())
      setPayments(prev => prev.filter(payment => payment.id !== id))
      toast.success('Ödeme başarıyla silindi')
    } catch (err) {
      console.error('Delete payment error:', err)
      toast.error('Ödeme silinirken bir hata oluştu')
      throw err
    }
  }

  const getTotalAmount = () => {
    return payments.reduce((total, payment) => total + payment.tutar, 0)
  }

  const getPaymentsByType = () => {
    const grouped: Record<string, number> = {}
    payments.forEach(payment => {
      grouped[payment.odeme_turu] = (grouped[payment.odeme_turu] || 0) + payment.tutar
    })
    return grouped
  }

  const getPaymentsByStatus = () => {
    const grouped: Record<string, number> = {}
    payments.forEach(payment => {
      grouped[payment.durum] = (grouped[payment.durum] || 0) + 1
    })
    return grouped
  }

  return {
    payments,
    loading,
    error,
    createPayment,
    updatePayment,
    deletePayment,
    getTotalAmount,
    getPaymentsByType,
    getPaymentsByStatus,
    refetch: fetchPayments,
  }
}