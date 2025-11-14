'use server'

import prisma from '@/lib/db'
import { requireAuth, getCurrentUser } from './auth'
import { headers } from 'next/headers'

export type AuditAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'LOGIN_FAILED'
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE'
  | 'VIEW'
  | 'UPLOAD'
  | 'DOWNLOAD'
  | 'APPROVE'
  | 'REJECT'
  | 'CLOSE_FILE'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGE'

export type EntityType = 
  | 'CUSTOMER' 
  | 'DEALER' 
  | 'USER' 
  | 'DOCUMENT' 
  | 'PAYMENT' 
  | 'NOTE'
  | 'AUTH'
  | 'SYSTEM'

interface CreateAuditLogParams {
  action: AuditAction
  entityType: EntityType
  entityId?: string | number
  entityName?: string
  description: string
  oldValues?: any
  newValues?: any
  userId?: number | bigint
  userName?: string
  userRole?: string
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    let userId = params.userId
    let userName = params.userName
    let userRole = params.userRole

    // If user info not provided, try to get current user
    if (!userId || !userName || !userRole) {
      try {
        const currentUser = await getCurrentUser()
        if (currentUser) {
          userId = currentUser.id
          userName = currentUser.name
          userRole = currentUser.role?.name
        }
      } catch {
        // User might not be authenticated (e.g., failed login)
      }
    }

    await prisma.auditLog.create({
      data: {
        user_id: userId ? BigInt(userId) : null,
        user_name: userName || null,
        user_role: userRole || null,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId ? String(params.entityId) : null,
        entity_name: params.entityName || null,
        description: params.description,
        old_values: params.oldValues ? JSON.stringify(params.oldValues) : null,
        new_values: params.newValues ? JSON.stringify(params.newValues) : null,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    })

    // Create notifications for important events
    await createNotificationsForAuditLog(params, userId, userName, userRole)
  } catch (error) {
    // Don't throw errors from audit logging to prevent breaking the main flow
    console.error('[AuditLog] Failed to create audit log:', error)
  }
}

/**
 * Create notifications based on audit log events
 */
