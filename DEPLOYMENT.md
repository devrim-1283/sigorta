# Deployment Guide - Sigorta Yönetim Sistemi

## Coolify Deployment

Bu proje Coolify ve Nixpacks ile deploy edilmek üzere yapılandırılmıştır.

### Gereksinimler

- Node.js 20+
- PHP 8.2+
- Composer
- SQLite (development) veya MySQL/PostgreSQL (production)

### Environment Variables (Coolify'da Ayarlanacak)

#### Backend (.env)
```env
APP_NAME="Sigorta Yönetim Sistemi"
APP_ENV=production
APP_KEY=base64:xxxxx  # php artisan key:generate ile oluştur
APP_DEBUG=false
APP_URL=https://yourdomain.com

FRONTEND_URL=https://yourdomain.com

DB_CONNECTION=sqlite
DB_DATABASE=/app/backend/database/database.sqlite

# veya MySQL için:
# DB_CONNECTION=mysql
# DB_HOST=your-db-host
# DB_PORT=3306
# DB_DATABASE=your-database-name
# DB_USERNAME=your-username
# DB_PASSWORD=your-password

SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com

CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database

LOG_CHANNEL=stack
LOG_LEVEL=error
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api/v1
```

### Build Commands

Nixpacks otomatik olarak şunları yapar:
1. npm install
2. composer install
3. npm run build
4. Laravel cache

### Post-Deployment Commands

İlk deployment'tan sonra şunları çalıştırın:

```bash
# Backend dizinine girin
cd backend

# Application key oluştur (sadece ilk deploy)
php artisan key:generate

# Database oluştur (SQLite için)
touch database/database.sqlite

# Migrations çalıştır
php artisan migrate --force

# Seeders çalıştır (demo data için)
php artisan db:seed --force

# Storage link oluştur
php artisan storage:link
```

### Port Configuration

- Frontend: 3000 (default Next.js)
- Backend: 8000 (Laravel serve)

Coolify reverse proxy ile tek domain üzerinden her iki servise erişim sağlar.

### File Uploads

Storage klasörü için persistent volume mount edin:
- Path: `/app/backend/storage`

### Database

SQLite için persistent volume:
- Path: `/app/backend/database/database.sqlite`

Veya MySQL/PostgreSQL container kullanın.

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
   - Database dosyası veya bağlantı bilgilerini kontrol edin

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

