'use server'

import prisma from '@/lib/db'
import { requireAuth } from './auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

/**
 * Generate a secure random password
 */
function generateRandomPassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  const randomBytes = crypto.randomBytes(length)
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length]
  }
  
  return password
}

export async function getCustomers(params?: {
  search?: string
  status?: string
  page?: number
  perPage?: number
}) {
  try {
    await requireAuth()

    console.log('[getCustomers] Starting with params:', params)

    const where: any = {}

  if (params?.search) {
    where.OR = [
      { ad_soyad: { contains: params.search, mode: 'insensitive' } },
      { tc_no: { contains: params.search } },
      { telefon: { contains: params.search } },
      { plaka: { contains: params.search } },
    ]
  }

  if (params?.status && params.status !== 'all') {
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
      notes: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      },
      orderBy: { created_at: 'desc' },
      take: params?.perPage || 50,
      skip: params?.page ? (params.page - 1) * (params.perPage || 50) : 0,
    }),
    prisma.customer.count({ where }),
  ])

    console.log('[getCustomers] Fetched customers count:', customers.length)
    console.log('[getCustomers] First customer raw:', customers[0])

  // Serialize customers for Next.js (convert BigInt and Date to JSON-safe types)
  const result = {
    customers: customers.map(c => ({
      id: Number(c.id),
      ad_soyad: c.ad_soyad,
      tc_no: c.tc_no,
      telefon: c.telefon,
      email: c.email,
      plaka: c.plaka,
      hasar_tarihi: c.hasar_tarihi
        ? c.hasar_tarihi.toISOString().split('T')[0]
        : null,
      file_type_id: Number(c.file_type_id),
      dealer_id: c.dealer_id ? Number(c.dealer_id) : null,
      başvuru_durumu: c.başvuru_durumu,
      evrak_durumu: c.evrak_durumu,
      dosya_kilitli: c.dosya_kilitli,
      created_at: c.created_at ? c.created_at.toISOString() : new Date().toISOString(),
      updated_at: c.updated_at ? c.updated_at.toISOString() : new Date().toISOString(),
      file_type: c.file_type ? {
        id: Number(c.file_type.id),
        name: c.file_type.name,
      } : null,
      dealer: c.dealer ? {
        id: Number(c.dealer.id),
        dealer_name: c.dealer.dealer_name,
      } : null,
      documents: c.documents?.filter((d: any) => !d.deleted_at).map(d => ({
        id: Number(d.id),
        tip: d.tip,
        dosya_adı: (d as any).dosya_adı || (d as any).belge_adi || 'Belge',
        dosya_yolu: d.dosya_yolu,
        durum: d.durum,
        mime_type: d.mime_type,
        yüklenme_tarihi: d.created_at ? d.created_at.toISOString() : null,
      })) || [],
      payments: c.payments?.map(p => ({
        id: Number(p.id),
        tutar: Number(p.tutar),
        tarih: p.tarih.toISOString().split('T')[0],
        durum: p.durum,
      })) || [],
      notes: c.notes?.map(n => {
        const content = (n as any).içerik ?? (n as any).note ?? ''
        return {
          id: Number(n.id),
          content,
          created_at: n.created_at ? n.created_at.toISOString() : null,
          author: n.user ? {
            id: Number(n.user.id),
            name: n.user.name,
          } : null,
        }
      }).filter(n => Boolean(n.content?.trim())) || [],
    })),
    total,
  }

    console.log('[getCustomers] Serialized result count:', result.customers.length)
    console.log('[getCustomers] First serialized customer:', result.customers[0])
    
    return result
  } catch (error: any) {
    console.error('[getCustomers] ❌ ERROR:', error)
    console.error('[getCustomers] ❌ Error message:', error.message)
    console.error('[getCustomers] ❌ Error stack:', error.stack)
    console.error('[getCustomers] ❌ Error name:', error.name)
    
    // Re-throw with detailed message for debugging
    throw new Error(`getCustomers failed: ${error.message}`)
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
    id: Number(customer.id),
    ad_soyad: customer.ad_soyad,
    tc_no: customer.tc_no,
    telefon: customer.telefon,
    email: customer.email,
    plaka: customer.plaka,
    hasar_tarihi: customer.hasar_tarihi ? customer.hasar_tarihi.toISOString() : null,
    file_type_id: Number(customer.file_type_id),
    dealer_id: customer.dealer_id ? Number(customer.dealer_id) : null,
    başvuru_durumu: customer.başvuru_durumu,
    evrak_durumu: customer.evrak_durumu,
    dosya_kilitli: customer.dosya_kilitli,
    dosya_kapanma_nedeni: customer.dosya_kapanma_nedeni,
    dosya_kapanma_tarihi: customer.dosya_kapanma_tarihi ? customer.dosya_kapanma_tarihi.toISOString() : null,
    created_at: customer.created_at ? customer.created_at.toISOString() : null,
    updated_at: customer.updated_at ? customer.updated_at.toISOString() : null,
    dealer: customer.dealer
      ? {
          id: Number(customer.dealer.id),
          dealer_name: customer.dealer.dealer_name,
          contact_person: customer.dealer.contact_person,
          phone: customer.dealer.phone,
          email: customer.dealer.email,
        }
      : null,
    file_type: customer.file_type
      ? {
          id: Number(customer.file_type.id),
          name: customer.file_type.name,
          description: customer.file_type.description,
          required_for_approval: customer.file_type.required_for_approval,
        }
      : null,
    documents:
      customer.documents
        ?.filter((doc: any) => !doc.deleted_at)
        .map((doc: any) => ({
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
          uploaded_by: Number(doc.uploaded_by),
          onaylayan_id: doc.onaylayan_id ? Number(doc.onaylayan_id) : null,
          onay_tarihi: doc.onay_tarihi ? doc.onay_tarihi.toISOString() : null,
          created_at: doc.created_at ? doc.created_at.toISOString() : null,
          updated_at: doc.updated_at ? doc.updated_at.toISOString() : null,
          uploader: doc.uploader
            ? {
                id: Number(doc.uploader.id),
                name: doc.uploader.name,
                email: doc.uploader.email,
              }
            : null,
          approver: doc.approver
            ? {
                id: Number(doc.approver.id),
                name: doc.approver.name,
                email: doc.approver.email,
              }
            : null,
        })) || [],
    payments:
      customer.payments?.map((payment: any) => ({
        id: Number(payment.id),
        tutar: payment.tutar ? Number(payment.tutar) : null,
        tarih: payment.tarih ? payment.tarih.toISOString() : null,
        durum: payment.durum,
        açıklama: (payment as any).açıklama || payment.description || null,
        created_at: payment.created_at ? payment.created_at.toISOString() : null,
        updated_at: payment.updated_at ? payment.updated_at.toISOString() : null,
        recorder: payment.recorder
          ? {
              id: Number(payment.recorder.id),
              name: payment.recorder.name,
              email: payment.recorder.email,
            }
          : null,
      })) || [],
    notes:
      customer.notes?.map((note: any) => {
        const content = note.içerik ?? note.note ?? note.content ?? ''
        return {
          id: Number(note.id),
          content,
          created_at: note.created_at ? note.created_at.toISOString() : null,
          updated_at: note.updated_at ? note.updated_at.toISOString() : null,
          author: note.user
            ? {
                id: Number(note.user.id),
                name: note.user.name,
                email: note.user.email,
              }
            : null,
        }
      }).filter((note: any) => Boolean(note.content?.trim())) || [],
  }
}

