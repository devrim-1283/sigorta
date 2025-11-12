'use server'

import prisma from '@/lib/db'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { writeFile, unlink, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fileTypeFromBuffer } from 'file-type'
import {
  ensureDocumentsDir,
  getDocumentRelativePath,
  getDocumentStoragePath,
  resolveDocumentPath,
} from '@/lib/storage'
import { createNotification } from './notifications'

type DocumentRecord = Awaited<ReturnType<typeof prisma.document.findFirst>>

function serializeDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null
}

function serializeDocument(doc: NonNullable<DocumentRecord>) {
  return {
    id: Number(doc.id),
    customer_id: Number(doc.customer_id),
    tip: doc.tip,
    dosya_adı: (doc as any).dosya_adı || (doc as any).belge_adi || 'Belge',
    dosya_yolu: doc.dosya_yolu,
    dosya_boyutu: doc.dosya_boyutu ? Number(doc.dosya_boyutu) : null,
    mime_type: doc.mime_type,
    durum: doc.durum,
    red_nedeni: doc.red_nedeni,
    document_type: doc.document_type,
    is_result_document: doc.is_result_document,
    result_document_type_id: doc.result_document_type_id ? Number(doc.result_document_type_id) : null,
    uploaded_by: Number(doc.uploaded_by),
    onaylayan_id: doc.onaylayan_id ? Number(doc.onaylayan_id) : null,
    onay_tarihi: serializeDate(doc.onay_tarihi),
    created_at: serializeDate(doc.created_at),
    updated_at: serializeDate(doc.updated_at),
  }
}

export async function getDocuments(params?: {
  search?: string
  type?: string
  status?: string
  customerId?: number
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Oturum açmanız gerekiyor')
  }

  const where: any = {}

  if (params?.search) {
    where.OR = [
      { dosya_adı: { contains: params.search, mode: 'insensitive' } },
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
    where: {
      ...where,
      deleted_at: null, // Only include non-deleted documents
    },
    include: {
      customer: true,
      uploader: true,
      approver: true,
    },
    orderBy: { created_at: 'desc' },
  })

  return documents.map(d => ({
    ...serializeDocument(d),
    customer: d.customer
      ? {
          id: Number(d.customer.id),
          ad_soyad: d.customer.ad_soyad,
          dealer_id: d.customer.dealer_id ? Number(d.customer.dealer_id) : null,
        }
      : null,
    uploader: d.uploader
      ? {
          id: Number(d.uploader.id),
          name: d.uploader.name,
          email: d.uploader.email,
        }
      : null,
    approver: d.approver
      ? {
          id: Number(d.approver.id),
          name: d.approver.name,
          email: d.approver.email,
        }
      : null,
  }))
}

// Get document statistics including deleted ones
export async function getDocumentStats() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Oturum açmanız gerekiyor')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalDocuments,
    uploadedToday,
    deletedToday,
  ] = await Promise.all([
    prisma.document.count({ where: { deleted_at: null } }),
    prisma.document.count({
      where: {
        deleted_at: null,
        created_at: { gte: today },
      },
    }),
    prisma.document.count({
      where: {
        deleted_at: { gte: today },
      },
    }),
  ])

  return {
    totalDocuments,
    uploadedToday,
    deletedToday,
  }
}

export async function getDocument(id: number) {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Oturum açmanız gerekiyor')
  }

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
    ...serializeDocument(document),
    customer: document.customer
      ? {
          id: Number(document.customer.id),
          ad_soyad: document.customer.ad_soyad,
        }
      : null,
    uploader: document.uploader
      ? {
          id: Number(document.uploader.id),
          name: document.uploader.name,
          email: document.uploader.email,
        }
      : null,
    approver: document.approver
      ? {
          id: Number(document.approver.id),
          name: document.approver.name,
          email: document.approver.email,
        }
      : null,
  }
}

