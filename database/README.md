# Veritabanı Yönetimi

## 🔧 Müşteri Tablosunu Sıfırlama

Eğer müşteri oluşturma hatası alıyorsanız veya veritabanını temizlemek istiyorsanız:

### Coolify/PostgreSQL'de Çalıştırma:

```bash
# Coolify konteynerına bağlan
docker exec -it <postgres-container-name> psql -U <username> -d <database-name>

# SQL dosyasını çalıştır
\i /path/to/reset-customers.sql

# Veya doğrudan komutu çalıştır:
psql -U <username> -d <database-name> -f reset-customers.sql
```

### Neler Yapılıyor:

1. ✅ İlişkili tüm kayıtlar temizleniyor (notes, payments, documents)
2. ✅ Customers tablosu DROP ve yeniden CREATE ediliyor
3. ✅ `created_at` ve `updated_at` alanları `NOT NULL` ve `DEFAULT NOW()` ile oluşturuluyor
4. ✅ Tüm indexler yeniden oluşturuluyor
5. ✅ Test müşteri ekleniyor

### Sorun Giderme:

#### Error: "Server Components render error"

Bu hata genellikle `created_at` veya `updated_at` alanlarının NULL olmasından kaynaklanır.

**Çözüm:**
```sql
-- reset-customers.sql dosyasını çalıştırın
-- Bu script tabloları yeniden oluşturacak ve doğru default değerleri ekleyecek
```

#### Error: "Müşteri oluşturulamadı"

Detaylı hata görmek için:

1. **Server log'larını kontrol edin** (Coolify/Railway dashboard)
2. **Browser console'da** tüm log'ları görün
3. **Development mode'da çalıştırın**:
   ```bash
   npm run dev
   ```

### Veritabanı Yapısını Kontrol Etme:

```sql
-- Customers tablosunu kontrol et
\d customers

-- Default değerleri kontrol et
SELECT 
  column_name,
  column_default,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- Mevcut müşterileri kontrol et
SELECT id, ad_soyad, tc_no, created_at, updated_at FROM customers;
```

### Prisma Client'ı Yenileme:

Veritabanı değişikliklerinden sonra:

```bash
# Prisma Client'ı yeniden oluştur
npx prisma generate

# Development'ta DB'yi sync et (dikkatli kullan!)
npx prisma db push

# Veya migration oluştur (production için önerilen)
npx prisma migrate dev --name fix_customers_table
```

## 📝 Notlar

- `reset-customers.sql` production'da DİKKATLE kullanılmalıdır (TÜM MÜŞTERİ VERİLERİ SİLİNİR!)
- Backup almadan önce bu scripti ÇALIŞTIRMAYIN
- Test ortamında önce deneyin
- Prisma schema ve database schema'nın senkron olduğundan emin olun

## 🔍 Hata Ayıklama Checklist:

- [ ] `created_at` ve `updated_at` alanları `NOT NULL` mı?
- [ ] Default değerler `NOW()` olarak ayarlı mı?
- [ ] Prisma client güncel mi? (`npx prisma generate`)
- [ ] Prisma schema ve DB senkron mu?
- [ ] Foreign key constraints doğru mu?
- [ ] TC No unique constraint var mı?

## 🚀 Deployment Sonrası:

```bash
# 1. Coolify'da veritabanına bağlan
# 2. reset-customers.sql'i çalıştır
# 3. Next.js uygulamasını restart et
# 4. Test müşteri oluşturmayı dene
```

