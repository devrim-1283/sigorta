 'use server'

import bcrypt from 'bcryptjs'
import { PrismaClient, Prisma } from '@prisma/client'
import { createNotification } from './notifications'
import { requireAuth } from './auth'
import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { validatePhone, validateEmail } from '@/lib/validation'

async function getDealerRoleId(tx: Prisma.TransactionClient): Promise<bigint> {
  const role = await tx.role.findFirst({
    where: { name: 'bayi' },
    select: { id: true },
  })

  if (!role) {
    throw new Error('Bayi rolü bulunamadı')
  }

  return role.id
}

export async function getDealers(params?: {
  search?: string
  status?: string
}) {
  await requireAuth()

  const where: any = { deleted_at: null }

  if (params?.search) {
    where.OR = [
      { dealer_name: { contains: params.search, mode: 'insensitive' } },
      { contact_person: { contains: params.search, mode: 'insensitive' } },
      { phone: { contains: params.search } },
    ]
  }

  if (params?.status) {
    where.status = params.status
  }

  const dealers = await prisma.dealer.findMany({
    where,
    include: {
      _count: {
        select: { customers: true },
      },
    },
    orderBy: { created_at: 'desc' },
  })

  return dealers.map(d => ({
    ...d,
    id: Number(d.id),
    customers_count: d._count.customers,
  }))
}

export async function getDealer(id: number) {
  await requireAuth()

  const dealer = await prisma.dealer.findUnique({
    where: { id: BigInt(id) },
    include: {
      customers: true,
      users: true,
    },
  })

  if (!dealer) {
    throw new Error('Bayi bulunamadı')
  }

  return {
    ...dealer,
    id: Number(dealer.id),
  }
}

