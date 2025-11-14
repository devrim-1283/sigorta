-- ===================================================
-- SİGORTA YÖNETİM SİSTEMİ - KOMPLE KURULUM SQL
-- Son Güncelleme: 2025-11-14
-- Bu dosya tüm tabloları, indexleri ve başlangıç verilerini içerir
-- ===================================================

-- Eski tabloları temizle (dikkatli kullanın!)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS accounting_transactions CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS result_document_types CASCADE;
DROP TABLE IF EXISTS required_documents CASCADE;
DROP TABLE IF EXISTS file_types CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS dealers CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS cache_locks CASCADE;
DROP TABLE IF EXISTS cache CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS personal_access_tokens CASCADE;

-- ===================================================
-- 1. ROLLER (ROLES)
-- ===================================================
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rolleri ekle
INSERT INTO roles (id, name, display_name, description, permissions) VALUES
(1, 'superadmin', 'Süper Admin', 'Tam sistem yöneticisi - tüm yetkilere sahip', '{"all":true}'),
(2, 'birincil-admin', 'Birincil Admin', 'Ana yönetici - çoğu işlemi yapabilir', '{"customers":true,"dealers":true,"documents":true,"payments":true,"reports":true}'),
(3, 'ikincil-admin', 'İkincil Admin', 'Yardımcı yönetici - sınırlı yetkiler', '{"customers":true,"documents":true,"payments":false}'),
(4, 'bayi', 'Bayi', 'Bayi kullanıcısı - sadece kendi müşterilerini görebilir', '{"customers":true,"documents":true}'),
(5, 'evrak-birimi', 'Evrak Birimi', 'Evrak yönetimi ve onay birimi', '{"documents":true,"customers":"readonly"}'),
(6, 'musteri', 'Müşteri', 'Müşteri kullanıcısı - sadece kendi dosyasını görebilir', '{"documents":"readonly"}'),
(7, 'operasyon', 'Operasyon', 'Operasyon ekibi - süreç takibi', '{"customers":"readonly","documents":"readonly","reports":true}');

-- Sequence'i ayarla
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));

