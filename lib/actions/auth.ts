'use server'

import { auth, signIn, signOut } from '@/auth'
import prisma from '@/lib/db'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const session = await auth()
  
  if (!session?.user) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: BigInt(session.user.id) },
    include: {
      role: true,
      dealer: true,
    },
  })

  if (!user) {
    return null
  }

  return {
    id: Number(user.id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    tc_no: user.tc_no,
    role: {
      id: Number(user.role.id),
      name: user.role.name,
      display_name: user.role.display_name,
    },
    dealer: user.dealer ? {
      id: Number(user.dealer.id),
      dealer_name: user.dealer.dealer_name,
    } : null,
    is_active: user.is_active,
    last_login_at: user.last_login_at,
  }
}

export async function authenticate(
  credentials: {
    email?: string
    phone?: string
    tc_no?: string
    password: string
  }
) {
  try {
    await signIn('credentials', {
      ...credentials,
      redirect: false,
    })
    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Giriş başarısız',
    }
  }
}

export async function logoutUser() {
  await signOut({ redirect: false })
  redirect('/')
}

export async function checkAuth() {
  const session = await auth()
  return !!session?.user
}

export async function getUserRole() {
  const session = await auth()
  return session?.user?.role || null
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }
  return session.user
}

export async function requireRole(allowedRoles: string[]) {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }
  
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/dashboard')
  }
  
  return session.user
}

