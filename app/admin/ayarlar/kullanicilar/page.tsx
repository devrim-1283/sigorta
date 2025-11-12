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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Edit, Trash2, UserPlus, Key, Shield, Eye, EyeOff, RefreshCw, Copy, User, Building2, Users, Briefcase } from "lucide-react"
import { type UserRole } from "@/lib/role-config"
import { userApi } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface User {
  id: number
  ad_soyad?: string
  name?: string
  email?: string
  telefon?: string
  phone?: string
  tc_no?: string
  role: {
    id: number
    name: string
  }
  aktif?: boolean
  is_active?: boolean
  created_at: string
}

interface Role {
  id: number
  name: string
  description?: string
}

// Role categories
const roleCategories = {
  'Yönetim': ['superadmin', 'birincil-admin', 'ikincil-admin'],
  'Operasyon': ['evrak-birimi', 'operasyon'],
  'Bayi': ['bayi'],
  'Müşteri': ['musteri', 'customer']
}

export default function UserManagementPage() {
  const { isAuthenticated, user, isLoading, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const userRole: UserRole = (user?.role?.name as UserRole) || "superadmin"

  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMyProfileModal, setShowMyProfileModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    tc_no: "",
    password: "",
    role_id: "",
    is_active: true
  })
  const [myProfileData, setMyProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    tc_no: "",
    password: "",
    newPassword: "",
    confirmPassword: ""
  })

  // Check if user is superadmin
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
      return
    }
    
    if (!isLoading && isAuthenticated && userRole !== "superadmin") {
      toast({
        title: "Yetkisiz Erişim",
        description: "Bu sayfaya sadece süper admin erişebilir.",
        variant: "destructive",
      })
      router.push("/admin/dashboard")
    }
  }, [isAuthenticated, isLoading, userRole, router, toast])

  useEffect(() => {
    if (isAuthenticated && userRole === "superadmin") {
      fetchUsers()
      fetchRoles()
      if (user) {
        setMyProfileData({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          tc_no: user.tc_no || "",
          password: "",
          newPassword: "",
          confirmPassword: ""
        })
      }
    }
  }, [isAuthenticated, userRole, user])

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
      const response = await userApi.list()
      setUsers(Array.isArray(response) ? response : (response?.users || []))
    } catch (error: any) {
      console.error('Failed to fetch users:', error)
      toast({
        title: "Uyarı",
        description: error.message || "Kullanıcılar yüklenemedi",
        variant: "default",
        duration: 5000,
      })
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
      'operasyon': 'bg-teal-100 text-teal-800 border-teal-300',
      'bayi': 'bg-orange-100 text-orange-800 border-orange-300',
      'musteri': 'bg-gray-100 text-gray-800 border-gray-300',
      'customer': 'bg-gray-100 text-gray-800 border-gray-300'
    }
    return colors[roleName] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getRoleDisplayName = (roleName: string) => {
    const names: Record<string, string> = {
      'superadmin': 'Süper Admin',
      'birincil-admin': 'Birincil Admin',
      'ikincil-admin': 'İkincil Admin',
      'evrak-birimi': 'Evrak Birimi',
      'operasyon': 'Operasyon',
      'bayi': 'Bayi',
      'musteri': 'Müşteri',
      'customer': 'Müşteri'
    }
    return names[roleName] || roleName
  }

  const getRoleCategory = (roleName: string): string => {
    for (const [category, roles] of Object.entries(roleCategories)) {
      if (roles.includes(roleName)) {
        return category
      }
    }
    return 'Diğer'
  }

  const generateStrongPassword = (): string => {
    const length = 12
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword()
    // Update state immediately
    setFormData((prev) => {
      const updated = { ...prev, password: newPassword }
      return updated
    })
    
    // Use setTimeout to ensure state is updated before showing toast
    setTimeout(async () => {
      try {
        await navigator.clipboard.writeText(newPassword)
        toast({
          title: "Şifre Oluşturuldu",
          description: "Rastgele şifre oluşturuldu ve panoya kopyalandı.",
        })
      } catch (error) {
        console.error("Password copy failed:", error)
        toast({
          title: "Şifre Oluşturuldu",
          description: `Yeni şifre: ${newPassword}`,
        })
      }
    }, 0)
  }

  const handleCopyPassword = () => {
    if (formData.password) {
      navigator.clipboard.writeText(formData.password)
      toast({
        title: "Kopyalandı",
        description: "Şifre panoya kopyalandı.",
      })
    }
  }

  const filteredUsers = users.filter(u => {
    const userName = u.ad_soyad || u.name || ''
    const userEmail = u.email || ''
    const userTcNo = u.tc_no || ''
    const userPhone = u.telefon || u.phone || ''
    
    const matchesSearch = userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         userTcNo.includes(searchQuery) ||
                         userPhone.includes(searchQuery)
    const matchesRole = roleFilter === 'all' || u.role.name === roleFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && (u.aktif ?? u.is_active ?? true)) ||
                         (statusFilter === 'inactive' && !(u.aktif ?? u.is_active ?? true))
    const matchesCategory = categoryFilter === 'all' || getRoleCategory(u.role.name) === categoryFilter
    
    return matchesSearch && matchesRole && matchesStatus && matchesCategory
  })

  // Group users by category
  const usersByCategory = filteredUsers.reduce((acc, user) => {
    const category = getRoleCategory(user.role.name)
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(user)
    return acc
  }, {} as Record<string, User[]>)

  const handleCreateUser = async () => {
    try {
      if (!formData.name || !formData.password || !formData.role_id) {
        toast({
          title: "Uyarı",
          description: "Lütfen tüm zorunlu alanları doldurun",
          variant: "default",
          duration: 4000,
        })
        return
      }

      // Check if selected role is müşteri/customer
      const selectedRole = roles.find(r => String(r.id) === formData.role_id)
      if (selectedRole && (selectedRole.name === 'musteri' || selectedRole.name === 'customer')) {
        toast({
          title: "Uyarı",
          description: "Müşteri rolü ile kullanıcı eklenemez. Müşteriler müşteri yönetimi sayfasından eklenmelidir.",
          variant: "default",
          duration: 5000,
        })
        return
      }

      await userApi.create({
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        tc_no: formData.tc_no || null,
        password: formData.password,
        role_id: parseInt(formData.role_id),
        is_active: formData.is_active
      })
      
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla oluşturuldu",
      })
      
      setShowCreateModal(false)
      resetForm()
      fetchUsers()
    } catch (error: any) {
      console.error('Failed to create user:', error)
      toast({
        title: "Uyarı",
        description: error.message || "Kullanıcı oluşturulamadı",
        variant: "default",
        duration: 5000,
      })
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return
    
    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        tc_no: formData.tc_no || null,
        role_id: parseInt(formData.role_id),
        is_active: formData.is_active
      }

      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password
      }

      await userApi.update(selectedUser.id, updateData)
      
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla güncellendi",
      })
      
      setShowEditModal(false)
      setSelectedUser(null)
      resetForm()
      fetchUsers()
    } catch (error: any) {
      console.error('Failed to update user:', error)
      toast({
        title: "Uyarı",
        description: error.message || "Kullanıcı güncellenemedi",
        variant: "default",
        duration: 5000,
      })
    }
  }

  const handleUpdateMyProfile = async () => {
    if (!user) return

    try {
      if (myProfileData.newPassword && myProfileData.newPassword !== myProfileData.confirmPassword) {
        toast({
          title: "Uyarı",
          description: "Yeni şifreler eşleşmiyor",
          variant: "default",
          duration: 4000,
        })
        return
      }

      const updateData: any = {
        name: myProfileData.name,
        email: myProfileData.email || null,
        phone: myProfileData.phone || null,
        tc_no: myProfileData.tc_no || null,
      }

      if (myProfileData.newPassword) {
        updateData.password = myProfileData.newPassword
      }

      await userApi.update(Number(user.id), updateData)
      
      toast({
        title: "Başarılı",
        description: "Profil bilgileriniz güncellendi",
      })
      
      setShowMyProfileModal(false)
      // Refresh user data
      window.location.reload()
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      toast({
        title: "Uyarı",
        description: error.message || "Profil güncellenemedi",
        variant: "default",
        duration: 5000,
      })
    }
  }

  const handleDeleteUser = async (userId: number) => {
    // Prevent superadmin from deleting themselves
    if (user && Number(user.id) === userId) {
      toast({
        title: "Hata",
        description: "Kendi hesabınızı silemezsiniz",
        variant: "destructive",
      })
      return
    }

    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return
    
    try {
      await userApi.delete(userId)
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla silindi",
      })
      fetchUsers()
    } catch (error: any) {
      console.error('Failed to delete user:', error)
      toast({
        title: "Uyarı",
        description: error.message || "Kullanıcı silinemedi",
        variant: "default",
        duration: 5000,
      })
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.ad_soyad || user.name || "",
      email: user.email || "",
      phone: user.telefon || user.phone || "",
      tc_no: user.tc_no || "",
      password: "",
      role_id: String(user.role.id),
      is_active: user.aktif ?? user.is_active ?? true
    })
    setShowPassword(false)
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      tc_no: "",
      password: "",
      role_id: "",
      is_active: true
    })
    setShowPassword(false)
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render if not superadmin
  if (userRole !== "superadmin") {
    return null
  }

  return (
    <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Kullanıcı Yönetimi</h1>
            <p className="text-slate-600 mt-1">Sistem kullanıcılarını yönetin</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowMyProfileModal(true)}
              variant="outline"
              className="rounded-2xl"
            >
              <User className="h-4 w-4 mr-2" />
              Profilim
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="rounded-2xl"
              style={{ backgroundColor: "#0B3D91", color: "white" }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Yeni Kullanıcı
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="rounded-3xl border-2 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Ad, email, telefon veya TC ile ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-2xl"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="max-h-[300px] overflow-y-auto z-[100]">
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {Object.keys(roleCategories).map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="max-h-[300px] overflow-y-auto z-[100]">
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users by Category */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 rounded-3xl border-2 p-1 bg-white">
            <TabsTrigger value="all" className="rounded-2xl">Tümü ({filteredUsers.length})</TabsTrigger>
            {Object.keys(roleCategories).map(category => {
              const count = filteredUsers.filter(u => getRoleCategory(u.role.name) === category).length
              return (
                <TabsTrigger key={category} value={category} className="rounded-2xl">
                  {category} ({count})
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card className="rounded-3xl border-2 shadow-lg">
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
                        <tr className="border-b-2">
                          <th className="text-left p-4 font-semibold text-slate-700">Ad Soyad</th>
                          <th className="text-left p-4 font-semibold text-slate-700">İletişim</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Rol</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Durum</th>
                          <th className="text-right p-4 font-semibold text-slate-700">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((userItem) => (
                          <tr key={userItem.id} className="border-b hover:bg-slate-50 transition-colors">
                            <td className="p-4">
                              <div className="font-medium">{userItem.ad_soyad || userItem.name}</div>
                              {userItem.telefon || userItem.phone ? (
                                <div className="text-sm text-slate-500">{userItem.telefon || userItem.phone}</div>
                              ) : null}
                            </td>
                            <td className="p-4">
                              <div className="text-slate-600">{userItem.email || '-'}</div>
                              {userItem.tc_no && (
                                <div className="text-sm text-slate-500">TC: {userItem.tc_no}</div>
                              )}
                            </td>
                            <td className="p-4">
                              <Badge className={cn("rounded-xl border", getRoleBadgeColor(userItem.role.name))}>
                                {getRoleDisplayName(userItem.role.name)}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <Badge className={cn("rounded-xl", (userItem.aktif ?? userItem.is_active ?? true) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                                {(userItem.aktif ?? userItem.is_active ?? true) ? 'Aktif' : 'Pasif'}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(userItem)}
                                  className="rounded-xl"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {user && Number(user.id) !== userItem.id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUser(userItem.id)}
                                    className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
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
          </TabsContent>

          {Object.keys(roleCategories).map(category => (
            <TabsContent key={category} value={category} className="space-y-4">
              <Card className="rounded-3xl border-2 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {category === 'Yönetim' && <Shield className="h-5 w-5 text-purple-600" />}
                    {category === 'Operasyon' && <Briefcase className="h-5 w-5 text-green-600" />}
                    {category === 'Bayi' && <Building2 className="h-5 w-5 text-orange-600" />}
                    {category === 'Müşteri' && <Users className="h-5 w-5 text-gray-600" />}
                    {category} ({usersByCategory[category]?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {usersByCategory[category]?.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-600">Bu kategoride kullanıcı bulunamadı.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {usersByCategory[category]?.map((userItem) => (
                        <Card key={userItem.id} className="rounded-2xl border-2 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-lg">{userItem.ad_soyad || userItem.name}</h3>
                                <p className="text-sm text-slate-600">{userItem.email || '-'}</p>
                                {userItem.telefon || userItem.phone ? (
                                  <p className="text-xs text-slate-500 mt-1">{userItem.telefon || userItem.phone}</p>
                                ) : null}
                              </div>
                              <Badge className={cn("rounded-xl border", getRoleBadgeColor(userItem.role.name))}>
                                {getRoleDisplayName(userItem.role.name)}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <Badge className={cn("rounded-xl", (userItem.aktif ?? userItem.is_active ?? true) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                                {(userItem.aktif ?? userItem.is_active ?? true) ? 'Aktif' : 'Pasif'}
                              </Badge>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(userItem)}
                                  className="rounded-xl"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {user && Number(user.id) !== userItem.id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUser(userItem.id)}
                                    className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Create User Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="sm:max-w-[600px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Yeni Kullanıcı Ekle</DialogTitle>
              <DialogDescription>
                Sisteme yeni bir kullanıcı ekleyin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Ad Soyad *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="rounded-2xl mt-2"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
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
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                      className="rounded-2xl pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full rounded-2xl"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGeneratePassword}
                    className="rounded-2xl"
                    title="Rastgele şifre üret ve kopyala"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Üret
                  </Button>
                  {formData.password && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopyPassword}
                      className="rounded-2xl"
                      title="Şifreyi kopyala"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="role">Rol *</Label>
                <Select value={formData.role_id} onValueChange={(value) => setFormData({...formData, role_id: value})}>
                  <SelectTrigger className="rounded-2xl mt-2">
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} className="max-h-[300px] overflow-y-auto z-[100]">
                    {roles
                      .filter(role => role.name !== 'musteri' && role.name !== 'customer')
                      .map(role => (
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
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }} className="rounded-2xl">
                İptal
              </Button>
              <Button onClick={handleCreateUser} className="rounded-2xl" style={{ backgroundColor: "#0B3D91", color: "white" }}>
                Kullanıcı Ekle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[600px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Kullanıcı Düzenle</DialogTitle>
              <DialogDescription>
                Kullanıcı bilgilerini güncelleyin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit_name">Ad Soyad *</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="rounded-2xl mt-2"
                />
              </div>
              <div>
                <Label htmlFor="edit_email">Email</Label>
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
                  <Label htmlFor="edit_phone">Telefon</Label>
                  <Input
                    id="edit_phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                    <Input
                      id="edit_password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                      className="rounded-2xl pr-10"
                      placeholder="Şifre değiştirmek için doldurun"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full rounded-2xl"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const newPassword = generateStrongPassword()
                      setFormData({ ...formData, password: newPassword })
                      navigator.clipboard.writeText(newPassword)
                      toast({
                        title: "Şifre Oluşturuldu",
                        description: "Rastgele şifre oluşturuldu ve panoya kopyalandı.",
                      })
                    }}
                    className="rounded-2xl"
                    title="Rastgele şifre üret ve kopyala"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Üret
                  </Button>
                  {formData.password && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(formData.password)
                        toast({
                          title: "Kopyalandı",
                          description: "Şifre panoya kopyalandı.",
                        })
                      }}
                      className="rounded-2xl"
                      title="Şifreyi kopyala"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="edit_role">Rol *</Label>
                <Select value={formData.role_id} onValueChange={(value) => setFormData({...formData, role_id: value})}>
                  <SelectTrigger className="rounded-2xl mt-2">
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} className="max-h-[300px] overflow-y-auto z-[100]">
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
                  id="edit_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="edit_is_active">Aktif</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }} className="rounded-2xl">
                İptal
              </Button>
              <Button onClick={handleEditUser} className="rounded-2xl" style={{ backgroundColor: "#0B3D91", color: "white" }}>
                Güncelle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* My Profile Modal */}
        <Dialog open={showMyProfileModal} onOpenChange={setShowMyProfileModal}>
          <DialogContent className="sm:max-w-[600px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Profil Bilgilerim</DialogTitle>
              <DialogDescription>
                Kendi bilgilerinizi ve şifrenizi güncelleyin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="my_name">Ad Soyad *</Label>
                <Input
                  id="my_name"
                  value={myProfileData.name}
                  onChange={(e) => setMyProfileData({...myProfileData, name: e.target.value})}
                  className="rounded-2xl mt-2"
                />
              </div>
              <div>
                <Label htmlFor="my_email">Email</Label>
                <Input
                  id="my_email"
                  type="email"
                  value={myProfileData.email}
                  onChange={(e) => setMyProfileData({...myProfileData, email: e.target.value})}
                  className="rounded-2xl mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="my_phone">Telefon</Label>
                  <Input
                    id="my_phone"
                    value={myProfileData.phone}
                    onChange={(e) => setMyProfileData({...myProfileData, phone: e.target.value})}
                    className="rounded-2xl mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="my_tc_no">TC No</Label>
                  <Input
                    id="my_tc_no"
                    value={myProfileData.tc_no}
                    onChange={(e) => setMyProfileData({...myProfileData, tc_no: e.target.value})}
                    className="rounded-2xl mt-2"
                  />
                </div>
              </div>
              <div className="border-t pt-4">
                <Label className="text-lg font-semibold">Şifre Değiştir</Label>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label htmlFor="new_password">Yeni Şifre</Label>
                    <div className="flex gap-2 mt-2">
                      <div className="relative flex-1">
                        <Input
                          id="new_password"
                          type={showPassword ? "text" : "password"}
                          value={myProfileData.newPassword}
                          onChange={(e) => setMyProfileData({...myProfileData, newPassword: e.target.value})}
                          className="rounded-2xl pr-10"
                          placeholder="Yeni şifre girin"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full rounded-2xl"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const newPassword = generateStrongPassword()
                          setMyProfileData({ ...myProfileData, newPassword, confirmPassword: newPassword })
                          navigator.clipboard.writeText(newPassword)
                          toast({
                            title: "Şifre Oluşturuldu",
                            description: "Rastgele şifre oluşturuldu ve panoya kopyalandı.",
                          })
                        }}
                        className="rounded-2xl"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Rastgele
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirm_password">Yeni Şifre Tekrar</Label>
                    <Input
                      id="confirm_password"
                      type={showPassword ? "text" : "password"}
                      value={myProfileData.confirmPassword}
                      onChange={(e) => setMyProfileData({...myProfileData, confirmPassword: e.target.value})}
                      className="rounded-2xl mt-2"
                      placeholder="Yeni şifreyi tekrar girin"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMyProfileModal(false)} className="rounded-2xl">
                İptal
              </Button>
              <Button onClick={handleUpdateMyProfile} className="rounded-2xl" style={{ backgroundColor: "#0B3D91", color: "white" }}>
                Güncelle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