export async function createDealer(data: {
  dealer_name: string
  contact_person?: string | null
  phone: string
  email?: string | null
  address?: string | null
  city?: string | null
  tax_number?: string | null
  status?: string
  password?: string
}) {
  await requireAuth()

  // Validate that email and password are provided for dealer login
  if (!data.email || !data.email.trim()) {
    throw new Error('Bayi girişi için e-posta adresi gereklidir')
  }

  if (!data.password || !data.password.trim()) {
    throw new Error('Bayi girişi için şifre gereklidir')
  }

  if (data.password.trim().length < 8) {
    throw new Error('Şifre en az 8 karakter olmalıdır')
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const trimmedEmail = data.email?.trim().toLowerCase() || null

      // Check for duplicate dealer phone or tax number before creation
      const existingDealer = await tx.dealer.findFirst({
        where: {
          OR: [
            { phone: data.phone },
            ...(data.tax_number ? [{ tax_number: data.tax_number }] : []),
            { email: trimmedEmail },
          ],
        },
        select: { 
          id: true, 
          dealer_name: true,
          phone: true,
          email: true,
          tax_number: true,
        },
      })

      if (existingDealer) {
        const conflicts: string[] = []
        const conflictDetails: string[] = []
        
        if (existingDealer.phone === data.phone) {
          conflicts.push('Telefon Numarası')
          conflictDetails.push(`Telefon: ${existingDealer.phone}`)
        }
        if (existingDealer.email === trimmedEmail) {
          conflicts.push('E-posta')
          conflictDetails.push(`E-posta: ${existingDealer.email}`)
        }
        if (data.tax_number && existingDealer.tax_number === data.tax_number) {
          conflicts.push('Vergi Numarası')
          conflictDetails.push(`Vergi No: ${existingDealer.tax_number}`)
        }

        let errorMessage = ''
        if (conflicts.length === 1) {
          errorMessage = `Bu ${conflicts[0]} (${conflictDetails[0]}) ile kayıtlı bir bayi zaten mevcut. `
        } else if (conflicts.length > 1) {
          errorMessage = `Bu ${conflicts.join(', ')} ile kayıtlı bir bayi zaten mevcut. `
          errorMessage += `Çakışan bilgiler: ${conflictDetails.join(', ')}. `
        } else {
          errorMessage = 'Bu bilgiler ile kayıtlı bir bayi zaten mevcut. '
        }
        
        if (existingDealer.dealer_name) {
          errorMessage += `Mevcut kayıt: ${existingDealer.dealer_name}. `
        }
        errorMessage += 'Lütfen mevcut kaydı düzenleyin veya farklı bilgiler girin.'
        
        throw new Error(errorMessage)
      }

      // Check if email or phone is already used by another user
      const existingUserWithEmail = await tx.user.findFirst({
        where: {
          OR: [
            { email: trimmedEmail },
            { phone: data.phone },
          ],
        },
        select: { 
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      })

      if (existingUserWithEmail) {
        const conflicts: string[] = []
        const conflictDetails: string[] = []
        
        if (existingUserWithEmail.email === trimmedEmail) {
          conflicts.push('E-posta')
          conflictDetails.push(`E-posta: ${existingUserWithEmail.email}`)
        }
        if (existingUserWithEmail.phone === data.phone) {
          conflicts.push('Telefon Numarası')
          conflictDetails.push(`Telefon: ${existingUserWithEmail.phone}`)
        }

        let errorMessage = ''
        if (conflicts.length === 1) {
          errorMessage = `Bu ${conflicts[0]} (${conflictDetails[0]}) başka bir kullanıcı tarafından kullanılıyor. `
        } else if (conflicts.length > 1) {
          errorMessage = `Bu ${conflicts.join(', ')} başka bir kullanıcı tarafından kullanılıyor. `
          errorMessage += `Çakışan bilgiler: ${conflictDetails.join(', ')}. `
        } else {
          errorMessage = 'Bu bilgiler başka bir kullanıcı tarafından kullanılıyor. '
        }
        
        if (existingUserWithEmail.name) {
          errorMessage += `Mevcut kullanıcı: ${existingUserWithEmail.name}. `
        }
        errorMessage += 'Lütfen farklı bir e-posta veya telefon numarası girin.'
        
        throw new Error(errorMessage)
      }

      // Create dealer
      const dealer = await tx.dealer.create({
        data: {
          dealer_name: data.dealer_name,
          contact_person: data.contact_person || null,
          phone: data.phone,
          email: trimmedEmail,
          address: data.address || null,
          city: data.city || null,
          tax_number: data.tax_number || null,
          status: data.status || 'active',
          created_at: new Date(),
          updated_at: new Date(),
        },
      })

      // Always create user account for dealer login (email and password are required)
      const hashedPassword = await bcrypt.hash((data.password || '').trim(), 12)
      const dealerRoleId = await getDealerRoleId(tx)
      
      await tx.user.create({
        data: {
          name: data.dealer_name,
          email: trimmedEmail,
          phone: data.phone,
          password: hashedPassword,
          role_id: dealerRoleId,
          dealer_id: dealer.id,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      })

      revalidatePath('/dashboard/dealers')
      revalidatePath('/admin/bayiler')

      // Send notifications
      try {
        const currentUser = await requireAuth()
        
        // Notify admins
        await createNotification({
          title: 'Yeni Bayi Eklendi',
          message: `${dealer.dealer_name} adlı yeni bayi sisteme eklendi.`,
          type: 'success',
          link: `/admin/bayiler`,
          roles: ['superadmin', 'birincil-admin'],
          excludeUserId: Number(currentUser.id),
        })
        
        // Notify the dealer user account that was created
        const dealerUser = await tx.user.findFirst({
          where: {
            dealer_id: dealer.id,
            is_active: true,
          },
          select: { id: true },
        })
        
        if (dealerUser) {
          await createNotification({
            title: 'Hesabınız Oluşturuldu',
            message: `Merhaba ${dealer.dealer_name}, bayi hesabınız oluşturuldu. Sisteme giriş yapabilirsiniz.`,
            type: 'success',
            link: `/admin/dashboard`,
            userIds: [Number(dealerUser.id)],
          })
        }
      } catch (notifError) {
        console.error('Notification error (non-critical):', notifError)
      }

      // Log dealer creation
      try {
        const { createAuditLog } = await import('./audit-logs')
        await createAuditLog({
          action: 'CREATE',
          entityType: 'DEALER',
          entityId: dealer.id.toString(),
          entityName: dealer.dealer_name,
          description: `Yeni bayi oluşturuldu: ${dealer.dealer_name}${dealer.contact_person ? ` (İrtibat: ${dealer.contact_person})` : ''}`,
          newValues: {
            dealer_name: dealer.dealer_name,
            contact_person: dealer.contact_person,
            phone: dealer.phone,
            email: dealer.email,
            city: dealer.city,
          },
        })
      } catch (logError) {
        console.error('[Dealer] Failed to log creation:', logError)
      }

      return {
        ...dealer,
        id: Number(dealer.id),
      }
    })
  } catch (error: any) {
    console.error('Create dealer error:', error)
    if (error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : error.meta?.target
      throw new Error(`Bayi oluşturulamadı: ${target || 'benzersiz alan'} zaten kullanımda`)
    }

    throw new Error(error.message || 'Bayi oluşturulamadı')
  }
}

