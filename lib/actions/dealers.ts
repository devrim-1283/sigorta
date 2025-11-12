 'use server'

import bcrypt from 'bcryptjs'
import { PrismaClient, Prisma } from '@prisma/client'
import { createNotification } from './notifications'
import { requireAuth } from './auth'

async function getDealerRoleId(tx: Prisma.TransactionClient): Promise<bigint> {
  const role = await tx.role.findFirst({
    where: { name: 'bayi' },
    select: { id: true },
  })

  if (!role) {
    throw new Error('Bayi rolü bulunamadı')
  }

  return role.id
}

import prisma from '@/lib/db'
import { requireAuth } from './auth'
import { revalidatePath } from 'next/cache'

export async function getDealers(params?: {
  search?: string
  status?: string
}) {
  await requireAuth()

  const where: any = { deleted_at: null }

  if (params?.search) {
    where.OR = [
      { dealer_name: { contains: params.search, mode: 'insensitive' } },
      { contact_person: { contains: params.search, mode: 'insensitive' } },
      { phone: { contains: params.search } },
    ]
  }

  if (params?.status) {
    where.status = params.status
  }

  const dealers = await prisma.dealer.findMany({
    where,
    include: {
      _count: {
        select: { customers: true },
      },
    },
    orderBy: { created_at: 'desc' },
  })

  return dealers.map(d => ({
    ...d,
    id: Number(d.id),
    customers_count: d._count.customers,
  }))
}

export async function getDealer(id: number) {
  await requireAuth()

  const dealer = await prisma.dealer.findUnique({
    where: { id: BigInt(id) },
    include: {
      customers: true,
      users: true,
    },
  })

  if (!dealer) {
    throw new Error('Bayi bulunamadı')
  }

  return {
    ...dealer,
    id: Number(dealer.id),
  }
}

export async function createDealer(data: {
  dealer_name: string
  contact_person?: string | null
  phone: string
  email?: string | null
  address?: string | null
  city?: string | null
  tax_number?: string | null
  status?: string
  password?: string
}) {
  await requireAuth()

  // Validate that email and password are provided for dealer login
  if (!data.email || !data.email.trim()) {
    throw new Error('Bayi girişi için e-posta adresi gereklidir')
  }

  if (!data.password || !data.password.trim()) {
    throw new Error('Bayi girişi için şifre gereklidir')
  }

  if (data.password.trim().length < 8) {
    throw new Error('Şifre en az 8 karakter olmalıdır')
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const trimmedEmail = data.email.trim().toLowerCase()

      // Check for duplicate dealer phone or tax number before creation
      const existingDealer = await tx.dealer.findFirst({
        where: {
          OR: [
            { phone: data.phone },
            ...(data.tax_number ? [{ tax_number: data.tax_number }] : []),
            { email: trimmedEmail },
          ],
        },
        select: { 
          id: true, 
          dealer_name: true,
          phone: true,
          email: true,
          tax_number: true,
        },
      })

      if (existingDealer) {
        const conflicts: string[] = []
        const conflictDetails: string[] = []
        
        if (existingDealer.phone === data.phone) {
          conflicts.push('Telefon Numarası')
          conflictDetails.push(`Telefon: ${existingDealer.phone}`)
        }
        if (existingDealer.email === trimmedEmail) {
          conflicts.push('E-posta')
          conflictDetails.push(`E-posta: ${existingDealer.email}`)
        }
        if (data.tax_number && existingDealer.tax_number === data.tax_number) {
          conflicts.push('Vergi Numarası')
          conflictDetails.push(`Vergi No: ${existingDealer.tax_number}`)
        }

        let errorMessage = ''
        if (conflicts.length === 1) {
          errorMessage = `Bu ${conflicts[0]} (${conflictDetails[0]}) ile kayıtlı bir bayi zaten mevcut. `
        } else if (conflicts.length > 1) {
          errorMessage = `Bu ${conflicts.join(', ')} ile kayıtlı bir bayi zaten mevcut. `
          errorMessage += `Çakışan bilgiler: ${conflictDetails.join(', ')}. `
        } else {
          errorMessage = 'Bu bilgiler ile kayıtlı bir bayi zaten mevcut. '
        }
        
        if (existingDealer.dealer_name) {
          errorMessage += `Mevcut kayıt: ${existingDealer.dealer_name}. `
        }
        errorMessage += 'Lütfen mevcut kaydı düzenleyin veya farklı bilgiler girin.'
        
        throw new Error(errorMessage)
      }

      // Check if email or phone is already used by another user
      const existingUserWithEmail = await tx.user.findFirst({
        where: {
          OR: [
            { email: trimmedEmail },
            { phone: data.phone },
          ],
        },
        select: { 
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      })

      if (existingUserWithEmail) {
        const conflicts: string[] = []
        const conflictDetails: string[] = []
        
        if (existingUserWithEmail.email === trimmedEmail) {
          conflicts.push('E-posta')
          conflictDetails.push(`E-posta: ${existingUserWithEmail.email}`)
        }
        if (existingUserWithEmail.phone === data.phone) {
          conflicts.push('Telefon Numarası')
          conflictDetails.push(`Telefon: ${existingUserWithEmail.phone}`)
        }

        let errorMessage = ''
        if (conflicts.length === 1) {
          errorMessage = `Bu ${conflicts[0]} (${conflictDetails[0]}) başka bir kullanıcı tarafından kullanılıyor. `
        } else if (conflicts.length > 1) {
          errorMessage = `Bu ${conflicts.join(', ')} başka bir kullanıcı tarafından kullanılıyor. `
          errorMessage += `Çakışan bilgiler: ${conflictDetails.join(', ')}. `
        } else {
          errorMessage = 'Bu bilgiler başka bir kullanıcı tarafından kullanılıyor. '
        }
        
        if (existingUserWithEmail.name) {
          errorMessage += `Mevcut kullanıcı: ${existingUserWithEmail.name}. `
        }
        errorMessage += 'Lütfen farklı bir e-posta veya telefon numarası girin.'
        
        throw new Error(errorMessage)
      }

      // Create dealer
      const dealer = await tx.dealer.create({
        data: {
          dealer_name: data.dealer_name,
          contact_person: data.contact_person || null,
          phone: data.phone,
          email: trimmedEmail,
          address: data.address || null,
          city: data.city || null,
          tax_number: data.tax_number || null,
          status: data.status || 'active',
          created_at: new Date(),
          updated_at: new Date(),
        },
      })

      // Always create user account for dealer login (email and password are required)
      const hashedPassword = await bcrypt.hash(data.password.trim(), 12)
      const dealerRoleId = await getDealerRoleId(tx)
      
      await tx.user.create({
        data: {
          name: data.dealer_name,
          email: trimmedEmail,
          phone: data.phone,
          password: hashedPassword,
          role_id: dealerRoleId,
          dealer_id: dealer.id,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      })

      revalidatePath('/dashboard/dealers')
      revalidatePath('/admin/bayiler')

      // Send notifications
      try {
        const currentUser = await requireAuth()
        
        // Notify admins
        await createNotification({
          title: 'Yeni Bayi Eklendi',
          message: `${dealer.dealer_name} adlı yeni bayi sisteme eklendi.`,
          type: 'success',
          link: `/admin/bayiler`,
          roles: ['superadmin', 'birincil-admin'],
          excludeUserId: currentUser.id,
        })
        
        // Notify the dealer user account that was created
        const dealerUser = await tx.user.findFirst({
          where: {
            dealer_id: dealer.id,
            is_active: true,
          },
          select: { id: true },
        })
        
        if (dealerUser) {
          await createNotification({
            title: 'Hesabınız Oluşturuldu',
            message: `Merhaba ${dealer.dealer_name}, bayi hesabınız oluşturuldu. Sisteme giriş yapabilirsiniz.`,
            type: 'success',
            link: `/admin/dashboard`,
            userIds: [Number(dealerUser.id)],
          })
        }
      } catch (notifError) {
        console.error('Notification error (non-critical):', notifError)
      }

      return {
        ...dealer,
        id: Number(dealer.id),
      }
    })
  } catch (error: any) {
    console.error('Create dealer error:', error)
    if (error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : error.meta?.target
      throw new Error(`Bayi oluşturulamadı: ${target || 'benzersiz alan'} zaten kullanımda`)
    }

    throw new Error(error.message || 'Bayi oluşturulamadı')
  }
}

