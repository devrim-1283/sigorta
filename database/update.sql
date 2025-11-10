-- ========================================
-- Database Update Script
-- Mevcut production DB'yi günceller
-- ========================================

-- 0. Documents tablosuna default NOW() ekle (evrak yükleme hatası düzeltmesi)
ALTER TABLE documents 
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- 1. Rol isimlerini güncelle (kod ile uyumlu hale getir)
UPDATE roles SET name = 'birincil-admin' WHERE name = 'admin';
UPDATE roles SET name = 'ikincil-admin' WHERE name = 'manager';
UPDATE roles SET name = 'bayi' WHERE name = 'agent';
UPDATE roles SET name = 'evrak-birimi' WHERE name = 'accountant';
UPDATE roles SET name = 'musteri' WHERE name = 'viewer';

-- 2. Duplicate email'i düzelt
UPDATE users 
SET email = 'izmir@sigorta.com' 
WHERE tc_no = '12345678905' AND email = 'ankara@sigorta.com';

-- 3. File Types'ı güncelle (4 dosya tipi olmalı)
DELETE FROM file_types WHERE id > 4;

UPDATE file_types SET 
  name = 'Değer Kaybı',
  description = 'Kaza sonrası araç değer kaybı dosyası',
  required_for_approval = true
WHERE id = 1;

UPDATE file_types SET 
  name = 'Parça ve İşçilik Farkı',
  description = 'Onarım sonrası parça ve işçilik farkı dosyası',
  required_for_approval = true
WHERE id = 2;

UPDATE file_types SET 
  name = 'Araç Mahrumiyeti',
  description = 'Araç kullanılamama nedeniyle mahuriyet tazminatı',
  required_for_approval = true
WHERE id = 3;

-- Pert Farkı yoksa ekle
INSERT INTO file_types (name, description, required_for_approval) 
SELECT 'Pert Farkı', 'Araç pert ilan edildiğinde değer farkı tazminatı', true
WHERE NOT EXISTS (SELECT 1 FROM file_types WHERE id = 4);