export async function updateDealer(id: number, data: Partial<{
  dealer_name: string
  contact_person: string
  phone: string
  email: string
  address: string
  city: string
  tax_number: string
  status: string
  password: string
}>) {
  await requireAuth()

  // Separate password from dealer data
  const { password, ...dealerData } = data

  const dealer = await prisma.$transaction(async (tx) => {
    // Get existing dealer for audit log comparison
    const existing = await tx.dealer.findUnique({
      where: { id: BigInt(id) },
      select: {
        dealer_name: true,
        contact_person: true,
        phone: true,
        email: true,
        city: true,
        address: true,
        tax_number: true,
      },
    })

    if (!existing) {
      throw new Error('Bayi bulunamadı')
    }

    // Normalize email if provided
    let normalizedEmail: string | null = null
    if (data.email !== undefined) {
      // Handle empty string as null
      const emailInput = data.email === '' ? null : data.email
      const trimmedEmail = emailInput?.trim() || null
      if (trimmedEmail) {
        try {
          // Use validateEmail to normalize email (lowercase, trim, validate)
          const emailValidation = validateEmail(trimmedEmail)
          if (emailValidation.valid) {
            normalizedEmail = emailValidation.sanitized
          } else {
            // If validation fails, use trimmed lowercase email as fallback
            normalizedEmail = trimmedEmail.toLowerCase().trim()
          }
        } catch (error) {
          // If validation throws error, use trimmed lowercase email as fallback
          normalizedEmail = trimmedEmail.toLowerCase().trim()
        }
      }
      // Update dealerData with normalized email
      dealerData.email = normalizedEmail || undefined
    }

    // Normalize phone if provided
    let normalizedPhone: string | null = null
    if (data.phone !== undefined) {
      // Handle empty string as null
      const phoneInput = data.phone === '' ? null : data.phone
      const trimmedPhone = phoneInput?.trim() || null
      if (trimmedPhone) {
        try {
          // Use validatePhone to normalize phone number
          const phoneValidation = validatePhone(trimmedPhone)
          if (phoneValidation.valid) {
            normalizedPhone = phoneValidation.sanitized
          } else {
            // If validation fails, use trimmed phone as-is (let database handle it)
            normalizedPhone = trimmedPhone
          }
        } catch (error) {
          // If validation throws error, use trimmed phone as-is
          normalizedPhone = trimmedPhone
        }
      }
      // Update dealerData with normalized phone
      dealerData.phone = normalizedPhone || undefined
    }

    // Update dealer (without password field)
    const updated = await tx.dealer.update({
      where: { id: BigInt(id) },
      data: dealerData,
    })

    // Find the associated user
    const existingUser = await tx.user.findFirst({
      where: {
        dealer_id: BigInt(id),
      },
    })

    if (existingUser) {
      // Prepare user update data
      const userUpdateData: any = {
        updated_at: new Date(),
      }

      // Update email if provided and different from current email
      if (data.email !== undefined) {
        // Only update if email is actually changing
        const currentEmail = existingUser.email?.toLowerCase().trim() || null
        const newEmail = normalizedEmail
        
        if (currentEmail !== newEmail) {
          // Check for email conflicts if email is changing
          if (newEmail) {
            const emailConflict = await tx.user.findFirst({
              where: {
                email: newEmail,
                id: { not: existingUser.id }, // Exclude current user
              },
            })

            if (emailConflict) {
              throw new Error(`Bu e-posta adresi (${newEmail}) başka bir kullanıcı tarafından kullanılıyor. Lütfen farklı bir e-posta adresi girin.`)
            }
          }
          userUpdateData.email = newEmail
        }
      }

      // Update phone if provided and different from current phone
      if (data.phone !== undefined) {
        // Only update if phone is actually changing
        // Normalize current phone for comparison
        let currentPhoneNormalized: string | null = null
        if (existingUser.phone) {
          try {
            const currentPhoneValidation = validatePhone(existingUser.phone)
            if (currentPhoneValidation.valid) {
              currentPhoneNormalized = currentPhoneValidation.sanitized
            } else {
              currentPhoneNormalized = existingUser.phone
            }
          } catch {
            currentPhoneNormalized = existingUser.phone
          }
        }
        
        const newPhone = normalizedPhone
        
        if (currentPhoneNormalized !== newPhone) {
          // Check for phone conflicts if phone is changing
          if (newPhone) {
            const phoneConflict = await tx.user.findFirst({
              where: {
                phone: newPhone,
                id: { not: existingUser.id }, // Exclude current user
              },
            })

            if (phoneConflict) {
              throw new Error(`Bu telefon numarası (${newPhone}) başka bir kullanıcı tarafından kullanılıyor. Lütfen farklı bir telefon numarası girin.`)
            }
          }
          userUpdateData.phone = newPhone
        }
      }

      // Update name if dealer_name changed
      if (data.dealer_name !== undefined) {
        userUpdateData.name = data.dealer_name
      }

      // Update password if provided
      const isPasswordChanged = password && password.trim()
      if (isPasswordChanged) {
        userUpdateData.password = await bcrypt.hash(password.trim(), 12)
      }

      // Only update if there's something to update
      if (Object.keys(userUpdateData).length > 1) { // More than just updated_at
        await tx.user.update({
          where: { id: existingUser.id },
          data: userUpdateData,
        })

        // Log password change separately
        if (isPasswordChanged) {
          try {
            const { createAuditLog } = await import('./audit-logs')
            await createAuditLog({
              action: 'UPDATE',
              entityType: 'DEALER',
              entityId: id.toString(),
              entityName: updated.dealer_name,
              description: `${updated.dealer_name} (Bayi) şifresini güncelledi`,
              newValues: {
                password_changed: true,
              },
            })
          } catch (logError) {
            console.error('[Dealer] Failed to log password change:', logError)
          }
        }
      }
    } else {
      // If no user exists, log warning
      console.warn(`[updateDealer] No user found for dealer ${id}, user update skipped`)
    }

    // Log dealer update
    try {
      const { createAuditLog } = await import('./audit-logs')
      const changedFields: string[] = []
      const oldValues: any = {}
      const newValues: any = {}
      
      if (data.dealer_name && data.dealer_name !== existing.dealer_name) {
        changedFields.push('Bayi Adı')
        oldValues.dealer_name = existing.dealer_name
        newValues.dealer_name = data.dealer_name
      }
      if (data.contact_person !== undefined && data.contact_person !== existing.contact_person) {
        changedFields.push('İrtibat Kişisi')
        oldValues.contact_person = existing.contact_person
        newValues.contact_person = data.contact_person
      }
      if (data.phone && data.phone !== existing.phone) {
        changedFields.push('Telefon')
        oldValues.phone = existing.phone
        newValues.phone = data.phone
      }
      if (data.email !== undefined && data.email !== existing.email) {
        changedFields.push('Email')
        oldValues.email = existing.email
        newValues.email = data.email
      }
      if (data.city !== undefined && data.city !== existing.city) {
        changedFields.push('Şehir')
        oldValues.city = existing.city
        newValues.city = data.city
      }
      
      if (changedFields.length > 0) {
        await createAuditLog({
          action: 'UPDATE',
          entityType: 'DEALER',
          entityId: id.toString(),
          entityName: updated.dealer_name,
          description: `Bayi güncellendi: ${updated.dealer_name}. Değiştirilen alanlar: ${changedFields.join(', ')}`,
          oldValues,
          newValues,
        })
      }
    } catch (logError) {
      console.error('[Dealer] Failed to log update:', logError)
    }

    return updated
  })

  revalidatePath('/dashboard/dealers')
  revalidatePath(`/dashboard/dealers/${id}`)

  return {
    ...dealer,
    id: Number(dealer.id),
  }
}

