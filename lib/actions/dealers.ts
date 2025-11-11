 'use server'

import bcrypt from 'bcryptjs'
import { PrismaClient, Prisma } from '@prisma/client'

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

  try {
    return await prisma.$transaction(async (tx) => {
      // Check for duplicate dealer phone or tax number before creation
      const existingDealer = await tx.dealer.findFirst({
        where: {
          OR: [
            { phone: data.phone },
            ...(data.tax_number ? [{ tax_number: data.tax_number }] : []),
            ...(data.email ? [{ email: data.email }] : []),
          ],
        },
        select: { id: true, dealer_name: true },
      })

      if (existingDealer) {
        throw new Error('Bu telefon, vergi numarası veya e-posta ile kayıtlı bir bayi zaten var')
      }

      if (data.email) {
        const existingUserWithEmail = await tx.user.findFirst({
          where: {
            OR: [
              { email: data.email },
              { phone: data.phone },
            ],
          },
          select: { id: true },
        })

        if (existingUserWithEmail) {
          throw new Error('Bu e-posta veya telefon numarası başka bir kullanıcı tarafından kullanılıyor')
        }
      }

      const dealer = await tx.dealer.create({
        data: {
          dealer_name: data.dealer_name,
          contact_person: data.contact_person || null,
          phone: data.phone,
          email: data.email || null,
          address: data.address || null,
          city: data.city || null,
          tax_number: data.tax_number || null,
          status: data.status || 'active',
          created_at: new Date(),
          updated_at: new Date(),
        },
      })

      if (data.email && data.password) {
        const hashedPassword = await bcrypt.hash(data.password, 12)
        const dealerRoleId = await getDealerRoleId(tx)
        await tx.user.create({
          data: {
            name: data.dealer_name,
            email: data.email,
            phone: data.phone,
            password: hashedPassword,
            role_id: dealerRoleId,
            dealer_id: dealer.id,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        })
      }

      revalidatePath('/dashboard/dealers')
      revalidatePath('/admin/bayiler')

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

