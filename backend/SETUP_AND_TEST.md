# Backend Setup ve Test Kılavuzu

## İlk Kurulum

### 1. Environment Dosyasını Oluşturun

```bash
cd backend
cp ENV_EXAMPLE.txt .env
```

### 2. Application Key Oluşturun

```bash
php artisan key:generate
```

### 3. Database Oluşturun

**Local Development (SQLite):**

Windows PowerShell:
```powershell
New-Item -ItemType File -Path database\database.sqlite -Force
```

Linux/Mac:
```bash
touch database/database.sqlite
```

**Production (PostgreSQL - Coolify):**
```env
# .env dosyasında:
DB_CONNECTION=pgsql
DB_HOST=f04k88w8koc44c4wossw04w4
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=s5CtgtRRl1z10S6feIbjixpjwnBTjh2LtBNY57sf883PIcvWa912Mz3ZC7Ed4v0F
```

### 4. Migrations Çalıştırın

```bash
php artisan migrate
```

Beklenen Sonuç:
- 14 migration dosyası başarıyla çalıştırılmalı
- roles, users, dealers, file_types, customers, documents, payments, notes, notifications, policies, claims tabloları oluşturulmalı

### 5. Seeder'ları Çalıştırın

```bash
php artisan db:seed
```

Beklenen Sonuç:
- 6 rol oluşturulmalı (superadmin, birincil-admin, ikincil-admin, evrak-birimi, bayi, musteri)
- 4 dosya tipi oluşturulmalı (Değer Kaybı, Parça-İşçilik, Araç Mahrumiyeti, Pert Farkı)
- 5 bayi oluşturulmalı
- 6 demo kullanıcı oluşturulmalı

### 6. Storage Link Oluşturun

```bash
php artisan storage:link
```

### 7. Laravel Sunucusunu Başlatın

```bash
php artisan serve
```

Sunucu http://localhost:8000 adresinde çalışacak.

## Test Senaryoları

### Test 1: Database Bağlantısı

```bash
php artisan tinker
```

```php
use App\Models\User;
User::count(); // 6 dönmeli
```

### Test 2: Authentication API

**Login İsteği (cURL):**

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sigorta.com","password":"password"}'
```

Beklenen Response:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Süper Admin",
    "email": "admin@sigorta.com",
    "role": {
      "name": "superadmin",
      "display_name": "Süper Admin"
    }
  },
  "token": "1|xxxxx..."
}
```

### Test 3: Protected Endpoint (Dashboard Stats)

Token'ı kullanarak:

```bash
curl -X GET http://localhost:8000/api/v1/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"
```

### Test 4: CORS Test

Frontend'den API çağrısı yaptığınızda CORS hatası almamalısınız.

### Test 5: Rol Bazlı Yetkilendirme

Bayi kullanıcısı ile login olun:

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bayi@sigorta.com","password":"password"}'
```

Sonra User Management endpoint'ini deneyin (sadece superadmin erişebilir):

```bash
curl -X GET http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer BAYI_TOKEN_HERE"
```

Beklenen: 403 Forbidden

## Yaygın Sorunlar ve Çözümler

### Sorun: "SQLSTATE[HY000] [14] unable to open database file" (SQLite)

**Çözüm:**
```bash
# Database dosyasının olduğundan emin olun
touch database/database.sqlite

# İzinleri kontrol edin
chmod 664 database/database.sqlite
chmod 775 database/
```

### Sorun: PostgreSQL Connection Error

**Çözüm:**
```bash
# PHP PostgreSQL extension kontrolü
php -m | grep pgsql

# Extension yoksa yükleyin (Ubuntu/Debian):
sudo apt install php8.2-pgsql

# Windows için:
# php.ini dosyasında extension=pdo_pgsql ve extension=pgsql satırlarını aktif edin

# Bağlantıyı test edin:
php artisan tinker --execute="DB::connection()->getPdo();"
```

### Sorun: "Class 'XXXController' not found"

**Çözüm:**
```bash
composer dump-autoload
```

### Sorun: "The stream or file could not be opened"

**Çözüm:**
```bash
# Storage izinlerini düzeltin
chmod -R 775 storage
chmod -R 775 bootstrap/cache
```

### Sorun: CORS Hatası

**Çözüm:**
.env dosyasında:
```env
CORS_ALLOWED_ORIGINS=http://localhost:3000
SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost,127.0.0.1
```

## API Endpoint Listesi

Tüm endpoint'leri görmek için:

```bash
php artisan route:list --path=api
```

## Log İzleme

```bash
# Real-time log izleme
php artisan pail

# Veya tail ile
tail -f storage/logs/laravel.log
```

## Database Temizleme

Sıfırdan başlamak isterseniz:

```bash
php artisan migrate:fresh --seed
```

**⚠️ Dikkat:** Bu komut tüm verileri siler ve yeniden oluşturur!

