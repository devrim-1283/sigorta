-- PostgreSQL Database Schema for Sigorta Yönetim Sistemi
-- Database: PostgreSQL 14+
-- Encoding: UTF8
-- COPY THIS FILE AND RUN IN COOLIFY POSTGRESQL QUERY EDITOR

-- Drop tables if exist (in correct order - child tables first)
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS dealers CASCADE;
DROP TABLE IF EXISTS file_types CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS personal_access_tokens CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS cache CASCADE;
DROP TABLE IF EXISTS cache_locks CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- 1. Roles Table
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Dealers Table
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

-- 3. Users Table
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

-- 4. File Types Table
CREATE TABLE file_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    required_for_approval BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Customers Table
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
    başvuru_durumu VARCHAR(50) DEFAULT 'Evrak Aşamasında',
    evrak_durumu VARCHAR(20) DEFAULT 'Eksik',
    dosya_kilitli BOOLEAN DEFAULT FALSE,
    dosya_kapanma_nedeni TEXT,
    dosya_kapanma_tarihi TIMESTAMP NULL,
    notlar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Documents Table
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    belge_adi VARCHAR(255) NOT NULL,
    dosya_yolu VARCHAR(255) NOT NULL,
    dosya_adi_orijinal VARCHAR(255) NOT NULL,
    mime_type VARCHAR(255),
    dosya_boyutu BIGINT,
    tip VARCHAR(100) NOT NULL,
    durum VARCHAR(20) DEFAULT 'Beklemede',
    red_nedeni TEXT,
    uploaded_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    onay_tarihi TIMESTAMP NULL,
    onaylayan_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- 7. Payments Table
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    tarih DATE NOT NULL,
    tutar DECIMAL(12, 2) NOT NULL,
    açıklama TEXT,
    durum VARCHAR(20) DEFAULT 'Bekliyor',
    ödeme_yöntemi VARCHAR(255),
    referans_no VARCHAR(255),
    kaydeden_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- 8. Notes Table
CREATE TABLE notes (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    içerik TEXT NOT NULL,
    is_important BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Notifications Table
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

-- 10. Policies Table
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

-- 11. Claims Table
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

-- 12. Personal Access Tokens (NextAuth/Laravel Sanctum compatible)
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

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index 
    ON personal_access_tokens(tokenable_type, tokenable_id);

-- 13. Jobs Table (Queue)
CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    queue VARCHAR(255) NOT NULL,
    payload TEXT NOT NULL,
    attempts SMALLINT NOT NULL,
    reserved_at INTEGER,
    available_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX jobs_queue_index ON jobs(queue);

-- 14. Cache Table
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

-- 15. Sessions Table
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    payload TEXT NOT NULL,
    last_activity INTEGER NOT NULL
);

CREATE INDEX sessions_user_id_index ON sessions(user_id);
CREATE INDEX sessions_last_activity_index ON sessions(last_activity);

-- Create useful indexes for performance
CREATE INDEX customers_tc_no_index ON customers(tc_no);
CREATE INDEX customers_telefon_index ON customers(telefon);
CREATE INDEX customers_başvuru_durumu_index ON customers(başvuru_durumu);
CREATE INDEX customers_dealer_id_index ON customers(dealer_id);
CREATE INDEX documents_customer_id_index ON documents(customer_id);
CREATE INDEX documents_durum_index ON documents(durum);
CREATE INDEX payments_customer_id_index ON payments(customer_id);
CREATE INDEX payments_durum_index ON payments(durum);
CREATE INDEX notes_customer_id_index ON notes(customer_id);
CREATE INDEX notifications_user_id_index ON notifications(user_id);
CREATE INDEX notifications_is_read_index ON notifications(is_read);
CREATE INDEX policies_customer_id_index ON policies(customer_id);
CREATE INDEX policies_status_index ON policies(status);
CREATE INDEX claims_customer_id_index ON claims(customer_id);
CREATE INDEX claims_status_index ON claims(status);

-- Insert default roles
INSERT INTO roles (name, display_name, description) VALUES
('superadmin', 'Süper Admin', 'Tam sistem erişimi'),
('admin', 'Yönetici', 'Genel yönetim yetkisi'),
('manager', 'Müdür', 'Şube/Bölge yönetimi'),
('agent', 'Acente', 'Müşteri işlemleri'),
('accountant', 'Muhasebe', 'Mali işlemler'),
('viewer', 'Görüntüleyici', 'Sadece okuma yetkisi');

-- Insert default file types
INSERT INTO file_types (name, description, required_for_approval) VALUES
('Trafik Kazası', 'Trafik kazası dosyaları', true),
('Kasko', 'Kasko hasar dosyaları', true),
('Sağlık', 'Sağlık sigortası dosyaları', false),
('Diğer', 'Diğer dosya tipleri', false);

