"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Shield, User } from "lucide-react"
import Image from "next/image"

interface LoginSelectorPageProps {
  onSelectAdminLogin: () => void
  onSelectDealerLogin: () => void
  onSelectCustomerLogin: () => void // Added customer login handler
}

export function LoginSelectorPage({
  onSelectAdminLogin,
  onSelectDealerLogin,
  onSelectCustomerLogin,
}: LoginSelectorPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Logo and Branding */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Image
              src="/oksijen-logo.png"
              alt="Şeffaf Danışmanlık"
              width={120}
              height={120}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-center text-slate-800 mb-2">Şeffaf Danışmanlık</h1>
          <p className="text-slate-600 text-lg">Sigorta Yönetim Sistemi</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Admin Login Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group">
            <CardHeader className="space-y-4 pb-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-[#0B3D91]/10 flex items-center justify-center group-hover:bg-[#0B3D91]/20 transition-colors">
                  <Shield className="w-8 h-8 text-[#0B3D91]" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center text-slate-800">Yönetici Girişi</CardTitle>
              <CardDescription className="text-center text-slate-600">
                Sistem yöneticileri, operasyon ve finans ekibi için
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={onSelectAdminLogin}
                className="w-full h-12 bg-[#0B3D91] hover:bg-[#0B3D91]/90 text-white font-medium transition-all duration-200 transform hover:scale-[1.02]"
              >
                Yönetici Olarak Giriş Yap
              </Button>
              <div className="mt-4 text-xs text-slate-500 text-center">Superadmin, Admin, Operasyon, Finans</div>
            </CardContent>
          </Card>

          {/* Dealer Login Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group">
            <CardHeader className="space-y-4 pb-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-[#F57C00]/10 flex items-center justify-center group-hover:bg-[#F57C00]/20 transition-colors">
                  <Building2 className="w-8 h-8 text-[#F57C00]" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center text-slate-800">Bayi Girişi</CardTitle>
              <CardDescription className="text-center text-slate-600">
                Bayi ve iş ortakları için özel giriş
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={onSelectDealerLogin}
                className="w-full h-12 bg-[#F57C00] hover:bg-[#F57C00]/90 text-white font-medium transition-all duration-200 transform hover:scale-[1.02]"
              >
                Bayi Olarak Giriş Yap
              </Button>
              <div className="mt-4 text-xs text-slate-500 text-center">Bayi hesapları için</div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group">
            <CardHeader className="space-y-4 pb-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <User className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center text-slate-800">Müşteri Girişi</CardTitle>
              <CardDescription className="text-center text-slate-600">Başvuru durumunuzu takip edin</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={onSelectCustomerLogin}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all duration-200 transform hover:scale-[1.02]"
              >
                Müşteri Olarak Giriş Yap
              </Button>
              <div className="mt-4 text-xs text-slate-500 text-center">Müşteri hesapları için</div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-slate-500">
          <p>&copy; 2025 Şeffaf Danışmanlık. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </div>
  )
}
