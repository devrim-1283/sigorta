# Production Configuration Summary

## 🎯 Domain & Database Configuration

### Domain
- **Production URL:** https://test-sms-link.com.tr
- **API Endpoint:** https://test-sms-link.com.tr/api/v1

### Database (PostgreSQL)
- **Type:** PostgreSQL 14+
- **Host:** f04k88w8koc44c4wossw04w4
- **Port:** 5432
- **Database:** postgres
- **Username:** postgres
- **Password:** s5CtgtRRl1z10S6feIbjixpjwnBTjh2LtBNY57sf883PIcvWa912Mz3ZC7Ed4v0F

**Connection URL:**
```
postgres://postgres:s5CtgtRRl1z10S6feIbjixpjwnBTjh2LtBNY57sf883PIcvWa912Mz3ZC7Ed4v0F@f04k88w8koc44c4wossw04w4:5432/postgres
```

## 📝 Environment Variables

### Backend (.env)
```env
APP_NAME="Sigorta Yönetim Sistemi"
APP_ENV=production
APP_KEY=base64:xxxxx  # php artisan key:generate ile oluşturun
APP_DEBUG=false
APP_URL=https://test-sms-link.com.tr

FRONTEND_URL=https://test-sms-link.com.tr

# PostgreSQL Database
DB_CONNECTION=pgsql
DB_HOST=f04k88w8koc44c4wossw04w4
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=s5CtgtRRl1z10S6feIbjixpjwnBTjh2LtBNY57sf883PIcvWa912Mz3ZC7Ed4v0F

# Alternative: DATABASE_URL
DATABASE_URL=postgres://postgres:s5CtgtRRl1z10S6feIbjixpjwnBTjh2LtBNY57sf883PIcvWa912Mz3ZC7Ed4v0F@f04k88w8koc44c4wossw04w4:5432/postgres

# CORS & Sanctum
SANCTUM_STATEFUL_DOMAINS=test-sms-link.com.tr,www.test-sms-link.com.tr
CORS_ALLOWED_ORIGINS=https://test-sms-link.com.tr,https://www.test-sms-link.com.tr

# Cache & Session
CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=error
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://test-sms-link.com.tr/api/v1
```

## 🚀 Deployment Steps (Coolify)

### 1. Initial Setup
```bash
# Coolify'da yeni uygulama oluşturun
# Git repository'nizi bağlayın
# Environment variables'ı yukarıdaki gibi ayarlayın
```

### 2. Build Process
Nixpacks otomatik olarak handle eder:
- Node.js 20 + PHP 8.2 + PostgreSQL extensions
- npm install + composer install
- Next.js build + Laravel cache

### 2.1 Startup Process
`start.sh` script'i her iki servisi de başlatır:
- Laravel backend: Port 8000 (internal)
- Next.js frontend: Coolify'ın atadığı port (Coolify proxy ile domain'e bağlı)

### 3. Post-Deploy Commands
```bash
cd backend

# Application key oluştur (ilk deploy)
php artisan key:generate

# PostgreSQL bağlantısını test et
php artisan tinker --execute="DB::connection()->getPdo();"

# Migrations çalıştır
php artisan migrate --force

# Demo verileri yükle (opsiyonel)
php artisan db:seed --force

# Storage link oluştur
php artisan storage:link
```

### 4. Verification
Test edin:
- https://test-sms-link.com.tr (Frontend)
- https://test-sms-link.com.tr/api/v1/auth/login (API)

Login:
- Email: admin@sigorta.com
- Password: password

## 🔒 Security Checklist

- [x] APP_DEBUG=false
- [x] APP_KEY generated
- [x] PostgreSQL bağlantısı güvenli
- [x] HTTPS enforced
- [x] CORS properly configured
- [x] Sanctum stateful domains set
- [x] Strong database password
- [ ] Change demo user passwords
- [ ] Setup SSL certificate
- [ ] Configure backup strategy
- [ ] Setup monitoring

## 📊 Database Schema

Total Tables: 14
- roles (6 rows)
- users (6 demo users)
- dealers (5 demo dealers)
- file_types (4 types)
- customers
- documents
- payments
- notes
- notifications
- policies
- claims
- cache, jobs, sessions, personal_access_tokens

## 🔧 Maintenance Commands

```bash
# Clear all cache
php artisan optimize:clear

# View logs
php artisan pail

# Database backup (PostgreSQL)
pg_dump -h f04k88w8koc44c4wossw04w4 -U postgres -d postgres > backup.sql

# Restart queue workers
php artisan queue:restart
```

## 📞 Support

Database issues? Check:
1. PHP pgsql extension: `php -m | grep pgsql`
2. Connection test: `php artisan tinker --execute="DB::connection()->getPdo();"`
3. Firewall rules for port 5432

CORS issues? Verify:
1. SANCTUM_STATEFUL_DOMAINS includes your domain
2. CORS_ALLOWED_ORIGINS includes https://test-sms-link.com.tr
3. No trailing slashes in URLs

## 🎉 Ready to Deploy!

All configurations are set for:
- Domain: test-sms-link.com.tr ✅
- Database: PostgreSQL ✅
- Environment: Production ✅
- Security: Configured ✅

Push to repository and deploy with Coolify!

