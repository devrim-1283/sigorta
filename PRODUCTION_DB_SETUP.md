# 🔥 ACİL: Production Database Setup

## ❌ SORUN
Giriş yapılınca 404 hatası veriyor → **DATABASE BOŞ!**

## ✅ ÇÖZÜM: Database Schema Yükle

### Adım 1: Coolify → PostgreSQL Aç

1. Coolify Dashboard'a git
2. **PostgreSQL** servisini bul (f04k88w8koc44c4wossw04w4)
3. **Execute Command** veya **Query Editor** aç

### Adım 2: Database Schema Yükle

**ÇOK ÖNEMLİ:** `database/init.sql` dosyasını Coolify'a yükle

**Method A: Coolify UI (ÖNERİLEN)**
```
1. Coolify → PostgreSQL → Query Editor
2. database/init.sql dosyasını aç (bu repo'dan)
3. TÜM DOSYAYI KOPYALA (Ctrl+A → Ctrl+C)
4. Query Editor'e YAPIŞTIR
5. EXECUTE / RUN tıkla
```

**Method B: psql (Terminal'den)**
```bash
# Local'de bu repo dizininde:
psql "postgres://postgres:s5CtgtRRl1z10S6feIbjixpjwnBTjh2LtBNY57sf883PIcvWa912Mz3ZC7Ed4v0F@f04k88w8koc44c4wossw04w4:5432/postgres" < database/init.sql
```

### Adım 3: Doğrula

Query Editor'de şunu çalıştır:
```sql
-- Tabloları kontrol et
SELECT COUNT(*) FROM users;
-- 6 user olmalı

-- Demo admin'i kontrol et
SELECT name, email, role_id FROM users WHERE email = 'admin@sigorta.com';
-- Sonuç: Super Admin | admin@sigorta.com | 1
```

## 🧪 TEST

Başarılı olursa:
```
URL: https://test-sms-link.com.tr/yonetici-giris
Email: admin@sigorta.com
Şifre: admin123
```

Sonuç: `/admin/dashboard`'a yönlendirilmeli ✅

## 📋 DATABASE SCHEMA İÇERİĞİ

init.sql dosyası şunları oluşturur:
- ✅ 15 tablo (roles, users, customers, dealers, documents, etc.)
- ✅ 5 rol (Super Admin, Admin, Moderator, Dealer, Accountant)
- ✅ 2 bayi (İstanbul, Ankara)
- ✅ 6 demo user (hepsi admin123 şifreli)
- ✅ Sample data (customers, policies, documents)

## ⚠️ EĞER HALA ÇALIŞMAZSA

1. **Database bağlantısını test et:**
```bash
psql "postgres://postgres:s5CtgtRRl1z10S6feIbjixpjwnBTjh2LtBNY57sf883PIcvWa912Mz3ZC7Ed4v0F@f04k88w8koc44c4wossw04w4:5432/postgres" -c "\dt"
```

2. **Environment variables kontrol:**
```
Coolify → Application → Environment Variables
DATABASE_URL = postgres://postgres:s5CtgtRRl1z10S6feIbjixpjwnBTjh2LtBNY57sf883PIcvWa912Mz3ZC7Ed4v0F@f04k88w8koc44c4wossw04w4:5432/postgres
```

3. **Prisma migration:**
```bash
# Production'da prisma client generate edildi mi?
# nixpacks.toml'de zaten var:
npx prisma generate
```

4. **Logs kontrol:**
```
Coolify → Application → Logs
[Auth Error] hatalarını ara
```

## 🚨 HEMEN ŞİMDİ YAP!

1. ✅ Coolify'da PostgreSQL Query Editor'ü aç
2. ✅ database/init.sql dosyasını yükle
3. ✅ Execute tıkla
4. ✅ Test: admin@sigorta.com / admin123

HAZIR! 🚀