export async function updateDealer(id: number, data: Partial<{
  dealer_name: string
  contact_person: string
  phone: string
  email: string
  address: string
  city: string
  tax_number: string
  status: string
  password: string
}>) {
  await requireAuth()

  // Separate password from dealer data
  const { password, ...dealerData } = data

  const dealer = await prisma.$transaction(async (tx) => {
    // Update dealer (without password field)
    const updated = await tx.dealer.update({
      where: { id: BigInt(id) },
      data: dealerData,
    })

    // If password is provided, update the associated user's password
    if (password && password.trim()) {
      const hashedPassword = await bcrypt.hash(password, 12)
      const existingUser = await tx.user.findFirst({
        where: {
          dealer_id: BigInt(id),
        },
      })

      if (existingUser) {
        await tx.user.update({
          where: { id: existingUser.id },
          data: { password: hashedPassword },
        })
      } else {
        // If no user exists, create one (optional - you might want to throw error instead)
        console.warn(`No user found for dealer ${id}, password update skipped`)
      }
    }

    return updated
  })

  revalidatePath('/dashboard/dealers')
  revalidatePath(`/dashboard/dealers/${id}`)

  return {
    ...dealer,
    id: Number(dealer.id),
  }
}

export async function deleteDealer(id: number) {
  await requireAuth()

  await prisma.dealer.update({
    where: { id: BigInt(id) },
    data: { deleted_at: new Date() },
  })

  revalidatePath('/dashboard/dealers')
  revalidatePath('/admin/bayiler')

  return { success: true }
}

export async function getDealerStats() {
  await requireAuth()

  const [total, active, pending] = await Promise.all([
    prisma.dealer.count(),
    prisma.dealer.count({ where: { status: 'active' } }),
    prisma.dealer.count({ where: { status: 'pending' } }),
  ])

  return {
    total_dealers: total,
    active_dealers: active,
    pending_dealers: pending,
  }
}

