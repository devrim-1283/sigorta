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
  await requireAuth()

  // Handle field name variations and type conversions
  const fileTypeId = data.file_type_id || data.dosya_tipi_id
  const hasarTarihi = typeof data.hasar_tarihi === 'string' 
    ? new Date(data.hasar_tarihi) 
    : data.hasar_tarihi

  if (!fileTypeId) {
    throw new Error('Dosya tipi gereklidir')
  }

  // Create customer first
  const customer = await prisma.customer.create({
    data: {
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
    },
    include: {
      dealer: true,
      file_type: true,
    },
  })

  // Auto-create user account for customer with role 'musteri'
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
          password: randomPassword, // This will be shown to Evrak Birimi
        })

        // Return customer with login credentials
        revalidatePath('/dashboard/customers')

        return {
          ...customer,
          id: Number(customer.id),
          file_type_id: Number(customer.file_type_id),
          dealer_id: customer.dealer_id ? Number(customer.dealer_id) : null,
          loginCredentials: {
            username: data.tc_no || data.telefon || data.email,
            password: randomPassword,
            loginUrl: '/musteri-giris'
          }
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

