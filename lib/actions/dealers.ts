'use server'

import prisma from '@/lib/db'
import { requireAuth } from './auth'
import { revalidatePath } from 'next/cache'

export async function getDealers(params?: {
  search?: string
  status?: string
}) {
  await requireAuth()

  const where: any = {}

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
}) {
  await requireAuth()

  try {
    const dealer = await prisma.dealer.create({
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

    revalidatePath('/dashboard/dealers')
    revalidatePath('/admin/bayiler')

    return {
      ...dealer,
      id: Number(dealer.id),
    }
  } catch (error: any) {
    console.error('Create dealer error:', error)
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
}>) {
  await requireAuth()

  const dealer = await prisma.dealer.update({
    where: { id: BigInt(id) },
    data,
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

