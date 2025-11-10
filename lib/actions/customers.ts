'use server'

import prisma from '@/lib/db'
import { requireAuth } from './auth'
import { revalidatePath } from 'next/cache'

export async function getCustomers(params?: {
  search?: string
  status?: string
  page?: number
  perPage?: number
}) {
  await requireAuth()

  const where: any = {}

  if (params?.search) {
    where.OR = [
      { ad_soyad: { contains: params.search, mode: 'insensitive' } },
      { tc_no: { contains: params.search } },
      { telefon: { contains: params.search } },
      { plaka: { contains: params.search } },
    ]
  }

  if (params?.status) {
    where.başvuru_durumu = params.status
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        dealer: true,
        file_type: true,
        documents: true,
        payments: true,
        notes: true,
      },
      orderBy: { created_at: 'desc' },
      take: params?.perPage || 50,
      skip: params?.page ? (params.page - 1) * (params.perPage || 50) : 0,
    }),
    prisma.customer.count({ where }),
  ])

  return {
    customers: customers.map(c => ({
      ...c,
      id: Number(c.id),
      file_type_id: Number(c.file_type_id),
      dealer_id: c.dealer_id ? Number(c.dealer_id) : null,
    })),
    total,
  }
}

export async function getCustomer(id: number) {
  await requireAuth()

  const customer = await prisma.customer.findUnique({
    where: { id: BigInt(id) },
    include: {
      dealer: true,
      file_type: true,
      documents: {
        include: {
          uploader: true,
          approver: true,
        },
      },
      payments: {
        include: {
          recorder: true,
        },
      },
      notes: {
        include: {
          user: true,
        },
        orderBy: { created_at: 'desc' },
      },
    },
  })

  if (!customer) {
    throw new Error('Müşteri bulunamadı')
  }

  return {
    ...customer,
    id: Number(customer.id),
    file_type_id: Number(customer.file_type_id),
    dealer_id: customer.dealer_id ? Number(customer.dealer_id) : null,
  }
}

export async function createCustomer(data: {
  ad_soyad: string
  tc_no: string
  telefon: string
  email?: string
  plaka: string
  hasar_tarihi: Date
  file_type_id: number
  dealer_id?: number
  başvuru_durumu?: string
  evrak_durumu?: string
  dosya_kilitli?: boolean
}) {
  await requireAuth()

  const customer = await prisma.customer.create({
    data: {
      ...data,
      file_type_id: BigInt(data.file_type_id),
      dealer_id: data.dealer_id ? BigInt(data.dealer_id) : null,
    },
    include: {
      dealer: true,
      file_type: true,
    },
  })

  revalidatePath('/dashboard/customers')

  return {
    ...customer,
    id: Number(customer.id),
    file_type_id: Number(customer.file_type_id),
    dealer_id: customer.dealer_id ? Number(customer.dealer_id) : null,
  }
}

export async function updateCustomer(id: number, data: Partial<{
  ad_soyad: string
  tc_no: string
  telefon: string
  email: string
  plaka: string
  hasar_tarihi: Date
  file_type_id: number
  dealer_id: number
  başvuru_durumu: string
  evrak_durumu: string
  dosya_kilitli: boolean
  notlar: string
}>) {
  await requireAuth()

  const updateData: any = { ...data }
  if (data.file_type_id) updateData.file_type_id = BigInt(data.file_type_id)
  if (data.dealer_id) updateData.dealer_id = BigInt(data.dealer_id)

  const customer = await prisma.customer.update({
    where: { id: BigInt(id) },
    data: updateData,
    include: {
      dealer: true,
      file_type: true,
    },
  })

  revalidatePath('/dashboard/customers')
  revalidatePath(`/dashboard/customers/${id}`)

  return {
    ...customer,
    id: Number(customer.id),
    file_type_id: Number(customer.file_type_id),
    dealer_id: customer.dealer_id ? Number(customer.dealer_id) : null,
  }
}

export async function deleteCustomer(id: number) {
  await requireAuth()

  await prisma.customer.delete({
    where: { id: BigInt(id) },
  })

  revalidatePath('/dashboard/customers')

  return { success: true }
}

export async function closeCustomerFile(id: number, reason?: string) {
  await requireAuth()

  const customer = await prisma.customer.update({
    where: { id: BigInt(id) },
    data: {
      dosya_kilitli: true,
      başvuru_durumu: 'Tamamlandı',
      dosya_kapanma_nedeni: reason,
      dosya_kapanma_tarihi: new Date(),
    },
  })

  revalidatePath('/dashboard/customers')
  revalidatePath(`/dashboard/customers/${id}`)

  return {
    ...customer,
    id: Number(customer.id),
    file_type_id: Number(customer.file_type_id),
    dealer_id: customer.dealer_id ? Number(customer.dealer_id) : null,
  }
}

export async function addCustomerNote(customerId: number, content: string) {
  const user = await requireAuth()

  const note = await prisma.note.create({
    data: {
      customer_id: BigInt(customerId),
      user_id: BigInt(user.id),
      içerik: content,
    },
    include: {
      user: true,
    },
  })

  revalidatePath(`/dashboard/customers/${customerId}`)

  return {
    ...note,
    id: Number(note.id),
    customer_id: Number(note.customer_id),
    user_id: Number(note.user_id),
  }
}

