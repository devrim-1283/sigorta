# Backend README

## Laravel 12 Backend API

### Kurulum Adımları

1. **Composer bağımlılıklarını yükleyin** (zaten yapıldı)
```bash
composer install
```

2. **Environment dosyasını yapılandırın**
```bash
cp .env.example .env
php artisan key:generate
```

3. **Veritabanı ayarlarını yapın**
`.env` dosyasında:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sigorta_paneli
DB_USERNAME=root
DB_PASSWORD=
```

4. **Migrations'ları çalıştırın**
```bash
php artisan migrate
```

5. **Storage link oluşturun**
```bash
php artisan storage:link
```

6. **Sunucuyu başlatın**
```bash
php artisan serve
```

### Seed Data (İsteğe Bağlı)

Test verileri için seed dosyaları oluşturulabilir. Şimdilik manuel olarak:

```sql
-- Roles
INSERT INTO roles (name, display_name, created_at, updated_at) VALUES
('superadmin', 'Süper Admin', NOW(), NOW()),
('birincil-admin', 'Birincil Admin', NOW(), NOW()),
('ikincil-admin', 'İkincil Admin', NOW(), NOW()),
('evrak-birimi', 'Evrak Birimi', NOW(), NOW()),
('bayi', 'Bayi', NOW(), NOW()),
('musteri', 'Müşteri', NOW(), NOW());

-- File Types
INSERT INTO file_types (name, label, color, created_at, updated_at) VALUES
('deger-kaybi', 'Değer Kaybı Dosyası', '#22c55e', NOW(), NOW()),
('parca-iscilik', 'Parça ve İşçilik Farkı Dosyası', '#3b82f6', NOW(), NOW()),
('arac-mahrumiyeti', 'Araç Mahrumiyeti Dosyası', '#f97316', NOW(), NOW()),
('pert-farki', 'Pert Farkı Dosyası', '#ef4444', NOW(), NOW());
```

### API Dokümantasyonu

Tüm API endpoint'leri `routes/api.php` dosyasında tanımlıdır.

### Notlar

- Sanctum token authentication kullanılıyor
- Role-based middleware ile yetkilendirme yapılıyor
- CORS ayarları `bootstrap/app.php` içinde yapılandırıldı
- File uploads `storage/app/public/documents` dizinine kaydediliyor
