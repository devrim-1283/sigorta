# Deployment Guide - Sigorta Yönetim Sistemi

## 🏗️ Mimari

**Teknolojiler:**
- **Frontend:** Next.js 14 (App Router, TypeScript, Tailwind CSS)
- **Backend:** Laravel 12 (API-only, PHP 8.2+)
- **Database:** PostgreSQL 14+
- **Auth:** Laravel Sanctum (Token-based)
- **Deploy:** Coolify + Nixpacks (Monorepo, Single Container)

**Port Yapısı:**
- Next.js: 3000 (Coolify otomatik yönlendirir)
- Laravel API: 8000 (internal)
- Domain: https://test-sms-link.com.tr
- API Endpoint: https://test-sms-link.com.tr/api/v1

## Coolify Deployment

Bu proje Coolify ve Nixpacks ile deploy edilmek üzere yapılandırılmıştır.

### Gereksinimler

- Node.js 20+
- PHP 8.2+
- PHP PostgreSQL extension (php-pgsql)
- Composer
- PostgreSQL 14+ (Coolify tarafından sağlanıyor)

### Environment Variables (Coolify'da Ayarlanacak)

#### Backend (.env)
```env
APP_NAME="Sigorta Yönetim Sistemi"
APP_ENV=production
APP_KEY=base64:xxxxx  # php artisan key:generate ile oluştur
APP_DEBUG=false
APP_URL=https://test-sms-link.com.tr

FRONTEND_URL=https://test-sms-link.com.tr

# PostgreSQL Database (Coolify)
DB_CONNECTION=pgsql
DB_HOST=f04k88w8koc44c4wossw04w4
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=s5CtgtRRl1z10S6feIbjixpjwnBTjh2LtBNY57sf883PIcvWa912Mz3ZC7Ed4v0F

# Veya DATABASE_URL olarak tek satırda:
# DATABASE_URL=postgres://postgres:s5CtgtRRl1z10S6feIbjixpjwnBTjh2LtBNY57sf883PIcvWa912Mz3ZC7Ed4v0F@f04k88w8koc44c4wossw04w4:5432/postgres

SANCTUM_STATEFUL_DOMAINS=test-sms-link.com.tr,www.test-sms-link.com.tr

CORS_ALLOWED_ORIGINS=https://test-sms-link.com.tr,https://www.test-sms-link.com.tr

CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database

LOG_CHANNEL=stack
LOG_LEVEL=error
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://test-sms-link.com.tr/api/v1
```

### Build Commands

Nixpacks otomatik olarak şunları yapar:
1. npm install
2. composer install
3. npm run build
4. Laravel cache

### PostgreSQL Schema Setup (ÖNEMLİ! - İLK ADIM)

**Deploy sonrası PostgreSQL'e schema yükleyin:**

Method 1: Copy-Paste (EN KOLAY)
```
1. backend/database/init.sql dosyasını açın
2. Tüm içeriği kopyalayın (Ctrl+A, Ctrl+C)
3. Coolify PostgreSQL Query Editor'e gidin
4. Yapıştırın ve Run/Execute tıklayın
```

Method 2: psql (Local'den)
```bash
psql "postgres://postgres:PASSWORD@HOST:5432/postgres" < backend/database/init.sql
```

**init.sql içeriği:**
- 15 tablo (roles, users, customers, documents, payments, vs.)
- Foreign key'ler ve index'ler
- Demo data (6 rol, 5 bayi, 6 kullanıcı, 5 müşteri)

### Post-Deployment Commands

Schema yüklendikten sonra backend komutları:

```bash
# Backend dizinine girin
cd backend

# Application key oluştur (sadece ilk deploy)
php artisan key:generate

# PostgreSQL bağlantısını test et
php artisan tinker --execute="DB::connection()->getPdo();"

# Storage link oluştur
php artisan storage:link

# Cache'leri oluştur (optional, performans için)
php artisan config:cache
php artisan route:cache
```

**NOT: Artık migration yok! init.sql kullanın.**

### Port Configuration

**Önerilen Deployment Stratejisi:**

Coolify'da tek monorepo olarak deploy edilecek:
- Coolify otomatik olarak `$PORT` değişkenini atar
- Next.js `npm start` ile başlar ve Coolify'ın atadığı portu kullanır
- Domain: https://test-sms-link.com.tr

**Backend API için:**
Backend dizininde `php artisan serve` ile Laravel API başlatılır.
İki seçenek var:

**Seçenek 1: Tek Container (Monorepo)**
- Next.js 3000'de çalışır (Coolify proxy ile domain'e bağlı)
- Laravel 8000'de çalışır (internal)
- Next.js API route'ları `/api/*` ile backend'e proxy eder

**Seçenek 2: İki Ayrı Servis (Önerilen)**
- Frontend: https://test-sms-link.com.tr
- Backend API: Internal service veya subdomain

Bu proje için **Seçenek 1** (monorepo) kurulu durumda.

### File Uploads

Storage klasörü için persistent volume mount edin:
- Path: `/app/backend/storage`

### Database

PostgreSQL kullanılıyor (Coolify tarafından yönetiliyor):
- Host: `f04k88w8koc44c4wossw04w4`
- Port: `5432`
- Database: `postgres`
- Backup önerilir: `pg_dump` ile düzenli yedekler alın

### Monitoring

- Logs: `cd backend && php artisan pail`
- Queue: `php artisan queue:listen`

### Demo Kullanıcılar

Seeder çalıştırdıktan sonra bu kullanıcılarla giriş yapabilirsiniz:

- **Süper Admin:** admin@sigorta.com / password
- **Birincil Admin:** birincil@sigorta.com / password
- **İkincil Admin:** ikincil@sigorta.com / password
- **Evrak Birimi:** evrak@sigorta.com / password
- **Bayi:** bayi@sigorta.com / password
- **Müşteri:** musteri@sigorta.com / password

### Troubleshooting

1. **CORS Hatası:**
   - SANCTUM_STATEFUL_DOMAINS'i doğru ayarladığınızdan emin olun
   - CORS_ALLOWED_ORIGINS'e frontend URL'ini ekleyin

2. **Database Hatası:**
   - Migration'ları çalıştırdığınızdan emin olun
   - PostgreSQL bağlantı bilgilerini kontrol edin
   - PHP pgsql extension'ının yüklü olduğundan emin olun: `php -m | grep pgsql`

3. **File Upload Hatası:**
   - storage:link komutunu çalıştırdığınızdan emin olun
   - Storage klasörü izinlerini kontrol edin (775)

4. **Build Hatası:**
   - Node.js ve PHP versiyonlarını kontrol edin
   - Composer ve npm bağımlılıklarını temizleyip yeniden yükleyin

### Security Checklist

- [ ] APP_DEBUG=false
- [ ] APP_KEY oluşturuldu
- [ ] Güçlü database şifreleri
- [ ] HTTPS kullanımı
- [ ] CORS doğru yapılandırıldı
- [ ] Rate limiting aktif
- [ ] Backup stratejisi mevcut

