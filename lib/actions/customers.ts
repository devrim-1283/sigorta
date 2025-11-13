'use server'

import prisma from '@/lib/db'
import { requireAuth, getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { validatePhone, validateTCNo } from '@/lib/validation'
import { createNotification } from './notifications'

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
    const user = await getCurrentUser()

    const where: any = {}

    // For customer role, filter by their TC number
    if (user?.role?.name === 'musteri' && user?.tc_no) {
      where.tc_no = user.tc_no
    }

    // For dealer (bayi) role, filter by their dealer_id
    if (user?.role?.name === 'bayi' && user?.dealer_id) {
      where.dealer_id = BigInt(user.dealer_id)
    }

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
      documents: c.documents?.map(d => ({
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
    
    return result
  } catch (error: any) {
    console.error('[getCustomers] Error:', error.message)
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
          creator: true,
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
    sigortadan_yatan_tutar: customer.sigortadan_yatan_tutar ? Number(customer.sigortadan_yatan_tutar) : null,
    musteri_hakedisi: customer.musteri_hakedisi ? Number(customer.musteri_hakedisi) : null,
    bayi_odeme_tutari: customer.bayi_odeme_tutari ? Number(customer.bayi_odeme_tutari) : null,
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
          description: customer.file_type.description || null,
          required_for_approval: customer.file_type.required_for_approval || false,
        }
      : null,
    documents:
      customer.documents
        ?.map((doc: any) => {
          // Handle BigInt for IDs and sizes
          const docId = typeof doc.id === 'bigint' ? Number(doc.id) : Number(doc.id)
          const customerId = typeof doc.customer_id === 'bigint' ? Number(doc.customer_id) : Number(doc.customer_id)
          const uploadedBy = typeof doc.uploaded_by === 'bigint' ? Number(doc.uploaded_by) : Number(doc.uploaded_by)
          const dosyaBoyutu = doc.dosya_boyutu ? (typeof doc.dosya_boyutu === 'bigint' ? Number(doc.dosya_boyutu) : Number(doc.dosya_boyutu)) : null
          const onaylayanId = doc.onaylayan_id ? (typeof doc.onaylayan_id === 'bigint' ? Number(doc.onaylayan_id) : Number(doc.onaylayan_id)) : null
          
          return {
            id: docId,
            customer_id: customerId,
            tip: doc.tip || null,
          dosya_adı: (doc as any).dosya_adı || (doc as any).belge_adi || 'Belge',
            dosya_yolu: doc.dosya_yolu || null,
            dosya_boyutu: dosyaBoyutu,
            mime_type: doc.mime_type || null,
            durum: doc.durum || null,
            red_nedeni: doc.red_nedeni || null,
            document_type: doc.document_type || null,
            is_result_document: doc.is_result_document || false,
            uploaded_by: uploadedBy,
            onaylayan_id: onaylayanId,
          onay_tarihi: doc.onay_tarihi ? doc.onay_tarihi.toISOString() : null,
          created_at: doc.created_at ? doc.created_at.toISOString() : null,
          updated_at: doc.updated_at ? doc.updated_at.toISOString() : null,
          uploader: doc.uploader
            ? {
                  id: typeof doc.uploader.id === 'bigint' ? Number(doc.uploader.id) : Number(doc.uploader.id),
                  name: doc.uploader.name || null,
                  email: doc.uploader.email || null,
              }
            : null,
          approver: doc.approver
            ? {
                  id: typeof doc.approver.id === 'bigint' ? Number(doc.approver.id) : Number(doc.approver.id),
                  name: doc.approver.name || null,
                  email: doc.approver.email || null,
              }
            : null,
          }
        }) || [],
    payments:
      customer.payments?.map((payment: any) => {
        // Handle BigInt for tutar
        let tutarValue: number | null = null
        if (payment.tutar) {
          tutarValue = typeof payment.tutar === 'bigint' ? Number(payment.tutar) : Number(payment.tutar)
        }
        
        // Handle Date for tarih
        let tarihValue: string | null = null
        if (payment.tarih) {
          if (payment.tarih instanceof Date) {
            tarihValue = payment.tarih.toISOString()
          } else if (typeof payment.tarih === 'string') {
            tarihValue = payment.tarih
          }
        }
        
        return {
          id: typeof payment.id === 'bigint' ? Number(payment.id) : Number(payment.id),
          tutar: tutarValue,
          tarih: tarihValue,
          durum: payment.durum || null,
        açıklama: (payment as any).açıklama || payment.description || null,
        created_at: payment.created_at ? payment.created_at.toISOString() : null,
        updated_at: payment.updated_at ? payment.updated_at.toISOString() : null,
          recorder: payment.creator
          ? {
                id: typeof payment.creator.id === 'bigint' ? Number(payment.creator.id) : Number(payment.creator.id),
                name: payment.creator.name || null,
                email: payment.creator.email || null,
            }
          : null,
        }
      }) || [],
    notes:
      customer.notes?.map((note: any) => {
        const content = note.içerik ?? note.note ?? note.content ?? ''
        return {
          id: typeof note.id === 'bigint' ? Number(note.id) : Number(note.id),
          content: content || '',
          created_at: note.created_at ? note.created_at.toISOString() : null,
          updated_at: note.updated_at ? note.updated_at.toISOString() : null,
          author: note.user
            ? {
                id: typeof note.user.id === 'bigint' ? Number(note.user.id) : Number(note.user.id),
                name: note.user.name || null,
                email: note.user.email || null,
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
  password?: string
}) {
  const user = await requireAuth()
  
  try {
    // Normalize and validate phone number
    let normalizedPhone: string
    try {
      const phoneValidation = validatePhone(data.telefon)
      if (!phoneValidation.valid) {
        throw new Error(phoneValidation.error || 'Geçersiz telefon numarası')
      }
      normalizedPhone = phoneValidation.sanitized
    } catch (error: any) {
      // Return user-friendly error message
      throw new Error(error.message || 'Telefon numarası formatı geçersiz. Lütfen 05XXXXXXXXX formatında girin.')
    }

    // Normalize and validate TC No (without strict algorithm check for flexibility)
    let normalizedTC: string
    try {
      const tcValidation = validateTCNo(data.tc_no, false) // false = don't enforce strict algorithm check
      if (!tcValidation.valid) {
        throw new Error(tcValidation.error || 'Geçersiz TC Kimlik No')
      }
      normalizedTC = tcValidation.sanitized
    } catch (error: any) {
      // Return user-friendly error message
      throw new Error(error.message || 'TC Kimlik No formatı geçersiz.')
    }

    // Normalize plaka (uppercase, remove spaces)
    const normalizedPlaka = data.plaka.trim().toUpperCase().replace(/\s+/g, '')


    // Helper function to normalize phone for comparison
    const normalizePhoneForComparison = (phone: string | null): string | null => {
      if (!phone) return null
      const digits = phone.replace(/\D/g, '')
      if (digits.length === 10 && digits.startsWith('5')) {
        return `0${digits}`
      } else if (digits.length === 12 && digits.startsWith('90')) {
        return `0${digits.substring(2)}`
      } else if (digits.length === 11 && digits.startsWith('05')) {
        return digits
      }
      return digits
    }

    // Normalize ad_soyad for comparison (trim, lowercase, remove extra spaces)
    const normalizedAdSoyad = data.ad_soyad.trim().toLowerCase().replace(/\s+/g, ' ')

    // Check duplicate customer by TC No, Ad Soyad, phone, or plate
    // First check by TC No, Ad Soyad, and Plaka (exact match)
    const customersByTCOrPlakaOrAdSoyad = await prisma.customer.findMany({
      where: {
        OR: [
          { tc_no: normalizedTC },
          { plaka: { equals: normalizedPlaka, mode: 'insensitive' } },
          { ad_soyad: { equals: normalizedAdSoyad, mode: 'insensitive' } },
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

    // Check if any of these match
    let existingCustomer = customersByTCOrPlakaOrAdSoyad.find(c => {
      const existingTC = c.tc_no?.replace(/\D/g, '') || ''
      const existingPlaka = c.plaka?.trim().toUpperCase().replace(/\s+/g, '') || ''
      const existingAdSoyad = c.ad_soyad?.trim().toLowerCase().replace(/\s+/g, ' ') || ''
      return existingTC === normalizedTC || existingPlaka === normalizedPlaka || existingAdSoyad === normalizedAdSoyad
    })

    // If not found, check by phone number and ad soyad
    if (!existingCustomer) {
      // Get customers with phone numbers that might match (starting with same digits) or same ad soyad
      const phonePrefix = normalizedPhone.substring(0, 3) // First 3 digits
      const potentialMatches = await prisma.customer.findMany({
        where: {
          OR: [
            {
              telefon: {
                startsWith: phonePrefix,
              },
            },
            {
              ad_soyad: { equals: normalizedAdSoyad, mode: 'insensitive' },
            },
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

      // Find exact match after normalization
      existingCustomer = potentialMatches.find(c => {
        const normalizedExisting = normalizePhoneForComparison(c.telefon)
        const existingAdSoyad = c.ad_soyad?.trim().toLowerCase().replace(/\s+/g, ' ') || ''
        return normalizedExisting === normalizedPhone || existingAdSoyad === normalizedAdSoyad
      }) || null
    }

    if (existingCustomer) {
      const conflicts: string[] = []
      const conflictDetails: string[] = []
      // Compare normalized values
      const existingTC = existingCustomer.tc_no?.replace(/\D/g, '') || ''
      const existingPlaka = existingCustomer.plaka?.trim().toUpperCase().replace(/\s+/g, '') || ''
      const existingAdSoyad = existingCustomer.ad_soyad?.trim().toLowerCase().replace(/\s+/g, ' ') || ''
      const normalizedExistingPhone = normalizePhoneForComparison(existingCustomer.telefon)
      
      if (existingTC === normalizedTC) {
        conflicts.push('TC Kimlik No')
        conflictDetails.push(`TC Kimlik No: ${existingCustomer.tc_no}`)
      }
      if (existingAdSoyad === normalizedAdSoyad) {
        conflicts.push('Ad Soyad')
        conflictDetails.push(`Ad Soyad: ${existingCustomer.ad_soyad}`)
      }
      if (normalizedExistingPhone === normalizedPhone) {
        conflicts.push('Telefon Numarası')
        conflictDetails.push(`Telefon: ${existingCustomer.telefon}`)
      }
      if (existingPlaka === normalizedPlaka) {
        conflicts.push('Plaka')
        conflictDetails.push(`Plaka: ${existingCustomer.plaka}`)
      }

      // Build detailed error message
      let errorMessage = ''
      if (conflicts.length === 1) {
        errorMessage = `Bu ${conflicts[0]} (${conflictDetails[0]}) ile kayıtlı bir müşteri zaten mevcut. `
      } else if (conflicts.length > 1) {
        errorMessage = `Bu ${conflicts.join(', ')} ile kayıtlı bir müşteri zaten mevcut. `
        errorMessage += `Çakışan bilgiler: ${conflictDetails.join(', ')}. `
      } else {
        errorMessage = 'Bu bilgiler ile kayıtlı bir müşteri zaten mevcut. '
      }
      
      // Add existing customer info
      if (existingCustomer.ad_soyad) {
        errorMessage += `Mevcut kayıt: ${existingCustomer.ad_soyad}. `
      }
      errorMessage += 'Lütfen mevcut kaydı düzenleyin veya farklı bilgiler girin.'
      
      // Create a proper error object that will be caught by the client
      const error = new Error(errorMessage)
      // Add a property to identify this as a validation error (not a server error)
      ;(error as any).isValidationError = true
      throw error
    }

    // Handle field name variations and type conversions
    const fileTypeId = data.file_type_id || data.dosya_tipi_id
    const hasarTarihi = typeof data.hasar_tarihi === 'string' 
      ? new Date(data.hasar_tarihi) 
      : data.hasar_tarihi


    if (!fileTypeId) {
      throw new Error('Dosya tipi gereklidir')
    }

    // Validate required fields
    if (!data.ad_soyad || !data.tc_no || !data.telefon || !data.plaka) {
      throw new Error('Ad Soyad, TC No, Telefon ve Plaka gereklidir')
    }

    // Create customer data object with normalized values
    const customerData = {
      ad_soyad: data.ad_soyad.trim(),
      tc_no: normalizedTC,
      telefon: normalizedPhone,
      email: data.email ? data.email.trim().toLowerCase() : null,
      plaka: normalizedPlaka,
      hasar_tarihi: hasarTarihi,
      file_type_id: BigInt(fileTypeId),
      dealer_id: data.dealer_id ? BigInt(data.dealer_id) : null,
      başvuru_durumu: data.başvuru_durumu || 'İnceleniyor',
      evrak_durumu: data.evrak_durumu || 'Eksik',
      dosya_kilitli: data.dosya_kilitli || false,
    }

    // Create customer first
    const customer = await prisma.customer.create({
      data: customerData,
      include: {
        dealer: true,
        file_type: true,
      },
    })

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
        // Check if user already exists with this TC No or phone (using normalized values)
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { tc_no: normalizedTC },
              { phone: normalizedPhone },
              ...(data.email ? [{ email: data.email.trim().toLowerCase() }] : [])
            ]
          }
        })

        // Use provided password or generate random one
        const passwordToUse = data.password && data.password.trim() 
          ? data.password.trim() 
          : generateRandomPassword(12)
        
        if (passwordToUse.length < 8) {
          throw new Error('Şifre en az 8 karakter olmalıdır')
        }

        const hashedPassword = await bcrypt.hash(passwordToUse, 12)

        if (!existingUser) {
          // Create user account with normalized values
          const newUser = await prisma.user.create({
            data: {
              name: data.ad_soyad.trim(),
              tc_no: normalizedTC,
              phone: normalizedPhone,
              email: data.email ? data.email.trim().toLowerCase() : null,
              password: hashedPassword,
              role_id: musteriRole.id,
              is_active: true,
            }
          })


          loginCredentials = {
            username: data.tc_no || data.telefon || data.email,
            password: passwordToUse,
            loginUrl: '/musteri-giris'
          }
        } else {
          // Update existing user with new password if provided
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: data.ad_soyad.trim(),
              tc_no: normalizedTC,
              phone: normalizedPhone,
              email: data.email ? data.email.trim().toLowerCase() : null,
              password: hashedPassword,
              updated_at: new Date(),
            }
          })


          loginCredentials = {
            username: data.tc_no || data.telefon || data.email,
            password: passwordToUse,
            loginUrl: '/musteri-giris'
          }
        }
      }
    } catch (error) {
      console.error('Failed to create/update user account for customer:', error)
      // Continue even if user creation fails - customer is already created
    }

    revalidatePath('/dashboard/customers')
    revalidatePath('/admin/musteriler')

    // Send notifications
    try {
      const customerUserId = customer.dealer_id ? Number(customer.dealer_id) : null
      const notificationRoles = ['superadmin', 'birincil-admin', 'evrak-birimi']
      
      // Notify admins and evrak birimi
      await createNotification({
        title: 'Yeni Müşteri Eklendi',
        message: `${customer.ad_soyad} adlı yeni müşteri sisteme eklendi.`,
        type: 'success',
        link: `/admin/musteriler/${Number(customer.id)}`,
        roles: notificationRoles,
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
            title: 'Yeni Müşteri Atandı',
            message: `${customer.ad_soyad} adlı müşteri size atandı.`,
            type: 'info',
            link: `/admin/musteriler/${Number(customer.id)}`,
            userIds: [Number(dealerUser.id)],
          })
        }
      }
      
      // Notify customer if user account was created
      if (loginCredentials) {
        const customerUser = await prisma.user.findFirst({
          where: {
            tc_no: normalizedTC,
            is_active: true,
          },
          select: { id: true },
        })
        
        if (customerUser) {
          await createNotification({
            title: 'Hesabınız Oluşturuldu',
            message: `Merhaba ${customer.ad_soyad}, hesabınız oluşturuldu. Başvurunuzu takip edebilirsiniz.`,
            type: 'success',
            link: `/admin/musteriler`,
            userIds: [Number(customerUser.id)],
          })
        }
      }
    } catch (notifError) {
      console.error('Notification error (non-critical):', notifError)
      // Don't fail customer creation if notification fails
    }

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

    
    return result
  } catch (error: any) {
    console.error('[createCustomer] Error:', error.message)
    
    // Extract user-friendly error message
    let userMessage = 'Müşteri oluşturulamadı'
    
    // If it's already a validation error with a user-friendly message, use it
    if ((error as any).isValidationError && error.message) {
      userMessage = error.message
    }
    // Handle Prisma unique constraint errors
    else if (error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) 
        ? error.meta.target.join(', ') 
        : error.meta?.target || 'bilgiler'
      
      if (target.includes('tc_no')) {
        userMessage = 'Bu TC Kimlik Numarası ile kayıtlı bir müşteri zaten mevcut. Lütfen mevcut kaydı düzenleyin veya farklı bilgiler girin.'
      } else if (target.includes('telefon')) {
        userMessage = 'Bu telefon numarası ile kayıtlı bir müşteri zaten mevcut. Lütfen mevcut kaydı düzenleyin veya farklı bilgiler girin.'
      } else if (target.includes('plaka')) {
        userMessage = 'Bu plaka ile kayıtlı bir müşteri zaten mevcut. Lütfen mevcut kaydı düzenleyin veya farklı bilgiler girin.'
      } else {
        userMessage = `Bu ${target} ile kayıtlı bir müşteri zaten mevcut. Lütfen mevcut kaydı düzenleyin veya farklı bilgiler girin.`
    }
    }
    // Handle Prisma foreign key errors
    else if (error.code === 'P2003') {
      userMessage = 'Seçilen dosya tipi veya bayi bulunamadı. Lütfen bilgileri kontrol edin.'
    }
    // Use error message if available and meaningful
    else if (error.message && !error.message.includes('Server Components render')) {
      userMessage = error.message
    }
    // Generic fallback
    else {
      userMessage = 'Müşteri oluşturulurken bir hata oluştu. Lütfen bilgileri kontrol edip tekrar deneyin.'
    }
    
    // Create error with user-friendly message that will be shown in production
    // Ensure the error message is properly serializable
    const customError: any = new Error(userMessage)
    // Mark as validation error so it's handled properly on client
    customError.isValidationError = true
    // Preserve message explicitly
    customError.message = userMessage
    // Add digest for Next.js error tracking
    customError.digest = (error as any).digest || `customer-create-${Date.now()}`
    // Ensure error name is set
    Object.defineProperty(customError, 'name', { value: 'ValidationError', enumerable: true, configurable: true })
    
    throw customError
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
  password?: string
  bayi_odeme_tutari?: number
}>) {
  const currentUser = await requireAuth()

  return await prisma.$transaction(async (tx) => {
    // Get customer first to get normalized values and old status
    const existingCustomer = await tx.customer.findUnique({
      where: { id: BigInt(id) },
      select: {
        tc_no: true,
        telefon: true,
        email: true,
        ad_soyad: true,
        başvuru_durumu: true,
        dealer_id: true,
      },
    })

    if (!existingCustomer) {
      throw new Error('Müşteri bulunamadı')
    }

    // Normalize TC No and phone
    const normalizedTC = data.tc_no ? data.tc_no.replace(/\s/g, '') : existingCustomer.tc_no
    let normalizedPhone = existingCustomer.telefon
    if (data.telefon) {
      const phoneValidation = validatePhone(data.telefon)
      if (!phoneValidation.valid) {
        throw new Error(phoneValidation.error || 'Geçersiz telefon numarası')
      }
      normalizedPhone = phoneValidation.sanitized
    }
    const customerEmail = data.email?.trim().toLowerCase() || existingCustomer.email?.trim().toLowerCase() || null
    const customerName = data.ad_soyad?.trim() || existingCustomer.ad_soyad

    // Prepare customer update data (exclude password - it's handled separately)
    const { password, ...customerUpdateData } = data
    const updateData: any = { ...customerUpdateData }
    
  if (data.file_type_id) updateData.file_type_id = BigInt(data.file_type_id)
  if (data.dealer_id) updateData.dealer_id = BigInt(data.dealer_id)
  if (data.hasar_tarihi) {
    updateData.hasar_tarihi =
      typeof data.hasar_tarihi === 'string'
        ? new Date(data.hasar_tarihi)
        : data.hasar_tarihi
  }
  if (data.bayi_odeme_tutari !== undefined) {
    updateData.bayi_odeme_tutari = data.bayi_odeme_tutari
  }

    // Update normalized values
    if (data.tc_no) updateData.tc_no = normalizedTC
    if (data.telefon) updateData.telefon = normalizedPhone
    if (data.email !== undefined) updateData.email = customerEmail

    // Update customer
    const customer = await tx.customer.update({
    where: { id: BigInt(id) },
    data: updateData,
    include: {
      dealer: true,
      file_type: true,
    },
  })

    // Handle password update if provided
    if (data.password && data.password.trim()) {
      const password = data.password.trim()
      
      if (password.length < 8) {
        throw new Error('Şifre en az 8 karakter olmalıdır')
      }

      // Get musteri role
      const musteriRole = await tx.role.findFirst({
        where: { name: 'musteri' },
      })

      if (!musteriRole) {
        console.warn('Musteri role not found, skipping user account update')
      } else {
        // Find existing user by TC No, phone, or email
        const existingUser = await tx.user.findFirst({
          where: {
            OR: [
              { tc_no: normalizedTC },
              { phone: normalizedPhone },
              ...(customerEmail ? [{ email: customerEmail }] : []),
            ],
          },
        })

        const hashedPassword = await bcrypt.hash(password, 12)

        if (existingUser) {
          // Update existing user
          await tx.user.update({
            where: { id: existingUser.id },
            data: {
              name: customerName,
              tc_no: normalizedTC,
              phone: normalizedPhone,
              email: customerEmail,
              password: hashedPassword,
              updated_at: new Date(),
            },
          })
        } else {
          // Create new user account
          await tx.user.create({
            data: {
              name: customerName,
              tc_no: normalizedTC,
              phone: normalizedPhone,
              email: customerEmail,
              password: hashedPassword,
              role_id: musteriRole.id,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date(),
            },
          })
        }
      }
    }

  revalidatePath('/dashboard/customers')
  revalidatePath(`/dashboard/customers/${id}`)
    revalidatePath('/admin/musteriler')

    // Send notification if status changed (outside transaction)
    const oldStatus = existingCustomer?.başvuru_durumu
    const oldDealerId = existingCustomer?.dealer_id
    
    try {
      if (oldStatus && data.başvuru_durumu && data.başvuru_durumu !== oldStatus) {
        // Notify admins
        await createNotification({
          title: 'Müşteri Durumu Değişti',
          message: `${existingCustomer.ad_soyad} adlı müşterinin durumu "${oldStatus}" → "${data.başvuru_durumu}" olarak güncellendi.`,
          type: 'info',
          link: `/admin/musteriler/${id}`,
          roles: ['superadmin', 'birincil-admin', 'evrak-birimi'],
          excludeUserId: currentUser.id,
        })
        
        // Notify dealer if customer has a dealer
        if (oldDealerId) {
          const dealerUser = await prisma.user.findFirst({
            where: {
              dealer_id: oldDealerId,
              is_active: true,
            },
            select: { id: true },
          })
          
          if (dealerUser) {
            await createNotification({
              title: 'Müşteri Durumu Güncellendi',
              message: `${existingCustomer.ad_soyad} adlı müşterinizin durumu "${data.başvuru_durumu}" olarak güncellendi.`,
              type: 'info',
              link: `/admin/musteriler/${id}`,
              userIds: [Number(dealerUser.id)],
            })
          }
        }
        
        // Notify customer
        const customerUser = await prisma.user.findFirst({
          where: {
            tc_no: normalizedTC,
            is_active: true,
          },
          select: { id: true },
        })
        
        if (customerUser) {
          await createNotification({
            title: 'Başvuru Durumunuz Güncellendi',
            message: `Başvuru durumunuz "${data.başvuru_durumu}" olarak güncellendi.`,
            type: 'info',
            link: `/admin/musteriler`,
            userIds: [Number(customerUser.id)],
          })
        }
      }
    } catch (notifError) {
      console.error('Notification error (non-critical):', notifError)
    }

  return {
    ...customer,
    id: Number(customer.id),
    file_type_id: Number(customer.file_type_id),
    dealer_id: customer.dealer_id ? Number(customer.dealer_id) : null,
  }
  })
}

export async function deleteCustomer(id: number) {
  await requireAuth()

  await prisma.customer.delete({
    where: { id: BigInt(id) },
  })

  revalidatePath('/dashboard/customers')

  return { success: true }
}

export async function closeCustomerFile(id: number, reason: string, sigortadanYatanTutar?: number, musteriHakedisi?: number) {
  await requireAuth()

  const updateData: any = {
      dosya_kilitli: true,
      başvuru_durumu: 'DOSYA KAPATILDI',
      dosya_kapanma_nedeni: reason,
      dosya_kapanma_tarihi: new Date(),
  }

  if (sigortadanYatanTutar !== undefined) {
    updateData.sigortadan_yatan_tutar = sigortadanYatanTutar
  }

  if (musteriHakedisi !== undefined) {
    updateData.musteri_hakedisi = musteriHakedisi
  }

  const customer = await prisma.customer.update({
    where: { id: BigInt(id) },
    data: updateData,
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

  // If status is "EVRAK AŞAMASINDA", check if all required documents are uploaded
  if (customer.başvuru_durumu === 'EVRAK AŞAMASINDA') {
    const requiredDocs = customer.file_type.required_documents || []
    
    if (requiredDocs.length > 0) {
      // Check if all required documents are uploaded
      const uploadedDocNames = customer.documents.map(doc => doc.tip.toLowerCase())
      const allRequiredUploaded = requiredDocs.every(reqDoc =>
        uploadedDocNames.some(uploaded => uploaded.includes(reqDoc.document_name.toLowerCase()))
      )

      if (allRequiredUploaded) {
        // Auto-transition to "BAŞVURU AŞAMASINDA"
        await prisma.customer.update({
          where: { id: BigInt(customerId) },
          data: {
            başvuru_durumu: 'BAŞVURU AŞAMASINDA',
            evrak_durumu: 'Tamam'
          }
        })

        revalidatePath(`/dashboard/customers/${customerId}`)
        revalidatePath('/dashboard/customers')
    revalidatePath('/admin/musteriler')

        return {
          statusChanged: true,
          newStatus: 'BAŞVURU AŞAMASINDA'
        }
      }
    }
  }

  return {
    statusChanged: false,
    newStatus: customer.başvuru_durumu
  }
}

