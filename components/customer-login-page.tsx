"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, User } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/hooks/use-toast"

interface CustomerLoginPageProps {
  onLogin: () => void
  onBack: () => void
}

export function CustomerLoginPage({ onLogin, onBack }: CustomerLoginPageProps) {
  const [tcNo, setTcNo] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login({ tc_no: tcNo, password })
      toast({
        title: "Başarılı",
        description: "Giriş yapıldı",
      })
      onLogin()
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Giriş başarısız",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button variant="ghost" onClick={onBack} className="mb-6 rounded-2xl hover:bg-white/50 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>

        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/oksijen-logo.png"
              alt="Şeffaf Danışmanlık"
              width={100}
              height={100}
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Müşteri Girişi</h1>
          <p className="text-slate-600">Başvuru durumunuzu görüntüleyin</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-3xl">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <User className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-center text-slate-800">Hoş Geldiniz</CardTitle>
            <CardDescription className="text-center text-slate-600">
              TC Kimlik No ve şifreniz ile giriş yapın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tc-no" className="text-sm font-semibold text-slate-700">
                  TC Kimlik No
                </Label>
                <Input
                  id="tc-no"
                  type="text"
                  placeholder="12345678901"
                  value={tcNo}
                  onChange={(e) => setTcNo(e.target.value)}
                  className="h-12 rounded-2xl border-2 focus:border-emerald-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Şifre
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-2xl border-2 focus:border-emerald-500 transition-colors"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Giriş yapılıyor...</span>
                  </div>
                ) : (
                  "Giriş Yap"
                )}
              </Button>

              <div className="text-center">
                <Button type="button" variant="link" className="text-emerald-600 hover:text-emerald-700 text-sm">
                  Şifremi Unuttum
                </Button>
              </div>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-200">
              <p className="text-xs font-semibold text-emerald-900 mb-2">Demo Hesap:</p>
              <p className="text-xs text-emerald-800">TC: 12345678901</p>
              <p className="text-xs text-emerald-800">Şifre: demo123</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-600">
          <p>&copy; 2025 Şeffaf Danışmanlık</p>
        </div>
      </div>
    </div>
  )
}
