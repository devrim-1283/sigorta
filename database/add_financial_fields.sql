-- Add financial fields to customers table
-- This migration adds sigortadan_yatan_tutar and musteri_hakedisi fields

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS sigortadan_yatan_tutar DECIMAL(12, 2) NULL,
ADD COLUMN IF NOT EXISTS musteri_hakedisi DECIMAL(12, 2) NULL;

-- Add comments for documentation
COMMENT ON COLUMN customers.sigortadan_yatan_tutar IS 'Sigortadan yatan toplam tutar';
COMMENT ON COLUMN customers.musteri_hakedisi IS 'Müşteriye yatan tutar (sigortadan yatan tutarın %80''i)';

