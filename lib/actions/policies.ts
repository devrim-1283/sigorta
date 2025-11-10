'use server'

import prisma from '@/lib/db'
import { requireAuth } from './auth'
import { revalidatePath } from 'next/cache'
import { Decimal } from '@prisma/client/runtime/library'

export async function getPolicies(params?: {
  search?: string
  status?: string
  limit?: number
}) {
  await requireAuth()

  const where: any = {}

  if (params?.search) {
    where.OR = [
      { policy_number: { contains: params.search } },
      {
        customer: {
          ad_soyad: { contains: params.search, mode: 'insensitive' },
        },
      },
    ]
  }

  if (params?.status) {
    where.status = params.status
  }

  const policies = await prisma.policy.findMany({
    where,
    include: {
      customer: true,
    },
    orderBy: { created_at: 'desc' },
    take: params?.limit,
  })

  return policies.map(p => ({
    ...p,
    id: Number(p.id),
    customer_id: Number(p.customer_id),
    premium: p.premium.toString(),
    coverage_amount: p.coverage_amount?.toString(),
  }))
}

export async function createPolicy(data: {
  customer_id: number
  policy_number?: string
  policy_type: string
  company: string
  premium: number | string
  coverage_amount?: number | string
  start_date: Date
  end_date: Date
  status?: string
  notes?: string
}) {
  await requireAuth()

  const policy = await prisma.policy.create({
    data: {
      customer_id: BigInt(data.customer_id),
      policy_number: data.policy_number,
      policy_type: data.policy_type,
      company: data.company,
      premium: new Decimal(data.premium.toString()),
      coverage_amount: data.coverage_amount ? new Decimal(data.coverage_amount.toString()) : null,
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status || 'active',
      notes: data.notes,
    },
  })

  revalidatePath('/dashboard/policies')

  return {
    ...policy,
    id: Number(policy.id),
    customer_id: Number(policy.customer_id),
    premium: policy.premium.toString(),
    coverage_amount: policy.coverage_amount?.toString(),
  }
}

export async function getPolicy(id: number) {
  await requireAuth()

  const policy = await prisma.policy.findUnique({
    where: { id: BigInt(id) },
    include: {
      customer: true,
    },
  })

  if (!policy) {
    throw new Error('Poliçe bulunamadı')
  }

  return {
    ...policy,
    id: Number(policy.id),
    customer_id: Number(policy.customer_id),
    premium: policy.premium.toString(),
    coverage_amount: policy.coverage_amount?.toString(),
  }
}

export async function updatePolicy(
  id: number,
  data: Partial<{
    policy_number: string
    policy_type: string
    company: string
    premium: number | string
    coverage_amount: number | string
    start_date: Date
    end_date: Date
    status: string
    notes: string
  }>
) {
  await requireAuth()

  const updateData: any = { ...data }
  if (data.premium) updateData.premium = new Decimal(data.premium.toString())
  if (data.coverage_amount) updateData.coverage_amount = new Decimal(data.coverage_amount.toString())

  const policy = await prisma.policy.update({
    where: { id: BigInt(id) },
    data: updateData,
  })

  revalidatePath('/dashboard/policies')

  return {
    ...policy,
    id: Number(policy.id),
    customer_id: Number(policy.customer_id),
    premium: policy.premium.toString(),
    coverage_amount: policy.coverage_amount?.toString(),
  }
}

export async function deletePolicy(id: number) {
  await requireAuth()

  await prisma.policy.delete({
    where: { id: BigInt(id) },
  })

  revalidatePath('/dashboard/policies')

  return { success: true }
}