export async function updateDocument(id: number, data: Partial<{
  belge_adi: string
  tip: string
  durum: string
  red_nedeni: string
}>) {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Oturum açmanız gerekiyor')
  }

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
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Oturum açmanız gerekiyor')
  }

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

    // Validate file type (client-side MIME type check)
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

    // Save file to memory first for content validation
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validate actual file content (prevent MIME type spoofing)
    const fileType = await fileTypeFromBuffer(buffer)
    if (!fileType) {
      throw new Error('Dosya tipi tespit edilemedi. Geçersiz dosya.')
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ]

    if (!allowedMimeTypes.includes(fileType.mime)) {
      throw new Error(`Geçersiz dosya içeriği. Beklenen: resim veya PDF, Tespit edilen: ${fileType.mime}`)
    }

    // Sanitize filename to prevent path traversal
    function sanitizeFilename(filename: string): string {
      const basename = path.basename(filename)
      return basename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 255)
    }

    // Generate file path within local storage
    const timestamp = Date.now()
    const originalExt = file.name.split('.').pop() || fileType.ext || 'bin'
    const sanitizedExt = sanitizeFilename(originalExt).split('.').pop() || fileType.ext || 'bin'
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${sanitizedExt}`
    ensureDocumentsDir()
    const absolutePath = getDocumentStoragePath(filename)
    const relativePath = getDocumentRelativePath(filename)

    // Save file to disk
    await writeFile(absolutePath, buffer)

    // Verify file was written successfully
    if (!existsSync(absolutePath)) {
      throw new Error('Dosya kaydedilemedi')
    }

    const fileStats = await stat(absolutePath)
    if (fileStats.size === 0) {
      throw new Error('Dosya boş olarak kaydedildi')
    }


    // Create document record in database
    const data: any = {
      customer_id: BigInt(customer_id),
      dosya_yolu: relativePath,
      mime_type: fileType.mime, // Use detected MIME type instead of client-provided
      dosya_boyutu: BigInt(file.size),
      tip: tipFromForm || documentTypeFromForm || 'Diğer',
      document_type: documentTypeFromForm || tipFromForm || 'Standart Evrak',
      durum: 'Beklemede',
      uploaded_by: BigInt(user.id),
      created_at: new Date(),
      updated_at: new Date(),
    }

    // Sanitize original filename to prevent path traversal
    const originalName = sanitizeFilename(originalNameFromForm || file.name)
    data['dosya_adı'] = originalName

    const document = await prisma.document.create({ 
      data,
      include: {
        customer: {
          include: {
            dealer: true,
          },
        },
      },
    })

    revalidatePath('/admin/musteriler')
    revalidatePath('/dashboard/documents')
    revalidatePath('/dashboard/customers')

    // Send notifications
    try {
      const customer = document.customer
      const docType = tipFromForm || documentTypeFromForm || 'Evrak'
      
      // Notify admins and evrak birimi
      await createNotification({
        title: 'Yeni Evrak Yüklendi',
        message: `${customer.ad_soyad} adlı müşteri için "${docType}" evrakı yüklendi.`,
        type: 'info',
        link: `/admin/musteriler/${customer_id}`,
        roles: ['superadmin', 'birincil-admin', 'evrak-birimi'],
        excludeUserId: user.id,
      })
      
      // Notify dealer if customer has a dealer
      if (customer.dealer_id) {
        const dealerUser = await prisma.user.findFirst({
          where: {
            dealer_id: customer.dealer_id,
            is_active: true,
          },
          select: { id: true },
        })
        
        if (dealerUser) {
          await createNotification({
            title: 'Müşteriniz İçin Evrak Yüklendi',
            message: `${customer.ad_soyad} adlı müşteriniz için "${docType}" evrakı yüklendi.`,
            type: 'info',
            link: `/admin/musteriler/${customer_id}`,
            userIds: [Number(dealerUser.id)],
          })
        }
      }
      
      // Notify customer
      const customerUser = await prisma.user.findFirst({
        where: {
          OR: [
            { tc_no: customer.tc_no },
            { phone: customer.telefon },
          ],
          is_active: true,
        },
        select: { id: true },
      })
      
      if (customerUser) {
        await createNotification({
          title: 'Evrakınız Yüklendi',
          message: `"${docType}" evrakınız sisteme yüklendi ve inceleniyor.`,
          type: 'success',
          link: `/admin/musteriler`,
          userIds: [Number(customerUser.id)],
        })
      }
    } catch (notifError) {
      console.error('Notification error (non-critical):', notifError)
    }

    return serializeDocument(document)
  } catch (error: any) {
    console.error('Upload document error:', error)
    // Re-throw with a clear message for production
    const errorMessage = error.message || 'Dosya yüklenemedi'
    const enhancedError = new Error(errorMessage)
    // Preserve the original error for debugging
    if (error.stack) {
      console.error('Original error stack:', error.stack)
    }
    throw enhancedError
  }
}

export async function deleteDocument(id: number) {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Oturum açmanız gerekiyor')
  }

  const document = await prisma.document.findUnique({
    where: { id: BigInt(id) },
  })

  if (!document) {
    throw new Error('Döküman bulunamadı')
  }

  // Try to delete physical file
  try {
    const filePath = resolveDocumentPath(document.dosya_yolu)
    if (filePath && existsSync(filePath)) {
      await unlink(filePath)
    }
  } catch (fileError) {
    console.error('File deletion error (continuing with DB delete):', fileError)
    // Continue even if file deletion fails
  }

  // Soft delete from database
  await prisma.document.update({
    where: { id: BigInt(id) },
    data: {
      deleted_at: new Date(),
    },
  })

  revalidatePath('/dashboard/documents')
  revalidatePath('/admin/musteriler')

  return { success: true }
}

export async function getDocumentDownloadUrl(id: number) {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Oturum açmanız gerekiyor')
  }

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

