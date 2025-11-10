# Sigorta Yönetim Sistemi

Modern, full-stack sigorta yönetim platformu. Next.js 14 + Laravel 12 ile geliştirilmiştir.

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

### Backend (Laravel 12)
- ✅ RESTful API
- ✅ Laravel Sanctum authentication
- ✅ Rol bazlı yetkilendirme middleware
- ✅ File upload ve storage yönetimi
- ✅ 11 model, 14 migration
- ✅ 13 API controller
- ✅ CORS yapılandırması
- ✅ SQLite (dev) / MySQL/PostgreSQL (prod) desteği

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
- **Framework:** Laravel 12
- **Language:** PHP 8.2+
- **Auth:** Laravel Sanctum
- **Database:** PostgreSQL (Production) / SQLite (Development)
- **Storage:** Local / S3 compatible

## 🏗️ Proje Yapısı

```
proje/
├── app/                    # Next.js pages (App Router)
├── components/             # React components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities & API client
├── backend/                # Laravel backend
│   ├── app/
│   │   ├── Models/        # Eloquent models (11 adet)
│   │   ├── Http/
│   │   │   ├── Controllers/Api/  # API controllers (13 adet)
│   │   │   └── Middleware/       # Custom middleware (2 adet)
│   ├── database/
│   │   ├── migrations/    # Database migrations (14 adet)
│   │   └── seeders/       # Demo data seeders
│   └── routes/api.php     # API routes
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
- PHP 8.2+ (php-pgsql extension dahil)
- Composer
- PostgreSQL 14+ (Production) / SQLite (Local test)

### 1. Backend Kurulumu

```bash
cd backend

# ENV dosyası oluştur
cp ENV_EXAMPLE.txt .env

# Paketleri yükle
composer install

# Key oluştur
php artisan key:generate

# Database oluştur (Local test için SQLite)
# Production'da PostgreSQL kullanılıyor
touch database/database.sqlite

# Migrations çalıştır
php artisan migrate

# Demo verileri yükle
php artisan db:seed

# Storage link oluştur
php artisan storage:link

# Sunucuyu başlat
php artisan serve
```

### 2. Frontend Kurulumu

```bash
# Ana klasörde
cp ENV_LOCAL_EXAMPLE.txt .env.local

# Paketler zaten yüklü, sunucuyu başlat
npm run dev
```

### 3. Giriş Yapın

- URL: http://localhost:3000
- Email: `admin@sigorta.com`
- Şifre: `password`

## 📝 Demo Kullanıcılar

Tüm şifreler: `password`

- **Süper Admin:** admin@sigorta.com
- **Birincil Admin:** birincil@sigorta.com
- **İkincil Admin:** ikincil@sigorta.com
- **Evrak Birimi:** evrak@sigorta.com
- **Bayi:** bayi@sigorta.com
- **Müşteri:** musteri@sigorta.com

## 📚 Dokümantasyon

- [Quick Start Guide](QUICKSTART.md) - Hızlı başlangıç
- [Backend Setup](backend/SETUP_AND_TEST.md) - Backend detaylı kurulum
- [Deployment Guide](DEPLOYMENT.md) - Production deployment
- [Backend Implementation Plan](backend-implementation.plan.md) - Teknik plan

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Current user

### Customers
- `GET /api/v1/customers` - List customers
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/customers/{id}` - Get customer
- `PUT /api/v1/customers/{id}` - Update customer
- `DELETE /api/v1/customers/{id}` - Delete customer
- `POST /api/v1/customers/{id}/close` - Close file
- `POST /api/v1/customers/{id}/notes` - Add note

### Documents
- `GET /api/v1/documents` - List documents
- `POST /api/v1/documents/upload` - Upload document
- `GET /api/v1/documents/{id}/download` - Download document
- `DELETE /api/v1/documents/{id}` - Delete document

### Dealers
- `GET /api/v1/dealers` - List dealers
- `POST /api/v1/dealers` - Create dealer
- `GET /api/v1/dealers/{id}` - Get dealer
- `PUT /api/v1/dealers/{id}` - Update dealer

### Dashboard
- `GET /api/v1/dashboard/stats` - Dashboard statistics

...ve daha fazlası! Tüm endpoint'ler için: `php artisan route:list --path=api`

## 🌐 Deployment (Coolify)

Proje Coolify/Nixpacks ile deploy edilmeye hazır:

1. GitHub/GitLab'a push edin
2. Coolify'da yeni app oluşturun
3. Environment variables ayarlayın
4. Deploy edin

Detaylar için: [DEPLOYMENT.md](DEPLOYMENT.md)

## 🛠️ Development

### Backend Development
```bash
cd backend

# Real-time logs
php artisan pail

# Clear cache
php artisan optimize:clear

# Database reset
php artisan migrate:fresh --seed
```

### Frontend Development
```bash
# Development server
npm run dev

# Production build
npm run build

# Type check
npm run lint
```

## 🧪 Testing

### Backend API Test (PowerShell)
```powershell
# Login
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" `
  -Method Post -ContentType "application/json" `
  -Body '{"email":"admin@sigorta.com","password":"password"}'

# Dashboard Stats
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/dashboard/stats" `
  -Headers @{"Authorization"="Bearer $($response.token)"}
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

