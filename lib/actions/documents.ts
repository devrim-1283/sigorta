'use server'

import prisma from '@/lib/db'
import { requireAuth } from './auth'
import { revalidatePath } from 'next/cache'
import { writeFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import {
  ensureDocumentsDir,
  getDocumentRelativePath,
  getDocumentStoragePath,
  resolveDocumentPath,
} from '@/lib/storage'

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

export async function uploadDocument(formData: FormData) {
  const user = await requireAuth()

  try {
    // Get form data
    const file = formData.get('file') as File
    const customer_id = formData.get('customer_id') as string
    const tipFromForm = formData.get('tip') as string | null
    const documentTypeFromForm = formData.get('document_type') as string | null
    const originalNameFromForm =
      (formData.get('original_name') as string | null) ||
      (formData.get('belge_adi') as string | null)

    if (!file || !customer_id) {
      throw new Error('File ve customer_id gerekli')
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('Dosya boyutu 10MB\'dan büyük olamaz')
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ]
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Geçersiz dosya tipi. Sadece resim ve PDF dosyaları yüklenebilir.')
    }

    // Generate file path within local storage
    const timestamp = Date.now()
    const ext = file.name.split('.').pop()
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`
    ensureDocumentsDir()
    const absolutePath = getDocumentStoragePath(filename)
    const relativePath = getDocumentRelativePath(filename)

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(absolutePath, buffer)

    // Create document record in database
    const data: any = {
      customer_id: BigInt(customer_id),
      dosya_yolu: relativePath,
      mime_type: file.type,
      dosya_boyutu: BigInt(file.size),
      tip: tipFromForm || documentTypeFromForm || 'Diğer',
      document_type: documentTypeFromForm || tipFromForm || 'Standart Evrak',
      durum: 'Beklemede',
      uploaded_by: BigInt(user.id),
      created_at: new Date(),
      updated_at: new Date(),
    }

    const originalName = originalNameFromForm || file.name
    data['dosya_adı'] = originalName

    const document = await prisma.document.create({ data })

    revalidatePath('/admin/musteriler')
    revalidatePath('/dashboard/documents')
    revalidatePath('/dashboard/customers')

    return {
      ...document,
      id: Number(document.id),
      customer_id: Number(document.customer_id),
      uploaded_by: Number(document.uploaded_by),
      dosya_boyutu: Number(document.dosya_boyutu),
    }
  } catch (error: any) {
    console.error('Upload document error:', error)
    throw new Error(error.message || 'Dosya yüklenemedi')
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

  const filePath = resolveDocumentPath(document.dosya_yolu)
  if (filePath && existsSync(filePath)) {
    await unlink(filePath)
  }

  await prisma.document.update({
    where: { id: BigInt(id) },
    data: { deleted_at: new Date() },
  })

  revalidatePath('/dashboard/documents')
  revalidatePath('/admin/musteriler')

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

  const originalName =
    (document as any).dosya_adı ||
    document.dosya_yolu?.split('/').pop() ||
    'document'

  return {
    url: `/api/documents/${id}/download`,
    filename: originalName,
  }
}

