'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, apiClient } from '@/lib/api-client'
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
  token: string | null
  login: (credentials: { email?: string; phone?: string; tc_no?: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored token on mount
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token')
      if (storedToken) {
        setToken(storedToken)
        apiClient.setToken(storedToken)
        // Fetch user data
        fetchUser()
      } else {
        setIsLoading(false)
      }
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await authApi.me()
      setUser(response.user)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
      }
      setToken(null)
      apiClient.setToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: { email?: string; phone?: string; tc_no?: string; password: string }) => {
    try {
      const response = await authApi.login(credentials)
      setToken(response.token)
      setUser(response.user)
      apiClient.setToken(response.token)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setToken(null)
      setUser(null)
      apiClient.setToken(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
        isAuthenticated: !!user && !!token,
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

