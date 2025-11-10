'use server'

import prisma from '@/lib/db'
import { requireAuth } from './auth'
import { revalidatePath } from 'next/cache'

/**
 * Get all result documents for a customer
 */
export async function getResultDocuments(customerId: number) {
  await requireAuth()

  const documents = await prisma.document.findMany({
    where: {
      customer_id: BigInt(customerId),
      is_result_document: true,
    },
    include: {
      result_document_type: true,
      uploader: true,
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  return documents.map(doc => ({
    ...doc,
    id: Number(doc.id),
    customer_id: Number(doc.customer_id),
    uploaded_by: Number(doc.uploaded_by),
    result_document_type_id: doc.result_document_type_id ? Number(doc.result_document_type_id) : null,
  }))
}

/**
 * Upload a result document
 */
export async function uploadResultDocument(data: {
  customer_id: number
  result_document_type_id: number
  file_path: string
  file_name: string
  file_size: number
  mime_type: string
}) {
  const user = await requireAuth()

  // Check if user has permission to upload result documents
  const userRole = user.role?.name?.toLowerCase()
  const allowedRoles = ['superadmin', 'birincil-admin', 'ikincil-admin']
  
  if (!allowedRoles.includes(userRole || '')) {
    throw new Error('Bu işlem için yetkiniz yok')
  }

  // Get result document type info
  const resultDocType = await prisma.resultDocumentType.findUnique({
    where: { id: BigInt(data.result_document_type_id) }
  })

  if (!resultDocType) {
    throw new Error('Geçersiz sonuç evrak tipi')
  }

  const document = await prisma.document.create({
    data: {
      customer_id: BigInt(data.customer_id),
      belge_adi: resultDocType.name,
      dosya_yolu: data.file_path,
      dosya_adi_orijinal: data.file_name,
      dosya_boyutu: BigInt(data.file_size),
      mime_type: data.mime_type,
      tip: resultDocType.name,
      durum: 'Onaylandı',
      is_result_document: true,
      result_document_type_id: BigInt(data.result_document_type_id),
      uploaded_by: BigInt(user.id),
      onay_tarihi: new Date(),
      onaylayan_id: BigInt(user.id),
    },
    include: {
      result_document_type: true,
      uploader: true,
    }
  })

  revalidatePath(`/dashboard/customers/${data.customer_id}`)

  return {
    ...document,
    id: Number(document.id),
    customer_id: Number(document.customer_id),
    uploaded_by: Number(document.uploaded_by),
    onaylayan_id: document.onaylayan_id ? Number(document.onaylayan_id) : null,
    result_document_type_id: document.result_document_type_id ? Number(document.result_document_type_id) : null,
  }
}

/**
 * Delete a result document
 */
export async function deleteResultDocument(id: number) {
  const user = await requireAuth()

  // Check if user has permission to delete result documents
  const userRole = user.role?.name?.toLowerCase()
  const allowedRoles = ['superadmin', 'birincil-admin', 'ikincil-admin']
  
  if (!allowedRoles.includes(userRole || '')) {
    throw new Error('Bu işlem için yetkiniz yok')
  }

  // Get the document first to get customer_id for revalidation
  const document = await prisma.document.findUnique({
    where: { id: BigInt(id) }
  })

  if (!document) {
    throw new Error('Evrak bulunamadı')
  }

  await prisma.document.delete({
    where: { id: BigInt(id) }
  })

  revalidatePath(`/dashboard/customers/${Number(document.customer_id)}`)

  return { success: true }
}

/**
 * Get all result document types
 */
export async function getResultDocumentTypes() {
  await requireAuth()

  const types = await prisma.resultDocumentType.findMany({
    orderBy: { display_order: 'asc' }
  })

  return types.map(type => ({
    ...type,
    id: Number(type.id),
  }))
}

