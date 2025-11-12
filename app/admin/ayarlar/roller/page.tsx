"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Shield, Plus, Edit, Trash2, Users, Lock, Check, X } from "lucide-react"
import { type UserRole } from "@/lib/role-config"
import { AVAILABLE_PAGES, type PagePermission } from "@/lib/available-pages"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface Role {
  id: number
  name: string
  description: string | null
  permissions: string | null // JSON string
  created_at: string
  _count?: {
    users: number
  }
}

interface RolePermissions {
  pages: {
    [pageId: string]: {
      canView?: boolean
      canCreate?: boolean
      canEdit?: boolean
      canDelete?: boolean
      canViewAll?: boolean
      canViewOwn?: boolean
      canExport?: boolean
    }
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
    description: "",
    permissions: {} as RolePermissions["pages"]
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
      const permissionsData: RolePermissions = {
        pages: formData.permissions
      }
      
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          permissions: JSON.stringify(permissionsData)
        })
      })
      
      if (response.ok) {
        setShowCreateModal(false)
        fetchRoles()
        setFormData({ name: "", description: "", permissions: {} })
      }
    } catch (error) {
      console.error('Failed to create role:', error)
    }
  }

  const handleEditRole = async () => {
    if (!selectedRole) return
    
    try {
      const permissionsData: RolePermissions = {
        pages: formData.permissions
      }
      
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          permissions: JSON.stringify(permissionsData)
        })
      })
      
      if (response.ok) {
        setShowEditModal(false)
        fetchRoles()
        setSelectedRole(null)
        setFormData({ name: "", description: "", permissions: {} })
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
    
    // Parse permissions from JSON
    let permissions: RolePermissions["pages"] = {}
    if (role.permissions) {
      try {
        const parsed = JSON.parse(role.permissions)
        permissions = parsed.pages || {}
      } catch (e) {
        console.error('Failed to parse permissions:', e)
      }
    }
    
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: permissions
    })
    setShowEditModal(true)
  }

  const isReadOnlyRole = (roleName: string) => {
    return roleName === 'bayi' || roleName === 'musteri'
  }

  const togglePagePermission = (pageId: string, permission: string) => {
    if (!selectedRole || isReadOnlyRole(selectedRole.name)) return
    
    setFormData(prev => {
      const newPermissions = { ...prev.permissions }
      if (!newPermissions[pageId]) {
        newPermissions[pageId] = {}
      }
      newPermissions[pageId] = {
        ...newPermissions[pageId],
        [permission]: !newPermissions[pageId][permission as keyof typeof newPermissions[typeof pageId]]
      }
      return { ...prev, permissions: newPermissions }
    })
  }

  const togglePageView = (pageId: string) => {
    if (!selectedRole || isReadOnlyRole(selectedRole.name)) return
    
    setFormData(prev => {
      const newPermissions = { ...prev.permissions }
      const currentView = newPermissions[pageId]?.canView || false
      
      if (!currentView) {
        // Enable view - initialize page permissions
        newPermissions[pageId] = {
          canView: true,
        }
      } else {
        // Disable view - remove page from permissions
        delete newPermissions[pageId]
      }
      
      return { ...prev, permissions: newPermissions }
    })
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
                      disabled={isReadOnlyRole(role.name)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Düzenle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRole(role.id)}
                      className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={role.name === 'superadmin' || isReadOnlyRole(role.name)}
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
          <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Yeni Rol Ekle</DialogTitle>
              <DialogDescription>
                Sisteme yeni bir rol ekleyin ve sayfa erişimlerini belirleyin
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6 py-4">
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

                {/* Page Permissions */}
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <Label className="text-base font-semibold">Sayfa Erişimleri ve İzinler</Label>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      Bu rolün hangi sayfaları görüntüleyebileceğini ve o sayfalarda ne işlem yapabileceğini belirleyin
                    </p>
                    
                    <div className="space-y-4">
                      {AVAILABLE_PAGES.map((page) => {
                        const pagePerms = formData.permissions[page.pageId] || {}
                        const hasAccess = pagePerms.canView || false
                        
                        return (
                          <Card key={page.pageId} className="rounded-2xl border-2">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={hasAccess}
                                      onCheckedChange={() => {
                                        setFormData(prev => {
                                          const newPermissions = { ...prev.permissions }
                                          const currentView = newPermissions[page.pageId]?.canView || false
                                          
                                          if (!currentView) {
                                            newPermissions[page.pageId] = {
                                              canView: true,
                                            }
                                          } else {
                                            delete newPermissions[page.pageId]
                                          }
                                          
                                          return { ...prev, permissions: newPermissions }
                                        })
                                      }}
                                      className="rounded"
                                    />
                                    <Label className="font-semibold text-base cursor-pointer">
                                      {page.pageName}
                                    </Label>
                                  </div>
                                  <Badge variant={hasAccess ? "default" : "outline"} className="rounded-xl">
                                    {hasAccess ? "Erişim Var" : "Erişim Yok"}
                                  </Badge>
                                </div>
                                
                                {hasAccess && (
                                  <div className="pl-8 space-y-2 pt-2 border-t">
                                    {Object.entries(page.permissions).map(([permKey, permValue]) => {
                                      if (permKey === 'canView') return null
                                      
                                      const isChecked = pagePerms[permKey as keyof typeof pagePerms] || false
                                      
                                      return (
                                        <div key={permKey} className="flex items-center gap-2">
                                          <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={() => {
                                              setFormData(prev => {
                                                const newPermissions = { ...prev.permissions }
                                                if (!newPermissions[page.pageId]) {
                                                  newPermissions[page.pageId] = {}
                                                }
                                                newPermissions[page.pageId] = {
                                                  ...newPermissions[page.pageId],
                                                  [permKey]: !newPermissions[page.pageId][permKey as keyof typeof newPermissions[typeof page.pageId]]
                                                }
                                                return { ...prev, permissions: newPermissions }
                                              })
                                            }}
                                            className="rounded"
                                          />
                                          <Label className="text-sm cursor-pointer">
                                            {permKey === 'canCreate' && 'Oluşturabilir'}
                                            {permKey === 'canEdit' && 'Düzenleyebilir'}
                                            {permKey === 'canDelete' && 'Silebilir'}
                                            {permKey === 'canViewAll' && 'Tümünü Görebilir'}
                                            {permKey === 'canViewOwn' && 'Sadece Kendi Verilerini Görebilir'}
                                            {permKey === 'canExport' && 'Dışa Aktarabilir'}
                                          </Label>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowCreateModal(false)
                setFormData({ name: "", description: "", permissions: {} })
              }} className="rounded-2xl">
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
          <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Rol Düzenle</DialogTitle>
              <DialogDescription>
                {selectedRole && isReadOnlyRole(selectedRole.name) 
                  ? "Bayi ve Müşteri rolleri varsayılan izinlere sahiptir ve düzenlenemez."
                  : "Rol bilgilerini ve sayfa erişimlerini güncelleyin"}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6 py-4">
                <div>
                  <Label htmlFor="edit_name">Rol Adı *</Label>
                  <Input
                    id="edit_name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="rounded-2xl mt-2"
                    disabled={selectedRole?.name === 'superadmin' || (selectedRole && isReadOnlyRole(selectedRole.name))}
                  />
                  {selectedRole?.name === 'superadmin' && (
                    <p className="text-xs text-amber-600 mt-1">
                      Sistem rolleri değiştirilemez
                    </p>
                  )}
                  {selectedRole && isReadOnlyRole(selectedRole.name) && (
                    <p className="text-xs text-blue-600 mt-1">
                      Bayi ve Müşteri rolleri varsayılan izinlere sahiptir
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
                    disabled={selectedRole && isReadOnlyRole(selectedRole.name)}
                  />
                </div>

                {/* Page Permissions */}
                {selectedRole && !isReadOnlyRole(selectedRole.name) && (
                  <div className="space-y-4">
                    <Separator />
                    <div>
                      <Label className="text-base font-semibold">Sayfa Erişimleri ve İzinler</Label>
                      <p className="text-xs text-slate-500 mt-1 mb-4">
                        Bu rolün hangi sayfaları görüntüleyebileceğini ve o sayfalarda ne işlem yapabileceğini belirleyin
                      </p>
                      
                      <div className="space-y-4">
                        {AVAILABLE_PAGES.map((page) => {
                          const pagePerms = formData.permissions[page.pageId] || {}
                          const hasAccess = pagePerms.canView || false
                          
                          return (
                            <Card key={page.pageId} className="rounded-2xl border-2">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Checkbox
                                        checked={hasAccess}
                                        onCheckedChange={() => togglePageView(page.pageId)}
                                        className="rounded"
                                      />
                                      <Label className="font-semibold text-base cursor-pointer">
                                        {page.pageName}
                                      </Label>
                                    </div>
                                    <Badge variant={hasAccess ? "default" : "outline"} className="rounded-xl">
                                      {hasAccess ? "Erişim Var" : "Erişim Yok"}
                                    </Badge>
                                  </div>
                                  
                                  {hasAccess && (
                                    <div className="pl-8 space-y-2 pt-2 border-t">
                                      {Object.entries(page.permissions).map(([permKey, permValue]) => {
                                        if (permKey === 'canView') return null
                                        
                                        const isChecked = pagePerms[permKey as keyof typeof pagePerms] || false
                                        
                                        return (
                                          <div key={permKey} className="flex items-center gap-2">
                                            <Checkbox
                                              checked={isChecked}
                                              onCheckedChange={() => togglePagePermission(page.pageId, permKey)}
                                              className="rounded"
                                            />
                                            <Label className="text-sm cursor-pointer">
                                              {permKey === 'canCreate' && 'Oluşturabilir'}
                                              {permKey === 'canEdit' && 'Düzenleyebilir'}
                                              {permKey === 'canDelete' && 'Silebilir'}
                                              {permKey === 'canViewAll' && 'Tümünü Görebilir'}
                                              {permKey === 'canViewOwn' && 'Sadece Kendi Verilerini Görebilir'}
                                              {permKey === 'canExport' && 'Dışa Aktarabilir'}
                                            </Label>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Read-only info for bayi and musteri */}
                {selectedRole && isReadOnlyRole(selectedRole.name) && (
                  <div className="space-y-4">
                    <Separator />
                    <Card className="rounded-2xl border-2 bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-blue-600" />
                            <Label className="font-semibold text-blue-900">Varsayılan İzinler</Label>
                          </div>
                          {selectedRole.name === 'bayi' && (
                            <div className="pl-7 space-y-1 text-sm text-blue-800">
                              <p>• Dashboard sayfasını görüntüleyebilir</p>
                              <p>• Sadece kendi müşterilerini görebilir</p>
                              <p>• Kendi müşterilerinin evraklarını görüntüleyebilir</p>
                              <p>• Bildirimlerini görebilir</p>
                            </div>
                          )}
                          {selectedRole.name === 'musteri' && (
                            <div className="pl-7 space-y-1 text-sm text-blue-800">
                              <p>• Dashboard sayfasını görüntüleyebilir</p>
                              <p>• Sadece kendi başvuru durumunu görebilir</p>
                              <p>• Bildirimlerini görebilir</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowEditModal(false)
                setSelectedRole(null)
                setFormData({ name: "", description: "", permissions: {} })
              }} className="rounded-2xl">
                İptal
              </Button>
              {selectedRole && !isReadOnlyRole(selectedRole.name) && (
                <Button onClick={handleEditRole} className="rounded-2xl bg-blue-600 hover:bg-blue-700">
                  Güncelle
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}

