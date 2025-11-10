# Quick Start Guide - Sigorta Yönetim Sistemi

## Hızlı Başlangıç (Development)

### 1. Backend Setup

```powershell
# Backend klasörüne girin
cd backend

# ENV dosyası oluşturun
Copy-Item ENV_EXAMPLE.txt .env

# Composer paketlerini yükleyin
composer install

# Application key oluşturun
php artisan key:generate

# Database oluşturun (SQLite)
New-Item -ItemType File -Path database\database.sqlite -Force

# Migrations çalıştırın
php artisan migrate

# Demo verileri yükleyin
php artisan db:seed

# Storage link oluşturun
php artisan storage:link

# Laravel sunucusunu başlatın
php artisan serve
```

Backend http://localhost:8000 adresinde çalışacak.

### 2. Frontend Setup

Yeni bir terminal açın:

```powershell
# Ana klasörde kalın
# ENV dosyası oluşturun
Copy-Item ENV_LOCAL_EXAMPLE.txt .env.local

# Next.js sunucusunu başlatın (packages zaten yüklü)
npm run dev
```

Frontend http://localhost:3000 adresinde çalışacak.

## Demo Kullanıcılar

Tüm şifreler: `password`

| Rol | Email | Yetki |
|-----|-------|-------|
| Süper Admin | admin@sigorta.com | Tüm yetkiler |
| Birincil Admin | birincil@sigorta.com | Müşteri, evrak, ödeme yönetimi |
| İkincil Admin | ikincil@sigorta.com | Görüntüleme ve evrak yönetimi |
| Evrak Birimi | evrak@sigorta.com | Evrak ve bayi yönetimi |
| Bayi | bayi@sigorta.com | Sadece kendi müşterileri |
| Müşteri | musteri@sigorta.com | Sadece kendi verileri |

## Özellik Testleri

### 1. Login Test
- Ana sayfaya gidin: http://localhost:3000
- "Yönetici Girişi" butonuna tıklayın
- Email: admin@sigorta.com
- Password: password
- Login olmalısınız ve dashboard'a yönlendirilmelisiniz

### 2. Dashboard Test
- Dashboard'da istatistikleri görebilmelisiniz
- Son eklenen müşterileri görebilmelisiniz (şu an boş olacak)

### 3. Müşteri Ekleme Test
- Sol menüden "Müşteri Yönetimi"ne tıklayın
- "Yeni Müşteri" butonuna tıklayın
- Form doldurarak yeni müşteri ekleyin

### 4. Dosya Yükleme Test
- Bir müşteri seçin
- "Evrak Ekle" butonuna tıklayın
- Dosya yükleyin (PDF, JPG, PNG, DOC destekleniyor)

### 5. Rol Testi
- Logout yapın
- Bayi kullanıcısı ile login olun (bayi@sigorta.com)
- Sadece menü kısıtlamalarını göreceksiniz
- User Management menüsü görünmeyecek (sadece superadmin)

## API Test (Manuel)

### PowerShell ile:

```powershell
# Login
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"admin@sigorta.com","password":"password"}'

$token = $response.token

# Dashboard Stats
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/dashboard/stats" `
  -Headers @{"Authorization"="Bearer $token"; "Accept"="application/json"}
```

## Sorun Giderme

### Backend Çalışmıyor
```powershell
cd backend
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan serve
```

### Frontend Çalışmıyor
```powershell
# node_modules silip yeniden yükleyin
Remove-Item -Recurse -Force node_modules, .next
npm install
npm run dev
```

### Database Hatası
```powershell
cd backend
# Database'i sıfırlayın
php artisan migrate:fresh --seed
```

### CORS Hatası
Backend .env dosyasında:
```env
CORS_ALLOWED_ORIGINS=http://localhost:3000
SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost
```

Sonra backend'i yeniden başlatın.

## Production Build Test

### Frontend:
```powershell
npm run build
npm start
```

### Backend:
```powershell
cd backend
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan serve
```

## Sonraki Adımlar

1. ✅ Backend implementasyonu tamamlandı
2. ✅ Frontend zaten hazır
3. ✅ Authentication çalışıyor
4. ✅ Rol bazlı yetkilendirme hazır
5. ✅ File upload hazır
6. ⏭️ Gerçek müşteri verileri ekleyin
7. ⏭️ Production deployment (Coolify)

## Yardım

Sorun yaşarsanız:
1. `backend/storage/logs/laravel.log` dosyasını kontrol edin
2. Browser console'u kontrol edin (F12)
3. `php artisan pail` ile real-time log izleyin

## Faydalı Komutlar

```powershell
# Backend logs
cd backend
php artisan pail

# Database sıfırlama
php artisan migrate:fresh --seed

# Cache temizleme
php artisan optimize:clear

# Route listesi
php artisan route:list

# Frontend build
npm run build

# Frontend type check
npm run lint
```

🎉 **Projeniz hazır! İyi geliştirmeler!**

