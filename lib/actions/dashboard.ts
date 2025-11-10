'use server'

import prisma from '@/lib/db'
import { requireAuth } from './auth'

export async function getDashboardStats() {
  await requireAuth()

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

  return {
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
    total_premium: (await prisma.policy.aggregate({ _sum: { premium: true } }))._sum.premium?.toString() || '0',
    recent_customers: recentCustomers.map(c => ({
      ...c,
      id: Number(c.id),
      file_type_id: Number(c.file_type_id),
      dealer_id: c.dealer_id ? Number(c.dealer_id) : null,
    })),
    recent_documents: recentDocuments.map(d => ({
      ...d,
      id: Number(d.id),
      customer_id: Number(d.customer_id),
      uploaded_by: Number(d.uploaded_by),
    })),
  }
}

