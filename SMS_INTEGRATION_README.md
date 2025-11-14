# NetGSM SMS Integration - Kurulum ve Kullanım Rehberi

## ✅ Tamamlanan İşlemler

1. **Veritabanı**: `sms_logs` tablosu ve Prisma schema eklendi
2. **NetGSM Service**: SMS gönderme ve durum sorgulama servisi
3. **Server Actions**: SMS log yönetimi, manuel gönderim, durum güncelleme
4. **Müşteri Entegrasyonu**: Otomatik SMS gönderimi (oluşturma + güncelleme)
5. **SMS Yönetim Sayfası**: Superadmin için tam özellikli UI
6. **API Routes**: REST endpoints (send, logs, status, sync)
7. **Menü Entegrasyonu**: SMS Yönetimi menüsü eklendi

## 🔧 Kurulum Adımları

### 1. Environment Variables

`.env` dosyanıza ekleyin:

```env
# NetGSM SMS API
NETGSM_USERNAME=850xxxxxxx
NETGSM_PASSWORD=your_api_password
NETGSM_SENDER=SEFFAF DAN
NETGSM_API_URL=https://api.netgsm.com.tr
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Optional: Cron job için API key
CRON_API_KEY=your_secure_random_key
```

### 2. Database Migration

Coolify PostgreSQL Query Editor'da çalıştırın:

```bash
# database/create_sms_logs.sql dosyasını çalıştırın
```

### 3. Prisma Generate

```bash
npx prisma generate
```

## 📱 Özellikler

### Otomatik SMS Gönderimi

#### Müşteri Oluşturulduğunda
- **Koşul**: Email adresi dolu olmalı
- **Mesaj İçeriği**:
  ```
  Merhaba [Ad Soyad], Şeffaf Danışmanlık'a hoş geldiniz. 
  Giriş bilgileriniz - E-posta: [email], Şifre: [password]. 
  Dosya durumunuzu [login_url] adresinden sorgulayabilirsiniz.
  ```

#### Müşteri Güncellendiğinde
- **Koşul**: Email, telefon veya şifre değiştiğinde
- **Mesaj İçeriği**:
  ```
  Merhaba [Ad Soyad], hesap bilgileriniz güncellendi. 
  Yeni giriş bilgileriniz - E-posta: [email], Şifre: [password/Değişmedi]. 
  Giriş: [login_url]
  ```

### Manuel SMS Gönderimi

SMS Yönetimi sayfasından:
1. Müşteri dropdown'ından seçim
2. Veya manuel telefon numarası girişi
3. Mesaj yazma (max 917 karakter)
4. Gönder butonu

### SMS Takibi

- Gönderilen tüm SMS'ler loglanır
- NetGSM'den durum sorgulaması
- Filtreleme: Durum, arama
- Pagination: 50 kayıt/sayfa
- İstatistikler: Toplam, Gönderildi, İletildi, Bekliyor, Başarısız

## 🎯 SMS Durumları

| Durum | Açıklama | Badge Rengi |
|-------|----------|-------------|
| `pending` | Bekliyor | Gri |
| `sent` | Gönderildi | Mavi |
| `delivery_status: 1` | İletildi | Yeşil |
| `failed` | Başarısız | Kırmızı |

## 📊 NetGSM Status Kodları

| Kod | Anlamı |
|-----|--------|
| 0 | İletilmeyi bekliyor |
| 1 | İletildi ✅ |
| 2 | Zaman aşımı |
| 3 | Hatalı numara |
| 4 | Operatöre gönderilemedi |
| 13 | Mükerrer gönderim |
| 14 | Yetersiz kredi |
| 16 | İYS ret |

## 🔐 Güvenlik

- SMS Yönetimi sayfası sadece **superadmin** erişimine açık
- NetGSM credentials environment variable'da
- Rate limiting: Aynı numaraya 1 dakikada max 1 SMS
- Telefon numarası validasyonu
- SQL injection koruması (Prisma ORM)

## 🚀 API Endpoints

### POST /api/sms/send
Manuel SMS gönderimi

**Request:**
```json
{
  "phone": "5051234567",
  "message": "Test mesajı",
  "customerId": 123,
  "recipientName": "Ad Soyad"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "17377215342605050417149344"
}
```

