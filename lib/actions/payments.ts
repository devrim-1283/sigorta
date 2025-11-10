'use server'

import prisma from '@/lib/db'
import { requireAuth } from './auth'
import { revalidatePath } from 'next/cache'
import { Decimal } from '@prisma/client/runtime/library'

export async function getPayments(params?: {
  search?: string
  status?: string
  customerId?: number
}) {
  await requireAuth()

  const where: any = {}

  if (params?.search) {
    where.OR = [
      { açıklama: { contains: params.search, mode: 'insensitive' } },
      {
        customer: {
          ad_soyad: { contains: params.search, mode: 'insensitive' },
        },
      },
    ]
  }

  if (params?.status) {
    where.durum = params.status
  }

  if (params?.customerId) {
    where.customer_id = BigInt(params.customerId)
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      customer: true,
      recorder: true,
    },
    orderBy: { tarih: 'desc' },
  })

  return payments.map(p => ({
    ...p,
    id: Number(p.id),
    customer_id: Number(p.customer_id),
    kaydeden_id: Number(p.kaydeden_id),
    tutar: p.tutar.toString(),
  }))
}

export async function getPayment(id: number) {
  await requireAuth()

  const payment = await prisma.payment.findUnique({
    where: { id: BigInt(id) },
    include: {
      customer: true,
      recorder: true,
    },
  })

  if (!payment) {
    throw new Error('Ödeme bulunamadı')
  }

  return {
    ...payment,
    id: Number(payment.id),
    customer_id: Number(payment.customer_id),
    kaydeden_id: Number(payment.kaydeden_id),
    tutar: payment.tutar.toString(),
  }
}

export async function createPayment(data: {
  customer_id: number
  tutar: number | string
  tarih: Date
  açıklama?: string
  durum: string
  ödeme_yöntemi?: string
  referans_no?: string
}) {
  const user = await requireAuth()

  const payment = await prisma.payment.create({
    data: {
      customer_id: BigInt(data.customer_id),
      tutar: new Decimal(data.tutar.toString()),
      tarih: data.tarih,
      açıklama: data.açıklama,
      durum: data.durum,
      ödeme_yöntemi: data.ödeme_yöntemi,
      referans_no: data.referans_no,
      kaydeden_id: BigInt(user.id),
    },
    include: {
      customer: true,
    },
  })

  revalidatePath('/dashboard/payments')
  revalidatePath(`/dashboard/customers/${data.customer_id}`)

  return {
    ...payment,
    id: Number(payment.id),
    customer_id: Number(payment.customer_id),
    kaydeden_id: Number(payment.kaydeden_id),
    tutar: payment.tutar.toString(),
  }
}

export async function updatePayment(id: number, data: Partial<{
  tutar: number | string
  tarih: Date
  açıklama: string
  durum: string
  ödeme_yöntemi: string
  referans_no: string
}>) {
  await requireAuth()

  const updateData: any = { ...data }
  if (data.tutar) {
    updateData.tutar = new Decimal(data.tutar.toString())
  }

  const payment = await prisma.payment.update({
    where: { id: BigInt(id) },
    data: updateData,
  })

  revalidatePath('/dashboard/payments')

  return {
    ...payment,
    id: Number(payment.id),
    customer_id: Number(payment.customer_id),
    kaydeden_id: Number(payment.kaydeden_id),
    tutar: payment.tutar.toString(),
  }
}

export async function deletePayment(id: number) {
  await requireAuth()

  await prisma.payment.update({
    where: { id: BigInt(id) },
    data: { deleted_at: new Date() },
  })

  revalidatePath('/dashboard/payments')

  return { success: true }
}

