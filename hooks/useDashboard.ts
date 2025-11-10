import { useState, useEffect } from 'react'
import { dashboardApi } from '@/lib/api-client'

export interface DashboardStats {
  total_customers: number
  total_dealers: number
  total_documents: number
  total_payments: number
  total_policies: number  // Poliçe sayısı (müşteri bazında)
  active_policies: number  // Aktif poliçeler
  total_claims: number    // Toplam hasar sayısı
  active_claims: number   // Aktif hasarlar
  recent_customers: Array<{
    id: number
    ad_soyad: string
    telefon: string
    dosya_turu: string
    created_at: string
  }>
  recent_documents: Array<{
    id: number
    belge_adi: string
    musteri_id: number
    musteri_ad: string
    tur: string
    durum: string
    created_at: string
  }>
  unread_notifications: number
  pending_payments: number
  closed_files_today: number
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await dashboardApi.getStats()
      setStats(data)
    } catch (err) {
      console.error('Dashboard stats fetch error:', err)
      setError('İstatistikler yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}