# 🔒 Güvenlik Denetim Raporu - Sigorta Yönetim Sistemi

**Tarih:** 2025-01-XX  
**Proje:** Next.js 14 + Prisma + PostgreSQL  
**Ortam:** Docker (Coolify) - Database Ayrı Container

---

## 📊 ÖZET

**Genel Güvenlik Skoru: 6.5/10**

Proje temel güvenlik önlemlerini içeriyor ancak production için kritik iyileştirmeler gerekiyor.

---

## ✅ GÜÇLÜ YÖNLER (Artılar)

### 1. **SQL Injection Koruması** ⭐⭐⭐⭐⭐
- ✅ Prisma ORM kullanımı (parametreli sorgular)
- ✅ Tüm database sorguları type-safe
- ✅ BigInt dönüşümleri güvenli

### 2. **Authentication & Authorization** ⭐⭐⭐⭐
- ✅ NextAuth.js v5 kullanımı
- ✅ JWT-based session management
- ✅ Rol bazlı yetkilendirme (RBAC)
- ✅ Password hashing (bcrypt, rounds: 12)
- ✅ Rate limiting (login attempts)
- ✅ Session timeout (30 gün - çok uzun, aşağıda)

### 3. **Input Validation** ⭐⭐⭐⭐
- ✅ Email validation (RFC 5322)
- ✅ Phone validation (Türkiye formatı)
- ✅ TC Kimlik No validation (algoritma kontrolü)
- ✅ Password strength validation
- ✅ File type validation (MIME type)
- ✅ File size limits (5-10MB)

### 4. **File Upload Security** ⭐⭐⭐
- ✅ File size limits
- ✅ MIME type whitelist
- ✅ Unique filename generation
- ✅ Authentication required

### 5. **Database Security** ⭐⭐⭐⭐
- ✅ Connection pooling (Prisma)
- ✅ Environment variable kullanımı
- ✅ Database ayrı container (Docker)

---

## ⚠️ KRİTİK GÜVENLİK ZAAFİYETLERİ

### 1. **Rate Limiting - In-Memory Storage** 🔴 KRİTİK
**Risk:** Docker'da çoklu instance'da çalışmaz, distributed attack'lara açık

**Mevcut Kod:**
```typescript
// lib/validation.ts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
```

**Sorun:**
- Her container instance'ı kendi memory'sini kullanır
- Load balancer arkasında çalışmaz
- Container restart'ta tüm rate limit kaybolur

**Çözüm:**
```typescript
// Redis kullanımı önerilir
import { Redis } from 'ioredis'
const redis = new Redis(process.env.REDIS_URL)

export async function checkRateLimit(identifier: string) {
  const key = `rate_limit:${identifier}`
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, 900) // 15 dakika
  }
  return { allowed: count <= 5, remaining: Math.max(0, 5 - count) }
}
```

**Öncelik:** YÜKSEK

---

### 2. **File Upload - MIME Type Spoofing** 🔴 KRİTİK
**Risk:** Zararlı dosyalar MIME type değiştirilerek yüklenebilir

**Mevcut Kod:**
```typescript
// lib/actions/documents.ts
if (!allowedTypes.includes(file.type)) {
  throw new Error('Geçersiz dosya tipi')
}
```

**Sorun:**
- Sadece client-side MIME type kontrolü
- Dosya içeriği kontrol edilmiyor
- PDF içinde JavaScript çalıştırılabilir
- Image içinde zararlı kod olabilir

**Çözüm:**
```typescript
import { fileTypeFromBuffer } from 'file-type'

// Dosya içeriğini kontrol et
const buffer = await file.arrayBuffer()
const fileType = await fileTypeFromBuffer(buffer)

if (!fileType || !allowedMimeTypes.includes(fileType.mime)) {
  throw new Error('Geçersiz dosya içeriği')
}

// PDF için ek kontrol
if (fileType.mime === 'application/pdf') {
  // PDF parser ile JavaScript kontrolü
  // Örn: pdf-parse kütüphanesi
}
```

**Öncelik:** YÜKSEK

---

### 3. **Path Traversal - File Upload** 🟠 ORTA
**Risk:** Dosya adında `../` ile farklı dizinlere yazma

