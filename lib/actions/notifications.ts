'use server'

import prisma from '@/lib/db'
import { requireAuth } from './auth'
import { revalidatePath } from 'next/cache'

export async function getNotifications() {
  const user = await requireAuth()

  const notifications = await prisma.notification.findMany({
    where: { user_id: BigInt(user.id) },
    orderBy: { created_at: 'desc' },
  })

  return notifications.map(n => ({
    ...n,
    id: Number(n.id),
    user_id: Number(n.user_id),
  }))
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

