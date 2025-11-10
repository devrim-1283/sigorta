"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Shield, Users, Settings, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"

type UserRole = "superadmin" | "admin" | "user"

const availablePermissions = [
  // Müşteri Yönetimi
  { id: "customer_create", label: "Müşteri Kaydı Oluşturabilir", category: "Müşteri Yönetimi", module: "customers" },
  {
    id: "customer_view_own",
    label: "Müşteri Listesini Görebilir (Sadece Kendi)",
    category: "Müşteri Yönetimi",
    module: "customers",
  },
  {
    id: "customer_view_all",
    label: "Müşteri Listesini Görebilir (Tüm Müşteriler)",
    category: "Müşteri Yönetimi",
    module: "customers",
  },
  {
    id: "customer_edit",
    label: "Müşteri Bilgilerini Düzenleyebilir",
    category: "Müşteri Yönetimi",
    module: "customers",
  },
  { id: "customer_delete", label: "Müşteri Silebilir", category: "Müşteri Yönetimi", module: "customers" },
  {
    id: "customer_status_update",
    label: "Müşteri Başvuru Durumu Güncelleyebilir",
    category: "Müşteri Yönetimi",
    module: "customers",
  },
  {
    id: "customer_view_owner",
    label: "Başvuru Sahibini ve Bayisini Görebilir",
    category: "Müşteri Yönetimi",
    module: "customers",
  },

  // Evrak Yönetimi
  { id: "document_upload", label: "Evrak Yükleyebilir", category: "Evrak Yönetimi", module: "documents" },
  { id: "document_view", label: "Evrakları Görebilir", category: "Evrak Yönetimi", module: "documents" },
  { id: "document_delete", label: "Evrak Silebilir", category: "Evrak Yönetimi", module: "documents" },
  { id: "document_download", label: "Evrak İndirebilir", category: "Evrak Yönetimi", module: "documents" },

  // Muhasebe
  { id: "accounting_view", label: "Muhasebe Görebilir", category: "Muhasebe", module: "accounting" },
  { id: "accounting_edit", label: "Muhasebe Düzenleyebilir", category: "Muhasebe", module: "accounting" },
  { id: "invoice_create", label: "Fatura Oluşturabilir", category: "Muhasebe", module: "accounting" },
  { id: "invoice_view", label: "Faturaları Görebilir", category: "Muhasebe", module: "accounting" },
  { id: "payment_manage", label: "Ödeme İşlemleri Yapabilir", category: "Muhasebe", module: "accounting" },

  // Bayi Yönetimi
  { id: "dealer_list_view", label: "Bayi Listesi Görebilir", category: "Bayi Yönetimi", module: "dealers" },
  { id: "dealer_create", label: "Bayi Ekleyebilir", category: "Bayi Yönetimi", module: "dealers" },
  { id: "dealer_edit", label: "Bayi Düzenleyebilir", category: "Bayi Yönetimi", module: "dealers" },
  { id: "dealer_delete", label: "Bayi Silebilir", category: "Bayi Yönetimi", module: "dealers" },
  { id: "dealer_manage", label: "Bayi Yönetimi Yapabilir", category: "Bayi Yönetimi", module: "dealers" },

  // Sistem Yönetimi
  { id: "role_management_view", label: "Rol Yönetimi Görebilir", category: "Sistem Yönetimi", module: "system" },
  { id: "role_management_edit", label: "Rol Yönetimi Düzenleyebilir", category: "Sistem Yönetimi", module: "system" },
  { id: "system_settings_view", label: "Sistem Ayarlarını Görebilir", category: "Sistem Yönetimi", module: "system" },
  {
    id: "system_settings_edit",
    label: "Sistem Ayarlarını Düzenleyebilir",
    category: "Sistem Yönetimi",
    module: "system",
  },
  { id: "user_management", label: "Kullanıcı Yönetimi", category: "Sistem Yönetimi", module: "system" },

  // Raporlama
  { id: "report_view", label: "Raporları Görebilir", category: "Raporlama", module: "reports" },
  { id: "report_export", label: "Rapor İndirebilir", category: "Raporlama", module: "reports" },
  { id: "report_create", label: "Rapor Oluşturabilir", category: "Raporlama", module: "reports" },
]