### GET /api/sms/logs
SMS loglarını listele

**Query Params:**
- `page`: Sayfa numarası (default: 1)
- `perPage`: Sayfa başına kayıt (default: 50)
- `search`: Arama terimi
- `status`: Durum filtresi (all, sent, failed, pending)

### POST /api/sms/status/[id]
Belirli SMS'in durumunu NetGSM'den sorgula

**Response:**
```json
{
  "success": true,
  "status": 1,
  "statusDescription": "İletildi",
  "deliveredDate": "14.11.2024 15:30:00"
}
```

### POST /api/sms/sync
Toplu durum senkronizasyonu (Cron job için)

**Headers:**
```
Authorization: Bearer [CRON_API_KEY]
```

**Response:**
```json
{
  "success": true,
  "updated": 15,
  "failed": 2,
  "total": 17
}
```

## 📅 Cron Job Kurulumu (Opsiyonel)

### Vercel Cron

`vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/sms/sync",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### External Cron

```bash
# Her 5 dakikada bir
*/5 * * * * curl -X POST https://yourdomain.com/api/sms/sync -H "Authorization: Bearer YOUR_CRON_API_KEY"
```

## 🧪 Test Senaryoları

### 1. Müşteri Oluşturma
```
1. Admin panelden "Yeni Müşteri Ekle"
2. Tüm bilgileri gir (özellikle email)
3. Kaydet
4. SMS'in müşteri telefonuna gitmesini bekle
5. SMS Yönetimi sayfasından kontrol et
```

### 2. Müşteri Güncelleme
```
1. Mevcut müşteri seç
2. Email, telefon veya şifre değiştir
3. Kaydet
4. SMS'in gitmesini bekle
5. SMS Yönetimi sayfasından kontrol et
```

### 3. Manuel SMS
```
1. SMS Yönetimi sayfasına git
2. Müşteri seç veya manuel numara gir
3. Mesaj yaz
4. Gönder
5. Log tablosunda görüntüle
```

### 4. Durum Sorgulama
```
1. SMS Yönetimi sayfasında bir log seç
2. "Güncelle" butonuna tıkla
3. NetGSM'den durum çekilir
4. Tablo güncellenir
```

## ⚠️ Önemli Notlar

1. **Email Zorunluluğu**: Müşteri oluşturulduğunda SMS gönderilebilmesi için email adresi dolu olmalı
2. **Telefon Formatı**: Türkiye formatında (05XX XXX XX XX) olmalı
3. **Karakter Limiti**: SMS mesajı max 917 karakter
4. **İYS Filtresi**: Bilgilendirme SMS'i olarak gönderiliyor (iysfilter: 0)
5. **Türkçe Karakter**: Encoding: TR parametresi ile destekleniyor
6. **NetGSM Credentials**: API kullanabilmek için NetGSM'den alt kullanıcı oluşturulmalı

## 🐛 Hata Ayıklama

### SMS Gönderilmiyor

```bash
# Console loglarını kontrol et
[Customer] Sending welcome SMS to: 05051234567
[NetGSM] Sending SMS to: 905051234567
[NetGSM] Response: { code: '00', jobid: '...' }
[Customer] SMS sent: Success
```

### NetGSM Hata Kodları

- `20`: Mesaj metni hatası
- `30`: Geçersiz kullanıcı/şifre
- `40`: Mesaj başlığı kayıtlı değil
- `70`: Eksik parametre
- `85`: Mükerrer gönderim

### Database Kontrol

```sql
-- Son gönderilen SMS'ler
SELECT * FROM sms_logs ORDER BY sent_at DESC LIMIT 10;

-- Başarısız SMS'ler
SELECT * FROM sms_logs WHERE status = 'failed';

-- İletim durumu
SELECT status, delivery_status, COUNT(*) 
FROM sms_logs 
GROUP BY status, delivery_status;
```

## 📞 Destek

Herhangi bir sorun için:
1. Console loglarını kontrol edin
2. `sms_logs` tablosunu inceleyin
3. NetGSM API dokümantasyonuna bakın: https://www.netgsm.com.tr/dokuman/
4. Environment variables'ın doğru olduğundan emin olun

---

**Son Güncelleme**: 2024-11-14
**Versiyon**: 1.0.0