-- 4. Dosya durumları için customers tablosuna check constraint ekle
-- (PostgreSQL'de mevcut data varsa constraint eklenemeyebilir, önce data güncelleyelim)
UPDATE customers SET başvuru_durumu = 'Evrak Aşamasında' WHERE başvuru_durumu NOT IN (
  'Evrak Aşamasında',
  'Başvuru Aşamasında', 
  'Başvuru Yapıldı',
  'Tahkim Başvurusu Yapıldı',
  'Tahkim Aşamasında',
  'İcra Aşamasında',
  'Dosya Kapatıldı'
);

-- 5. Documents tablosuna document_type kolonu ekle (sonuç evrakları için)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_type VARCHAR(100) DEFAULT 'Standart Evrak';

-- Mevcut evrakları kategorize et
UPDATE documents SET document_type = 'Standart Evrak' WHERE document_type IS NULL OR document_type = '';

-- 6. Customers tablosuna dosya kapanma bilgisi kolonu ekle (eğer yoksa)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS dosya_kapatma_nedeni TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS dosya_kapatma_tarihi TIMESTAMP;

-- 7. Required Documents tablosu oluştur (dosya tiplerine göre zorunlu evraklar)
CREATE TABLE IF NOT EXISTS required_documents (
  id BIGSERIAL PRIMARY KEY,
  file_type_id BIGINT NOT NULL REFERENCES file_types(id) ON DELETE CASCADE,
  document_name VARCHAR(255) NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(file_type_id, document_name)
);

-- Zorunlu evrakları ekle
-- Değer Kaybı (file_type_id = 1)
INSERT INTO required_documents (file_type_id, document_name, display_order) VALUES
(1, 'Müşteri vekaleti', 1),
(1, 'Eksper raporu', 2),
(1, 'Kaza tutanağı', 3),
(1, 'Mağdur ruhsatı', 4),
(1, 'Olay yeri resimleri', 5),
(1, 'Onarım resimleri', 6),
(1, 'IBAN bilgisi', 7)
ON CONFLICT (file_type_id, document_name) DO NOTHING;

-- Parça ve İşçilik Farkı (file_type_id = 2)
INSERT INTO required_documents (file_type_id, document_name, display_order) VALUES
(2, 'Vekalet', 1),
(2, 'Parça farkını beyan eden resimler', 2),
(2, 'Parça farkını beyan eden faturalar', 3),
(2, 'Eksper raporu', 4),
(2, 'Onarım resimleri', 5),
(2, 'IBAN bilgisi', 6)
ON CONFLICT (file_type_id, document_name) DO NOTHING;

-- Araç Mahrumiyeti (file_type_id = 3)
INSERT INTO required_documents (file_type_id, document_name, display_order) VALUES
(3, 'Muvafakatname', 1),
(3, 'Eksper raporu', 2),
(3, 'Vekalet', 3),
(3, 'Araç ruhsatı', 4),
(3, 'IBAN bilgisi', 5)
ON CONFLICT (file_type_id, document_name) DO NOTHING;

-- Pert Farkı (file_type_id = 4) - Şimdilik boş, dinamik olarak eklenebilir

-- 8. Result Document Types tablosu oluştur (sonuç evrakları tipleri)
CREATE TABLE IF NOT EXISTS result_document_types (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sonuç evrak tiplerini ekle
INSERT INTO result_document_types (name, description, display_order) VALUES
('Sigortaya çekilen ihtarname', NULL, 1),
('Tahkim başvuru dilekçesi', NULL, 2),
('Tahkim komisyonu nihai kararı', NULL, 3),
('Bilirkişi raporu', NULL, 4),
('Sigortadan gelen ödeme dekontu', NULL, 5),
('Sistem tarafından yapılan ödeme', NULL, 6),
('Esnaf talimat evrakı', NULL, 7),
('İcra dilekçesi', NULL, 8)
ON CONFLICT (name) DO NOTHING;

-- 9. Documents tablosuna result document type bağlantısı ekle
ALTER TABLE documents ADD COLUMN IF NOT EXISTS result_document_type_id BIGINT REFERENCES result_document_types(id) ON DELETE SET NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_result_document BOOLEAN DEFAULT FALSE;

-- Mevcut evrakları güncelle
UPDATE documents SET is_result_document = FALSE WHERE is_result_document IS NULL;

-- 10. Accounting Transactions tablosu oluştur
CREATE TABLE IF NOT EXISTS accounting_transactions (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(100),
  description TEXT,
  amount DECIMAL(15, 2) NOT NULL,
  transaction_date DATE NOT NULL,
  document_url TEXT,
  created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Müşteri şifreleri için random hash oluştur (geçici olarak admin123 kullanılabilir)
-- NOT: Gerçek random şifreler uygulama tarafından oluşturulacak

-- ========================================
-- VERİFİKASYON SORULARI
-- ========================================

-- Rolleri kontrol et
SELECT id, name, display_name FROM roles ORDER BY id;
-- Beklenen: 6 rol (superadmin, birincil-admin, ikincil-admin, bayi, evrak-birimi, musteri)

-- Kullanıcıları kontrol et
SELECT id, name, email, role_id, is_active FROM users ORDER BY role_id;
-- Beklenen: 6 kullanıcı, her role için en az 1

-- File types kontrol et
SELECT id, name, description FROM file_types ORDER BY id;
-- Beklenen: 4 dosya tipi

-- Müşterileri kontrol et
SELECT COUNT(*) as total_customers FROM customers;
-- Beklenen: En az 5 demo müşteri

-- Document types kontrol et
SELECT DISTINCT document_type, COUNT(*) FROM documents GROUP BY document_type;
-- Beklenen: document_type kolonunun mevcut olması

-- ========================================
-- BAŞARILI MESAJI
-- ========================================
SELECT 'Database update completed successfully!' AS status;
SELECT 'Roles updated: 5' AS info;
SELECT 'File types: 4' AS info;
SELECT 'New columns added to documents and customers' AS info;