**Mevcut Kod:**
```typescript
const ext = file.name.split('.').pop()
const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`
```

**Sorun:**
- `file.name` direkt kullanılıyor (bazı yerlerde)
- `originalNameFromForm` sanitize edilmiyor

**Çözüm:**
```typescript
import path from 'path'

function sanitizeFilename(filename: string): string {
  // Path traversal karakterlerini temizle
  const sanitized = path.basename(filename)
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255)
  return sanitized
}
```

**Öncelik:** ORTA

---

### 4. **Environment Variables Exposure** 🔴 KRİTİK
**Risk:** Hassas bilgiler repository'de

**Tespit Edilen Dosyalar:**
- `ENV_LOCAL.txt` - Database password açık
- `QUICKSTART.txt` - Database URL açık
- `ENV_COOLIFY.txt` - Production secrets

**Sorun:**
```text
DATABASE_URL="postgres://postgres:s5CtgtRRl1z10S6feIbjixpjwnBTjh2LtBNY57sf883PIcvWa912Mz3ZC7Ed4v0F@..."
```

**Çözüm:**
1. `.gitignore`'a ekle:
```
ENV_*.txt
QUICKSTART.txt
*.env
.env.local
.env.production
```

2. `.env.example` oluştur (placeholder'lar ile)

**Öncelik:** YÜKSEK

---

### 5. **Session Duration - Çok Uzun** 🟠 ORTA
**Risk:** Token çalınırsa 30 gün geçerli

**Mevcut Kod:**
```typescript
// auth.config.ts
session: {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 gün
}
```

**Sorun:**
- 30 gün çok uzun
- Refresh token mekanizması yok
- Inactive session timeout yok

**Çözüm:**
```typescript
session: {
  strategy: 'jwt',
  maxAge: 24 * 60 * 60, // 1 gün
  updateAge: 60 * 60, // 1 saatte bir refresh
}
```

**Öncelik:** ORTA

---

### 6. **XSS Protection - Yetersiz** 🟠 ORTA
**Risk:** User input'ları yeterince sanitize edilmiyor

**Mevcut Kod:**
```typescript
// lib/validation.ts
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, '') // Sadece < ve > temizleniyor
    .substring(0, 1000)
}
```

**Sorun:**
- Sadece `<` ve `>` karakterleri temizleniyor
- JavaScript event handler'ları (`onclick`, `onerror`) temizlenmiyor
- HTML entity encoding yok

**Çözüm:**
```typescript
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
}
```

**Öncelik:** ORTA

---

### 7. **CORS Configuration - Eksik** 🟠 ORTA
**Risk:** Tüm origin'lerden istek kabul ediliyor

**Mevcut Durum:**
- Next.js default CORS ayarları
- Explicit CORS yapılandırması yok
- API route'larda CORS header'ları yok

**Çözüm:**
```typescript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN || 'https://yourdomain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ]
  },
}
```

**Öncelik:** ORTA

---

### 8. **Error Handling - Information Disclosure** 🟡 DÜŞÜK
**Risk:** Hata mesajlarında hassas bilgi sızıntısı

**Mevcut Kod:**
```typescript
// Birçok yerde
catch (error: any) {
  console.error('Error:', error)
  throw new Error(error.message) // Stack trace sızabilir
}
```

**Sorun:**
- Production'da stack trace gösterilebilir
- Database error mesajları expose edilebilir

**Çözüm:**
```typescript
catch (error: any) {
  console.error('Error:', error)
  
  // Production'da generic mesaj
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
  }
  
  // Development'ta detaylı mesaj
  throw error
}
```

**Öncelik:** DÜŞÜK

---

### 9. **Content Security Policy (CSP) - Eksik** 🟠 ORTA
**Risk:** XSS saldırılarına karşı ek koruma yok

**Mevcut Durum:**
- CSP header'ı yok
- Inline script'ler kullanılıyor

**Çözüm:**
```typescript
// next.config.mjs
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self';
      frame-ancestors 'none';
    `.replace(/\s{2,}/g, ' ').trim()
  },
]
```

**Öncelik:** ORTA

---

### 10. **HTTPS Enforcement - Eksik** 🟠 ORTA
**Risk:** Production'da HTTP'ye düşme riski

**Mevcut Durum:**
- Coolify SSL yönetiyor ama kod seviyesinde zorunluluk yok

