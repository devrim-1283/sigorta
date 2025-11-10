# Coolify Deployment Notes

## 🚀 Deployment Configuration

### Domain
- **Production:** https://test-sms-link.com.tr
- **API Endpoint:** https://test-sms-link.com.tr/api/v1

### Architecture
**Monorepo Structure:**
- Single Git repository
- Frontend: Next.js 14 (App Router, Standalone mode)
- Backend: Laravel 12 (API mode)
- Database: PostgreSQL (Coolify managed)

### How It Works

1. **Nixpacks Build:**
   - Detects Node.js + PHP project
   - Installs dependencies (npm + composer)
   - Builds Next.js production bundle
   - Caches Laravel config/routes/views

2. **Startup (start.sh):**
   - Starts Laravel backend on port 8000 (internal)
   - Starts Next.js frontend on Coolify's assigned port
   - Coolify reverse proxy handles HTTPS + domain routing

3. **Port Management:**
   - Coolify automatically assigns `$PORT` environment variable
   - Next.js `npm start` listens on this port
   - Coolify proxy: `https://test-sms-link.com.tr` → Frontend
   - Frontend API calls: `https://test-sms-link.com.tr/api/v1` → Backend (port 8000)

## 📝 Environment Variables (Coolify'da Set Edin)

### Critical Variables
```env
# Application
APP_ENV=production
APP_KEY=base64:xxxxx  # Generate with: php artisan key:generate
APP_DEBUG=false
APP_URL=https://test-sms-link.com.tr
FRONTEND_URL=https://test-sms-link.com.tr

# Frontend API endpoint
NEXT_PUBLIC_API_URL=https://test-sms-link.com.tr/api/v1

# PostgreSQL (Coolify internal)
DB_CONNECTION=pgsql
DB_HOST=f04k88w8koc44c4wossw04w4
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=s5CtgtRRl1z10S6feIbjixpjwnBTjh2LtBNY57sf883PIcvWa912Mz3ZC7Ed4v0F

# CORS & Security
SANCTUM_STATEFUL_DOMAINS=test-sms-link.com.tr,www.test-sms-link.com.tr
CORS_ALLOWED_ORIGINS=https://test-sms-link.com.tr,https://www.test-sms-link.com.tr

# Caching
CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=error
```

## 🔧 Post-Deploy Commands

İlk deployment sonrası Coolify terminal'den çalıştırın:

```bash
# Backend dizinine girin
cd backend

# Application key oluştur (only once!)
php artisan key:generate

# Test PostgreSQL connection
php artisan tinker --execute="DB::connection()->getPdo();"

# Run migrations
php artisan migrate --force

# Seed demo data (optional)
php artisan db:seed --force

# Create storage link
php artisan storage:link
```

## 📦 Files Structure

```
project/
├── start.sh              # Startup script (starts both services)
├── nixpacks.toml         # Nixpacks configuration
├── package.json          # Frontend dependencies
├── next.config.mjs       # Next.js config (standalone mode)
├── app/                  # Next.js pages
├── components/           # React components
├── lib/api-client.ts     # API client (uses NEXT_PUBLIC_API_URL)
└── backend/
    ├── composer.json     # Backend dependencies
    ├── .env              # Laravel environment (set via Coolify)
    ├── app/              # Laravel application
    ├── routes/api.php    # API routes
    └── database/
        └── migrations/   # Database schema
```

## ✅ Verification Checklist

Post-deployment, verify:

1. **Frontend loads:** https://test-sms-link.com.tr
2. **API responds:** https://test-sms-link.com.tr/api/v1/file-types
3. **Login works:** admin@sigorta.com / password
4. **Database connected:** Check dashboard shows stats
5. **File uploads work:** Try uploading a document
6. **CORS working:** No console errors in browser

## 🐛 Common Issues

### Issue: "Failed to fetch" or CORS errors

**Fix:**
```env
# In Coolify environment variables:
SANCTUM_STATEFUL_DOMAINS=test-sms-link.com.tr,www.test-sms-link.com.tr
CORS_ALLOWED_ORIGINS=https://test-sms-link.com.tr,https://www.test-sms-link.com.tr
NEXT_PUBLIC_API_URL=https://test-sms-link.com.tr/api/v1
```

Redeploy after changing env vars.

### Issue: "Connection refused" to database

**Fix:**
```bash
# Verify PostgreSQL extension
php -m | grep pgsql

# Should show: pdo_pgsql, pgsql
# If not, nixpacks.toml already includes them
```

### Issue: "Class not found" errors

**Fix:**
```bash
cd backend
composer dump-autoload
php artisan optimize:clear
```

### Issue: 500 errors

**Fix:**
```bash
# Check Laravel logs
cd backend
tail -100 storage/logs/laravel.log

# Or use pail for real-time logs
php artisan pail
```

## 🔄 Update Workflow

When you push new code:

1. Coolify auto-detects the push
2. Runs build process (nixpacks.toml)
3. Restarts services (start.sh)
4. No downtime (Coolify zero-downtime deployment)

**For database changes:**
```bash
# SSH into Coolify container
php artisan migrate --force
```

## 📊 Monitoring

### Logs
```bash
# Laravel logs
cd backend && php artisan pail

# Or view file
tail -f backend/storage/logs/laravel.log

# Next.js logs
# Available in Coolify dashboard
```

### Database
```bash
# Connect to PostgreSQL
psql postgres://postgres:PASSWORD@f04k88w8koc44c4wossw04w4:5432/postgres

# Check tables
\dt

# View migrations
SELECT * FROM migrations;
```

## 🎯 Key Points

1. ✅ **Single domain** for both frontend and backend
2. ✅ **Coolify manages** ports and SSL automatically
3. ✅ **PostgreSQL** is internal Coolify service
4. ✅ **No manual port** configuration needed
5. ✅ **Environment variables** control everything
6. ✅ **Monorepo** approach - one repo, two services
7. ✅ **Zero-downtime** deployments
8. ✅ **Automatic HTTPS** via Coolify proxy

## 🚀 Ready to Deploy!

1. Push to Git repository
2. Connect to Coolify
3. Set environment variables
4. Deploy
5. Run post-deploy commands
6. Test login: admin@sigorta.com / password

**Done!** 🎉

Domain: https://test-sms-link.com.tr
Database: PostgreSQL @ f04k88w8koc44c4wossw04w4:5432

