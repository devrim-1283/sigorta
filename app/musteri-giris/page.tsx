"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Lock, Mail, Eye, EyeOff, ArrowLeft, User, Phone } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function CustomerLoginPage() {
  const [loginType, setLoginType] = useState<'email' | 'tc_no' | 'phone'>('email')
  const [email, setEmail] = useState("")
  const [tcNo, setTcNo] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { login, logout, user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      let credentials: { email?: string; phone?: string; tc_no?: string; password: string } = {
        password,
      }

      if (loginType === 'email') {
        if (!email.trim()) {
          setError('E-posta adresi gerekli')
          setIsLoading(false)
          return
        }
        credentials.email = email.trim()
        console.log('[Müşteri Giriş] E-posta ile deneniyor:', credentials.email)
      } else if (loginType === 'tc_no') {
        if (!tcNo.trim()) {
          setError('TC Kimlik No gerekli')
          setIsLoading(false)
          return
        }
        credentials.tc_no = tcNo.trim().replace(/\D/g, '')
        console.log('[Müşteri Giriş] TC No ile deneniyor:', credentials.tc_no)
      } else if (loginType === 'phone') {
        if (!phone.trim()) {
          setError('Telefon numarası gerekli')
          setIsLoading(false)
          return
        }
        credentials.phone = phone.trim()
        console.log('[Müşteri Giriş] Telefon ile deneniyor:', credentials.phone)
      }

      await login(credentials)
      
      // Wait a moment for session to update
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log('[Müşteri Giriş] Başarılı')
      router.push("/admin/dashboard")
    } catch (err: any) {
      console.error('[Müşteri Giriş] Hata:', err)
      setError(err.message || "Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-start justify-center p-4 pt-8 sm:pt-12 md:pt-16">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Link href="/" className="inline-flex items-center text-slate-600 hover:text-slate-800 transition-colors text-sm sm:text-base">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ana Sayfa
          </Link>
        </div>
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-blue-600">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Müşteri Girişi</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 sm:mt-2">Sigorta Müşteri Portalı</p>
        </div>

        {/* Login Form */}
        <Card className="rounded-2xl sm:rounded-3xl border-2 shadow-lg">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-center text-lg sm:text-xl">Müşteri Paneli</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {error && (
                <Alert className="rounded-xl border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="login-type">Giriş Tipi</Label>
                <Select value={loginType} onValueChange={(value: 'email' | 'tc_no' | 'phone') => {
                  setLoginType(value)
                  setError("")
                }}>
                  <SelectTrigger id="login-type" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">E-posta</SelectItem>
                    <SelectItem value="tc_no">TC Kimlik No</SelectItem>
                    <SelectItem value="phone">Telefon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loginType === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="email">E-posta Adresi</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="musteri@sigorta.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 rounded-xl"
                    required
                  />
                </div>
              </div>
              )}

              {loginType === 'tc_no' && (
                <div className="space-y-2">
                  <Label htmlFor="tc_no">TC Kimlik No</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      id="tc_no"
                      type="text"
                      placeholder="12345678901"
                      value={tcNo}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 11)
                        setTcNo(value)
                      }}
                      maxLength={11}
                      className="pl-10 rounded-xl"
                      required
                    />
                  </div>
                </div>
              )}

              {loginType === 'phone' && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon Numarası</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+90 532 123 4567 veya 05321234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 rounded-xl"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full rounded-2xl py-3 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Giriş Yapılıyor...
                  </div>
                ) : (
                  "Giriş Yap"
                )}
              </Button>
            </form>

            {/* Info */}
            <div className="mt-6 p-4 rounded-xl bg-blue-50">
              <p className="text-sm font-medium text-blue-700 mb-2">Giriş Bilgileri:</p>
              <div className="space-y-1 text-xs text-blue-600">
                <p>E-posta, TC Kimlik No veya telefon numaranız ile giriş yapabilirsiniz.</p>
                <p className="mt-2">Şifrenizi unuttuysanız lütfen yönetici ile iletişime geçin.</p>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}