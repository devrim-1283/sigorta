"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Save, User, Bell, Shield, Database, Palette, Globe } from "lucide-react"
import type { UserRole } from "@/lib/role-config"

export default function SettingsPage() {
  const { isAuthenticated, user, isLoading, logout } = useAuth()
  const router = useRouter()
  const userRole: UserRole = (user?.role?.name as UserRole) || "superadmin"

  const [generalSettings, setGeneralSettings] = useState({
    companyName: "Oksijen Oto Sigorta",
    email: "info@oksijenoto.com",
    phone: "+90 212 555 0123",
    address: "İstanbul, Türkiye",
    taxNumber: "1234567890",
    taxOffice: "Kadıköy"
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    monthlyReports: true,
    systemAlerts: true,
    customerUpdates: false
  })

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: true,
    passwordExpiry: true,
    ipRestriction: false,
    auditLog: true
  })

  const [systemSettings, setSystemSettings] = useState({
    autoBackup: true,
    maintenanceMode: false,
    debugMode: false,
    apiRateLimit: true,
    fileUploadLimit: "10MB"
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleSaveSettings = async (section: string) => {
    try {
      // API call to save settings
      const response = await fetch('/api/settings/' + section, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          general: generalSettings,
          notifications: notificationSettings,
          security: securitySettings,
          system: systemSettings
        }),
      });

      if (response.ok) {
        // Show success message
        alert('Ayarlar başarıyla kaydedildi!');
      } else {
        throw new Error('Ayarlar kaydedilemedi');
      }
    } catch (error: any) {
      console.error('Settings save error:', error);
      alert('Ayarlar kaydedilemedi: ' + error.message);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#0B3D91] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600">Yükleniyor...</p>
        </div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src="/oksijen-logo.png" alt="Logo" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Ayarlar</h1>
              <p className="text-sm text-slate-600">Sistem ayarlarını burada yönetebilirsiniz</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="rounded-2xl border-2 font-medium bg-transparent"
          >
            Çıkış Yap
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <Card className="rounded-3xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" style={{ color: "#0B3D91" }} />
                Genel Ayarlar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Şirket Adı</Label>
                <Input
                  id="companyName"
                  value={generalSettings.companyName}
                  onChange={(e) => setGeneralSettings({...generalSettings, companyName: e.target.value})}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={generalSettings.email}
                  onChange={(e) => setGeneralSettings({...generalSettings, email: e.target.value})}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={generalSettings.phone}
                  onChange={(e) => setGeneralSettings({...generalSettings, phone: e.target.value})}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adres</Label>
                <Input
                  id="address"
                  value={generalSettings.address}
                  onChange={(e) => setGeneralSettings({...generalSettings, address: e.target.value})}
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxNumber">Vergi No</Label>
                  <Input
                    id="taxNumber"
                    value={generalSettings.taxNumber}
                    onChange={(e) => setGeneralSettings({...generalSettings, taxNumber: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                  <Input
                    id="taxOffice"
                    value={generalSettings.taxOffice}
                    onChange={(e) => setGeneralSettings({...generalSettings, taxOffice: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <Button
                onClick={() => handleSaveSettings('general')}
                className="rounded-2xl w-full"
                style={{ backgroundColor: "#F57C00", color: "white" }}
              >
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="rounded-3xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" style={{ color: "#0B3D91" }} />
                Bildirim Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>E-posta Bildirimleri</Label>
                  <p className="text-sm text-muted-foreground">Önemli güncellemeler için e-posta al</p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>SMS Bildirimleri</Label>
                  <p className="text-sm text-muted-foreground">Acil durumlar için SMS al</p>
                </div>
                <Switch
                  checked={notificationSettings.smsNotifications}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, smsNotifications: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Anlık Bildirimler</Label>
                  <p className="text-sm text-muted-foreground">Tarayıcı bildirimlerini etkinleştir</p>
                </div>
                <Switch
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, pushNotifications: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Aylık Raporlar</Label>
                  <p className="text-sm text-muted-foreground">Aylık performans raporları al</p>
                </div>
                <Switch
                  checked={notificationSettings.monthlyReports}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, monthlyReports: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Sistem Uyarıları</Label>
                  <p className="text-sm text-muted-foreground">Sistem bildirimlerini al</p>
                </div>
                <Switch
                  checked={notificationSettings.systemAlerts}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, systemAlerts: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Müşteri Güncellemeleri</Label>
                  <p className="text-sm text-muted-foreground">Müşteri işlemleri hakkında bilgilendirme al</p>
                </div>
                <Switch
                  checked={notificationSettings.customerUpdates}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, customerUpdates: checked})}
                />
              </div>
              <Button
                onClick={() => handleSaveSettings('notifications')}
                className="rounded-2xl w-full"
                style={{ backgroundColor: "#F57C00", color: "white" }}
              >
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </Button>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="rounded-3xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" style={{ color: "#0B3D91" }} />
                Güvenlik Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>İki Faktörlü Kimlik Doğrulama</Label>
                  <p className="text-sm text-muted-foreground">Giriş için 2FA gerektir</p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorAuth}
                  onCheckedChange={(checked) => setSecuritySettings({...securitySettings, twoFactorAuth: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Oturum Zaman Aşımı</Label>
                  <p className="text-sm text-muted-foreground">Hareketsiz oturumları sonlandır</p>
                </div>
                <Switch
                  checked={securitySettings.sessionTimeout}
                  onCheckedChange={(checked) => setSecuritySettings({...securitySettings, sessionTimeout: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Parola Süreleme</Label>
                  <p className="text-sm text-muted-foreground">Düzenli parola değişimi gerektir</p>
                </div>
                <Switch
                  checked={securitySettings.passwordExpiry}
                  onCheckedChange={(checked) => setSecuritySettings({...securitySettings, passwordExpiry: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>IP Kısıtlama</Label>
                  <p className="text-sm text-muted-foreground">Belirli IP'lere erişim izni ver</p>
                </div>
                <Switch
                  checked={securitySettings.ipRestriction}
                  onCheckedChange={(checked) => setSecuritySettings({...securitySettings, ipRestriction: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Denetim Günlüğü</Label>
                  <p className="text-sm text-muted-foreground">Tüm işlemleri kaydet</p>
                </div>
                <Switch
                  checked={securitySettings.auditLog}
                  onCheckedChange={(checked) => setSecuritySettings({...securitySettings, auditLog: checked})}
                />
              </div>
              <Button
                onClick={() => handleSaveSettings('security')}
                className="rounded-2xl w-full"
                style={{ backgroundColor: "#F57C00", color: "white" }}
              >
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </Button>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card className="rounded-3xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" style={{ color: "#0B3D91" }} />
                Sistem Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Otomatik Yedekleme</Label>
                  <p className="text-sm text-muted-foreground">Günlük otomatik yedekleme yap</p>
                </div>
                <Switch
                  checked={systemSettings.autoBackup}
                  onCheckedChange={(checked) => setSystemSettings({...systemSettings, autoBackup: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Bakım Modu</Label>
                  <p className="text-sm text-muted-foreground">Siteyi bakım moduna al</p>
                </div>
                <Switch
                  checked={systemSettings.maintenanceMode}
                  onCheckedChange={(checked) => setSystemSettings({...systemSettings, maintenanceMode: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Hata Ayıklama Modu</Label>
                  <p className="text-sm text-muted-foreground">Geliştirici modunu etkinleştir</p>
                </div>
                <Switch
                  checked={systemSettings.debugMode}
                  onCheckedChange={(checked) => setSystemSettings({...systemSettings, debugMode: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>API Hız Sınırlama</Label>
                  <p className="text-sm text-muted-foreground">API isteklerini sınırla</p>
                </div>
                <Switch
                  checked={systemSettings.apiRateLimit}
                  onCheckedChange={(checked) => setSystemSettings({...systemSettings, apiRateLimit: checked})}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="fileUploadLimit">Dosya Yükleme Limiti</Label>
                <select
                  id="fileUploadLimit"
                  value={systemSettings.fileUploadLimit}
                  onChange={(e) => setSystemSettings({...systemSettings, fileUploadLimit: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-[#0B3D91] focus:outline-none"
                >
                  <option value="5MB">5 MB</option>
                  <option value="10MB">10 MB</option>
                  <option value="25MB">25 MB</option>
                  <option value="50MB">50 MB</option>
                  <option value="100MB">100 MB</option>
                </select>
              </div>
              <Button
                onClick={() => handleSaveSettings('system')}
                className="rounded-2xl w-full"
                style={{ backgroundColor: "#F57C00", color: "white" }}
              >
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}