**Çözüm:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // HTTPS zorunluluğu
  if (process.env.NODE_ENV === 'production' && 
      request.headers.get('x-forwarded-proto') !== 'https') {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      301
    )
  }
}
```

**Öncelik:** ORTA

---

### 11. **Database Connection Security** 🟡 DÜŞÜK
**Risk:** Connection string'de password açık

**Mevcut Durum:**
- DATABASE_URL environment variable'da
- SSL/TLS zorunluluğu yok

**Çözüm:**
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // SSL zorunluluğu
  // ?sslmode=require
}
```

**Öncelik:** DÜŞÜK (Docker network'te güvenli ama best practice)

---

### 12. **Logging & Monitoring - Eksik** 🟡 DÜŞÜK
**Risk:** Saldırı tespiti zor

**Mevcut Durum:**
- Sadece console.error
- Structured logging yok
- Security event logging yok

**Çözüm:**
```typescript
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'security.log' }),
  ],
})

// Security events
logger.warn('security', {
  event: 'failed_login',
  identifier: identifier,
  ip: request.ip,
  timestamp: new Date(),
})
```

**Öncelik:** DÜŞÜK (ama önerilir)

---

## 🐳 DOCKER GÜVENLİK ÖNERİLERİ

### 1. **Container Security**
```dockerfile
# Non-root user kullan
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Minimal base image
FROM node:20-alpine

# Security updates
RUN apk update && apk upgrade
```

### 2. **Network Security**
- Database container'ı sadece app container'ından erişilebilir olmalı
- Public port expose edilmemeli
- Docker network isolation kullan

### 3. **Secrets Management**
```yaml
# docker-compose.yml
services:
  app:
    secrets:
      - database_url
      - nextauth_secret

secrets:
  database_url:
    external: true
  nextauth_secret:
    external: true
```

---

## 📋 ÖNCELİKLİ AKSİYON LİSTESİ

### 🔴 KRİTİK (Hemen Yapılmalı)
1. ✅ Rate limiting'i Redis'e taşı
2. ✅ File upload MIME type spoofing koruması ekle
3. ✅ Environment variables'ı repository'den kaldır
4. ✅ File upload path traversal koruması

### 🟠 ORTA (1-2 Hafta İçinde)
5. ✅ Session duration'ı kısalt (1 gün)
6. ✅ XSS protection iyileştir (DOMPurify)
7. ✅ CORS yapılandırması ekle
8. ✅ Content Security Policy ekle
9. ✅ HTTPS enforcement ekle

### 🟡 DÜŞÜK (İyileştirme)
10. ✅ Error handling iyileştir
11. ✅ Structured logging ekle
12. ✅ Database SSL zorunluluğu
13. ✅ Security headers ekle

---

## 📊 GÜVENLİK SKORU DAĞILIMI

| Kategori | Skor | Durum |
|----------|------|-------|
| Authentication | 8/10 | ✅ İyi |
| Authorization | 7/10 | ✅ İyi |
| Input Validation | 7/10 | ✅ İyi |
| File Upload | 5/10 | ⚠️ İyileştirilmeli |
| Session Management | 6/10 | ⚠️ İyileştirilmeli |
| Error Handling | 6/10 | ⚠️ İyileştirilmeli |
| XSS Protection | 5/10 | ⚠️ İyileştirilmeli |
| CSRF Protection | 8/10 | ✅ İyi (Next.js otomatik) |
| SQL Injection | 10/10 | ✅ Mükemmel (Prisma) |
| Secrets Management | 4/10 | 🔴 Kritik |
| Rate Limiting | 4/10 | 🔴 Kritik |
| Logging | 3/10 | ⚠️ İyileştirilmeli |

**Ortalama: 6.5/10**

---

## 🔐 EK ÖNERİLER

### 1. **Security Headers**
```typescript
// next.config.mjs
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
]
```

### 2. **API Rate Limiting**
```typescript
// Tüm API route'lar için
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // 100 istek
})
```

### 3. **Input Sanitization Library**
```bash
npm install dompurify isomorphic-dompurify
npm install validator
```

### 4. **Security Testing**
```bash
# OWASP ZAP scan
# npm audit
npm audit --audit-level=moderate
```

---

## 📚 REFERANSLAR

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Prisma Security](https://www.prisma.io/docs/guides/security)

---

**Rapor Hazırlayan:** AI Security Auditor  
**Son Güncelleme:** 2025-01-XX

