-- ========================================
-- Documents Tablosu Kolon Kontrolü
-- ========================================

-- Gerçek kolonları görelim
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;

-- Eğer dosya_adi_orijinal yoksa, doğru kolon adını bulalım
-- Muhtemelen: dosya_adı veya belge_adi veya file_name

