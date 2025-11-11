# 🔍 Server Log'larını Görme Talimatları

## Sorun Devam Ediyor
Hala "Server Components render" hatası alıyorsunuz ama **gerçek hata mesajı production'da gizli**.

## ✅ Çözüm Adımları:

### Seçenek 1: Coolify Server Log'larını Kontrol Edin (EN KOLAY)

1. **Coolify Dashboard'a gidin**
2. **Uygulamanızı seçin** (Next.js app)
3. **"Logs" sekmesine tıklayın**
4. **"Live Logs" veya "Recent Logs" görün**
5. **500 hatası aldığınızda log'lara bakın**
6. **Gerçek hata mesajını bana gönderin**

Coolify'da log'ları şöyle görürsünüz:
```
[Server Error] PrismaClientKnownRequestError: ...
[Error] Cannot read property 'X' of undefined
[Database Error] ...
```

### Seçenek 2: Prisma Studio ile Veritabanını Kontrol Edin

```bash
# Lokal terminalden Coolify database'e bağlanın
npx prisma studio --url "postgresql://postgres:PASSWORD@HOST:5432/DATABASE"
```

Kontrol edin:
- `customers` tablosunda kayıt var mı?
- `created_at` ve `updated_at` dolu mu?
- `documents`, `payments` tabloları boş mu?

### Seçenek 3: Development Mode'da Çalıştırın (Detaylı Hata)

```bash
# Local'de development build
npm run dev

# Veya production build ama development mode
npm run build
NODE_ENV=development npm start
```

Development'ta **tam hata mesajı görünür**!

### Seçenek 4: Manuel SQL Sorgusu

PostgreSQL'e bağlanın ve test edin:

```sql
-- Coolify PostgreSQL container'ına bağlanın
docker exec -it <postgres-container> psql -U postgres -d <database>

-- Müşterileri kontrol et
SELECT id, ad_soyad, created_at, updated_at FROM customers;

-- Documents var mı?
SELECT COUNT(*) FROM documents;

-- Payments var mı?
SELECT COUNT(*) FROM payments;

-- Notes var mı?
SELECT COUNT(*) FROM notes;
```

### Seçenek 5: API Route Test (Manuel)

Tarayıcıda şunu açın:
```
https://your-domain.com/api/customers
```

veya terminal'den:
```bash
curl https://your-domain.com/api/customers
```

Dönen hatayı bana gönderin.

---

## 🤔 Olası Nedenler:

### 1. Build Cache Problemi
Coolify yeni kod'u almamış olabilir.

**Çözüm:**
```bash
# Coolify'da "Force Rebuild" yapın
# veya
# Git'te yeni commit atın (boş commit bile olur)
git commit --allow-empty -m "Force rebuild"
git push
```

### 2. Prisma Client Güncel Değil
Schema değişti ama Prisma Client yenilenmemiş.

**Çözüm:**
```bash
# Coolify build sırasında otomatik çalışmalı ama manuel de yapabilirsiniz
npx prisma generate
```

### 3. Environment Variable Sorunu
`DATABASE_URL` yanlış veya eksik olabilir.

**Kontrol:**
- Coolify → Environment Variables
- `DATABASE_URL` doğru mu?
- Şifre, host, port doğru mu?

### 4. Başka Bir Serialization Sorunu
Başka bir field'da Date veya BigInt serialize edilmemiş olabilir.

**Bunu bulalım:** Server log'ları gerekli!

---

## 🚨 ACİL: Bana Şunları Gönderin

1. **Coolify Server Logs** (son 50 satır)
2. **Database query sonucu:**
   ```sql
   SELECT * FROM customers LIMIT 1;
   ```
3. **Environment variables** (şifreli kısmı gizleyin):
   ```
   DATABASE_URL=postgresql://user:***@host:port/db
   NODE_ENV=production
   ```

4. **Build log'ları** (deploy sırasında hata var mı?)

---

## 📋 Geçici Workaround

Eğer log'lara erişemiyorsanız, **geçici olarak** production'da detaylı hata gösterebiliriz:

### `lib/actions/customers.ts` dosyasına ekleyin:

```typescript
export async function getCustomers(params?: ...) {
  try {
    await requireAuth()
    // ... mevcut kod ...
  } catch (error: any) {
    // PRODUCTION'DA BİLE HATAY GÖSTER (GEÇİCİ!)
    console.error('❌ getCustomers error:', error)
    console.error('❌ Error message:', error.message)
    console.error('❌ Error stack:', error.stack)
    
    // Re-throw with full message
    throw new Error(`getCustomers failed: ${error.message}\n${error.stack}`)
  }
}
```

Bu şekilde browser console'da **tam hata mesajını** görürsünüz.

---

## ✅ Bir Sonraki Adım

**Bana Coolify log'larını gönderin** ve sorunu çözelim!

Veya şimdi test için şunu deneyin:
```bash
# PostgreSQL'e bağlanın
# Müşterileri listeleyin
SELECT * FROM customers;

# Sonucu buraya yapıştırın
```

