'use server'

import prisma from '@/lib/db'
import { requireAuth } from './auth'
import { revalidatePath } from 'next/cache'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Get all accounting transactions
 */
export async function getAccountingTransactions(params?: {
  type?: 'income' | 'expense'
  startDate?: Date
  endDate?: Date
  page?: number
  perPage?: number
}) {
  const user = await requireAuth()

  // Only birincil-admin and superadmin can access accounting
  const userRole = user.role?.name?.toLowerCase()
  const allowedRoles = ['superadmin', 'birincil-admin']
  
  if (!allowedRoles.includes(userRole || '')) {
    throw new Error('Bu modüle erişim yetkiniz yok')
  }

  const where: any = {}

  if (params?.type) {
    where.type = params.type
  }

  if (params?.startDate || params?.endDate) {
    where.transaction_date = {}
    if (params.startDate) where.transaction_date.gte = params.startDate
    if (params.endDate) where.transaction_date.lte = params.endDate
  }

  const [transactions, total] = await Promise.all([
    prisma.accountingTransaction.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { transaction_date: 'desc' },
      take: params?.perPage || 50,
      skip: params?.page ? (params.page - 1) * (params.perPage || 50) : 0,
    }),
    prisma.accountingTransaction.count({ where }),
  ])

  return {
    transactions: transactions.map(t => ({
      ...t,
      id: Number(t.id),
      created_by: Number(t.created_by),
      amount: t.amount.toString(),
    })),
    total,
  }
}

/**
 * Get accounting statistics
 */
export async function getAccountingStats(params?: {
  startDate?: Date
  endDate?: Date
}) {
  const user = await requireAuth()

  // Only birincil-admin and superadmin can access accounting
  const userRole = user.role?.name?.toLowerCase()
  const allowedRoles = ['superadmin', 'birincil-admin']
  
  if (!allowedRoles.includes(userRole || '')) {
    throw new Error('Bu modüle erişim yetkiniz yok')
  }

  const where: any = {}

  if (params?.startDate || params?.endDate) {
    where.transaction_date = {}
    if (params.startDate) where.transaction_date.gte = params.startDate
    if (params.endDate) where.transaction_date.lte = params.endDate
  }

  // Get all transactions
  const transactions = await prisma.accountingTransaction.findMany({
    where,
    select: {
      type: true,
      amount: true,
    }
  })

  // Calculate totals
  let totalIncome = new Decimal(0)
  let totalExpense = new Decimal(0)

  transactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome = totalIncome.plus(t.amount)
    } else if (t.type === 'expense') {
      totalExpense = totalExpense.plus(t.amount)
    }
  })

  const netProfit = totalIncome.minus(totalExpense)

  return {
    totalIncome: totalIncome.toString(),
    totalExpense: totalExpense.toString(),
    netProfit: netProfit.toString(),
    balance: netProfit.toString(), // Same as net profit
  }
}

/**
 * Create a new accounting transaction
 */
export async function createAccountingTransaction(data: {
  type: 'income' | 'expense'
  category?: string | null
  description?: string | null
  amount: number | string
  transaction_date: Date | string
  document_url?: string | null
}) {
  const user = await requireAuth()

  // Only birincil-admin and superadmin can create transactions
  const userRole = user.role?.name?.toLowerCase()
  const allowedRoles = ['superadmin', 'birincil-admin']
  
  if (!allowedRoles.includes(userRole || '')) {
    throw new Error('Bu işlem için yetkiniz yok')
  }

  try {
    // Validate required fields
    if (!data.type || !data.amount || !data.transaction_date) {
      throw new Error('Tür, tutar ve tarih gereklidir')
    }

    // Convert date if string
    const transactionDate = typeof data.transaction_date === 'string' 
      ? new Date(data.transaction_date) 
      : data.transaction_date

    const transaction = await prisma.accountingTransaction.create({
      data: {
        type: data.type,
        category: data.category || null,
        description: data.description || null,
        amount: new Decimal(data.amount.toString()),
        transaction_date: transactionDate,
        document_url: data.document_url || null,
        created_by: BigInt(user.id),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    revalidatePath('/admin/muhasebe')

    return {
      ...transaction,
      id: Number(transaction.id),
      created_by: Number(transaction.created_by),
      amount: transaction.amount.toString(),
    }
  } catch (error: any) {
    console.error('Create accounting transaction error:', error)
    throw new Error(error.message || 'İşlem oluşturulamadı')
  }
}

/**
 * Update an accounting transaction
 */
export async function updateAccountingTransaction(
  id: number,
  data: Partial<{
    type: 'income' | 'expense'
    category: string
    description: string
    amount: number | string
    transaction_date: Date
    document_url: string
  }>
) {
  const user = await requireAuth()

  // Only birincil-admin and superadmin can update transactions
  const userRole = user.role?.name?.toLowerCase()
  const allowedRoles = ['superadmin', 'birincil-admin']
  
  if (!allowedRoles.includes(userRole || '')) {
    throw new Error('Bu işlem için yetkiniz yok')
  }

  const updateData: any = { ...data }
  if (data.amount) updateData.amount = new Decimal(data.amount.toString())

  const transaction = await prisma.accountingTransaction.update({
    where: { id: BigInt(id) },
    data: updateData,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    }
  })

  revalidatePath('/admin/muhasebe')

  return {
    ...transaction,
    id: Number(transaction.id),
    created_by: Number(transaction.created_by),
    amount: transaction.amount.toString(),
  }
}

/**
 * Delete an accounting transaction
 */
export async function deleteAccountingTransaction(id: number) {
  const user = await requireAuth()

  // Only birincil-admin and superadmin can delete transactions
  const userRole = user.role?.name?.toLowerCase()
  const allowedRoles = ['superadmin', 'birincil-admin']
  
  if (!allowedRoles.includes(userRole || '')) {
    throw new Error('Bu işlem için yetkiniz yok')
  }

  await prisma.accountingTransaction.delete({
    where: { id: BigInt(id) },
  })

  revalidatePath('/admin/muhasebe')

  return { success: true }
}