async function createNotificationsForAuditLog(
  params: CreateAuditLogParams,
  userId: number | bigint | undefined,
  userName: string | undefined,
  userRole: string | undefined
) {
  try {
    const { createNotification } = await import('./notifications')
    
    // Admin login notifications - Only for superadmin
    if (params.action === 'LOGIN' && userRole && ['superadmin', 'birincil-admin', 'ikincil-admin'].includes(userRole)) {
      await createNotification({
        title: 'Yönetici Girişi',
        message: `${userName} (${userRole}) sisteme giriş yaptı`,
        type: 'info',
        link: '/admin/loglar',
        roles: ['superadmin'],
        excludeUserId: userId ? Number(userId) : undefined,
      })
    }

    // Customer creation - Notify all admins except creator
    if (params.action === 'CREATE' && params.entityType === 'CUSTOMER') {
      // Determine who created the customer
      let creatorDisplayName = userName || 'Bilinmeyen'
      
      // If creator is a dealer (bayi), hide their name for non-superadmin roles
      if (userRole === 'bayi') {
        try {
          const user = await prisma.user.findUnique({
            where: { id: BigInt(userId || 0) },
            include: { dealer: true },
          })
          
          // For superadmin: show dealer name
          const superadminMessage = `${userName} tarafından yeni müşteri eklendi: ${params.entityName}`
          
          // For other admins: hide dealer name, show only dealer ID
          const otherAdminsMessage = user?.dealer 
            ? `Bayi ID: ${user.dealer.id} tarafından yeni müşteri eklendi: ${params.entityName}`
            : `${userName} tarafından yeni müşteri eklendi: ${params.entityName}`
          
          // Send to superadmin with full dealer name
          await createNotification({
            title: 'Yeni Müşteri Eklendi',
            message: superadminMessage,
            type: 'success',
            link: `/admin/musteriler/${params.entityId}`,
            roles: ['superadmin'],
            excludeUserId: userId ? Number(userId) : undefined,
          })
          
          // Send to other admins with masked dealer info
          await createNotification({
            title: 'Yeni Müşteri Eklendi',
            message: otherAdminsMessage,
            type: 'success',
            link: `/admin/musteriler/${params.entityId}`,
            roles: ['birincil-admin', 'ikincil-admin', 'evrak-birimi'],
            excludeUserId: userId ? Number(userId) : undefined,
          })
          
          return // Exit early, notifications sent
        } catch (error) {
          console.error('[AuditLog] Error getting dealer info:', error)
        }
      }
      
      // For non-dealer creators (admin, evrak-birimi, etc.), show their name to everyone
      await createNotification({
        title: 'Yeni Müşteri Eklendi',
        message: `${creatorDisplayName} tarafından yeni müşteri eklendi: ${params.entityName}`,
        type: 'success',
        link: `/admin/musteriler/${params.entityId}`,
        roles: ['superadmin', 'birincil-admin', 'ikincil-admin', 'evrak-birimi'],
        excludeUserId: userId ? Number(userId) : undefined,
      })
    }

    // Document upload - Notify all admins
    if (params.action === 'UPLOAD' || (params.action === 'CREATE' && params.entityType === 'DOCUMENT')) {
      await createNotification({
        title: 'Yeni Evrak Yüklendi',
        message: `${userName} tarafından yeni evrak yüklendi${params.entityName ? `: ${params.entityName}` : ''}`,
        type: 'info',
        link: params.entityId ? `/admin/musteriler/${params.entityId}` : '/admin/dokumanlar',
        roles: ['superadmin', 'birincil-admin', 'ikincil-admin', 'evrak-birimi', 'operasyon'],
        excludeUserId: userId ? Number(userId) : undefined,
      })
    }

    // Payment creation - Notify all admins
    if (params.action === 'CREATE' && params.entityType === 'PAYMENT') {
      await createNotification({
        title: 'Yeni Ödeme Kaydı',
        message: `${userName} tarafından yeni ödeme kaydedildi${params.entityName ? `: ${params.entityName}` : ''}`,
        type: 'success',
        link: '/admin/muhasebe',
        roles: ['superadmin', 'birincil-admin', 'ikincil-admin'],
        excludeUserId: userId ? Number(userId) : undefined,
      })
    }

    // File closed - Notify all admins
    if (params.action === 'CLOSE_FILE') {
      await createNotification({
        title: 'Dosya Kapatıldı',
        message: `${userName} tarafından dosya kapatıldı: ${params.entityName}`,
        type: 'warning',
        link: `/admin/musteriler/${params.entityId}`,
        roles: ['superadmin', 'birincil-admin', 'ikincil-admin'],
        excludeUserId: userId ? Number(userId) : undefined,
      })
    }

    // Dealer creation - Notify only superadmin
    if (params.action === 'CREATE' && params.entityType === 'DEALER') {
      await createNotification({
        title: 'Yeni Bayi Eklendi',
        message: `${userName} tarafından yeni bayi eklendi: ${params.entityName}`,
        type: 'success',
        link: '/admin/bayiler',
        roles: ['superadmin'],
        excludeUserId: userId ? Number(userId) : undefined,
      })
    }

    // User creation - Notify superadmin
    if (params.action === 'CREATE' && params.entityType === 'USER') {
      await createNotification({
        title: 'Yeni Kullanıcı Oluşturuldu',
        message: `${userName} tarafından yeni kullanıcı oluşturuldu: ${params.entityName}`,
        type: 'info',
        link: '/admin/ayarlar/kullanicilar',
        roles: ['superadmin'],
        excludeUserId: userId ? Number(userId) : undefined,
      })
    }
  } catch (notifError) {
    // Don't fail audit log creation if notification fails
    console.error('[AuditLog] Failed to create notification:', notifError)
  }
}

/**
 * Get audit logs with pagination and filters
 */
