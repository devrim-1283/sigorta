'use server'

import prisma from '@/lib/db'
import { requireAuth, getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { sendSMS, checkSMSStatus, getSMSStatusDescription } from '@/lib/services/netgsm'

export interface SMSLogData {
  recipientName?: string
  recipientPhone: string
  message: string
  customerId?: number
  jobId?: string
  status?: string
  errorMessage?: string
}

/**
 * Create SMS log entry in database
 */
export async function createSMSLog(data: SMSLogData) {
  try {
    const user = await getCurrentUser()
    
    const log = await prisma.smsLog.create({
      data: {
        recipient_name: data.recipientName,
        recipient_phone: data.recipientPhone,
        message: data.message,
        customer_id: data.customerId ? BigInt(data.customerId) : null,
        sent_by: user ? BigInt(user.id) : null,
        job_id: data.jobId,
        status: data.status || 'pending',
        error_message: data.errorMessage,
        sender_name: process.env.NETGSM_SENDER || 'SEFFAF DAN',
        sent_at: new Date(),
      }
    })

    return {
      success: true,
      log: {
        id: Number(log.id),
        recipient_name: log.recipient_name,
        recipient_phone: log.recipient_phone,
        message: log.message,
        status: log.status,
        job_id: log.job_id,
        sent_at: log.sent_at.toISOString(),
      }
    }
  } catch (error: any) {
    console.error('[SMS] Failed to create log:', error)
    return {
      success: false,
      error: error.message || 'SMS log kaydedilemedi'
    }
  }
}

/**
 * Get SMS logs with pagination and filtering
 */
export async function getSMSLogs(params?: {
  page?: number
  perPage?: number
  search?: string
  status?: string
}) {
  try {
    await requireAuth()
    
    const page = params?.page || 1
    const perPage = params?.perPage || 50
    const skip = (page - 1) * perPage

    const where: any = {}

    // Search filter
    if (params?.search) {
      where.OR = [
        { recipient_name: { contains: params.search, mode: 'insensitive' } },
        { recipient_phone: { contains: params.search } },
      ]
    }

    // Status filter
    if (params?.status && params.status !== 'all') {
      where.status = params.status
    }

    const [logs, total] = await Promise.all([
      prisma.smsLog.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              ad_soyad: true,
              telefon: true,
            }
          },
          sender: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: { sent_at: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.smsLog.count({ where }),
    ])

    return {
      logs: logs.map(log => ({
        id: Number(log.id),
        recipient_name: log.recipient_name,
        recipient_phone: log.recipient_phone,
        message: log.message,
        sender_name: log.sender_name,
        job_id: log.job_id,
        status: log.status,
        delivery_status: log.delivery_status,
        error_message: log.error_message,
        customer_id: log.customer_id ? Number(log.customer_id) : null,
        sent_by: log.sent_by ? Number(log.sent_by) : null,
        sent_at: log.sent_at.toISOString(),
        delivered_at: log.delivered_at?.toISOString(),
        customer: log.customer ? {
          id: Number(log.customer.id),
          ad_soyad: log.customer.ad_soyad,
          telefon: log.customer.telefon,
        } : null,
        sender: log.sender ? {
          id: Number(log.sender.id),
          name: log.sender.name,
        } : null,
      })),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    }
  } catch (error: any) {
    console.error('[SMS] Failed to get logs:', error)
    throw new Error(`SMS logları alınamadı: ${error.message}`)
  }
}

/**
 * Get SMS statistics
 */
export async function getSMSStats() {
  try {
    await requireAuth()

    const [total, sent, delivered, failed, pending] = await Promise.all([
      prisma.smsLog.count(),
      prisma.smsLog.count({ where: { status: 'sent' } }),
      prisma.smsLog.count({ where: { delivery_status: '1' } }),
      prisma.smsLog.count({ where: { status: 'failed' } }),
      prisma.smsLog.count({ where: { status: 'pending' } }),
    ])

    return {
      total,
      sent,
      delivered,
      failed,
      pending,
    }
  } catch (error: any) {
    console.error('[SMS] Failed to get stats:', error)
    throw new Error(`SMS istatistikleri alınamadı: ${error.message}`)
  }
}

/**
 * Send manual SMS
 */
