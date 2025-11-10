'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/role-config'

interface User {
  id: number
  name: string
  email?: string
  phone?: string
  tc_no?: string
  role?: {
    id: number
    name: UserRole
    display_name: string
  }
  dealer?: {
    id: number
    dealer_name: string
  }
  is_active: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null // Deprecated, kept for compatibility
  login: (credentials: { email?: string; phone?: string; tc_no?: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const isLoading = status === 'loading'

  useEffect(() => {
    if (session?.user) {
      // Map NextAuth session to our User type
      setUser({
        id: parseInt(session.user.id),
        name: session.user.name || '',
        email: session.user.email || undefined,
        role: {
          id: session.user.roleId,
          name: session.user.role as UserRole,
          display_name: session.user.role,
        },
        dealer: session.user.dealerId ? {
          id: session.user.dealerId,
          dealer_name: ''
        } : undefined,
        is_active: session.user.isActive,
      })
    } else {
      setUser(null)
    }
  }, [session])

  const login = async (credentials: { email?: string; phone?: string; tc_no?: string; password: string }) => {
    const result = await nextAuthSignIn('credentials', {
      ...credentials,
      redirect: false,
    })

    if (result?.error) {
      throw new Error(result.error)
    }

    // Session will be updated automatically, wait a bit then redirect
    // The router will be handled by the page component based on role
    router.refresh()
  }

  const logout = async () => {
    await nextAuthSignOut({ redirect: false })
    setUser(null)
    router.push('/')
    router.refresh()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token: null, // Deprecated, NextAuth uses httpOnly cookies
        login,
        logout,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
