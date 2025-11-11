-- ========================================
-- Customer Table Reset Script
-- Müşteri tablosunu temizler ve yeniden oluşturur
-- ========================================

-- 1. İlişkili tabloları önce temizle (foreign key constraints)
DELETE FROM notes WHERE customer_id IS NOT NULL;
DELETE FROM payments WHERE customer_id IS NOT NULL;
DELETE FROM documents WHERE customer_id IS NOT NULL;
DELETE FROM customers;

-- 2. Sequences'i sıfırla
ALTER SEQUENCE customers_id_seq RESTART WITH 1;
ALTER SEQUENCE documents_id_seq RESTART WITH 1;
ALTER SEQUENCE payments_id_seq RESTART WITH 1;
ALTER SEQUENCE notes_id_seq RESTART WITH 1;

-- 3. Customers tablosunu yeniden oluştur (DROP ve CREATE)
DROP TABLE IF EXISTS customers CASCADE;

CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  ad_soyad VARCHAR(255) NOT NULL,
  tc_no VARCHAR(11) NOT NULL UNIQUE,
  telefon VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  plaka VARCHAR(20) NOT NULL,
  hasar_tarihi DATE NOT NULL,
  başvuru_durumu VARCHAR(100) DEFAULT 'İnceleniyor',
  evrak_durumu VARCHAR(50) DEFAULT 'Eksik',
  dosya_kilitli BOOLEAN DEFAULT FALSE,
  dosya_kapatma_nedeni TEXT,
  dosya_kapatma_tarihi TIMESTAMP,
  file_type_id BIGINT REFERENCES file_types(id) ON DELETE SET NULL,
  dealer_id BIGINT REFERENCES dealers(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. İndeksler ekle
CREATE INDEX idx_customers_tc_no ON customers(tc_no);
CREATE INDEX idx_customers_plaka ON customers(plaka);
CREATE INDEX idx_customers_dealer ON customers(dealer_id);
CREATE INDEX idx_customers_file_type ON customers(file_type_id);
CREATE INDEX idx_customers_status ON customers(başvuru_durumu);

-- 5. Documents tablosunu yeniden oluştur
DROP TABLE IF EXISTS documents CASCADE;

CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tip VARCHAR(255) NOT NULL,
  dosya_adı VARCHAR(500) NOT NULL,
  dosya_yolu TEXT NOT NULL,
  dosya_boyutu BIGINT,
  mime_type VARCHAR(100),
  durum VARCHAR(50) DEFAULT 'Beklemede',
  red_nedeni TEXT,
  document_type VARCHAR(100) DEFAULT 'Standart Evrak',
  is_result_document BOOLEAN DEFAULT FALSE,
  result_document_type_id BIGINT REFERENCES result_document_types(id) ON DELETE SET NULL,
  uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_customer ON documents(customer_id);
CREATE INDEX idx_documents_type ON documents(tip);
CREATE INDEX idx_documents_status ON documents(durum);

-- 6. Payments tablosunu yeniden oluştur
DROP TABLE IF EXISTS payments CASCADE;

CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tutar DECIMAL(15, 2) NOT NULL,
  tarih DATE NOT NULL,
  açıklama TEXT,
  durum VARCHAR(50) DEFAULT 'Bekliyor',
  ödeme_yöntemi VARCHAR(100),
  referans_no VARCHAR(255),
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_date ON payments(tarih);
CREATE INDEX idx_payments_status ON payments(durum);

-- 7. Notes tablosunu yeniden oluştur
DROP TABLE IF EXISTS notes CASCADE;

CREATE TABLE notes (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_customer ON notes(customer_id);
CREATE INDEX idx_notes_created_by ON notes(created_by);

-- 8. Test için bir müşteri ekle
INSERT INTO customers (
  ad_soyad,
  tc_no,
  telefon,
  email,
  plaka,
  hasar_tarihi,
  başvuru_durumu,
  evrak_durumu,
  dosya_kilitli,
  file_type_id,
  dealer_id
) VALUES (
  'Test Müşteri',
  '12345678900',
  '+90 532 123 4567',
  'test@test.com',
  '34 TEST 123',
  '2024-01-15',
  'İnceleniyor',
  'Eksik',
  FALSE,
  1,
  NULL
);

-- ========================================
-- VERİFİKASYON
-- ========================================

-- Tabloları kontrol et
SELECT 'Customers table created successfully' AS status;
SELECT COUNT(*) as customer_count FROM customers;

-- Sequence'leri kontrol et
SELECT currval('customers_id_seq') as customer_seq;

-- Constraint'leri kontrol et
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('customers', 'documents', 'payments', 'notes')
ORDER BY tc.table_name, tc.constraint_type;

-- Default değerleri kontrol et
SELECT 
  column_name,
  column_default,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'customers'
  AND column_name IN ('created_at', 'updated_at')
ORDER BY column_name;

SELECT '✅ Reset completed! You can now create customers.' AS message;