const initialRoles = [
  {
    id: "1",
    name: "Superadmin",
    description: "Sistemin ve tüm rollerin sahibi - Sınırsız yetki",
    userCount: 1,
    permissions: ["all"],
    color: "#DC2626",
    isProtected: true,
  },
  {
    id: "2",
    name: "Bayi",
    description: "Müşteri kaydı oluşturabilir, kendi müşterilerini görebilir",
    userCount: 8,
    permissions: ["customer_create", "customer_view_own", "document_upload", "document_view"],
    color: "#0B3D91",
    isProtected: false,
  },
  {
    id: "3",
    name: "Operasyon Admin",
    description: "Tüm müşterileri görebilir, başvuru durumu güncelleyebilir",
    userCount: 5,
    permissions: ["customer_view_all", "customer_status_update", "document_view", "document_upload", "accounting_view"],
    color: "#F57C00",
    isProtected: false,
  },
  {
    id: "4",
    name: "Finans",
    description: "Muhasebe ve finans işlemleri",
    userCount: 3,
    permissions: [
      "customer_view_all",
      "accounting_view",
      "accounting_edit",
      "invoice_view",
      "invoice_create",
      "payment_manage",
      "report_view",
      "report_export",
    ],
    color: "#10B981",
    isProtected: false,
  },
]

interface RoleManagementPageProps {
  currentUserRole?: UserRole
}

