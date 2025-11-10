import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { SessionProvider } from "next-auth/react"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Sigorta Yönetim Sistemi",
  description: "Profesyonel sigorta yönetim sistemi",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased font-sans`}>
        <SessionProvider>
          <AuthProvider>
            <Suspense fallback={null}>{children}</Suspense>
            <Toaster />
          </AuthProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
