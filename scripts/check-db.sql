-- Quick database health check script
-- Run this in Coolify PostgreSQL Query Editor

-- 1. Check if tables exist
SELECT 
    'Tables Count' AS check_type,
    COUNT(*) AS result
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 2. Check users count
SELECT 
    'Users Count' AS check_type,
    COUNT(*) AS result
FROM users;

-- 3. Check if demo admin exists
SELECT 
    'Demo Admin' AS check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE email = 'admin@sigorta.com') 
        THEN 'EXISTS ✓' 
        ELSE 'NOT FOUND ✗' 
    END AS result;

-- 4. List all users
SELECT 
    id,
    name,
    email,
    role_id,
    is_active,
    created_at
FROM users
ORDER BY id;

-- 5. Check roles
SELECT 
    id,
    name,
    display_name
FROM roles
ORDER BY id;

-- 6. Check dealers
SELECT 
    id,
    dealer_name,
    is_active
FROM dealers
ORDER BY id;

-- Expected Results:
-- Tables Count: 15
-- Users Count: 6
-- Demo Admin: EXISTS ✓
-- Users: admin@sigorta.com, istanbul@sigorta.com, ankara@sigorta.com, muhasebe@sigorta.com, test.musteri@email.com, inactive.user@email.com
-- Roles: 5 (superadmin, admin, moderator, dealer, accountant)
-- Dealers: 2 (İstanbul Ana Acente, Ankara Şubesi)