export function RoleManagementPage({ currentUserRole = "user" }: RoleManagementPageProps) {
  const [roles, setRoles] = useState(initialRoles)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  })

  const isSuperAdmin = currentUserRole === "superadmin"

  const visibleRoles = isSuperAdmin ? roles : roles.filter((role) => !role.isProtected)
  const canManageRoles = isSuperAdmin

  const handleCreateRole = () => {
    if (!canManageRoles) return

    const role = {
      id: String(roles.length + 1),
      name: newRole.name,
      description: newRole.description,
      userCount: 0,
      permissions: newRole.permissions,
      color: "#6366F1",
      isProtected: false,
    }
    setRoles([...roles, role])
    setIsDialogOpen(false)
    setNewRole({ name: "", description: "", permissions: [] })
  }

  const handleDeleteRole = (id: string) => {
    if (!canManageRoles) return

    const roleToDelete = roles.find((role) => role.id === id)
    if (roleToDelete?.isProtected) return

    setRoles(roles.filter((role) => role.id !== id))
  }

  const handleEditRole = (role: any) => {
    if (!canManageRoles) return
    if (role.isProtected && !isSuperAdmin) return

    setEditingRole(role)
    setNewRole({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    })
    setIsDialogOpen(true)
  }

  const handleUpdateRole = () => {
    if (!canManageRoles) return

    setRoles(
      roles.map((role) =>
        role.id === editingRole.id
          ? {
              ...role,
              name: newRole.name,
              description: newRole.description,
              permissions: newRole.permissions,
            }
          : role,
      ),
    )
    setIsDialogOpen(false)
    setEditingRole(null)
    setNewRole({ name: "", description: "", permissions: [] })
  }

  const togglePermission = (permissionId: string) => {
    setNewRole((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }))
  }

  const groupedPermissions = availablePermissions.reduce(
    (acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = []
      }
      acc[perm.category].push(perm)
      return acc
    },
    {} as Record<string, typeof availablePermissions>,
  )

  const getPermissionLabels = (permissionIds: string[]) => {
    if (permissionIds.includes("all")) return ["Tüm Yetkiler"]
    return permissionIds.map((id) => availablePermissions.find((p) => p.id === id)?.label).filter(Boolean) as string[]
  }

  return (
    <div className="space-y-6">
      {!isSuperAdmin && (
        <Alert className="rounded-2xl border-2 border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900 font-semibold">Sınırlı Erişim</AlertTitle>
          <AlertDescription className="text-amber-800">
            Rol yönetimi yetkilerine sahip değilsiniz. Sadece mevcut rolleri görüntüleyebilirsiniz. Rol oluşturma,
            düzenleme ve silme işlemleri için Superadmin yetkisi gereklidir.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: "#0B3D91" }}>
            Rol Yönetimi
          </h2>
          <p className="text-muted-foreground font-medium mt-1">
            {isSuperAdmin
              ? "Sınırsız sayıda rol tanımlayın ve her modül için detaylı yetkiler belirleyin"
              : "Mevcut rolleri görüntüleyin (Düzenleme yetkisi yok)"}
          </p>
        </div>
        {canManageRoles && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="rounded-2xl font-semibold shadow-lg"
                style={{ backgroundColor: "#F57C00", color: "white" }}
                onClick={() => {
                  setEditingRole(null)
                  setNewRole({ name: "", description: "", permissions: [] })
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Yeni Rol Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>{editingRole ? "Rol Düzenle" : "Yeni Rol Oluştur"}</DialogTitle>
                <DialogDescription>
                  {editingRole
                    ? "Mevcut rolü düzenleyin ve yetkilerini güncelleyin"
                    : "Yeni bir rol oluşturun ve modül bazında detaylı yetkiler tanımlayın"}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[65vh] pr-4">
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Rol Adı</Label>
                    <Input
                      id="name"
                      placeholder="Örn: Bayi, Operasyon Admin, Finans"
                      value={newRole.name}
                      onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Açıklama</Label>
                    <Input
                      id="description"
                      placeholder="Bu rolün sorumluluklarını kısaca açıklayın"
                      value={newRole.description}
                      onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Modül ve Eylem Bazlı Yetkiler</Label>
                      <Badge variant="secondary" className="rounded-xl">
                        {newRole.permissions.length} yetki seçildi
                      </Badge>
                    </div>
                    {Object.entries(groupedPermissions).map(([category, perms]) => (
                      <Card key={category} className="rounded-2xl border-2">
                        <CardHeader className="pb-3">
                          <CardTitle
                            className="text-sm font-semibold flex items-center gap-2"
                            style={{ color: "#0B3D91" }}
                          >
                            <Shield className="h-4 w-4" />
                            {category}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {perms.map((perm) => (
                            <div
                              key={perm.id}
                              className="flex items-center justify-between space-x-3 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                              <label
                                htmlFor={perm.id}
                                className="text-sm font-medium leading-none cursor-pointer flex-1"
                              >
                                {perm.label}
                              </label>
                              <Switch
                                id={perm.id}
                                checked={newRole.permissions.includes(perm.id)}
                                onCheckedChange={() => togglePermission(perm.id)}
                              />
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                  İptal
                </Button>
                <Button
                  onClick={editingRole ? handleUpdateRole : handleCreateRole}
                  className="rounded-xl"
                  style={{ backgroundColor: "#F57C00", color: "white" }}
                  disabled={!newRole.name || !newRole.description}
                >
                  {editingRole ? "Güncelle" : "Oluştur"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visibleRoles.map((role) => {
          const permissionLabels = getPermissionLabels(role.permissions)
          return (
            <Card
              key={role.id}
              className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-md"
                      style={{ backgroundColor: role.color }}
                    >
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {role.name}
                        {role.isProtected && (
                          <Badge variant="secondary" className="rounded-xl text-xs">
                            Korumalı
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">{role.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="font-semibold">{role.userCount} kullanıcı</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Yetkiler:</p>
                  <div className="flex flex-wrap gap-2">
                    {permissionLabels.slice(0, 3).map((permission, index) => (
                      <Badge key={index} variant="secondary" className="rounded-xl text-xs">
                        {permission}
                      </Badge>
                    ))}
                    {permissionLabels.length > 3 && (
                      <Badge variant="secondary" className="rounded-xl text-xs">
                        +{permissionLabels.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
                {canManageRoles && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl bg-transparent"
                      onClick={() => handleEditRole(role)}
                      disabled={role.isProtected && !isSuperAdmin}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Düzenle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                      onClick={() => handleDeleteRole(role.id)}
                      disabled={role.isProtected}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="rounded-3xl border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" style={{ color: "#0B3D91" }} />
            Rol Yönetimi Sistemi Hakkında
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="space-y-2">
            <p className="font-semibold" style={{ color: "#0B3D91" }}>
              Superadmin Yetkileri:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Sınırsız sayıda rol tanımlayabilir</li>
              <li>Her modül ve eylem için detaylı yetkiler atayabilir</li>
              <li>Tüm rolleri görebilir ve yönetebilir</li>
              <li>Sistemin tüm özelliklerine erişebilir</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-semibold" style={{ color: "#F57C00" }}>
              Diğer Kullanıcılar:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Sadece kendilerine tanımlanmış rolün izinleri kadarını görür</li>
              <li>Yetkisi olmayan modüllere erişemez</li>
              <li>Rol bazlı veri filtreleme (örn: sadece kendi müşterileri)</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-semibold" style={{ color: "#10B981" }}>
              Örnek Roller:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong>Bayi:</strong> Müşteri kaydı oluşturabilir, sadece kendi müşterilerini görebilir
              </li>
              <li>
                <strong>Operasyon Admin:</strong> Tüm müşterileri görebilir, başvuru durumu güncelleyebilir (başvuru
                sahibini göremez)
              </li>
              <li>
                <strong>Finans:</strong> Muhasebe görebilir, müşteri listesi salt okunur
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