export async function createCustomer(data: {
  ad_soyad: string
  tc_no: string
  telefon: string
  email?: string | null
  plaka: string
  hasar_tarihi: Date | string
  file_type_id?: number | null
  dosya_tipi_id?: number | null
  dealer_id?: number | null
  başvuru_durumu?: string
  evrak_durumu?: string
  dosya_kilitli?: boolean
}) {
  const user = await requireAuth()
  
  console.log('[createCustomer] Starting with data:', JSON.stringify(data, null, 2))

  try {
    // Check duplicate customer by TC No, phone, or plate before attempting to create
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          { tc_no: data.tc_no },
          { telefon: data.telefon },
          { plaka: data.plaka },
        ],
      },
      select: {
        id: true,
        tc_no: true,
        telefon: true,
        plaka: true,
        ad_soyad: true,
      },
    })

    if (existingCustomer) {
      const conflicts: string[] = []
      if (existingCustomer.tc_no === data.tc_no) {
        conflicts.push('TC No')
      }
      if (existingCustomer.telefon === data.telefon) {
        conflicts.push('Telefon')
      }
      if (existingCustomer.plaka === data.plaka) {
        conflicts.push('Plaka')
      }

      const conflictFields = conflicts.join(', ')
      throw new Error(
        `Bu ${conflictFields || 'bilgiler'} ile kayıtlı bir müşteri zaten var. Lütfen mevcut kaydı güncelleyin.`
      )
    }

    // Handle field name variations and type conversions
    const fileTypeId = data.file_type_id || data.dosya_tipi_id
    const hasarTarihi = typeof data.hasar_tarihi === 'string' 
      ? new Date(data.hasar_tarihi) 
      : data.hasar_tarihi

    console.log('[createCustomer] Processed values:', { fileTypeId, hasarTarihi })

    if (!fileTypeId) {
      throw new Error('Dosya tipi gereklidir')
    }

    // Validate required fields
    if (!data.ad_soyad || !data.tc_no || !data.telefon || !data.plaka) {
      throw new Error('Ad Soyad, TC No, Telefon ve Plaka gereklidir')
    }

    // Create customer data object
    const customerData = {
      ad_soyad: data.ad_soyad,
      tc_no: data.tc_no,
      telefon: data.telefon,
      email: data.email || null,
      plaka: data.plaka,
      hasar_tarihi: hasarTarihi,
      file_type_id: BigInt(fileTypeId),
      dealer_id: data.dealer_id ? BigInt(data.dealer_id) : null,
      başvuru_durumu: data.başvuru_durumu || 'İnceleniyor',
      evrak_durumu: data.evrak_durumu || 'Eksik',
      dosya_kilitli: data.dosya_kilitli || false,
    }

    console.log('[createCustomer] Creating customer with data:', customerData)

    // Create customer first
    const customer = await prisma.customer.create({
      data: customerData,
      include: {
        dealer: true,
        file_type: true,
      },
    })

    console.log('[createCustomer] Customer created successfully:', customer.id)

    // Auto-create user account for customer with role 'musteri'
    let loginCredentials = null
    try {
      // Get musteri role
      const musteriRole = await prisma.role.findFirst({
        where: { name: 'musteri' }
      })

      if (!musteriRole) {
        console.error('Musteri role not found in database')
      } else {
        // Check if user already exists with this TC No or phone
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { tc_no: data.tc_no },
              { phone: data.telefon },
              ...(data.email ? [{ email: data.email }] : [])
            ]
          }
        })

        if (!existingUser) {
          // Generate random password
          const randomPassword = generateRandomPassword(12)
          const hashedPassword = await bcrypt.hash(randomPassword, 12)

          // Create user account
          const newUser = await prisma.user.create({
            data: {
              name: data.ad_soyad,
              tc_no: data.tc_no,
              phone: data.telefon,
              email: data.email || null,
              password: hashedPassword,
              role_id: musteriRole.id,
              is_active: true,
            }
          })

          console.log('Customer user account created:', {
            userId: Number(newUser.id),
            username: data.tc_no || data.telefon || data.email,
            password: randomPassword,
          })

          loginCredentials = {
            username: data.tc_no || data.telefon || data.email,
            password: randomPassword,
            loginUrl: '/musteri-giris'
          }
        } else {
          console.log('User already exists for this customer, skipping user creation')
        }
      }
    } catch (error) {
      console.error('Failed to create user account for customer:', error)
      // Continue even if user creation fails - customer is already created
    }

    revalidatePath('/dashboard/customers')
    revalidatePath('/admin/musteriler')

    // Serialize the customer object for Next.js (convert BigInt and Date to JSON-safe types)
    const result = {
      id: Number(customer.id),
      ad_soyad: customer.ad_soyad,
      tc_no: customer.tc_no,
      telefon: customer.telefon,
      email: customer.email,
      plaka: customer.plaka,
      hasar_tarihi: customer.hasar_tarihi
        ? customer.hasar_tarihi.toISOString().split('T')[0]
        : null,
      file_type_id: Number(customer.file_type_id),
      dealer_id: customer.dealer_id ? Number(customer.dealer_id) : null,
      başvuru_durumu: customer.başvuru_durumu,
      evrak_durumu: customer.evrak_durumu,
      dosya_kilitli: customer.dosya_kilitli,
      dosya_kapanma_nedeni: customer.dosya_kapanma_nedeni,
      dosya_kapanma_tarihi: customer.dosya_kapanma_tarihi?.toISOString() || null,
      notlar: customer.notlar,
      created_at: customer.created_at ? customer.created_at.toISOString() : null,
      updated_at: customer.updated_at ? customer.updated_at.toISOString() : null,
      file_type: customer.file_type ? {
        id: Number(customer.file_type.id),
        name: customer.file_type.name,
        description: customer.file_type.description,
        required_for_approval: customer.file_type.required_for_approval,
      } : null,
      dealer: customer.dealer ? {
        id: Number(customer.dealer.id),
        dealer_name: customer.dealer.dealer_name,
        contact_person: customer.dealer.contact_person,
        phone: customer.dealer.phone,
        email: customer.dealer.email,
      } : null,
      ...(loginCredentials && { loginCredentials })
    }

    console.log('[createCustomer] Returning serialized result')
    
    return result
  } catch (error: any) {
    console.error('[createCustomer] Error occurred:', error)
    console.error('[createCustomer] Error stack:', error.stack)
    console.error('[createCustomer] Error name:', error.name)
    console.error('[createCustomer] Error message:', error.message)
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      throw new Error('Bu TC No, Telefon veya Plaka ile kayıtlı bir müşteri zaten var')
    }
    if (error.code === 'P2003') {
      throw new Error('Seçilen dosya tipi veya bayi bulunamadı')
    }
    
    throw new Error(error.message || 'Müşteri oluşturulamadı')
  }
}