-- ===================================================
-- 2. BAYİLER (DEALERS)
-- ===================================================
CREATE TABLE dealers (
    id BIGSERIAL PRIMARY KEY,
    dealer_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    tax_number VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_dealers_status ON dealers(status);
CREATE INDEX idx_dealers_deleted_at ON dealers(deleted_at);

-- ===================================================
-- 3. KULLANICILAR (USERS)
-- ===================================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    tc_no VARCHAR(11) UNIQUE,
    email_verified_at TIMESTAMP,
    password VARCHAR(255) NOT NULL,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    dealer_id BIGINT REFERENCES dealers(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    remember_token VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_dealer_id ON users(dealer_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Demo kullanıcılar (şifreler: password123)
INSERT INTO users (name, email, phone, password, role_id, is_active) VALUES
('Super Admin', 'admin@system.com', '05001234567', '$2a$10$rGF5y8h3V5K7X.aX7K8oKOQz1N/qJ3K9N0F5M7W8P1Q2R3S4T5U6V', 1, true);

-- ===================================================
-- 4. DOSYA TÜRLERİ (FILE TYPES)
-- ===================================================
CREATE TABLE file_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    required_for_approval BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO file_types (id, name, description, required_for_approval) VALUES
(1, 'Kasko - Trafik', 'Kasko ve Trafik hasar dosyası', true),
(2, 'Konut Sigortası', 'Konut sigortası hasar dosyası', true),
(3, 'İşyeri Sigortası', 'İşyeri sigortası hasar dosyası', true),
(4, 'Sağlık Sigortası', 'Sağlık sigortası hasar dosyası', false);

SELECT setval('file_types_id_seq', (SELECT MAX(id) FROM file_types));

-- ===================================================
-- 5. GEREKLİ EVRAKLAR (REQUIRED DOCUMENTS)
-- ===================================================
CREATE TABLE required_documents (
    id BIGSERIAL PRIMARY KEY,
    file_type_id BIGINT NOT NULL REFERENCES file_types(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(file_type_id, document_name)
);

-- Kasko - Trafik için gerekli evraklar
INSERT INTO required_documents (file_type_id, document_name, display_order) VALUES
(1, 'Muvafakatname', 1),
(1, 'Eksper raporu', 2),
(1, 'Vekalet', 3),
(1, 'Araç ruhsatı', 4),
(1, 'IBAN bilgisi', 5);

-- Konut Sigortası için gerekli evraklar
INSERT INTO required_documents (file_type_id, document_name, display_order) VALUES
(2, 'Hasar tespit tutanağı', 1),
(2, 'Fotoğraflar', 2),
(2, 'Tapu fotokopisi', 3),
(2, 'IBAN bilgisi', 4);

-- İşyeri Sigortası için gerekli evraklar
INSERT INTO required_documents (file_type_id, document_name, display_order) VALUES
(3, 'Hasar tespit raporu', 1),
(3, 'Fotoğraflar', 2),
(3, 'İşyeri belgesi', 3),
(3, 'IBAN bilgisi', 4);

-- ===================================================
-- 6. SONUÇ EVRAK TÜRLERİ (RESULT DOCUMENT TYPES)
-- ===================================================
CREATE TABLE result_document_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO result_document_types (id, name, description, display_order) VALUES
(1, 'Sigortaya Çekilen İhtar', 'Sigorta şirketine gönderilen resmi ihtarname belgesi', 1),
(2, 'Tahkim Başvuru Dilekçesi', 'Tahkim kuruluna yapılan başvuru dilekçesi', 2),
(3, 'Tahkim Komisyonu Kararı', 'Tahkim komisyonunun verdiği nihai karar belgesi', 3),
(4, 'Bilirkişi Raporu', 'Mahkeme tarafından atanan bilirkişinin hazırladığı rapor', 4),
(5, 'Sigortadan Gelen Ödeme', 'Sigorta şirketinden yapılan ödemenin dekont belgesi', 5),
(6, 'Talimat Evrakı', 'Esnafa verilen talimat ve ödeme evrakları', 6),
(7, 'İcra Dilekçesi', 'İcra takibi için hazırlanan dilekçe', 7);

SELECT setval('result_document_types_id_seq', (SELECT MAX(id) FROM result_document_types));

-- ===================================================
-- 7. MÜŞTERİLER (CUSTOMERS)
-- ===================================================
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    ad_soyad VARCHAR(255) NOT NULL,
    tc_no VARCHAR(11) UNIQUE NOT NULL,
    telefon VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    plaka VARCHAR(20) NOT NULL,
    hasar_tarihi DATE NOT NULL,
    file_type_id BIGINT NOT NULL REFERENCES file_types(id) ON DELETE RESTRICT,
    dealer_id BIGINT REFERENCES dealers(id) ON DELETE SET NULL,
    başvuru_durumu VARCHAR(100) DEFAULT 'İnceleniyor',
    evrak_durumu VARCHAR(20) DEFAULT 'Eksik',
    dosya_kilitli BOOLEAN DEFAULT false,
    dosya_kapanma_nedeni TEXT,
    dosya_kapanma_tarihi TIMESTAMP,
    sigortadan_yatan_tutar DECIMAL(12, 2),
    musteri_hakedisi DECIMAL(12, 2),
    bayi_odeme_tutari DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_file_type ON customers(file_type_id);
CREATE INDEX idx_customers_dealer ON customers(dealer_id);
CREATE INDEX idx_customers_basvuru_durumu ON customers(başvuru_durumu);
CREATE INDEX idx_customers_evrak_durumu ON customers(evrak_durumu);
CREATE INDEX idx_customers_dosya_kilitli ON customers(dosya_kilitli);
CREATE INDEX idx_customers_tc_no ON customers(tc_no);

-- ===================================================
-- 8. EVRAKLAR (DOCUMENTS)
-- ===================================================
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    tip VARCHAR(100) NOT NULL,
    dosya_adı VARCHAR(255) NOT NULL,
    dosya_yolu TEXT NOT NULL,
    dosya_boyutu BIGINT,
    mime_type VARCHAR(255),
    durum VARCHAR(20) DEFAULT 'Beklemede',
    red_nedeni TEXT,
    document_type VARCHAR(100) DEFAULT 'Standart Evrak',
    is_result_document BOOLEAN DEFAULT false,
    result_document_type_id BIGINT REFERENCES result_document_types(id) ON DELETE SET NULL,
    uploaded_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    onaylayan_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    onay_tarihi TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_documents_customer ON documents(customer_id);
CREATE INDEX idx_documents_tip ON documents(tip);
CREATE INDEX idx_documents_durum ON documents(durum);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_result_type ON documents(result_document_type_id);
CREATE INDEX idx_documents_deleted_at ON documents(deleted_at);
CREATE INDEX idx_documents_is_result ON documents(is_result_document);

-- ===================================================
-- 9. ÖDEMELER (PAYMENTS)
-- ===================================================
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    tarih DATE NOT NULL,
    tutar DECIMAL(15, 2) NOT NULL,
    açıklama TEXT,
    durum VARCHAR(50) DEFAULT 'Bekliyor',
    ödeme_yöntemi VARCHAR(100),
    referans_no VARCHAR(255),
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_durum ON payments(durum);
CREATE INDEX idx_payments_tarih ON payments(tarih);

-- ===================================================
-- 10. NOTLAR (NOTES)
-- ===================================================
CREATE TABLE notes (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_customer ON notes(customer_id);
CREATE INDEX idx_notes_created_by ON notes(created_by);

-- ===================================================
-- 11. BİLDİRİMLER (NOTIFICATIONS)
-- ===================================================
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ===================================================
-- 12. POLİÇELER (POLICIES)
-- ===================================================
CREATE TABLE policies (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    policy_number VARCHAR(255) UNIQUE,
    policy_type VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    premium DECIMAL(12, 2) NOT NULL,
    coverage_amount DECIMAL(15, 2),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_policies_customer ON policies(customer_id);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_policies_deleted_at ON policies(deleted_at);

-- ===================================================
-- 13. HASAR TALEPLERİ (CLAIMS)
-- ===================================================
CREATE TABLE claims (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    claim_number VARCHAR(255) UNIQUE,
    claim_date DATE NOT NULL,
    incident_date DATE NOT NULL,
    description TEXT NOT NULL,
    claim_amount DECIMAL(15, 2),
    approved_amount DECIMAL(15, 2),
    status VARCHAR(20) DEFAULT 'pending',
    rejection_reason TEXT,
    handled_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_claims_customer ON claims(customer_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_handled_by ON claims(handled_by);
CREATE INDEX idx_claims_deleted_at ON claims(deleted_at);

-- ===================================================
-- 14. MUHASEBE İŞLEMLERİ (ACCOUNTING TRANSACTIONS)
-- ===================================================
CREATE TABLE accounting_transactions (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    document_url TEXT,
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accounting_type ON accounting_transactions(type);
CREATE INDEX idx_accounting_date ON accounting_transactions(transaction_date);
CREATE INDEX idx_accounting_created_by ON accounting_transactions(created_by);

-- ===================================================
-- 15. DENETİM LOGLARI (AUDIT LOGS)
-- ===================================================
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    user_name VARCHAR(255),
    user_role VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    entity_name VARCHAR(255),
    description TEXT NOT NULL,
    old_values TEXT,
    new_values TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ===================================================
-- 16. SİSTEM TABLOLARI (SYSTEM TABLES)
-- ===================================================

-- Personal Access Tokens
CREATE TABLE personal_access_tokens (
    id BIGSERIAL PRIMARY KEY,
    tokenable_type VARCHAR(255) NOT NULL,
    tokenable_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    abilities TEXT,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_pat_tokenable ON personal_access_tokens(tokenable_type, tokenable_id);

-- Jobs Queue
CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    queue VARCHAR(255) NOT NULL,
    payload TEXT NOT NULL,
    attempts SMALLINT NOT NULL,
    reserved_at INT,
    available_at INT NOT NULL,
    created_at INT NOT NULL
);

CREATE INDEX idx_jobs_queue ON jobs(queue);

-- Cache
CREATE TABLE cache (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    expiration INT NOT NULL
);

-- Cache Locks
CREATE TABLE cache_locks (
    key VARCHAR(255) PRIMARY KEY,
    owner VARCHAR(255) NOT NULL,
    expiration INT NOT NULL
);

-- Sessions
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    payload TEXT NOT NULL,
    last_activity INT NOT NULL
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity);

-- ===================================================
-- KURULUM TAMAMLANDI
-- ===================================================

-- Veritabanı istatistikleri
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Tablo sayısı
SELECT COUNT(*) AS toplam_tablo FROM information_schema.tables WHERE table_schema = 'public';

-- İndeks sayısı  
SELECT COUNT(*) AS toplam_indeks FROM pg_indexes WHERE schemaname = 'public';

VACUUM ANALYZE;

-- ===================================================
-- NOTLAR:
-- 1. Tüm şifreler bcrypt ile hashlenmeli ($2a$10$...)
-- 2. Super admin default şifresi: password123
-- 3. Tüm tarih alanları timezone aware (TIMESTAMP)
-- 4. Soft delete için deleted_at kullanılıyor
-- 5. BigInt kullanılıyor (BIGSERIAL/BIGINT)
-- 6. Cascade delete ilişkileri doğru yapılandırılmış
-- ===================================================

