# 🚀 Deployment Guide - Sigorta Yönetim Sistemi

**Production Domain:** https://test-sms-link.com.tr  
**Stack:** Next.js 14 + Prisma + PostgreSQL + NextAuth.js  
**Platform:** Coolify

---

## 📋 Hızlı Başlangıç (Coolify)

### 1️⃣ PostgreSQL Database Oluştur

Coolify'da:
1. **New Resource** → **PostgreSQL**
2. Version: **14** veya üstü
3. **Deploy**

Database URL (Coolify otomatik oluşturur):
```
postgres://postgres:GENERATED_PASSWORD@SERVICE_NAME:5432/postgres
```

**Projenizin DATABASE_URL:**
```
postgres://postgres:s5CtgtRRl1z10S6feIbjixpjwnBTjh2LtBNY57sf883PIcvWa912Mz3ZC7Ed4v0F@f04k88w8koc44c4wossw04w4:5432/postgres
```

---

### 2️⃣ Database Schema Yükle (ÇOK ÖNEMLİ!)

**Method 1: Coolify UI (ÖNERİLEN)**

1. Coolify → PostgreSQL Resource → **Query Editor**
2. Bu repo'dan `database/init.sql` dosyasını aç
3. **Tüm içeriği kopyala** (Ctrl+A → Ctrl+C)
4. Query Editor'e **yapıştır**
5. **Execute / Run** tıkla

✅ Success mesajını göreceksiniz:
```sql
Database schema created successfully!
Total tables: 15
Demo users: 6 (password: password for all)
Login with: admin@sigorta.com / password
```

