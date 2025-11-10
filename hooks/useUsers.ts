import { useState, useEffect } from 'react'
import { userApi } from '@/lib/api-client'
import { toast } from 'sonner'

export interface User {
  id: number
  name: string
  email?: string
  phone?: string
  tc_no?: string
  role_id: number
  role?: {
    id: number
    name: string
    display_name: string
  }
  dealer_id?: number
  dealer?: {
    id: number
    dealer_name: string
  }
  is_active: boolean
  created_at: string
  updated_at?: string
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await userApi.getAll()
      setUsers(data || [])
    } catch (err) {
      console.error('Users fetch error:', err)
      setError('Kullanıcılar yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (userData: Partial<User>) => {
    try {
      const newUser = await userApi.create(userData)
      setUsers(prev => [...prev, newUser])
      toast.success('Kullanıcı başarıyla oluşturuldu')
      return newUser
    } catch (err) {
      console.error('Create user error:', err)
      toast.error('Kullanıcı oluşturulurken bir hata oluştu')
      throw err
    }
  }

  const updateUser = async (id: number, userData: Partial<User>) => {
    try {
      const updatedUser = await userApi.update(id.toString(), userData)
      setUsers(prev =>
        prev.map(user =>
          user.id === id ? { ...user, ...updatedUser } : user
        )
      )
      toast.success('Kullanıcı bilgileri güncellendi')
      return updatedUser
    } catch (err) {
      console.error('Update user error:', err)
      toast.error('Kullanıcı güncellenirken bir hata oluştu')
      throw err
    }
  }

  const deleteUser = async (id: number) => {
    try {
      await userApi.delete(id.toString())
      setUsers(prev => prev.filter(user => user.id !== id))
      toast.success('Kullanıcı başarıyla silindi')
    } catch (err) {
      console.error('Delete user error:', err)
      toast.error('Kullanıcı silinirken bir hata oluştu')
      throw err
    }
  }

  const toggleUserStatus = async (id: number) => {
    try {
      const user = users.find(u => u.id === id)
      if (!user) return

      const updatedUser = await updateUser(id, { is_active: !user.is_active })
      return updatedUser
    } catch (err) {
      console.error('Toggle user status error:', err)
      throw err
    }
  }

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    refetch: fetchUsers,
  }
}