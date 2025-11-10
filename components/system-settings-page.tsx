"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Upload, Save, Palette, MessageSquare, ListChecks, FileText, X } from "lucide-react"

interface StatusLabel {
  id: string
  name: string
  color: string
  order: number
}

export function SystemSettingsPage() {
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("/oksijen-logo.png")
  const [primaryColor, setPrimaryColor] = useState("#0B3D91")
  const [secondaryColor, setSecondaryColor] = useState("#F57C00")

  // SMS Settings
  const [netgsmApiKey, setNetgsmApiKey] = useState("")
  const [netgsmSenderName, setNetgsmSenderName] = useState("SEFFAF")
  const [smsOnStatusChange, setSmsOnStatusChange] = useState(true)
  const [smsOnDocumentUpload, setSmsOnDocumentUpload] = useState(false)

  // Status Labels
  const [statusLabels, setStatusLabels] = useState<StatusLabel[]>([
    { id: "1", name: "İnceleniyor", color: "#6B7280", order: 1 },
    { id: "2", name: "Başvuru Aşamasında", color: "#F97316", order: 2 },
    { id: "3", name: "Dava Aşamasında", color: "#EF4444", order: 3 },
    { id: "4", name: "Onaylandı", color: "#10B981", order: 4 },
    { id: "5", name: "Tamamlandı", color: "#3B82F6", order: 5 },
  ])

  // Legal Texts
  const [kvkkText, setKvkkText] = useState("")
  const [contractText, setContractText] = useState("")
  const [privacyPolicy, setPrivacyPolicy] = useState("")

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveSettings = () => {
    console.log("[v0] Saving system settings...")
    // Implement save logic here
    alert("Ayarlar başarıyla kaydedildi!")
  }

  const addStatusLabel = () => {
    const newLabel: StatusLabel = {
      id: Date.now().toString(),
      name: "Yeni Durum",
      color: "#6B7280",
      order: statusLabels.length + 1,
    }
    setStatusLabels([...statusLabels, newLabel])
  }

  const updateStatusLabel = (id: string, field: keyof StatusLabel, value: string | number) => {
    setStatusLabels(statusLabels.map((label) => (label.id === id ? { ...label, [field]: value } : label)))
  }

  const deleteStatusLabel = (id: string) => {
    setStatusLabels(statusLabels.filter((label) => label.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: "#0B3D91" }}>
            Sistem Ayarları
          </h2>
          <p className="text-muted-foreground mt-1">Sistem genelini ilgilendiren ayarları yönetin</p>
        </div>
        <Button
          onClick={handleSaveSettings}
          className="rounded-2xl font-semibold shadow-lg"
          style={{ backgroundColor: "#F57C00", color: "white" }}
        >
          <Save className="mr-2 h-4 w-4" />
          Ayarları Kaydet
        </Button>
      </div>

      <Tabs defaultValue="visual" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4 rounded-3xl p-2 bg-white shadow-lg border">
          <TabsTrigger
            value="visual"
            className="rounded-2xl font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white"
          >
            <Palette className="mr-2 h-4 w-4" />
            Görsel Kimlik
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="rounded-2xl font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Entegrasyonlar
          </TabsTrigger>
          <TabsTrigger
            value="statuses"
            className="rounded-2xl font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white"
          >
            <ListChecks className="mr-2 h-4 w-4" />
            Süreç Durumları
          </TabsTrigger>
          <TabsTrigger
            value="texts"
            className="rounded-2xl font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white"
          >
            <FileText className="mr-2 h-4 w-4" />
            Metinler
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Visual Identity */}
        <TabsContent value="visual" className="space-y-6 mt-6">
          <Card className="rounded-3xl border-2 shadow-lg">
            <CardHeader>
              <CardTitle>Logo ve Marka Kimliği</CardTitle>
              <CardDescription>Sistemde kullanılacak logo ve renk paletini ayarlayın</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-4">
                <Label htmlFor="logo-upload" className="text-base font-semibold">
                  Logo
                </Label>
                <div className="flex items-center gap-6">
                  <div className="flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-dashed bg-slate-50 p-4">
                    {logoPreview ? (
                      <img
                        src={logoPreview || "/placeholder.svg"}
                        alt="Logo Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="max-w-xs"
                    />
                    <p className="text-sm text-muted-foreground">PNG, JPG veya SVG formatında yükleyebilirsiniz</p>
                  </div>
                </div>
              </div>

              {/* Color Palette */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="primary-color" className="text-base font-semibold">
                    Ana Renk
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="primary-color"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1"
                      placeholder="#0B3D91"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Sidebar ve başlıklarda kullanılır</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="secondary-color" className="text-base font-semibold">
                    İkincil Renk
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1"
                      placeholder="#F57C00"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Butonlar ve vurgularda kullanılır</p>
                </div>
              </div>

              {/* Color Preview */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Renk Önizleme</Label>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-20 rounded-2xl shadow-md" style={{ backgroundColor: primaryColor }} />
                    <p className="text-center text-sm font-medium">Ana Renk</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-20 rounded-2xl shadow-md" style={{ backgroundColor: secondaryColor }} />
                    <p className="text-center text-sm font-medium">İkincil Renk</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Integrations */}
        <TabsContent value="integrations" className="space-y-6 mt-6">
          <Card className="rounded-3xl border-2 shadow-lg">
            <CardHeader>
              <CardTitle>NetGSM SMS Entegrasyonu</CardTitle>
              <CardDescription>SMS bildirimleri için NetGSM API ayarlarını yapılandırın</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="netgsm-api-key" className="text-base font-semibold">
                  NetGSM API Key
                </Label>
                <Input
                  id="netgsm-api-key"
                  type="password"
                  value={netgsmApiKey}
                  onChange={(e) => setNetgsmApiKey(e.target.value)}
                  placeholder="NetGSM API anahtarınızı girin"
                  className="max-w-xl"
                />
                <p className="text-sm text-muted-foreground">NetGSM panelinden API anahtarınızı alabilirsiniz</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="netgsm-sender" className="text-base font-semibold">
                  Gönderici Adı
                </Label>
                <Input
                  id="netgsm-sender"
                  type="text"
                  value={netgsmSenderName}
                  onChange={(e) => setNetgsmSenderName(e.target.value)}
                  placeholder="SEFFAF"
                  className="max-w-xl"
                  maxLength={11}
                />
                <p className="text-sm text-muted-foreground">SMS'lerde görünecek gönderici adı (max 11 karakter)</p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-base font-semibold">Bildirim Ayarları</Label>

                <div className="flex items-center justify-between rounded-2xl border p-4">
                  <div className="space-y-1">
                    <p className="font-medium">Durum Değişiminde SMS Gönder</p>
                    <p className="text-sm text-muted-foreground">
                      Başvuru durumu değiştiğinde müşteriye SMS bildirimi gönderilir
                    </p>
                  </div>
                  <Switch checked={smsOnStatusChange} onCheckedChange={setSmsOnStatusChange} />
                </div>

                <div className="flex items-center justify-between rounded-2xl border p-4">
                  <div className="space-y-1">
                    <p className="font-medium">Evrak Yüklendiğinde SMS Gönder</p>
                    <p className="text-sm text-muted-foreground">
                      Yeni evrak yüklendiğinde ilgili kişilere SMS bildirimi gönderilir
                    </p>
                  </div>
                  <Switch checked={smsOnDocumentUpload} onCheckedChange={setSmsOnDocumentUpload} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Process Statuses */}
        <TabsContent value="statuses" className="space-y-6 mt-6">
          <Card className="rounded-3xl border-2 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Süreç Durum Etiketleri</CardTitle>
                  <CardDescription>Başvuru süreçlerinde kullanılacak durum etiketlerini yönetin</CardDescription>
                </div>
                <Button
                  onClick={addStatusLabel}
                  variant="outline"
                  className="rounded-2xl bg-transparent"
                  style={{ borderColor: "#F57C00", color: "#F57C00" }}
                >
                  <ListChecks className="mr-2 h-4 w-4" />
                  Yeni Durum Ekle
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {statusLabels.map((label, index) => (
                <div key={label.id} className="flex items-center gap-4 rounded-2xl border p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-600">
                    {index + 1}
                  </div>
                  <div className="flex-1 grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Durum Adı</Label>
                      <Input
                        value={label.name}
                        onChange={(e) => updateStatusLabel(label.id, "name", e.target.value)}
                        placeholder="Durum adı"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Renk</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={label.color}
                          onChange={(e) => updateStatusLabel(label.id, "color", e.target.value)}
                          className="h-10 w-16 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={label.color}
                          onChange={(e) => updateStatusLabel(label.id, "color", e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Önizleme</Label>
                      <div className="flex items-center gap-2">
                        <Badge
                          className="rounded-xl px-3 py-1 font-semibold"
                          style={{ backgroundColor: label.color, color: "white" }}
                        >
                          {label.name}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteStatusLabel(label.id)}
                    className="h-10 w-10 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Legal Texts */}
        <TabsContent value="texts" className="space-y-6 mt-6">
          <Card className="rounded-3xl border-2 shadow-lg">
            <CardHeader>
              <CardTitle>Hukuki Metinler ve Sözleşmeler</CardTitle>
              <CardDescription>KVKK, gizlilik politikası ve sözleşme metinlerini düzenleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="kvkk-text" className="text-base font-semibold">
                  KVKK Aydınlatma Metni
                </Label>
                <Textarea
                  id="kvkk-text"
                  value={kvkkText}
                  onChange={(e) => setKvkkText(e.target.value)}
                  placeholder="KVKK aydınlatma metnini buraya girin..."
                  className="min-h-[200px] rounded-2xl"
                />
                <p className="text-sm text-muted-foreground">
                  Müşteri kayıt formunda gösterilecek KVKK aydınlatma metni
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="contract-text" className="text-base font-semibold">
                  Sözleşme Onay Metni
                </Label>
                <Textarea
                  id="contract-text"
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  placeholder="Sözleşme onay metnini buraya girin..."
                  className="min-h-[200px] rounded-2xl"
                />
                <p className="text-sm text-muted-foreground">Başvuru sırasında onaylanması gereken sözleşme metni</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="privacy-policy" className="text-base font-semibold">
                  Gizlilik Politikası
                </Label>
                <Textarea
                  id="privacy-policy"
                  value={privacyPolicy}
                  onChange={(e) => setPrivacyPolicy(e.target.value)}
                  placeholder="Gizlilik politikası metnini buraya girin..."
                  className="min-h-[200px] rounded-2xl"
                />
                <p className="text-sm text-muted-foreground">
                  Web sitesinde ve uygulamada gösterilecek gizlilik politikası
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