**Method 2: psql (Local'den)**
```bash
psql "postgres://postgres:s5CtgtRRl1z10S6feIbjixpjwnBTjh2LtBNY57sf883PIcvWa912Mz3ZC7Ed4v0F@f04k88w8koc44c4wossw04w4:5432/postgres" < database/init.sql
```

---

### 3️⃣ Next.js Uygulamasını Ekle

Coolify'da:
1. **New Resource** → **Application**
2. **Git Repository:**
   - URL: `https://github.com/YOUR_USERNAME/YOUR_REPO.git`
   - Branch: `main`
3. **Build Pack:** Nixpacks (otomatik seçilir)
4. **Port:** 3000 (otomatik)

---

### 4️⃣ Environment Variables Ayarla

Coolify → Application → **Environment Variables** → Add:

```env
DATABASE_URL=postgres://postgres:s5CtgtRRl1z10S6feIbjixpjwnBTjh2LtBNY57sf883PIcvWa912Mz3ZC7Ed4v0F@f04k88w8koc44c4wossw04w4:5432/postgres

NEXTAUTH_SECRET=k8fJ3nP9mL2qR5tY7wX0zA1bC4dE6gH8iJ9kM2nP5qR7t

NEXTAUTH_URL=https://test-sms-link.com.tr

NODE_ENV=production
```

**NEXTAUTH_SECRET oluşturma:**
```bash
openssl rand -base64 32
# Output'u kopyala ve NEXTAUTH_SECRET olarak kullan
```

---

### 5️⃣ Persistent Volume (File Uploads)

Coolify → Application → **Volumes** → Add Volume:

- **Source:** `/app/public/uploads`
- **Destination:** (Coolify otomatik)

Bu şekilde upload edilen dosyalar deploy'lar arası korunur.

---

### 6️⃣ Domain Yapılandırma

Coolify → Application → **Domains**:

1. Domain: `test-sms-link.com.tr`
2. **SSL Certificate:** Auto-generate (Let's Encrypt)
3. **Save**

---

### 7️⃣ Deploy!

1. **Deploy** butonuna tıkla
2. Build logs'u izle
3. **Build süresi:** ~2-3 dakika

**Build adımları (Otomatik):**
```bash
npm install --production
npx prisma generate
npm run build
npm start
```

---

### 8️⃣ Test

1. Tarayıcıda aç: **https://test-sms-link.com.tr**
2. **Login:**
   - Email: `admin@sigorta.com`
   - Şifre: `password`
3. ✅ Dashboard açılmalı ve data göstermeli

---

## 💻 Local Development

### Gereksinimler
- Node.js 20+
- PostgreSQL 14+
- npm

### Kurulum

#### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/REPO.git
cd proje
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Environment Variables
```bash
# .env.local oluştur
cp ENV_LOCAL_EXAMPLE.txt .env.local
```

**`.env.local` içeriği düzenle:**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/sigorta_db"
NEXTAUTH_SECRET="your-local-secret-key"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

#### 4. PostgreSQL Setup
```bash
# Database oluştur
psql -U postgres -c "CREATE DATABASE sigorta_db;"

# Schema yükle
psql -U postgres -d sigorta_db -f database/init.sql
```

#### 5. Prisma Generate
```bash
npx prisma generate
```

#### 6. Start Development Server
```bash
npm run dev
```

#### 7. Open Browser
```
http://localhost:3000
```

**Demo Login:**
- Email: `admin@sigorta.com`
- Şifre: `admin123`

---

## 🔧 Troubleshooting

### ❌ "spawn pnpm ENOENT" Build Hatası

**Sebep:** Next.js projeyi `pnpm` ile kurmaya çalışıyor ama `pnpm` yok.

**Çözüm:**
```bash
# 1. pnpm lock dosyasını sil
rm -f pnpm-lock.yaml

# 2. .npmrc oluştur (proje kökünde)
echo "package-manager=npm" > .npmrc
echo "legacy-peer-deps=true" >> .npmrc

# 3. .gitignore'a ekle
echo "pnpm-lock.yaml" >> .gitignore
echo "yarn.lock" >> .gitignore

# 4. nixpacks.toml güncelle (npm ci kullan)
# [phases.install]
# cmds = ["npm ci --legacy-peer-deps"]

# 5. Git push & redeploy
git add .npmrc .gitignore nixpacks.toml
git commit -m "Fix: Force npm usage"
git push origin main
```

✅ Build başarılı olmalı!

---

### ❌ "Database connection error"

**Çözüm:**
```bash
# 1. DATABASE_URL doğru mu?
echo $DATABASE_URL

# 2. init.sql yüklendi mi?
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"
# 6 user görmelisin

# 3. Prisma client oluşturuldu mu?
npx prisma generate
```

---

### ❌ "NextAuth configuration error"

**Çözüm:**
```bash
# 1. NEXTAUTH_SECRET var mı?
echo $NEXTAUTH_SECRET

# Yoksa oluştur:
openssl rand -base64 32

# 2. NEXTAUTH_URL doğru mu?
# Production: https://test-sms-link.com.tr
# Local: http://localhost:3000
```

---

### ❌ "Prisma Client not found"

**Çözüm:**
```bash
# 1. Generate client
npx prisma generate

# 2. Rebuild
npm run build
```

---

### ❌ "File upload failed"

**Çözüm:**
```bash
# 1. Upload klasörü oluştur
mkdir -p public/uploads/documents

# 2. Coolify'da Persistent Volume ekle
# Source: /app/public/uploads
```

---

### ❌ Build çok uzun sürüyor (>5 dakika)

**Normal süre:** 2-4 dakika

**Çözüm:**
- Network bağlantınızı kontrol edin
- Coolify server kaynaklarını check edin
- Cache temizleyip rebuild edin

---

## 👥 Demo Kullanıcılar

`database/init.sql` ile yüklenir:

| Email | Rol | Şifre | Yetki |
|-------|-----|-------|-------|
| admin@sigorta.com | Süper Admin | admin123 | Tam erişim |
| istanbul@sigorta.com | Yönetici | admin123 | Bayi yönetimi |
| ankara@sigorta.com | Acente | admin123 | Müşteri işlemleri |
| muhasebe@sigorta.com | Muhasebe | admin123 | Ödeme işlemleri |
| izmir@sigorta.com | Görüntüleyici | admin123 | Sadece okuma |
| bursa@sigorta.com | Müdür | admin123 | Şube yönetimi |

**⚠️ PRODUCTION'DA ŞİFRELERİ DEĞİŞTİRİN!**

### Şifre Değiştirme

```bash
# 1. bcrypt hash oluştur
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YeniSifre123', 12));"

# 2. Database'de güncelle
psql "$DATABASE_URL"
UPDATE users SET password = '$2a$12$YENI_HASH' WHERE email = 'admin@sigorta.com';
```

Veya **Prisma Studio** ile:
```bash
npx prisma studio
# http://localhost:5555
# Users → Select user → Edit password field
```

---

## 📊 Database

**15 Tablo:**
- `roles` - Kullanıcı rolleri (6 rol)
- `users` - Kullanıcılar
- `dealers` - Bayiler
- `customers` - Müşteriler
- `file_types` - Dosya tipleri
- `documents` - Belgeler
- `payments` - Ödemeler
- `notes` - Notlar
- `notifications` - Bildirimler
- `policies` - Poliçeler
- `claims` - Hasar talepleri
- `personal_access_tokens` - API tokens
- `jobs` - Queue jobs
- `cache` - Cache
- `sessions` - Sessions

**Schema Dosyaları:**
- `database/init.sql` - PostgreSQL DDL + Demo data
- `prisma/schema.prisma` - Prisma schema

---

## 🔄 Code Güncellemeleri

### Git Push Sonrası Otomatik Deploy

```bash
# 1. Local'de değişiklik yap
git add .
git commit -m "Feature: X eklendi"
git push origin main

# 2. Coolify otomatik detect eder
# (Webhook aktifse)

# 3. Build başlar: ~2-3 dk

# 4. Zero-downtime deployment
```

### Manuel Redeploy

```
Coolify → Application → Redeploy
```

### Rollback

```
Coolify → Application → Deployments
→ Önceki deployment'ı seç
→ "Redeploy"
```

---

## 🔐 Security Checklist

Production'a deploy etmeden önce:

- [ ] **NEXTAUTH_SECRET** benzersiz ve güçlü (32+ karakter)
- [ ] **Demo şifreleri** değiştirildi
- [ ] **DATABASE_URL** güvenli password
- [ ] **HTTPS** aktif (Coolify auto SSL)
- [ ] **File upload** size limiti ayarlandı
- [ ] **Environment variables** Coolify'da, repo'da YOK
- [ ] **PostgreSQL** external access kapalı

---

## 📈 Monitoring

### Coolify Logs
```
Coolify → Application → Logs (Real-time)
```

### Database Monitoring
```bash
# Connection count
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity;"

# Database size
psql "$DATABASE_URL" -c "SELECT pg_size_pretty(pg_database_size('postgres'));"
```

### Application Health
```bash
# Server çalışıyor mu?
curl https://test-sms-link.com.tr

# SSL valid mi?
openssl s_client -connect test-sms-link.com.tr:443
```

---

## 🛠️ Development Commands

```bash
# Development server (hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type check
npm run lint

# Prisma Studio (Database GUI)
npx prisma studio  # → http://localhost:5555

# Database reset
psql -U postgres -c "DROP DATABASE sigorta_db;"
psql -U postgres -c "CREATE DATABASE sigorta_db;"
psql -U postgres -d sigorta_db -f database/init.sql
npx prisma generate
```

---

## 📦 Build Configuration

**`nixpacks.toml` (Coolify otomatik kullanır):**
```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm ci --legacy-peer-deps"]

[phases.build]
cmds = [
    "npx prisma generate",
    "npm run build"
]

[start]
cmd = "npm start"
```

**Build süresi:** ~2-3 dakika  
**Runtime:** Node.js 20  
**Process:** 1 (Monolithic)

**⚠️ Önemli:** Proje **npm** kullanır. `pnpm-lock.yaml` veya `yarn.lock` dosyaları varsa silin ve `.gitignore` ekleyin.

---

## 🎯 Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| **Framework** | Next.js 14.2 (App Router) |
| **Language** | TypeScript 5 |
| **Auth** | NextAuth.js v5 |
| **ORM** | Prisma |
| **Database** | PostgreSQL 14+ |
| **Styling** | Tailwind CSS + Radix UI |
| **Forms** | React Hook Form + Zod |
| **Charts** | Recharts |
| **Deploy** | Coolify + Nixpacks |

---

## ✅ Success Criteria

Deploy başarılı sayılır:

- [x] Site açılıyor: https://test-sms-link.com.tr
- [x] SSL aktif (HTTPS)
- [x] Login çalışıyor
- [x] Dashboard data gösteriyor
- [x] CRUD operations çalışıyor
- [x] File upload/download çalışıyor
- [x] Database connection başarılı
- [x] Rol bazlı erişim kontrol çalışıyor

---

## 📚 Dosya Yapısı

```
proje/
├── app/                    # Next.js pages (App Router)
│   ├── api/               # API routes (file upload)
│   ├── auth/              # Auth pages
│   └── dashboard/         # Protected pages
├── components/             # React components
├── lib/
│   ├── actions/           # Server Actions (Backend logic)
│   ├── api-client.ts      # API wrapper
│   ├── auth-context.tsx   # Auth context
│   └── db.ts              # Prisma client
├── prisma/
│   └── schema.prisma      # Prisma schema (15 models)
├── database/
│   └── init.sql           # PostgreSQL schema + demo data
├── public/
│   └── uploads/           # File uploads
├── types/                 # TypeScript types
├── auth.config.ts         # NextAuth config
├── middleware.ts          # Auth middleware
├── nixpacks.toml          # Coolify build config
├── ENV_PRODUCTION.txt     # Environment variables template
├── ENV_LOCAL_EXAMPLE.txt  # Local development template
├── DEPLOYMENT.md          # Bu dosya
└── README.md              # Proje özeti
```

---

## 🔗 Linkler

- **Production:** https://test-sms-link.com.tr
- **Database:** PostgreSQL (Coolify managed)
- **Prisma Studio (Local):** http://localhost:5555
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **NextAuth Docs:** https://next-auth.js.org
- **Coolify Docs:** https://coolify.io/docs

---

## 🎉 Özet

### Production Deployment (Coolify)
1. ✅ PostgreSQL oluştur
2. ✅ `database/init.sql` yükle (Query Editor)
3. ✅ Next.js app ekle (Git repo)
4. ✅ Environment variables ayarla (4 değişken)
5. ✅ Persistent volume ekle (`/app/public/uploads`)
6. ✅ Domain bağla (SSL otomatik)
7. ✅ Deploy! (~2-3 dk)
8. ✅ Test: admin@sigorta.com / password

### Local Development
1. ✅ `npm install`
2. ✅ `.env.local` oluştur
3. ✅ PostgreSQL database oluştur
4. ✅ `database/init.sql` yükle
5. ✅ `npx prisma generate`
6. ✅ `npm run dev`
7. ✅ Test: http://localhost:3000

---

**Hazır! 🚀**

**Domain:** https://test-sms-link.com.tr  
**Stack:** Next.js 14 Full-Stack + Prisma + PostgreSQL + NextAuth.js  
**Demo Login:** admin@sigorta.com / password

**Başarılar! 🎯**
