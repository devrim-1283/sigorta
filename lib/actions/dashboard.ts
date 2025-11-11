'use server'

import prisma from '@/lib/db'
import { requireAuth } from './auth'

export async function getDashboardStats() {
  try {
    await requireAuth()

    console.log('[getDashboardStats] Starting...')

    const [
    totalCustomers,
    totalDealers,
    totalDocuments,
    totalPayments,
    totalPolicies,
    activePolicies,
    totalClaims,
    pendingClaims,
    unreadNotifications,
    pendingPayments,
    closedFilesToday,
    recentCustomers,
    recentDocuments,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.dealer.count(),
    prisma.document.count(),
    prisma.payment.aggregate({ _sum: { tutar: true } }),
    prisma.policy.count(),
    prisma.policy.count({ where: { status: 'active' } }),
    prisma.claim.count(),
    prisma.claim.count({ where: { status: 'pending' } }),
    prisma.notification.count({ where: { is_read: false } }),
    prisma.payment.count({ where: { durum: 'Bekliyor' } }),
    prisma.customer.count({
      where: {
        dosya_kilitli: true,
        updated_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.customer.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        file_type: true,
        dealer: true,
      },
    }),
    prisma.document.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        customer: true,
        uploader: true,
      },
    }),
  ])

  // Count completed files
  const completedFiles = await prisma.customer.count({
    where: { 
      OR: [
        { başvuru_durumu: 'Tamamlandı' },
        { başvuru_durumu: 'Dosya Kapatıldı' }
      ]
    },
  })

    console.log('[getDashboardStats] Data fetched successfully')
    console.log('[getDashboardStats] Recent customers count:', recentCustomers.length)

  const result = {
    total_customers: totalCustomers,
    total_dealers: totalDealers,
    total_documents: totalDocuments,
    total_payments: totalPayments._sum.tutar?.toString() || '0',
    total_policies: totalPolicies,
    active_policies: activePolicies,
    total_claims: totalClaims,
    pending_claims: pendingClaims,
    unread_notifications: unreadNotifications,
    pending_payments: pendingPayments,
    closed_files_today: closedFilesToday,
    active_customers: await prisma.customer.count({
      where: { başvuru_durumu: { not: 'Tamamlandı' } },
    }),
    pending_cases: await prisma.customer.count({
      where: { başvuru_durumu: 'Beklemede' },
    }),
    completed_files: completedFiles,
    total_premium: (await prisma.policy.aggregate({ _sum: { premium: true } }))._sum.premium?.toString() || '0',
    recent_customers: recentCustomers.map(c => ({
      id: Number(c.id),
      ad_soyad: c.ad_soyad,
      tc_no: c.tc_no,
      telefon: c.telefon,
      plaka: c.plaka,
      hasar_tarihi: c.hasar_tarihi.toISOString().split('T')[0],
      başvuru_durumu: c.başvuru_durumu,
      file_type_id: Number(c.file_type_id),
      dealer_id: c.dealer_id ? Number(c.dealer_id) : null,
      created_at: c.created_at ? c.created_at.toISOString() : new Date().toISOString(),
      file_type: c.file_type ? {
        id: Number(c.file_type.id),
        name: c.file_type.name,
      } : null,
      dealer: c.dealer ? {
        id: Number(c.dealer.id),
        dealer_name: c.dealer.dealer_name,
      } : null,
    })),
    recent_documents: recentDocuments.map(d => ({
      id: Number(d.id),
      tip: d.tip,
      dosya_adi_orijinal: (d as any).dosya_adı || 'Belge',
      durum: d.durum,
      customer_id: Number(d.customer_id),
      uploaded_by: Number(d.uploaded_by),
      created_at: d.created_at ? d.created_at.toISOString() : new Date().toISOString(),
      customer: d.customer ? {
        id: Number(d.customer.id),
        ad_soyad: d.customer.ad_soyad,
      } : null,
      uploader: d.uploader ? {
        id: Number(d.uploader.id),
        name: d.uploader.name,
      } : null,
    })),
  }

    console.log('[getDashboardStats] Returning result')
    
    return result
  } catch (error: any) {
    console.error('[getDashboardStats] ❌ ERROR:', error)
    console.error('[getDashboardStats] ❌ Error message:', error.message)
    console.error('[getDashboardStats] ❌ Error stack:', error.stack)
    
    // Re-throw with detailed message
    throw new Error(`getDashboardStats failed: ${error.message}`)
  }
}

