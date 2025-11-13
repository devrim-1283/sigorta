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

    // Email is required for login
    if (!data.email || !data.email.trim()) {
      throw new Error('E-posta adresi gereklidir')
    }

    // Validate and sanitize email
    const { validateEmail } = await import('@/lib/validation')
    const emailValidation = validateEmail(data.email)
    if (!emailValidation.valid) {
      throw new Error(emailValidation.error || 'Geçersiz e-posta formatı')
    }

    // Normalize email to lowercase
    const normalizedEmail = emailValidation.sanitized.toLowerCase().trim()

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      throw new Error('Bu e-posta adresi zaten kullanılıyor')
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: normalizedEmail,
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

    // Log user creation
    try {
      const { createAuditLog } = await import('./audit-logs')
      const roleInfo = await prisma.role.findUnique({ where: { id: BigInt(data.role_id) } })
      await createAuditLog({
        action: 'CREATE',
        entityType: 'USER',
        entityId: user.id.toString(),
        entityName: user.name,
        description: `Yeni kullanıcı oluşturuldu: ${user.name} (${roleInfo?.name || 'Rol bilinmiyor'})`,
        newValues: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          role_id: user.role_id.toString(),
          dealer_id: user.dealer_id?.toString(),
        },
      })
    } catch (logError) {
      console.error('[User] Failed to log creation:', logError)
    }

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
  
  // Normalize email if provided
  if (data.email) {
    const { validateEmail } = await import('@/lib/validation')
    const emailValidation = validateEmail(data.email)
    if (!emailValidation.valid) {
      throw new Error(emailValidation.error || 'Geçersiz e-posta formatı')
    }
    const normalizedEmail = emailValidation.sanitized.toLowerCase().trim()
    
    // Check if email is already used by another user
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })
    
    if (existingUser && Number(existingUser.id) !== id) {
      throw new Error('Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor')
    }
    
    updateData.email = normalizedEmail
  }
  
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

  // Log user update
  try {
    const { createAuditLog } = await import('./audit-logs')
    const changedFields: string[] = []
    
    if (data.name) changedFields.push('Ad Soyad')
    if (data.email) changedFields.push('Email')
    if (data.phone) changedFields.push('Telefon')
    if (data.password) changedFields.push('Şifre')
    if (data.role_id) changedFields.push('Rol')
    if (data.dealer_id !== undefined) changedFields.push('Bayi')
    
    if (changedFields.length > 0) {
      await createAuditLog({
        action: 'UPDATE',
        entityType: 'USER',
        entityId: id.toString(),
        entityName: user.name,
        description: `Kullanıcı güncellendi: ${user.name}. Değiştirilen alanlar: ${changedFields.join(', ')}`,
        newValues: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          role_id: data.role_id,
          dealer_id: data.dealer_id,
          password_changed: !!data.password,
        },
      })
    }
  } catch (logError) {
    console.error('[User] Failed to log update:', logError)
  }

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

  // Get user details before deleting
  const user = await prisma.user.findUnique({
    where: { id: BigInt(id) },
    select: {
      name: true,
      email: true,
      phone: true,
      role: {
        select: { name: true },
      },
    },
  })

  await prisma.user.delete({
    where: { id: BigInt(id) },
  })

  // Log user deletion
  if (user) {
    try {
      const { createAuditLog } = await import('./audit-logs')
      await createAuditLog({
        action: 'DELETE',
        entityType: 'USER',
        entityId: id.toString(),
        entityName: user.name,
        description: `Kullanıcı silindi: ${user.name} (${user.role.name})`,
        oldValues: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role.name,
        },
      })
    } catch (logError) {
      console.error('[User] Failed to log deletion:', logError)
    }
  }

  revalidatePath('/dashboard/users')

  return { success: true }
}

