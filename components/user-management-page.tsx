"use client"

import { useState } from "react"
import {
  Search,
  Plus,
  Phone,
  User,
  Edit,
  Ban,
  Check,
  X,
  RefreshCw,
  Key,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useUsers, type User } from "@/hooks/useUsers"
import { toast } from "sonner"

export function UserManagementPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    tc_no: "",
    password: "",
    role_id: "",
    dealer_id: "",
    is_active: true,
  })

  const {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    refetch,
  } = useUsers()

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery) ||
      user.tc_no?.includes(searchQuery)
  )

  const handleCreateUser = async () => {
    try {
      await createUser(formData)
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return
    try {
      await updateUser(selectedUser.id, formData)
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      resetForm()
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleToggleStatus = async (userId: number) => {
    try {
      await toggleUserStatus(userId)
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email || "",
      phone: user.phone || "",
      tc_no: user.tc_no || "",
      password: "",
      role_id: user.role_id.toString(),
      dealer_id: user.dealer_id?.toString() || "",
      is_active: user.is_active,
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      tc_no: "",
      password: "",
      role_id: "",
      dealer_id: "",
      is_active: true,
    })
  }

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case "superadmin":
        return "bg-purple-100 text-purple-800"
      case "birincil-admin":
        return "bg-blue-100 text-blue-800"
      case "ikincil-admin":
        return "bg-green-100 text-green-800"
      case "evrak-birimi":
        return "bg-orange-100 text-orange-800"
      case "bayi":
        return "bg-yellow-100 text-yellow-800"
      case "musteri":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: "#0B3D91" }}>
            Kullanıcı Yönetimi
          </h2>
          <p className="text-muted-foreground font-medium mt-1">
            {loading ? "Yükleniyor..." : "Sistem kullanıcılarını oluşturun ve yönetin"}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={refetch}
            disabled={loading}
            className="rounded-2xl bg-white border-2 font-semibold"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Yenile
          </Button>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="rounded-2xl font-semibold shadow-lg"
            style={{ backgroundColor: "#F57C00", color: "white" }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Kullanıcı
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="rounded-3xl border-2 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-800">
              <X className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card className="rounded-3xl border-2 shadow-lg">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
            <Input
              placeholder="Kullanıcı adı, e-posta, telefon veya TC ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-2xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="rounded-3xl border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Kullanıcı Listesi ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-bold">Kullanıcı</TableHead>
                  <TableHead className="font-bold">İletişim</TableHead>
                  <TableHead className="font-bold">Rol</TableHead>
                  <TableHead className="font-bold">Durum</TableHead>
                  <TableHead className="font-bold">Kayıt Tarihi</TableHead>
                  <TableHead className="font-bold text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                          <div className="space-y-1">
                            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="h-3 bg-gray-200 rounded w-28 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <div className="h-8 w-8 bg-gray-200 rounded-xl animate-pulse"></div>
                          <div className="h-8 w-8 bg-gray-200 rounded-xl animate-pulse"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "Eşleşen kullanıcı bulunamadı" : "Henüz kullanıcı kaydı bulunmuyor"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback
                              style={{ backgroundColor: "#0B3D91", color: "white" }}
                              className="font-bold"
                            >
                              {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold">{user.name}</p>
                            <p className="text-xs text-muted-foreground">#{user.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {user.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span>{user.email}</span>
                            </div>
                          )}
                          {user.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("rounded-xl", getRoleColor(user.role?.name || ""))}>
                          {user.role?.display_name || user.role?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-xl font-semibold",
                            user.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          )}
                        >
                          {user.is_active ? (
                            <>
                              <Check className="mr-1 h-3 w-3" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <X className="mr-1 h-3 w-3" />
                              Pasif
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(user.created_at).toLocaleDateString("tr-TR")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            className="rounded-xl"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(user.id)}
                            className={cn(
                              "rounded-xl",
                              user.is_active
                                ? "text-red-600 hover:bg-red-50"
                                : "text-green-600 hover:bg-green-50"
                            )}
                          >
                            {user.is_active ? <Ban className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold" style={{ color: "#0B3D91" }}>
              Yeni Kullanıcı Oluştur
            </DialogTitle>
            <DialogDescription>Yeni sistem kullanıcısı oluşturun</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Ad Soyad *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ad Soyad"
                className="rounded-2xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ornek@email.com"
                className="rounded-2xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+90 5XX XXX XX XX"
                className="rounded-2xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tc_no">TC Kimlik No</Label>
              <Input
                id="tc_no"
                value={formData.tc_no}
                onChange={(e) => setFormData({ ...formData, tc_no: e.target.value })}
                placeholder="11 haneli TC no"
                className="rounded-2xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Şifre *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Şifre"
                className="rounded-2xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role_id">Rol *</Label>
              <Select
                value={formData.role_id}
                onValueChange={(value) => setFormData({ ...formData, role_id: value })}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Süper Admin</SelectItem>
                  <SelectItem value="2">Birincil Admin</SelectItem>
                  <SelectItem value="3">İkincil Admin</SelectItem>
                  <SelectItem value="4">Evrak Birimi</SelectItem>
                  <SelectItem value="5">Bayi</SelectItem>
                  <SelectItem value="6">Müşteri</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-2xl border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Durum</Label>
                <p className="text-sm text-muted-foreground">Kullanıcıyı aktif olarak oluştur</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                resetForm()
              }}
              className="rounded-2xl"
            >
              İptal
            </Button>
            <Button
              onClick={handleCreateUser}
              className="rounded-2xl"
              style={{ backgroundColor: "#F57C00", color: "white" }}
              disabled={!formData.name || !formData.password || !formData.role_id}
            >
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold" style={{ color: "#0B3D91" }}>
              Kullanıcı Düzenle
            </DialogTitle>
            <DialogDescription>Kullanıcı bilgilerini güncelleyin</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Ad Soyad *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-2xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">E-posta</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="rounded-2xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Telefon</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="rounded-2xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-tc_no">TC Kimlik No</Label>
              <Input
                id="edit-tc_no"
                value={formData.tc_no}
                onChange={(e) => setFormData({ ...formData, tc_no: e.target.value })}
                className="rounded-2xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">Yeni Şifre</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Boş bırakırsanız şifre değişmez"
                className="rounded-2xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role_id">Rol *</Label>
              <Select
                value={formData.role_id}
                onValueChange={(value) => setFormData({ ...formData, role_id: value })}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Süper Admin</SelectItem>
                  <SelectItem value="2">Birincil Admin</SelectItem>
                  <SelectItem value="3">İkincil Admin</SelectItem>
                  <SelectItem value="4">Evrak Birimi</SelectItem>
                  <SelectItem value="5">Bayi</SelectItem>
                  <SelectItem value="6">Müşteri</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-2xl border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="edit-is_active">Durum</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.is_active ? "Kullanıcı aktif" : "Kullanıcı pasif"}
                </p>
              </div>
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedUser(null)
                resetForm()
              }}
              className="rounded-2xl"
            >
              İptal
            </Button>
            <Button
              onClick={handleEditUser}
              className="rounded-2xl"
              style={{ backgroundColor: "#F57C00", color: "white" }}
              disabled={!formData.name || !formData.role_id}
            >
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}