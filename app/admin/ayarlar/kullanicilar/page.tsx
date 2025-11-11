"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, UserPlus, Key, Shield } from "lucide-react"
import { type UserRole } from "@/lib/role-config"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface User {
  id: number
  ad_soyad: string
  email: string
  telefon?: string
  tc_no?: string
  role: {
    id: number
    name: string
  }
  aktif: boolean
  created_at: string
}

interface Role {
  id: number
  name: string
  description?: string
}

export default function UserManagementPage() {
  const { isAuthenticated, user, isLoading, logout } = useAuth()
  const router = useRouter()
  const userRole: UserRole = (user?.role?.name as UserRole) || "superadmin"

  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    ad_soyad: "",
    email: "",
    telefon: "",
    tc_no: "",
    password: "",
    role_id: "",
    aktif: true
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers()
      fetchRoles()
    }
  }, [isAuthenticated])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles')
      const data = await response.json()
      setRoles(data.roles || [])
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    }
  }

  const getRoleBadgeColor = (roleName: string) => {
    const colors: Record<string, string> = {
      'superadmin': 'bg-purple-100 text-purple-800 border-purple-300',
      'birincil-admin': 'bg-blue-100 text-blue-800 border-blue-300',
      'ikincil-admin': 'bg-cyan-100 text-cyan-800 border-cyan-300',
      'evrak-birimi': 'bg-green-100 text-green-800 border-green-300',
      'bayi': 'bg-orange-100 text-orange-800 border-orange-300',
      'musteri': 'bg-gray-100 text-gray-800 border-gray-300'
    }
    return colors[roleName] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getRoleDisplayName = (roleName: string) => {
    const names: Record<string, string> = {
      'superadmin': 'Süper Admin',
      'birincil-admin': 'Birincil Admin',
      'ikincil-admin': 'İkincil Admin',
      'evrak-birimi': 'Evrak Birimi',
      'bayi': 'Bayi',
      'musteri': 'Müşteri'
    }
    return names[roleName] || roleName
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.ad_soyad.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.tc_no?.includes(searchQuery)
    const matchesRole = roleFilter === 'all' || u.role.name === roleFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && u.aktif) ||
                         (statusFilter === 'inactive' && !u.aktif)
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setShowCreateModal(false)
        fetchUsers()
        setFormData({
          ad_soyad: "",
          email: "",
          telefon: "",
          tc_no: "",
          password: "",
          role_id: "",
          aktif: true
        })
      }
    } catch (error) {
      console.error('Failed to create user:', error)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return
    
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setShowEditModal(false)
        fetchUsers()
        setSelectedUser(null)
      }
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      ad_soyad: user.ad_soyad,
      email: user.email,
      telefon: user.telefon || "",
      tc_no: user.tc_no || "",
      password: "",
      role_id: String(user.role.id),
      aktif: user.aktif
    })
    setShowEditModal(true)
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <main className="flex-1 overflow-auto bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Kullanıcı Yönetimi</h1>
            <p className="text-slate-600 mt-1">Sistem kullanıcılarını yönetin</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="rounded-2xl bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Yeni Kullanıcı
          </Button>
        </div>

        {/* Filters */}
        <Card className="rounded-3xl border-2">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Ad, email veya TC ile ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-2xl"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Tüm Roller" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Roller</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.name}>
                      {getRoleDisplayName(role.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Tüm Durumlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle>Kullanıcılar ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Yükleniyor...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Kullanıcı bulunamadı.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold text-slate-700">Ad Soyad</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Email</th>
                      <th className="text-left p-4 font-semibold text-slate-700">TC No</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Rol</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Durum</th>
                      <th className="text-right p-4 font-semibold text-slate-700">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-slate-50">
                        <td className="p-4">
                          <div className="font-medium">{user.ad_soyad}</div>
                          {user.telefon && (
                            <div className="text-sm text-slate-500">{user.telefon}</div>
                          )}
                        </td>
                        <td className="p-4 text-slate-600">{user.email}</td>
                        <td className="p-4 text-slate-600">{user.tc_no || '-'}</td>
                        <td className="p-4">
                          <Badge className={`rounded-xl ${getRoleBadgeColor(user.role.name)}`}>
                            {getRoleDisplayName(user.role.name)}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={`rounded-xl ${user.aktif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.aktif ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(user)}
                              className="rounded-xl"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create User Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
              <DialogDescription>
                Sisteme yeni bir kullanıcı ekleyin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="ad_soyad">Ad Soyad *</Label>
                <Input
                  id="ad_soyad"
                  value={formData.ad_soyad}
                  onChange={(e) => setFormData({...formData, ad_soyad: e.target.value})}
                  className="rounded-2xl mt-2"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="rounded-2xl mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefon">Telefon</Label>
                  <Input
                    id="telefon"
                    value={formData.telefon}
                    onChange={(e) => setFormData({...formData, telefon: e.target.value})}
                    className="rounded-2xl mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="tc_no">TC No</Label>
                  <Input
                    id="tc_no"
                    value={formData.tc_no}
                    onChange={(e) => setFormData({...formData, tc_no: e.target.value})}
                    className="rounded-2xl mt-2"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password">Şifre *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="rounded-2xl mt-2"
                />
              </div>
              <div>
                <Label htmlFor="role">Rol *</Label>
                <Select value={formData.role_id} onValueChange={(value) => setFormData({...formData, role_id: value})}>
                  <SelectTrigger className="rounded-2xl mt-2">
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={String(role.id)}>
                        {getRoleDisplayName(role.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="rounded-2xl">
                İptal
              </Button>
              <Button onClick={handleCreateUser} className="rounded-2xl bg-blue-600 hover:bg-blue-700">
                Kullanıcı Ekle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Kullanıcı Düzenle</DialogTitle>
              <DialogDescription>
                Kullanıcı bilgilerini güncelleyin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit_ad_soyad">Ad Soyad *</Label>
                <Input
                  id="edit_ad_soyad"
                  value={formData.ad_soyad}
                  onChange={(e) => setFormData({...formData, ad_soyad: e.target.value})}
                  className="rounded-2xl mt-2"
                />
              </div>
              <div>
                <Label htmlFor="edit_email">Email *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="rounded-2xl mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_telefon">Telefon</Label>
                  <Input
                    id="edit_telefon"
                    value={formData.telefon}
                    onChange={(e) => setFormData({...formData, telefon: e.target.value})}
                    className="rounded-2xl mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_tc_no">TC No</Label>
                  <Input
                    id="edit_tc_no"
                    value={formData.tc_no}
                    onChange={(e) => setFormData({...formData, tc_no: e.target.value})}
                    className="rounded-2xl mt-2"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_password">Yeni Şifre (boş bırakılırsa değişmez)</Label>
                <Input
                  id="edit_password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="rounded-2xl mt-2"
                  placeholder="Şifre değiştirmek için doldurun"
                />
              </div>
              <div>
                <Label htmlFor="edit_role">Rol *</Label>
                <Select value={formData.role_id} onValueChange={(value) => setFormData({...formData, role_id: value})}>
                  <SelectTrigger className="rounded-2xl mt-2">
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={String(role.id)}>
                        {getRoleDisplayName(role.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_aktif"
                  checked={formData.aktif}
                  onChange={(e) => setFormData({...formData, aktif: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="edit_aktif">Aktif</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="rounded-2xl">
                İptal
              </Button>
              <Button onClick={handleEditUser} className="rounded-2xl bg-blue-600 hover:bg-blue-700">
                Güncelle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}

