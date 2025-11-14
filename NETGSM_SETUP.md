# NetGSM SMS Entegrasyonu Kurulum Rehberi

## Hata: "Mesaj başlığı sistemde kayıtlı değil" (Hata Kodu: 40)

Bu hata, NetGSM hesabınızda gönderici adı (mesaj başlığı) tanımlı olmadığında oluşur.

### Çözüm Adımları:

#### 1. NetGSM'de Gönderici Adı Tanımlama

1. [www.netgsm.com.tr](https://www.netgsm.com.tr) adresine giriş yapın
2. **SMS Hizmeti** > **SMS Ayarları** > **Başlıklarım** menüsüne gidin
3. Yeni başlık ekleyin veya mevcut başlıklarınızı kontrol edin
4. Gönderici adı özellikleri:
   - En az 3, en fazla 11 karakter olmalıdır
   - Türkçe karakter içerebilir
   - Örnek: `SEFFAF DAN`, `SEFFAFDAN`, `SIGORTA` vb.

#### 2. API Alt Kullanıcısı Oluşturma

1. **Abonelik İşlemleri** > **Alt Kullanıcı Hesapları** menüsüne gidin
2. Yeni bir alt kullanıcı oluşturun
3. Alt kullanıcıya **API servisi yetkilerini** verin

#### 3. Ortam Değişkenlerini Ayarlama

`.env` dosyanızı oluşturun veya güncelleyin:

```env
# NetGSM API Credentials
NETGSM_USERNAME="850xxxxxxx"  # NetGSM abone numaranız
NETGSM_PASSWORD="your-api-password"  # API alt kullanıcı şifresi
NETGSM_SENDER="SEFFAF DAN"  # NetGSM'de tanımlı gönderici adınız (MAX 11 karakter)
NETGSM_API_URL="https://api.netgsm.com.tr"  # Opsiyonel, varsayılan zaten bu

# Application URL
NEXT_PUBLIC_APP_URL="https://yourdomain.com"  # SMS'lerde gönderilen link için
```

#### 4. IP Kısıtlaması (Opsiyonel)

Güvenlik için IP adresi kısıtlaması ekleyebilirsiniz:

1. **Abonelik İşlemleri** > **API işlemleri** menüsüne gidin
2. **API için IP Erişimini Sınırla** butonunu kullanın
3. Sunucu IP adresinizi ekleyin

> **Not**: IP sınırlaması eklerseniz, yalnızca belirtilen IP adreslerinden API çağrısı yapabilirsiniz.

#### 5. API Yetkilisi Tanımlama

Teknik değişikliklerden haberdar olmak için:

1. **Abonelik İşlemleri** > **API işlemleri** menüsüne gidin
2. **API yetkilisi** bölümüne API entegrasyonunu sağlayan kişinin bilgilerini girin

## NetGSM Hata Kodları

| Kod | Açıklama | Çözüm |
|-----|----------|-------|
| 00  | Başarılı | - |
| 20  | Mesaj metni hatası veya karakter sınırı aşımı | Mesaj metnini kontrol edin (max 917 karakter) |
| 30  | Geçersiz kullanıcı adı/şifre veya IP kısıtlaması | Kullanıcı adı, şifre ve IP adresini kontrol edin |
| **40**  | **Mesaj başlığı sistemde kayıtlı değil** | **NetGSM'de gönderici adı tanımlayın** |
| 50  | İYS kontrollü gönderim yapılamıyor | Hesabınızda İYS entegrasyonu aktif değil |
| 70  | Eksik veya hatalı parametre | API parametrelerini kontrol edin |
| 80  | Gönderim sınır aşımı | Dakikada maksimum gönderim sayısını aştınız |
| 85  | Mükerrer gönderim sınır aşımı | Aynı numaraya 1 dakikada 20'den fazla SMS gönderilemez |

## SMS Durumları

| Kod | Durum | Açıklama |
|-----|-------|----------|
| 0   | İletilmeyi bekliyor | SMS henüz gönderilmedi |
| 1   | İletildi | SMS başarıyla iletildi |
| 2   | Zaman aşımı | SMS süresi doldu |
| 3   | Hatalı numara | Geçersiz telefon numarası |
| 4   | Operatöre gönderilemedi | Operatör hatası |
| 11  | Operatör tarafından reddedildi | Operatör mesajı kabul etmedi |
| 12  | Gönderim hatası | Teknik hata |
| 13  | Mükerrer gönderim | Aynı mesaj kısa sürede tekrar gönderildi |
| 14  | Yetersiz kredi | Hesabınızda yeterli kredi yok |
| 15  | Kara liste | Numara kara listede |
| 16  | İYS ret | İYS sistemi mesajı reddetti |
| 17  | İYS hatası | İYS sorgulama hatası |

## Test Etme

Kurulumu test etmek için:

1. Uygulamaya süper admin olarak giriş yapın
2. **SMS Yönetimi** sayfasına gidin
3. Manuel SMS gönderimi yapın
4. SMS loglarını kontrol edin
5. Sistem loglarında SMS gönderim kayıtlarını inceleyin

## Otomatik SMS Gönderimi

Sistem aşağıdaki durumlarda otomatik SMS gönderir:

### 1. Müşteri Oluşturulduğunda
- **Kime**: Yeni müşteri
- **İçerik**: Hoş geldiniz mesajı + giriş bilgileri (e-posta, şifre, login linki)
- **Log**: Hem SMS loglarına hem sistem loglarına kaydedilir

### 2. Müşteri Bilgileri Güncellendiğinde
- **Tetikleme**: E-posta, telefon veya şifre değiştirildiğinde
- **Kime**: Müşteri (güncel telefon numarasına)
- **İçerik**: Güncellenen giriş bilgileri
- **Log**: Hem SMS loglarına hem sistem loglarına kaydedilir

### 3. Manuel SMS Gönderimi
- **Kimin**: Sadece süper admin
- **Nereden**: SMS Yönetimi sayfası
- **Log**: Hem SMS loglarına hem sistem loglarına kaydedilir

## Sistem Logları

Tüm SMS gönderimleri sistem loglarına şu bilgilerle kaydedilir:

- **Action**: `SEND_SMS`
- **Entity Type**: `CUSTOMER` veya `SMS`
- **Description**: Gönderim durumu ve alıcı bilgisi
- **Metadata**:
  - Telefon numarası
  - Mesaj uzunluğu
  - Job ID (NetGSM)
  - Durum (sent/failed)
  - Hata mesajı (varsa)
  - Manuel gönderim mi? (isManual)
  - Değişen alanlar (customer update için)

## SMS Mesaj Şablonları

### Hoş Geldiniz SMS'i
```
Merhaba [Ad Soyad], Şeffaf Danışmanlık'a hoş geldiniz. Giriş bilgileriniz - E-posta: [email], Şifre: [password]. Dosya durumunuzu [login_url] adresinden sorgulayabilirsiniz.
```

### Bilgi Güncelleme SMS'i
```
Merhaba [Ad Soyad], hesap bilgileriniz güncellendi. Yeni giriş bilgileriniz - E-posta: [email], Şifre: [password veya "Değişmedi"]. Giriş: [login_url]
```

## Sorun Giderme

### SMS Gönderilmiyor
1. `.env` dosyasında `NETGSM_USERNAME` ve `NETGSM_PASSWORD` doğru mu?
2. NetGSM'de alt kullanıcıya API yetkisi verildi mi?
3. `NETGSM_SENDER` değeri NetGSM'de kayıtlı mı? (En fazla 11 karakter)
4. Sunucu IP adresi NetGSM'de kısıtlı IP listesinde mi?

### SMS Loglarında "failed" Durumu
1. SMS loglarında `error_message` sütununu kontrol edin
2. Sistem loglarında (`/admin/loglar`) SMS gönderim detaylarına bakın
3. NetGSM hata kodlarına göre çözüm uygulayın

### SMS Gönderiliyor Ama Ulaşmıyor
1. SMS Yönetimi sayfasından durum güncellemesi yapın
2. NetGSM raporlarını kontrol edin: [www.netgsm.com.tr](https://www.netgsm.com.tr) > SMS Hizmeti > Raporlar-İstatistik
3. Telefon numarası formatını kontrol edin (5xxxxxxxxx)

## İletişim

NetGSM Destek:
- Web: [www.netgsm.com.tr](https://www.netgsm.com.tr)
- Çağrı Merkezi: 850 346 37 46
- E-posta: destek@netgsm.com.tr

## Kaynaklar

- [NetGSM API Dokümantasyonu](https://www.netgsm.com.tr/dokuman/)
- [NetGSM Python SDK](https://pypi.org/project/netgsm-sms/)
- [NetGSM JavaScript SDK](https://www.npmjs.com/package/@netgsm/sms)

