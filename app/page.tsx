"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Eğer kullanıcı giriş yapmışsa, admin panel'e yönlendir
    if (isAuthenticated && user) {
      router.push("/admin/dashboard")
    }
  }, [isAuthenticated, user, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0B3D91] to-[#1e40af] shadow-2xl">
            <Shield className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
          Sigorta Yönetim
          <span className="block text-[#0B3D91]">Sistemi</span>
        </h1>
        <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
          Lütfen giriş yapmak için uygun portalı seçin
        </p>

        {/* Login Options */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/yonetici-giris">
            <Button className="rounded-2xl px-8 py-4 text-lg font-semibold" style={{ backgroundColor: "#0B3D91", color: "white" }}>
              Yönetici Girişi
            </Button>
          </Link>
          <Link href="/bayi-giris">
            <Button variant="outline" className="rounded-2xl px-8 py-4 text-lg font-semibold border-2" style={{ color: "#F57C00", borderColor: "#F57C00" }}>
              Bayi Girişi
            </Button>
          </Link>
          <Link href="/musteri-giris">
            <Button variant="outline" className="rounded-2xl px-8 py-4 text-lg font-semibold border-2" style={{ color: "#3B82F6", borderColor: "#3B82F6" }}>
              Müşteri Girişi
            </Button>
          </Link>
        </div>

        {/* Demo Info */}
        <div className="mt-16 p-6 bg-white/80 backdrop-blur-sm rounded-2xl max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Demo Hesapları</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <p><strong>Yönetici:</strong> admin@sigorta.com / password</p>
            <p><strong>Bayi:</strong> bayi@sigorta.com / password</p>
            <p><strong>Müşteri:</strong> musteri@sigorta.com / password</p>
          </div>
        </div>
      </div>
    </div>
  )
}