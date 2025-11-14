'use server'

import prisma from '@/lib/db'
import { requireAuth } from './auth'
import { revalidatePath } from 'next/cache'

export async function getNotifications(params?: {
  page?: number
  perPage?: number
}) {
  const user = await requireAuth()

  // Pagination
  const page = params?.page || 1
  const perPage = params?.perPage || 50
  const skip = (page - 1) * perPage

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { user_id: BigInt(user.id) },
      orderBy: { created_at: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.notification.count({ where: { user_id: BigInt(user.id) } }),
  ])

  return {
    notifications: notifications.map(n => ({
      ...n,
      id: Number(n.id),
      user_id: Number(n.user_id),
    })),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  }
}

export async function markNotificationAsRead(id: number) {
  const user = await requireAuth()

  const notification = await prisma.notification.update({
    where: {
      id: BigInt(id),
      user_id: BigInt(user.id),
    },
    data: {
      is_read: true,
      read_at: new Date(),
    },
  })

  revalidatePath('/dashboard')

  return {
    ...notification,
    id: Number(notification.id),
    user_id: Number(notification.user_id),
  }
}

export async function markNotificationAsUnread(id: number) {
  const user = await requireAuth()

  const notification = await prisma.notification.update({
    where: {
      id: BigInt(id),
      user_id: BigInt(user.id),
    },
    data: {
      is_read: false,
      read_at: null,
    },
  })

  revalidatePath('/dashboard')

  return {
    ...notification,
    id: Number(notification.id),
    user_id: Number(notification.user_id),
  }
}

export async function markAllNotificationsAsRead() {
  const user = await requireAuth()

  await prisma.notification.updateMany({
    where: {
      user_id: BigInt(user.id),
      is_read: false,
    },
    data: {
      is_read: true,
      read_at: new Date(),
    },
  })

  revalidatePath('/dashboard')

  return { success: true }
}

export async function deleteNotification(id: number) {
  const user = await requireAuth()

  await prisma.notification.delete({
    where: {
      id: BigInt(id),
      user_id: BigInt(user.id),
    },
  })

  revalidatePath('/dashboard')

  return { success: true }
}

/**
 * Create a notification for specific users based on their roles
 */
export async function createNotification(data: {
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  link?: string
  userIds?: number[] // Specific user IDs to notify
  roles?: string[] // Roles to notify (all users with these roles)
  excludeUserId?: number // User ID to exclude (e.g., the one who triggered the action)
}) {
  try {
    console.log('[Notification] createNotification called:', { title: data.title, roles: data.roles, excludeUserId: data.excludeUserId })
    
    const type = data.type || 'info'
    
    // Get user IDs to notify
    let userIds: number[] = []
    
    if (data.userIds && data.userIds.length > 0) {
      // Use specific user IDs
      userIds = data.userIds.filter(id => id !== data.excludeUserId)
      console.log('[Notification] Using specific user IDs:', userIds)
    } else if (data.roles && data.roles.length > 0) {
      // Get all users with specified roles
      console.log('[Notification] Looking for users with roles:', data.roles)
      const roleRecords = await prisma.role.findMany({
        where: {
          name: {
            in: data.roles,
          },
        },
        select: { id: true, name: true },
      })
      console.log('[Notification] Found roles:', roleRecords)
      
      if (roleRecords.length > 0) {
        const roleIds = roleRecords.map(r => r.id)
        const users = await prisma.user.findMany({
          where: {
            role_id: {
              in: roleIds,
            },
            is_active: true,
            ...(data.excludeUserId ? { id: { not: BigInt(data.excludeUserId) } } : {}),
          },
          select: { id: true, name: true },
        })
        console.log('[Notification] Found users:', users.map(u => ({ id: Number(u.id), name: u.name })))
        userIds = users.map(u => Number(u.id))
      }
    }
    
    console.log('[Notification] Final user IDs to notify:', userIds)
    
    // Create notifications for all target users
    if (userIds.length > 0) {
      await prisma.notification.createMany({
        data: userIds.map(userId => ({
          user_id: BigInt(userId),
          title: data.title,
          message: data.message,
          type,
          link: data.link || null,
          is_read: false,
          created_at: new Date(),
          updated_at: new Date(),
        })),
      })
      
      console.log('[Notification] Successfully created', userIds.length, 'notifications')
      
      revalidatePath('/admin/bildirimler')
      revalidatePath('/admin/dashboard')
    } else {
      console.log('[Notification] No users to notify - list was empty')
    }
    
    return { success: true, notifiedUsers: userIds.length }
  } catch (error: any) {
    console.error('[Notification] Create notification error:', error)
    // Don't throw - notifications are not critical
    return { success: false, error: error.message }
  }
}

