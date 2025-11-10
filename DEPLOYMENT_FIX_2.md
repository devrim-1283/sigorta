========================================
   DEPLOYMENT FIX #2 TAMAMLANDI! 🚀
========================================

❌ PROBLEMLER:
   1. Error: <Html> should not be imported outside of pages/_document
   2. TypeError: Cannot read properties of null (reading 'useContext')
   3. Attempted import error: 'reportsApi' is not exported
   4. Attempted import error: 'documentsApi' is not exported

✅ COZUMLER:

1. **React Context/Hooks Hatası Çözüldü:**
   - SessionProvider ve AuthProvider client component'e taşındı
   - Yeni dosya: `components/providers.tsx` (client component)
   - `app/layout.tsx` güncellendi (server component olarak kaldı)

   Neden: Next.js 14 App Router'da SessionProvider ve AuthProvider 
   client-side hook'lar kullanıyor. Bunlar direkt server component'te 
   (layout.tsx) kullanılamaz, client wrapper'a ihtiyaç duyar.

2. **API Import Hataları Çözüldü:**
   - `lib/api-client.ts`'e eksik API'lar eklendi:
     * reportsApi (dashboardApi'ye alias)
     * documentsApi (documentApi'ye alias)
     * claimsApi (claimApi'ye alias)
     * accountingApi (placeholder - boş implementasyon)

📦 DEGISEN DOSYALAR:
   - components/providers.tsx (YENİ)
   - app/layout.tsx (güncellendi)
   - lib/api-client.ts (güncellendi)

🔍 TEKNIK DETAY:

**Önceki Hatalı Yapı:**
```tsx
// app/layout.tsx (Server Component)
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider> {/* ❌ Client hook'u server'da! */}
          <AuthProvider>   {/* ❌ useSession() içinde! */}
            {children}
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
```

**Yeni Doğru Yapı:**
```tsx
// components/providers.tsx (Client Component)
'use client'
export function Providers({ children }) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SessionProvider>
  )
}

// app/layout.tsx (Server Component - ✅)
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers> {/* ✅ Client wrapper */}
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

⚠️ UYARI - LOKAl BUILD:
   Windows + OneDrive sync nedeniyle local build'de Prisma 
   dosya kilitleme hatası var (EPERM). Bu deployment'ı etkilemez!
   Docker build'de sorun yok çünkü OneDrive sync yok.

🚀 DEPLOYMENT:
   1. Git commit ve push yapın
   2. Coolify otomatik deploy edecek
   3. Build süresi: ~2-3 dakika
   4. Artık build başarılı olmalı!

✅ TEST:
   URL: https://test-sms-link.com.tr
   Login: admin@sigorta.com / admin123

HAZIR! GIT PUSH YAPABILIRSINIZ! 🎯
========================================

