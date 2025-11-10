"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Shield, Plus, Edit, Trash2, Users, Lock } from "lucide-react"
import { type UserRole } from "@/lib/role-config"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface Role {
  id: number
  name: string
  description: string | null
  created_at: string
  _count?: {
    users: number
  }
}

export default function RoleManagementPage() {
  const { isAuthenticated, user, isLoading, logout } = useAuth()
  const router = useRouter()
  const userRole: UserRole = (user?.role?.name as UserRole) || "superadmin"

  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
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

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/roles')
      const data = await response.json()
      setRoles(data.roles || [])
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    } finally {
      setLoading(false)
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

  const getRoleIcon = (roleName: string) => {
    if (roleName.includes('admin')) return <Shield className="h-5 w-5" />
    if (roleName === 'bayi') return <Users className="h-5 w-5" />
    return <Lock className="h-5 w-5" />
  }

  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setShowCreateModal(false)
        fetchRoles()
        setFormData({ name: "", description: "" })
      }
    } catch (error) {
      console.error('Failed to create role:', error)
    }
  }

  const handleEditRole = async () => {
    if (!selectedRole) return
    
    try {
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setShowEditModal(false)
        fetchRoles()
        setSelectedRole(null)
      }
    } catch (error) {
      console.error('Failed to update role:', error)
    }
  }

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('Bu rolü silmek istediğinizden emin misiniz? Bu role sahip kullanıcılar etkilenebilir.')) return
    
    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchRoles()
      } else {
        const error = await response.json()
        alert(error.error || 'Rol silinemedi')
      }
    } catch (error) {
      console.error('Failed to delete role:', error)
    }
  }

  const openEditModal = (role: Role) => {
    setSelectedRole(role)
    setFormData({
      name: role.name,
      description: role.description || ""
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
            <h1 className="text-3xl font-bold text-slate-900">Rol Yönetimi</h1>
            <p className="text-slate-600 mt-1">Sistem rollerini ve yetkilerini yönetin</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="rounded-2xl bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Rol
          </Button>
        </div>

        {/* Roles Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Yükleniyor...</p>
          </div>
        ) : roles.length === 0 ? (
          <Card className="rounded-3xl border-2">
            <CardContent className="p-12 text-center">
              <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Henüz rol eklenmemiş.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <Card key={role.id} className="rounded-3xl border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl ${getRoleBadgeColor(role.name).split(' ')[0]}`}>
                        {getRoleIcon(role.name)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {getRoleDisplayName(role.name)}
                        </CardTitle>
                        <Badge className={`rounded-xl mt-1 ${getRoleBadgeColor(role.name)}`}>
                          {role.name}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600 min-h-[40px]">
                    {role.description || 'Açıklama yok'}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Users className="h-4 w-4" />
                    <span>{role._count?.users || 0} kullanıcı</span>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(role)}
                      className="rounded-xl flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Düzenle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRole(role.id)}
                      className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={role.name === 'superadmin'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="rounded-3xl border-2 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-blue-600">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Rol Yönetimi Hakkında</h3>
                <p className="text-sm text-blue-800">
                  Roller, kullanıcıların sistemde hangi işlemleri yapabileceğini belirler. 
                  Her rol için farklı yetkiler ve erişim seviyeleri tanımlanabilir.
                  Sistem rolleri (superadmin, birincil-admin, vb.) varsayılan rollerdir ve silinmemelidir.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Role Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Yeni Rol Ekle</DialogTitle>
              <DialogDescription>
                Sisteme yeni bir rol ekleyin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Rol Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="ornek-rol"
                  className="rounded-2xl mt-2"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Küçük harf ve tire kullanın (örn: ozel-rol)
                </p>
              </div>
              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Bu rol hakkında açıklama..."
                  className="rounded-2xl mt-2 min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="rounded-2xl">
                İptal
              </Button>
              <Button onClick={handleCreateRole} className="rounded-2xl bg-blue-600 hover:bg-blue-700">
                Rol Ekle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Role Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Rol Düzenle</DialogTitle>
              <DialogDescription>
                Rol bilgilerini güncelleyin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit_name">Rol Adı *</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="rounded-2xl mt-2"
                  disabled={selectedRole?.name === 'superadmin'}
                />
                {selectedRole?.name === 'superadmin' && (
                  <p className="text-xs text-amber-600 mt-1">
                    Sistem rolleri değiştirilemez
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="edit_description">Açıklama</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="rounded-2xl mt-2 min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="rounded-2xl">
                İptal
              </Button>
              <Button onClick={handleEditRole} className="rounded-2xl bg-blue-600 hover:bg-blue-700">
                Güncelle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}

