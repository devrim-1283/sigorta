'use server'

import prisma from '@/lib/db'
import { requireAuth } from './auth'
import { revalidatePath } from 'next/cache'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export async function getDocuments(params?: {
  search?: string
  type?: string
  status?: string
  customerId?: number
}) {
  await requireAuth()

  const where: any = {}

  if (params?.search) {
    where.OR = [
      { belge_adi: { contains: params.search, mode: 'insensitive' } },
      {
        customer: {
          ad_soyad: { contains: params.search, mode: 'insensitive' },
        },
      },
    ]
  }

  if (params?.type) {
    where.tip = params.type
  }

  if (params?.status) {
    where.durum = params.status
  }

  if (params?.customerId) {
    where.customer_id = BigInt(params.customerId)
  }

  const documents = await prisma.document.findMany({
    where,
    include: {
      customer: true,
      uploader: true,
      approver: true,
    },
    orderBy: { created_at: 'desc' },
  })

  return documents.map(d => ({
    ...d,
    id: Number(d.id),
    customer_id: Number(d.customer_id),
    uploaded_by: Number(d.uploaded_by),
    onaylayan_id: d.onaylayan_id ? Number(d.onaylayan_id) : null,
  }))
}

export async function getDocument(id: number) {
  await requireAuth()

  const document = await prisma.document.findUnique({
    where: { id: BigInt(id) },
    include: {
      customer: true,
      uploader: true,
      approver: true,
    },
  })

  if (!document) {
    throw new Error('Döküman bulunamadı')
  }

  return {
    ...document,
    id: Number(document.id),
    customer_id: Number(document.customer_id),
    uploaded_by: Number(document.uploaded_by),
    onaylayan_id: document.onaylayan_id ? Number(document.onaylayan_id) : null,
  }
}

export async function updateDocument(id: number, data: Partial<{
  belge_adi: string
  tip: string
  durum: string
  red_nedeni: string
}>) {
  const user = await requireAuth()

  const updateData: any = { ...data }
  
  // If approving, set approval data
  if (data.durum === 'Onaylandı') {
    updateData.onay_tarihi = new Date()
    updateData.onaylayan_id = BigInt(user.id)
  }

  const document = await prisma.document.update({
    where: { id: BigInt(id) },
    data: updateData,
  })

  revalidatePath('/dashboard/documents')

  return {
    ...document,
    id: Number(document.id),
    customer_id: Number(document.customer_id),
    uploaded_by: Number(document.uploaded_by),
    onaylayan_id: document.onaylayan_id ? Number(document.onaylayan_id) : null,
  }
}

export async function deleteDocument(id: number) {
  await requireAuth()

  const document = await prisma.document.findUnique({
    where: { id: BigInt(id) },
  })

  if (!document) {
    throw new Error('Döküman bulunamadı')
  }

  // Delete file from filesystem
  const filePath = path.join(process.cwd(), 'public', document.dosya_yolu)
  if (existsSync(filePath)) {
    await unlink(filePath)
  }

  // Soft delete
  await prisma.document.update({
    where: { id: BigInt(id) },
    data: { deleted_at: new Date() },
  })

  revalidatePath('/dashboard/documents')

  return { success: true }
}

export async function getDocumentDownloadUrl(id: number) {
  await requireAuth()

  const document = await prisma.document.findUnique({
    where: { id: BigInt(id) },
  })

  if (!document) {
    throw new Error('Döküman bulunamadı')
  }

  return {
    url: document.dosya_yolu,
    filename: document.belge_adi,
  }
}

export async function uploadDocument(formData: FormData) {
  await requireAuth()

  // This will be handled by /api/upload route
  // This function is just a wrapper for consistency
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Dosya yüklenemedi')
  }

  const data = await response.json()
  
  revalidatePath('/dashboard/documents')
  
  return data.document
}