export async function getAuditLogs(params?: {
  page?: number
  limit?: number
  action?: AuditAction
  entityType?: EntityType
  userId?: number
  startDate?: Date
  endDate?: Date
  search?: string
}) {
  await requireAuth()
  const user = await getCurrentUser()

  // Only superadmin can view audit logs
  if (user?.role?.name !== 'superadmin') {
    throw new Error('Bu işlem için yetkiniz yok')
  }

  const page = params?.page || 1
  const limit = params?.limit || 50
  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {}

  if (params?.action) {
    where.action = params.action
  }

  if (params?.entityType) {
    where.entity_type = params.entityType
  }

  if (params?.userId) {
    where.user_id = BigInt(params.userId)
  }

  if (params?.startDate || params?.endDate) {
    where.created_at = {}
    if (params.startDate) {
      where.created_at.gte = params.startDate
    }
    if (params.endDate) {
      where.created_at.lte = params.endDate
    }
  }

  if (params?.search) {
    where.OR = [
      { user_name: { contains: params.search, mode: 'insensitive' } },
      { entity_name: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    logs: logs.map(log => ({
      id: Number(log.id),
      user_id: log.user_id ? Number(log.user_id) : null,
      user_name: log.user_name,
      user_role: log.user_role,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      entity_name: log.entity_name,
      description: log.description,
      old_values: log.old_values ? JSON.parse(log.old_values) : null,
      new_values: log.new_values ? JSON.parse(log.new_values) : null,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      created_at: log.created_at.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats() {
  await requireAuth()
  const user = await getCurrentUser()

  // Only superadmin can view audit logs
  if (user?.role?.name !== 'superadmin') {
    throw new Error('Bu işlem için yetkiniz yok')
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalLogs,
    todayLogs,
    weekLogs,
    monthLogs,
    loginCount,
    failedLoginCount,
    actionCounts,
    entityCounts,
    topUsers,
  ] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { created_at: { gte: today } } }),
    prisma.auditLog.count({ where: { created_at: { gte: thisWeek } } }),
    prisma.auditLog.count({ where: { created_at: { gte: thisMonth } } }),
    prisma.auditLog.count({ where: { action: 'LOGIN' } }),
    prisma.auditLog.count({ where: { action: 'LOGIN_FAILED' } }),
    prisma.$queryRaw`
      SELECT action, COUNT(*)::int as count
      FROM audit_logs
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `,
    prisma.$queryRaw`
      SELECT entity_type, COUNT(*)::int as count
      FROM audit_logs
      GROUP BY entity_type
      ORDER BY count DESC
      LIMIT 10
    `,
    prisma.$queryRaw`
      SELECT user_name, user_role, COUNT(*)::int as count
      FROM audit_logs
      WHERE user_name IS NOT NULL
      GROUP BY user_name, user_role
      ORDER BY count DESC
      LIMIT 10
    `,
  ])

  return {
    totalLogs,
    todayLogs,
    weekLogs,
    monthLogs,
    loginCount,
    failedLoginCount,
    actionCounts: actionCounts as Array<{ action: string; count: number }>,
    entityCounts: entityCounts as Array<{ entity_type: string; count: number }>,
    topUsers: topUsers as Array<{ user_name: string; user_role: string; count: number }>,
  }
}

/**
 * Delete old audit logs (cleanup)
 */
export async function deleteOldAuditLogs(daysToKeep: number = 90) {
  await requireAuth()
  const user = await getCurrentUser()

  // Only superadmin can delete audit logs
  if (user?.role?.name !== 'superadmin') {
    throw new Error('Bu işlem için yetkiniz yok')
  }

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const result = await prisma.auditLog.deleteMany({
    where: {
      created_at: {
        lt: cutoffDate,
      },
    },
  })

  await createAuditLog({
    action: 'DELETE',
    entityType: 'SYSTEM',
    description: `${result.count} adet ${daysToKeep} günden eski log kaydı silindi`,
  })

  return {
    deletedCount: result.count,
    cutoffDate: cutoffDate.toISOString(),
  }
}

