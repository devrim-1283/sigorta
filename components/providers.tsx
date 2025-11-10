'use client'

import { SessionProvider } from "next-auth/react"
import { AuthProvider } from "@/lib/auth-context"
import type { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SessionProvider>
  )
}

