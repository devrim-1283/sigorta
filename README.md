# Sigorta Yönetim Sistemi

Modern, full-stack sigorta yönetim platformu. Next.js 14 (Full-Stack) + Prisma + PostgreSQL ile geliştirilmiştir.

## 🚀 Özellikler

### Frontend (Next.js 14)
- ✅ Modern, responsive UI (Tailwind CSS + Radix UI)
- ✅ TypeScript ile tip güvenliği
- ✅ Rol bazlı dashboard ve menü sistemi
- ✅ 3 farklı giriş portalı (Yönetici, Bayi, Müşteri)
- ✅ Real-time form validation (React Hook Form + Zod)
- ✅ Dosya yükleme ve önizleme
- ✅ Responsive charts ve grafikler (Recharts)
- ✅ Dark mode desteği hazır

### Backend (Next.js Full-Stack)
- ✅ Server Components + Server Actions
- ✅ NextAuth.js v5 authentication
- ✅ Rol bazlı yetkilendirme
- ✅ File upload ve storage yönetimi
- ✅ Prisma ORM (PostgreSQL)
- ✅ Type-safe database queries
- ✅ 15 database models
- ✅ Monolithic architecture

## 📋 Teknoloji Stack

### Frontend
- **Framework:** Next.js 14.2 (App Router)
- **Language:** TypeScript 5
- **UI Library:** Radix UI + shadcn/ui
- **Styling:** Tailwind CSS 3.4
- **Forms:** React Hook Form + Zod
- **State:** React Context API
- **Animation:** Framer Motion
- **Charts:** Recharts

### Backend
- **Framework:** Next.js 14 (Server Components + Server Actions)
- **Language:** TypeScript 5
- **ORM:** Prisma
- **Auth:** NextAuth.js v5
- **Database:** PostgreSQL 14+
- **Storage:** Local filesystem

## 🏗️ Proje Yapısı

```
proje/
├── app/                    # Next.js pages (App Router)
│   ├── api/               # API routes (file upload)
│   ├── auth/              # Auth pages (NextAuth)
│   └── dashboard/         # Protected pages
├── components/             # React components
├── hooks/                  # Custom React hooks
├── lib/
│   ├── actions/           # Server Actions (CRUD operations)
│   ├── api-client.ts      # API wrapper (server actions)
│   ├── auth-context.tsx   # Auth context (NextAuth)
│   └── db.ts              # Prisma client singleton
├── prisma/
│   └── schema.prisma      # Database schema
├── public/
│   └── uploads/           # File uploads
├── types/                 # TypeScript types
├── auth.config.ts         # NextAuth configuration
├── middleware.ts          # Auth middleware
├── nixpacks.toml          # Coolify deployment config
└── DEPLOYMENT.md          # Deployment guide
```

## 🎯 Kullanıcı Rolleri

| Rol | Yetki |
|-----|-------|
| **superadmin** | Tüm sistem yetkisi |
| **birincil-admin** | Müşteri, evrak, ödeme yönetimi |
| **ikincil-admin** | Görüntüleme ve evrak yönetimi |
| **evrak-birimi** | Evrak ve bayi yönetimi |
| **bayi** | Sadece kendi müşterileri |
| **musteri** | Sadece kendi verileri |

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 20+
- PostgreSQL 14+ (Production veya Local)
- npm veya yarn

### 1. Kurulum

```bash
# Dependencies yükle
npm install

# ENV dosyası oluştur
cp ENV_LOCAL_EXAMPLE.txt .env.local

# .env.local'i düzenle ve şunları ayarla:
# DATABASE_URL="postgresql://user:password@localhost:5432/sigorta_db"
# NEXTAUTH_SECRET="openssl rand -base64 32 ile oluştur"
# NEXTAUTH_URL="http://localhost:3000"

# PostgreSQL database'i init.sql ile yükle
psql -U postgres -d sigorta_db -f database/init.sql

# Prisma client oluştur
npx prisma generate

# Development sunucusunu başlat
npm run dev
```

### 2. Giriş Yapın

- URL: http://localhost:3000
- Email: `admin@sigorta.com`
- Şifre: `admin123`

## 📝 Demo Kullanıcılar

**Tüm şifreler: `admin123`**

- **Süper Admin:** admin@sigorta.com
- **Birincil Admin:** birincil@sigorta.com
- **İkincil Admin:** ikincil@sigorta.com
- **Evrak Birimi:** evrak@sigorta.com
- **Bayi:** bayi@sigorta.com
- **Müşteri:** musteri@sigorta.com