export async function deleteDealer(id: number) {
  await requireAuth()

  // Get dealer details before deleting
  const dealer = await prisma.dealer.findUnique({
    where: { id: BigInt(id) },
    select: {
      dealer_name: true,
      contact_person: true,
      phone: true,
      email: true,
    },
  })

  // Hard delete (deleted_at column doesn't exist yet)
  await prisma.dealer.delete({
    where: { id: BigInt(id) },
  })

  // Log dealer deletion
  if (dealer) {
    try {
      const { createAuditLog } = await import('./audit-logs')
      await createAuditLog({
        action: 'DELETE',
        entityType: 'DEALER',
        entityId: id.toString(),
        entityName: dealer.dealer_name,
        description: `Bayi silindi: ${dealer.dealer_name}${dealer.contact_person ? ` (İrtibat: ${dealer.contact_person})` : ''}`,
        oldValues: {
          dealer_name: dealer.dealer_name,
          contact_person: dealer.contact_person,
          phone: dealer.phone,
          email: dealer.email,
        },
      })
    } catch (logError) {
      console.error('[Dealer] Failed to log deletion:', logError)
    }
  }

  revalidatePath('/dashboard/dealers')
  revalidatePath('/admin/bayiler')

  return { success: true }
}

export async function getDealerStats() {
  await requireAuth()

  const [total, active, pending] = await Promise.all([
    prisma.dealer.count(),
    prisma.dealer.count({ where: { status: 'active' } }),
    prisma.dealer.count({ where: { status: 'pending' } }),
  ])

  return {
    total_dealers: total,
    active_dealers: active,
    pending_dealers: pending,
  }
}

