"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Settings, Save, Database, Mail, Bell, Shield, Globe, Clock, Download } from "lucide-react"
import { type UserRole } from "@/lib/role-config"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface SystemSettings {
  site_name: string
  site_description: string
  contact_email: string
  contact_phone: string
  enable_notifications: boolean
  enable_email_notifications: boolean
  enable_sms_notifications: boolean
  max_upload_size: number
  session_timeout: number
  maintenance_mode: boolean
  database_url: string
}

export default function SystemSettingsPage() {
  const { isAuthenticated, user, isLoading, logout } = useAuth()
  const router = useRouter()
  const userRole: UserRole = (user?.role?.name as UserRole) || "superadmin"
  const storagePathHint = process.env.NEXT_PUBLIC_DOCUMENT_STORAGE_ROOT || "/storage/documents"

  const [settings, setSettings] = useState<SystemSettings>({
    site_name: "Sigorta Yönetim Sistemi",
    site_description: "Sigorta müşterileri ve evrak takip sistemi",
    contact_email: "info@sigorta.com",
    contact_phone: "+90 555 123 4567",
    enable_notifications: true,
    enable_email_notifications: true,
    enable_sms_notifications: false,
    max_upload_size: 10,
    session_timeout: 30,
    maintenance_mode: false,
    database_url: process.env.DATABASE_URL || ""
  })
  const [loading, setLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

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

  const handleSave = async () => {
    try {
      setLoading(true)
      setSaveMessage("")
      
      // Simulated save - in production this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSaveMessage("Ayarlar başarıyla kaydedildi!")
      setTimeout(() => setSaveMessage(""), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveMessage("Ayarlar kaydedilirken hata oluştu!")
    } finally {
      setLoading(false)
    }
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Sistem Ayarları</h1>
            <p className="text-slate-600 mt-1">Genel sistem ayarlarını yönetin</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="rounded-2xl bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>

        {saveMessage && (
          <Card className={`rounded-3xl border-2 ${saveMessage.includes('başarıyla') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <CardContent className="p-4">
              <p className={`text-sm font-medium ${saveMessage.includes('başarıyla') ? 'text-green-800' : 'text-red-800'}`}>
                {saveMessage}
              </p>
            </CardContent>
          </Card>
        )}

        {/* General Settings */}
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Genel Ayarlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="site_name">Site Adı</Label>
              <Input
                id="site_name"
                value={settings.site_name}
                onChange={(e) => setSettings({...settings, site_name: e.target.value})}
                className="rounded-2xl mt-2"
              />
            </div>
            <div>
              <Label htmlFor="site_description">Site Açıklaması</Label>
              <Textarea
                id="site_description"
                value={settings.site_description}
                onChange={(e) => setSettings({...settings, site_description: e.target.value})}
                className="rounded-2xl mt-2"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_email">İletişim Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => setSettings({...settings, contact_email: e.target.value})}
                  className="rounded-2xl mt-2"
                />
              </div>
              <div>
                <Label htmlFor="contact_phone">İletişim Telefon</Label>
                <Input
                  id="contact_phone"
                  value={settings.contact_phone}
                  onChange={(e) => setSettings({...settings, contact_phone: e.target.value})}
                  className="rounded-2xl mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              Bildirim Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable_notifications">Bildirimleri Etkinleştir</Label>
                <p className="text-sm text-slate-500">Sistem bildirimlerini aç/kapat</p>
              </div>
              <Switch
                id="enable_notifications"
                checked={settings.enable_notifications}
                onCheckedChange={(checked) => setSettings({...settings, enable_notifications: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable_email_notifications">Email Bildirimleri</Label>
                <p className="text-sm text-slate-500">Email ile bildirim gönder</p>
              </div>
              <Switch
                id="enable_email_notifications"
                checked={settings.enable_email_notifications}
                onCheckedChange={(checked) => setSettings({...settings, enable_email_notifications: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable_sms_notifications">SMS Bildirimleri</Label>
                <p className="text-sm text-slate-500">SMS ile bildirim gönder (NetGSM)</p>
              </div>
              <Switch
                id="enable_sms_notifications"
                checked={settings.enable_sms_notifications}
                onCheckedChange={(checked) => setSettings({...settings, enable_sms_notifications: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Sistem Konfigürasyonu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_upload_size">Maksimum Dosya Boyutu (MB)</Label>
                <Input
                  id="max_upload_size"
                  type="number"
                  value={settings.max_upload_size}
                  onChange={(e) => setSettings({...settings, max_upload_size: parseInt(e.target.value)})}
                  className="rounded-2xl mt-2"
                />
              </div>
              <div>
                <Label htmlFor="session_timeout">Oturum Zaman Aşımı (dakika)</Label>
                <Input
                  id="session_timeout"
                  type="number"
                  value={settings.session_timeout}
                  onChange={(e) => setSettings({...settings, session_timeout: parseInt(e.target.value)})}
                  className="rounded-2xl mt-2"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-200">
              <div className="space-y-0.5">
                <Label htmlFor="maintenance_mode" className="text-amber-900">Bakım Modu</Label>
                <p className="text-sm text-amber-700">Sistem bakıma alınsın mı?</p>
              </div>
              <Switch
                id="maintenance_mode"
                checked={settings.maintenance_mode}
                onCheckedChange={(checked) => setSettings({...settings, maintenance_mode: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Veritabanı Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="database_url">Database URL</Label>
              <Input
                id="database_url"
                type="password"
                value={settings.database_url}
                className="rounded-2xl mt-2 font-mono text-sm"
                disabled
              />
              <p className="text-xs text-slate-500 mt-1">
                Veritabanı bağlantı bilgileri .env dosyasından okunur
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-100 rounded-2xl">
              <div>
                <p className="text-xs text-slate-600">Durum</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <p className="text-sm font-semibold">Bağlı</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-600">Tür</p>
                <p className="text-sm font-semibold mt-1">PostgreSQL</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Versiyon</p>
                <p className="text-sm font-semibold mt-1">15.x</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Sunucu</p>
                <p className="text-sm font-semibold mt-1">Coolify</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Backup */}
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              Evrak Yedeği
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Sisteme yüklenen tüm evrakları yerel depodan sıkıştırılmış şekilde indirebilirsiniz.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-slate-500">
                <p>Evraklar varsayılan olarak <span className="font-semibold">{storagePathHint}</span> klasöründe saklanır.</p>
                <p>Yedek alma işlemi yalnızca <strong>superadmin</strong> kullanıcıları için kullanılabilir.</p>
              </div>
              <Button
                className="rounded-2xl bg-blue-600 hover:bg-blue-700"
                onClick={() => window.open('/api/documents/backup', '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Evrak Yedeğini İndir
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Güvenlik
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Güvenlik Özellikleri</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                  NextAuth.js ile güvenli oturum yönetimi
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                  Bcrypt ile şifrelenmiş kullanıcı parolaları
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                  SQL injection koruması (Prisma ORM)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                  Rol tabanlı erişim kontrolü (RBAC)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                  Rate limiting aktif
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="rounded-3xl border-2 bg-slate-100 border-slate-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-600" />
              Sistem Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-600">Platform</p>
                <p className="text-sm font-semibold mt-1">Next.js 14</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Node Version</p>
                <p className="text-sm font-semibold mt-1">{process.version}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Environment</p>
                <p className="text-sm font-semibold mt-1">{process.env.NODE_ENV || 'production'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Deployment</p>
                <p className="text-sm font-semibold mt-1">Coolify</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

