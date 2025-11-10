'use server'

import prisma from '@/lib/db'
import { requireAuth } from './auth'
import { revalidatePath } from 'next/cache'
import { Decimal } from '@prisma/client/runtime/library'

export async function getClaims(params?: {
  search?: string
  status?: string
  limit?: number
}) {
  await requireAuth()

  const where: any = {}

  if (params?.search) {
    where.OR = [
      { claim_number: { contains: params.search } },
      { description: { contains: params.search, mode: 'insensitive' } },
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

  const claims = await prisma.claim.findMany({
    where,
    include: {
      customer: true,
      handler: true,
    },
    orderBy: { created_at: 'desc' },
    take: params?.limit,
  })

  return claims.map(c => ({
    ...c,
    id: Number(c.id),
    customer_id: Number(c.customer_id),
    handled_by: c.handled_by ? Number(c.handled_by) : null,
    claim_amount: c.claim_amount?.toString(),
    approved_amount: c.approved_amount?.toString(),
  }))
}

export async function createClaim(data: {
  customer_id: number
  claim_number?: string
  claim_date: Date
  incident_date: Date
  description: string
  claim_amount?: number | string
  status?: string
}) {
  await requireAuth()

  const claim = await prisma.claim.create({
    data: {
      customer_id: BigInt(data.customer_id),
      claim_number: data.claim_number,
      claim_date: data.claim_date,
      incident_date: data.incident_date,
      description: data.description,
      claim_amount: data.claim_amount ? new Decimal(data.claim_amount.toString()) : null,
      status: data.status || 'pending',
    },
  })

  revalidatePath('/dashboard/claims')

  return {
    ...claim,
    id: Number(claim.id),
    customer_id: Number(claim.customer_id),
    claim_amount: claim.claim_amount?.toString(),
  }
}

export async function getPendingClaims() {
  await requireAuth()

  const claims = await prisma.claim.findMany({
    where: { status: 'pending' },
    include: {
      customer: true,
    },
    orderBy: { created_at: 'desc' },
  })

  return claims.map(c => ({
    ...c,
    id: Number(c.id),
    customer_id: Number(c.customer_id),
    claim_amount: c.claim_amount?.toString(),
  }))
}