export async function sendManualSMS(data: {
  phone: string
  message: string
  customerId?: number
  recipientName?: string
}) {
  try {
    const user = await requireAuth()
    
    // Check if user is superadmin
    const currentUser = await getCurrentUser()
    if (currentUser?.role?.name !== 'superadmin') {
      throw new Error('Bu işlem için yetkiniz yok')
    }

    // Send SMS via NetGSM
    const smsResult = await sendSMS({
      phone: data.phone,
      message: data.message,
      customerName: data.recipientName,
    })

    // Create log entry
    await createSMSLog({
      recipientPhone: data.phone,
      recipientName: data.recipientName,
      message: data.message,
      customerId: data.customerId,
      jobId: smsResult.jobid,
      status: smsResult.success ? 'sent' : 'failed',
      errorMessage: smsResult.error,
    })

    revalidatePath('/admin/sms')

    return {
      success: smsResult.success,
      jobId: smsResult.jobid,
      error: smsResult.error,
    }
  } catch (error: any) {
    console.error('[SMS] Manual send failed:', error)
    return {
      success: false,
      error: error.message || 'SMS gönderilemedi'
    }
  }
}

/**
 * Update SMS status from NetGSM
 */
export async function updateSMSStatus(smsLogId: number) {
  try {
    await requireAuth()

    const log = await prisma.smsLog.findUnique({
      where: { id: BigInt(smsLogId) }
    })

    if (!log || !log.job_id) {
      throw new Error('SMS log bulunamadı veya job_id mevcut değil')
    }

    // Query NetGSM for status
    const statusResult = await checkSMSStatus(log.job_id)

    if (statusResult.success && statusResult.status !== undefined) {
      // Update log with delivery status
      await prisma.smsLog.update({
        where: { id: BigInt(smsLogId) },
        data: {
          delivery_status: statusResult.status.toString(),
          delivered_at: statusResult.status === 1 ? new Date() : null,
          updated_at: new Date(),
        }
      })

      revalidatePath('/admin/sms')

      return {
        success: true,
        status: statusResult.status,
        statusDescription: getSMSStatusDescription(statusResult.status),
        deliveredDate: statusResult.deliveredDate,
      }
    } else {
      return {
        success: false,
        error: statusResult.error || 'Durum sorgulanamadı'
      }
    }
  } catch (error: any) {
    console.error('[SMS] Status update failed:', error)
    return {
      success: false,
      error: error.message || 'Durum güncellenemedi'
    }
  }
}

/**
 * Sync SMS statuses for recent pending/sent messages
 */
export async function syncSMSStatuses() {
  try {
    await requireAuth()

    // Get SMS logs from last 24 hours that need status update
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const logsToSync = await prisma.smsLog.findMany({
      where: {
        job_id: { not: null },
        sent_at: { gte: oneDayAgo },
        OR: [
          { status: 'sent', delivery_status: null },
          { status: 'sent', delivery_status: '0' }, // Pending delivery
        ]
      },
      take: 50, // Limit to avoid rate limiting
    })

    let updated = 0
    let failed = 0

    for (const log of logsToSync) {
      if (!log.job_id) continue

      const result = await updateSMSStatus(Number(log.id))
      
      if (result.success) {
        updated++
      } else {
        failed++
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    revalidatePath('/admin/sms')

    return {
      success: true,
      updated,
      failed,
      total: logsToSync.length,
    }
  } catch (error: any) {
    console.error('[SMS] Sync failed:', error)
    return {
      success: false,
      error: error.message || 'Senkronizasyon başarısız'
    }
  }
}

/**
 * Get customers for SMS recipient selection
 */
export async function getCustomersForSMS(search?: string) {
  try {
    await requireAuth()

    const where: any = {}

    if (search) {
      where.OR = [
        { ad_soyad: { contains: search, mode: 'insensitive' } },
        { telefon: { contains: search } },
        { tc_no: { contains: search } },
      ]
    }

    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        ad_soyad: true,
        telefon: true,
        email: true,
      },
      orderBy: { ad_soyad: 'asc' },
      take: 20,
    })

    return customers.map(c => ({
      id: Number(c.id),
      ad_soyad: c.ad_soyad,
      telefon: c.telefon,
      email: c.email,
    }))
  } catch (error: any) {
    console.error('[SMS] Failed to get customers:', error)
    throw new Error(`Müşteriler alınamadı: ${error.message}`)
  }
}

