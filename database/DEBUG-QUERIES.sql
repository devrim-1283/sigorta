-- ========================================
-- Debug Queries - Veritabanı Kontrolü
-- ========================================

-- 1. Customers tablosunu kontrol et
SELECT 
  id, 
  ad_soyad, 
  tc_no, 
  created_at, 
  updated_at,
  file_type_id,
  dealer_id
FROM customers 
LIMIT 5;

-- 2. File types kontrolü
SELECT id, name FROM file_types;

-- 3. Dealers kontrolü
SELECT id, dealer_name FROM dealers;

-- 4. Documents kontrolü (customer ile birlikte)
SELECT 
  d.id,
  d.customer_id,
  d.tip,
  d.dosya_adi_orijinal,
  d.created_at,
  c.ad_soyad as customer_name
FROM documents d
LEFT JOIN customers c ON d.customer_id = c.id
LIMIT 5;

-- 5. Payments kontrolü
SELECT 
  p.id,
  p.customer_id,
  p.tutar,
  p.tarih,
  p.created_at,
  c.ad_soyad as customer_name
FROM payments p
LEFT JOIN customers c ON p.customer_id = c.id
LIMIT 5;

-- 6. Notes kontrolü
SELECT 
  n.id,
  n.customer_id,
  n.note,
  n.created_at,
  n.created_by
FROM notes n
LIMIT 5;

-- 7. Users tablosu kontrolü (uploader için)
SELECT id, name, email FROM users LIMIT 5;

-- 8. Tam bir customer ile tüm ilişkili veriler
SELECT 
  'Customer' as type,
  c.id,
  c.ad_soyad,
  c.created_at,
  c.updated_at
FROM customers c
WHERE c.id = 1
UNION ALL
SELECT 
  'Document' as type,
  d.id,
  d.tip,
  d.created_at,
  d.updated_at
FROM documents d
WHERE d.customer_id = 1
UNION ALL
SELECT 
  'Payment' as type,
  p.id,
  p.tutar::text,
  p.created_at,
  p.created_at as updated_at
FROM payments p
WHERE p.customer_id = 1
UNION ALL
SELECT 
  'Note' as type,
  n.id,
  n.note,
  n.created_at,
  n.created_at as updated_at
FROM notes n
WHERE n.customer_id = 1;

-- 9. Data type kontrolü
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('customers', 'documents', 'payments', 'notes')
  AND column_name IN ('created_at', 'updated_at', 'tarih', 'hasar_tarihi')
ORDER BY table_name, column_name;

