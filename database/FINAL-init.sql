-- ============================================================================
-- PostgreSQL Database Schema for Sigorta Yönetim Sistemi
-- Database: PostgreSQL 14+
-- Encoding: UTF8
-- Last Updated: 2024-11-14
-- ============================================================================
-- USAGE:
-- 1. Copy this entire file
-- 2. Open Coolify PostgreSQL Query Editor
-- 3. Paste and run
-- ============================================================================

-- Drop tables if exist (in correct order - child tables first)
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
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS dealers CASCADE;
DROP TABLE IF EXISTS file_types CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS personal_access_tokens CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS cache CASCADE;
DROP TABLE IF EXISTS cache_locks CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- ============================================================================
-- 1. Roles Table
-- ============================================================================
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. Dealers Table
-- ============================================================================
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
    deleted_at TIMESTAMP NULL
);

-- ============================================================================
-- 3. Users Table
-- ============================================================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    tc_no VARCHAR(11) UNIQUE,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    dealer_id BIGINT NULL REFERENCES dealers(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    remember_token VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. File Types Table
-- ============================================================================
CREATE TABLE file_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    required_for_approval BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. Required Documents Table
-- ============================================================================
CREATE TABLE required_documents (
    id BIGSERIAL PRIMARY KEY,
    file_type_id BIGINT NOT NULL REFERENCES file_types(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(file_type_id, document_name)
);

-- ============================================================================
-- 6. Result Document Types Table
-- ============================================================================
CREATE TABLE result_document_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. Customers Table
-- ============================================================================
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    ad_soyad VARCHAR(255) NOT NULL,
    tc_no VARCHAR(11) NOT NULL UNIQUE,
    telefon VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    plaka VARCHAR(20) NOT NULL,
    hasar_tarihi DATE NOT NULL,
    file_type_id BIGINT NOT NULL REFERENCES file_types(id) ON DELETE RESTRICT,
    dealer_id BIGINT NULL REFERENCES dealers(id) ON DELETE SET NULL,
    başvuru_durumu VARCHAR(100) DEFAULT 'İnceleniyor',
    evrak_durumu VARCHAR(20) DEFAULT 'Eksik',
    dosya_kilitli BOOLEAN DEFAULT FALSE,
    dosya_kapanma_nedeni TEXT,
    dosya_kapanma_tarihi TIMESTAMP NULL,
    sigortadan_yatan_tutar DECIMAL(12, 2),
    musteri_hakedisi DECIMAL(12, 2),
    bayi_odeme_tutari DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. Documents Table
-- ============================================================================
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
    is_result_document BOOLEAN DEFAULT FALSE,
    result_document_type_id BIGINT NULL REFERENCES result_document_types(id) ON DELETE SET NULL,
    uploaded_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    onaylayan_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
    onay_tarihi TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- ============================================================================
-- 9. Payments Table
-- ============================================================================
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    tarih DATE NOT NULL,
    tutar DECIMAL(15, 2) NOT NULL,
    açıklama TEXT,
    durum VARCHAR(50) DEFAULT 'Bekliyor',
    ödeme_yöntemi VARCHAR(100),
    referans_no VARCHAR(255),
    created_by BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 10. Notes Table
-- ============================================================================
CREATE TABLE notes (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 11. Notifications Table
-- ============================================================================
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 12. Policies Table
-- ============================================================================
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
    deleted_at TIMESTAMP NULL
);

-- ============================================================================
-- 13. Claims Table
-- ============================================================================
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
    handled_by BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP NULL,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- ============================================================================
-- 14. Accounting Transactions Table
-- ============================================================================
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

-- ============================================================================
-- 15. Audit Logs Table (NEW)
-- ============================================================================
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
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 16. System Tables (Laravel/NextAuth)
-- ============================================================================

-- Personal Access Tokens
CREATE TABLE personal_access_tokens (
    id BIGSERIAL PRIMARY KEY,
    tokenable_type VARCHAR(255) NOT NULL,
    tokenable_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    abilities TEXT,
    last_used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jobs Queue
CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    queue VARCHAR(255) NOT NULL,
    payload TEXT NOT NULL,
    attempts SMALLINT NOT NULL,
    reserved_at INTEGER,
    available_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

-- Cache
CREATE TABLE cache (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    expiration INTEGER NOT NULL
);

CREATE TABLE cache_locks (
    key VARCHAR(255) PRIMARY KEY,
    owner VARCHAR(255) NOT NULL,
    expiration INTEGER NOT NULL
);

-- Sessions
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    payload TEXT NOT NULL,
    last_activity INTEGER NOT NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_tc_no ON users(tc_no);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_dealer_id ON users(dealer_id);

-- Customer indexes
CREATE INDEX idx_customers_tc_no ON customers(tc_no);
CREATE INDEX idx_customers_telefon ON customers(telefon);
CREATE INDEX idx_customers_başvuru_durumu ON customers(başvuru_durumu);
CREATE INDEX idx_customers_dealer_id ON customers(dealer_id);
CREATE INDEX idx_customers_file_type_id ON customers(file_type_id);

-- Document indexes
CREATE INDEX idx_documents_customer_id ON documents(customer_id);
CREATE INDEX idx_documents_durum ON documents(durum);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_deleted_at ON documents(deleted_at);

-- Payment indexes
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_durum ON payments(durum);
CREATE INDEX idx_payments_created_by ON payments(created_by);

-- Note indexes
CREATE INDEX idx_notes_customer_id ON notes(customer_id);
CREATE INDEX idx_notes_created_by ON notes(created_by);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Policy indexes
CREATE INDEX idx_policies_customer_id ON policies(customer_id);
CREATE INDEX idx_policies_status ON policies(status);

-- Claim indexes
CREATE INDEX idx_claims_customer_id ON claims(customer_id);
CREATE INDEX idx_claims_status ON claims(status);

-- Audit log indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- System table indexes
CREATE INDEX idx_personal_access_tokens_tokenable ON personal_access_tokens(tokenable_type, tokenable_id);
CREATE INDEX idx_jobs_queue ON jobs(queue);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity);

-- ============================================================================
-- DEFAULT DATA - ROLES
-- ============================================================================
INSERT INTO roles (name, display_name, description) VALUES
('superadmin', 'Süper Admin', 'Tam sistem erişimi ve yönetim yetkisi'),
('birincil-admin', 'Birincil Admin', 'Genel yönetim yetkisi - dosya kapatabilir'),
('ikincil-admin', 'İkincil Admin', 'Şube/Bölge yönetimi - süreç evrakı yükleyebilir'),
('bayi', 'Bayi', 'Bayi işlemleri - müşteri ekleyebilir'),
('evrak-birimi', 'Evrak Birimi', 'Evrak yönetimi - süreç evrakı yükleyebilir'),
('musteri', 'Müşteri', 'Sadece okuma yetkisi'),
('operasyon', 'Operasyon', 'Operasyon yönetimi');

-- ============================================================================
-- DEFAULT DATA - FILE TYPES
-- ============================================================================
INSERT INTO file_types (name, description, required_for_approval) VALUES
('Trafik Kazası', 'Trafik kazası hasar dosyaları', true),
('Kasko', 'Kasko hasar dosyaları', true),
('Sağlık', 'Sağlık sigortası dosyaları', false),
('Diğer', 'Diğer dosya tipleri', false);

-- ============================================================================
-- DEFAULT DATA - RESULT DOCUMENT TYPES
-- ============================================================================
INSERT INTO result_document_types (name, description, display_order) VALUES
('Ekspertiz Raporu', 'Hasar ekspertiz raporu', 1),
('Ödeme Belgesi', 'Sigorta şirketi ödeme belgesi', 2),
('IBAN Bilgisi', 'Müşteri IBAN bilgi belgesi', 3),
('Fatura', 'İlgili fatura belgesi', 4),
('Diğer', 'Diğer sonuç evrakları', 5);

-- ============================================================================
-- DEMO DATA - DEALERS (Optional - Remove in production)
-- ============================================================================
INSERT INTO dealers (dealer_name, contact_person, phone, email, address, city, tax_number, status) VALUES
('Oksijen Sigorta İstanbul', 'Mehmet Yılmaz', '0212 555 0001', 'istanbul@oksijen.com', 'Levent Mahallesi, İş Kuleleri, No:15 Kat:8', 'İstanbul', '1234567890', 'active'),
('Oksijen Sigorta Ankara', 'Ayşe Demir', '0312 555 0002', 'ankara@oksijen.com', 'Çankaya, Atatürk Bulvarı, No:123', 'Ankara', '1234567891', 'active'),
('Oksijen Sigorta İzmir', 'Can Öztürk', '0232 555 0003', 'izmir@oksijen.com', 'Alsancak, Kıbrıs Şehitleri Caddesi, No:45', 'İzmir', '1234567892', 'active');

-- ============================================================================
-- DEMO DATA - USERS (Password: "admin123" for all)
-- ============================================================================
-- Bcrypt hash: $2a$12$W2g2cFHCZdkrfoVxMdlVruNb/1kxhDKFmO1TA3x5il.JkSHc9/7u2
INSERT INTO users (name, email, phone, tc_no, password, role_id, dealer_id, is_active) VALUES
('Super Admin', 'admin@sigorta.com', '0555 000 0001', '12345678901', '$2a$12$W2g2cFHCZdkrfoVxMdlVruNb/1kxhDKFmO1TA3x5il.JkSHc9/7u2', 1, NULL, true),
('İstanbul Yöneticisi', 'istanbul@sigorta.com', '0555 000 0002', '12345678902', '$2a$12$W2g2cFHCZdkrfoVxMdlVruNb/1kxhDKFmO1TA3x5il.JkSHc9/7u2', 2, 1, true),
('Ankara Acente', 'ankara@sigorta.com', '0555 000 0003', '12345678903', '$2a$12$W2g2cFHCZdkrfoVxMdlVruNb/1kxhDKFmO1TA3x5il.JkSHc9/7u2', 4, 2, true),
('Evrak Personel', 'evrak@sigorta.com', '0555 000 0004', '12345678904', '$2a$12$W2g2cFHCZdkrfoVxMdlVruNb/1kxhDKFmO1TA3x5il.JkSHc9/7u2', 5, NULL, true);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '✅ Database schema created successfully!' AS status;
SELECT '📊 Total tables: 19' AS info;
SELECT '👤 Demo users: 4 (password: admin123)' AS credentials;
SELECT '🔑 Login: admin@sigorta.com / admin123' AS login_info;
SELECT '🎯 Features: Audit Logs, Notifications, Document Management' AS features;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================