export async function updateCustomer(id: number, data: Partial<{
  ad_soyad: string
  tc_no: string
  telefon: string
  email: string
  plaka: string
  hasar_tarihi: Date | string
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
  if (data.hasar_tarihi) {
    updateData.hasar_tarihi =
      typeof data.hasar_tarihi === 'string'
        ? new Date(data.hasar_tarihi)
        : data.hasar_tarihi
  }

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

export async function closeCustomerFile(id: number, reason: string) {
  await requireAuth()

  const customer = await prisma.customer.update({
    where: { id: BigInt(id) },
    data: {
      dosya_kilitli: true,
      başvuru_durumu: 'Dosya Kapatıldı',
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

/**
 * Check and auto-transition customer status based on uploaded documents
 */
export async function checkAndUpdateCustomerStatus(customerId: number) {
  await requireAuth()

  // Get customer with documents
  const customer = await prisma.customer.findUnique({
    where: { id: BigInt(customerId) },
    include: {
      documents: true,
      file_type: {
        include: {
          required_documents: true
        }
      }
    }
  })

  if (!customer) {
    throw new Error('Müşteri bulunamadı')
  }

  // If status is "Evrak Aşamasında", check if all required documents are uploaded
  if (customer.başvuru_durumu === 'Evrak Aşamasında') {
    const requiredDocs = customer.file_type.required_documents || []
    
    if (requiredDocs.length > 0) {
      // Check if all required documents are uploaded
      const uploadedDocNames = customer.documents.map(doc => doc.tip.toLowerCase())
      const allRequiredUploaded = requiredDocs.every(reqDoc =>
        uploadedDocNames.some(uploaded => uploaded.includes(reqDoc.document_name.toLowerCase()))
      )

      if (allRequiredUploaded) {
        // Auto-transition to "Başvuru Aşamasında"
        await prisma.customer.update({
          where: { id: BigInt(customerId) },
          data: {
            başvuru_durumu: 'Başvuru Aşamasında',
            evrak_durumu: 'Tamam'
          }
        })

        revalidatePath(`/dashboard/customers/${customerId}`)
        revalidatePath('/dashboard/customers')
    revalidatePath('/admin/musteriler')

        return {
          statusChanged: true,
          newStatus: 'Başvuru Aşamasında'
        }
      }
    }
  }

  return {
    statusChanged: false,
    newStatus: customer.başvuru_durumu
  }
}

