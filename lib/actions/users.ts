'use server'

import prisma from '@/lib/db'
import { requireRole } from './auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

export async function getUsers() {
  await requireRole(['superadmin'])

  const users = await prisma.user.findMany({
    include: {
      role: true,
      dealer: true,
    },
    orderBy: { created_at: 'desc' },
  })

  return users.map(u => ({
    ...u,
    id: Number(u.id),
    role_id: Number(u.role_id),
    dealer_id: u.dealer_id ? Number(u.dealer_id) : null,
    password: undefined, // Don't expose password
  }))
}

export async function createUser(data: {
  name: string
  email?: string | null
  phone?: string | null
  tc_no?: string | null
  password: string
  role_id: number
  dealer_id?: number | null
  is_active?: boolean
}) {
  await requireRole(['superadmin'])

  try {
    // Validate required fields
    if (!data.name || !data.password || !data.role_id) {
      throw new Error('Ad, şifre ve rol gereklidir')
    }

    // At least one contact method required
    if (!data.email && !data.phone && !data.tc_no) {
      throw new Error('En az bir iletişim bilgisi (Email, Telefon veya TC No) gereklidir')
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        tc_no: data.tc_no || null,
        password: hashedPassword,
        role_id: BigInt(data.role_id),
        dealer_id: data.dealer_id ? BigInt(data.dealer_id) : null,
        is_active: data.is_active ?? true,
      },
      include: {
        role: true,
        dealer: true,
      },
    })

    revalidatePath('/dashboard/users')
    revalidatePath('/admin/ayarlar/kullanicilar')

    return {
      ...user,
      id: Number(user.id),
      role_id: Number(user.role_id),
      dealer_id: user.dealer_id ? Number(user.dealer_id) : null,
      password: undefined,
    }
  } catch (error: any) {
    console.error('Create user error:', error)
    throw new Error(error.message || 'Kullanıcı oluşturulamadı')
  }
}

export async function updateUser(id: number, data: Partial<{
  name: string
  email: string
  phone: string
  tc_no: string
  password: string
  role_id: number
  dealer_id: number
  is_active: boolean
}>) {
  await requireRole(['superadmin'])

  const updateData: any = { ...data }
  
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 12)
  }
  
  if (data.role_id) updateData.role_id = BigInt(data.role_id)
  if (data.dealer_id) updateData.dealer_id = BigInt(data.dealer_id)

  const user = await prisma.user.update({
    where: { id: BigInt(id) },
    data: updateData,
    include: {
      role: true,
      dealer: true,
    },
  })

  revalidatePath('/dashboard/users')

  return {
    ...user,
    id: Number(user.id),
    role_id: Number(user.role_id),
    dealer_id: user.dealer_id ? Number(user.dealer_id) : null,
    password: undefined,
  }
}

export async function deleteUser(id: number) {
  await requireRole(['superadmin'])

  await prisma.user.delete({
    where: { id: BigInt(id) },
  })

  revalidatePath('/dashboard/users')

  return { success: true }
}