-- Insert demo dealers
INSERT INTO dealers (dealer_name, contact_person, phone, email, address, city, tax_number, status) VALUES
('Oksijen Sigorta İstanbul', 'Mehmet Yılmaz', '0212 555 0001', 'istanbul@oksijen.com', 'Levent Mahallesi, İş Kuleleri, No:15 Kat:8', 'İstanbul', '1234567890', 'active'),
('Oksijen Sigorta Ankara', 'Ayşe Demir', '0312 555 0002', 'ankara@oksijen.com', 'Çankaya, Atatürk Bulvarı, No:123', 'Ankara', '1234567891', 'active'),
('Oksijen Sigorta İzmir', 'Can Öztürk', '0232 555 0003', 'izmir@oksijen.com', 'Alsancak, Kıbrıs Şehitleri Caddesi, No:45', 'İzmir', '1234567892', 'active'),
('Oksijen Sigorta Bursa', 'Zeynep Kaya', '0224 555 0004', 'bursa@oksijen.com', 'Nilüfer, Atatürk Caddesi, No:78', 'Bursa', '1234567893', 'active'),
('Oksijen Sigorta Antalya', 'Ahmet Şahin', '0242 555 0005', 'antalya@oksijen.com', 'Muratpaşa, Lara Caddesi, No:234', 'Antalya', '1234567894', 'active');

-- Insert demo users (password: "admin123" for all users)
-- bcrypt hash of "admin123" with rounds=12: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lE3hY0XyZGHi
INSERT INTO users (name, email, phone, tc_no, password, role_id, dealer_id, is_active) VALUES
('Super Admin', 'admin@sigorta.com', '0555 000 0001', '12345678901', '$2a$12$W2g2cFHCZdkrfoVxMdlVruNb/1kxhDKFmO1TA3x5il.JkSHc9/7u2', 1, NULL, true),
('İstanbul Yöneticisi', 'istanbul@sigorta.com', '0555 000 0002', '12345678902', '$2a$12$W2g2cFHCZdkrfoVxMdlVruNb/1kxhDKFmO1TA3x5il.JkSHc9/7u2', 2, 1, true),
('Ankara Acente', 'ankara@sigorta.com', '0555 000 0003', '12345678903', '$2a$12$W2g2cFHCZdkrfoVxMdlVruNb/1kxhDKFmO1TA3x5il.JkSHc9/7u2', 4, 2, true),
('Muhasebe Personel', 'muhasebe@sigorta.com', '0555 000 0004', '12345678904', '$2a$12$W2g2cFHCZdkrfoVxMdlVruNb/1kxhDKFmO1TA3x5il.JkSHc9/7u2', 5, NULL, true),
('İzmir Görüntüleyici', 'izmir@sigorta.com', '0555 000 0005', '12345678905', '$2a$12$W2g2cFHCZdkrfoVxMdlVruNb/1kxhDKFmO1TA3x5il.JkSHc9/7u2', 6, 3, true),
('Bursa Müdür', 'bursa@sigorta.com', '0555 000 0006', '12345678906', '$2a$12$W2g2cFHCZdkrfoVxMdlVruNb/1kxhDKFmO1TA3x5il.JkSHc9/7u2', 3, 4, true);

-- Insert demo customers
INSERT INTO customers (ad_soyad, tc_no, telefon, email, plaka, hasar_tarihi, file_type_id, dealer_id, başvuru_durumu, evrak_durumu, dosya_kilitli) VALUES
('Ahmet Yılmaz', '11111111111', '0532 111 1111', 'ahmet@example.com', '34ABC123', '2024-01-15', 1, 1, 'İnceleniyor', 'Tamam', false),
('Mehmet Demir', '22222222222', '0533 222 2222', 'mehmet@example.com', '06XYZ456', '2024-02-10', 2, 2, 'Başvuru Aşamasında', 'Eksik', false),
('Ayşe Kaya', '33333333333', '0534 333 3333', 'ayse@example.com', '35DEF789', '2024-03-05', 1, 3, 'Onaylandı', 'Tamam', false),
('Fatma Şahin', '44444444444', '0535 444 4444', 'fatma@example.com', '16GHI012', '2024-01-20', 3, 1, 'Beklemede', 'Eksik', false),
('Ali Öztürk', '55555555555', '0536 555 5555', 'ali@example.com', '07JKL345', '2024-04-12', 1, 4, 'Tamamlandı', 'Tamam', true);

-- Success message
SELECT 'Database schema created successfully!' AS status;
SELECT 'Total tables: 15' AS info;
SELECT 'Demo users: 6 (password: admin123 for all)' AS credentials;
SELECT 'Login with: admin@sigorta.com / admin123' AS login_info;