## 📚 Dokümantasyon

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Coolify deployment guide (Production + Local)
- **[ENV_PRODUCTION.txt](ENV_PRODUCTION.txt)** - Environment variables template
- **[database/init.sql](database/init.sql)** - PostgreSQL schema + demo data
- **[prisma/schema.prisma](prisma/schema.prisma)** - Prisma schema

## 🔌 Server Actions

Bu proje Server Actions kullanır (REST API yok):

### Authentication (`lib/actions/auth.ts`)
- `authenticate()` - Login
- `logoutUser()` - Logout
- `getCurrentUser()` - Current user
- `requireAuth()` - Auth guard
- `requireRole()` - Role guard

### Customers (`lib/actions/customers.ts`)
- `getCustomers()` - List customers
- `getCustomer(id)` - Get customer
- `createCustomer(data)` - Create customer
- `updateCustomer(id, data)` - Update customer
- `deleteCustomer(id)` - Delete customer
- `closeCustomerFile(id, reason)` - Close file
- `addCustomerNote(id, content)` - Add note

### Documents (`lib/actions/documents.ts`)
- `getDocuments()` - List documents
- `getDocument(id)` - Get document
- `uploadDocument(formData)` - Upload (via `/api/upload`)
- `updateDocument(id, data)` - Update document
- `deleteDocument(id)` - Delete document
- `getDocumentDownloadUrl(id)` - Download URL

### Dashboard (`lib/actions/dashboard.ts`)
- `getDashboardStats()` - Dashboard statistics

...ve daha fazlası! Tüm actions için: `lib/actions/` klasörü

## 🌐 Deployment (Coolify)

Proje Coolify/Nixpacks ile deploy edilmeye hazır:

1. GitHub/GitLab'a push edin
2. Coolify'da yeni app oluşturun
3. Environment variables ayarlayın
4. Deploy edin

Detaylar için: [DEPLOYMENT.md](DEPLOYMENT.md)

## 🛠️ Development

### Development Commands
```bash
# Development server (Hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type check
npm run lint

# Prisma Studio (Database GUI)
npx prisma studio

# Database reset
# 1. Drop all tables in PostgreSQL
# 2. Re-run: psql -U postgres -d sigorta_db -f database/init.sql
# 3. npx prisma generate
```

## 🧪 Testing

### Manual Testing
1. **Login Test:**
   - Go to http://localhost:3000
   - Login with `admin@sigorta.com` / `password`
   - Should redirect to dashboard

2. **CRUD Test:**
   - Navigate to Customers
   - Create a new customer
   - Edit the customer
   - View customer details

3. **File Upload Test:**
   - Go to Documents
   - Upload a file (PDF or image)
   - Download the file
   - Check `/public/uploads/documents/`

4. **Prisma Studio:**
   ```bash
   npx prisma studio
   # Opens http://localhost:5555
   # Browse all database tables
   ```

## 📊 Veritabanı Şeması

### Core Tables
- `roles` - Kullanıcı rolleri
- `users` - Kullanıcılar
- `dealers` - Bayiler
- `file_types` - Dosya tipleri
- `customers` - Müşteriler
- `documents` - Evraklar
- `payments` - Ödemeler
- `notes` - Notlar
- `notifications` - Bildirimler
- `policies` - Poliçeler
- `claims` - Hasarlar

## 🔒 Güvenlik

- ✅ Laravel Sanctum token authentication
- ✅ Rol bazlı yetkilendirme
- ✅ CORS yapılandırması
- ✅ Input validation (backend + frontend)
- ✅ Password hashing (bcrypt)
- ✅ CSRF protection
- ✅ SQL injection protection (Eloquent ORM)

## 🐛 Sorun Giderme

### CORS Hatası
```env
# backend/.env
CORS_ALLOWED_ORIGINS=http://localhost:3000
SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

### Database Hatası
```bash
cd backend
php artisan migrate:fresh --seed
```

### Build Hatası
```bash
rm -rf node_modules .next
npm install
npm run build
```

## 📄 Lisans

MIT

## 👨‍💻 Geliştirici

Bu proje modern full-stack development best practices kullanılarak geliştirilmiştir.

## 🙏 Teşekkürler

- Next.js Team
- Laravel Team
- Radix UI
- shadcn/ui
- Tüm açık kaynak katkıda bulunanlar

---

**Not:** Bu proje production-ready durumdadır. Deployment öncesi `.env` dosyalarını güvenli şekilde yapılandırmayı unutmayın!

🚀 **Happy Coding!**

