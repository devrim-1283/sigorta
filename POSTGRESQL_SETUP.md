# PostgreSQL Setup Guide

## 🐘 Production Database Configuration

### Database Credentials (Coolify PostgreSQL)

```
Host: f04k88w8koc44c4wossw04w4
Port: 5432
Database: postgres
Username: postgres
Password: s5CtgtRRl1z10S6feIbjixpjwnBTjh2LtBNY57sf883PIcvWa912Mz3ZC7Ed4v0F
```

### Connection URL
```
postgres://postgres:s5CtgtRRl1z10S6feIbjixpjwnBTjh2LtBNY57sf883PIcvWa912Mz3ZC7Ed4v0F@f04k88w8koc44c4wossw04w4:5432/postgres
```

## 📝 Laravel Configuration

### Option 1: Individual Variables (.env)
```env
DB_CONNECTION=pgsql
DB_HOST=f04k88w8koc44c4wossw04w4
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=s5CtgtRRl1z10S6feIbjixpjwnBTjh2LtBNY57sf883PIcvWa912Mz3ZC7Ed4v0F
```

### Option 2: Database URL (.env)
```env
DATABASE_URL=postgres://postgres:s5CtgtRRl1z10S6feIbjixpjwnBTjh2LtBNY57sf883PIcvWa912Mz3ZC7Ed4v0F@f04k88w8koc44c4wossw04w4:5432/postgres
```

## 🔧 PHP PostgreSQL Extension

### Check if Installed
```bash
php -m | grep pgsql
```

Should show:
```
pdo_pgsql
pgsql
```

### Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install php8.2-pgsql
sudo systemctl restart apache2  # or nginx/php-fpm
```

**MacOS (Homebrew):**
```bash
brew install php@8.2
pecl install pgsql
```

**Windows:**
Edit `php.ini` and uncomment:
```ini
extension=pdo_pgsql
extension=pgsql
```

## ✅ Connection Test

### Using Artisan Tinker
```bash
cd backend
php artisan tinker
```

Then run:
```php
DB::connection()->getPdo();
// Should return: PDO object

DB::select('SELECT version()');
// Should return PostgreSQL version
```

### Using Migration Test
```bash
php artisan migrate:status
```

If connection works, you'll see migration table status.

## 🗄️ Database Management

### Connect with psql
```bash
psql "postgres://postgres:s5CtgtRRl1z10S6feIbjixpjwnBTjh2LtBNY57sf883PIcvWa912Mz3ZC7Ed4v0F@f04k88w8koc44c4wossw04w4:5432/postgres"
```

### Common Commands
```sql
-- List all tables
\dt

-- Describe table structure
\d table_name

-- Show all databases
\l

-- Show current connection info
\conninfo

-- Quit
\q
```

### Backup Database
```bash
# Full backup
pg_dump -h f04k88w8koc44c4wossw04w4 \
  -U postgres \
  -d postgres \
  -F c \
  -f backup_$(date +%Y%m%d).dump

# SQL format (readable)
pg_dump -h f04k88w8koc44c4wossw04w4 \
  -U postgres \
  -d postgres \
  > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
# From custom format
pg_restore -h f04k88w8koc44c4wossw04w4 \
  -U postgres \
  -d postgres \
  backup_20241110.dump

# From SQL
psql -h f04k88w8koc44c4wossw04w4 \
  -U postgres \
  -d postgres \
  < backup_20241110.sql
```

## 🚨 Troubleshooting

### Error: "could not connect to server"

**Check:**
1. Network connectivity
2. Firewall rules (port 5432)
3. PostgreSQL service is running
4. Host/port are correct

### Error: "password authentication failed"

**Check:**
1. Password is correct (no extra spaces)
2. Username is 'postgres'
3. Using correct authentication method

### Error: "FATAL: database 'postgres' does not exist"

**Solution:**
```bash
# Connect to default database and create
psql -h f04k88w8koc44c4wossw04w4 -U postgres -d template1

CREATE DATABASE postgres;
```

### Error: "PHP pgsql extension not found"

**Solution:**
Install php-pgsql extension (see installation section above)

## 🔐 Security Best Practices

1. **Never commit credentials** to git
2. **Use .env files** for sensitive data
3. **Rotate passwords** regularly
4. **Backup regularly** (at least daily)
5. **Monitor connections** and performance
6. **Use SSL connections** when possible

## 📊 Performance Tips

### Laravel Query Optimization
```php
// Use select to limit columns
Customer::select('id', 'ad_soyad')->get();

// Use indexes (in migrations)
$table->index('email');
$table->index(['customer_id', 'created_at']);

// Use eager loading
Customer::with('documents', 'payments')->get();
```

### Database Indexes (Already Applied)
```sql
-- Check existing indexes
SELECT * FROM pg_indexes WHERE schemaname = 'public';
```

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| Test connection | `php artisan tinker --execute="DB::connection()->getPdo();"` |
| Run migrations | `php artisan migrate` |
| Rollback | `php artisan migrate:rollback` |
| Fresh start | `php artisan migrate:fresh --seed` |
| Check status | `php artisan migrate:status` |
| Database backup | `pg_dump -h HOST -U USER DATABASE > backup.sql` |
| View tables | `\dt` in psql |

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Laravel Database](https://laravel.com/docs/database)
- [Laravel Migrations](https://laravel.com/docs/migrations)
- [PHP PostgreSQL](https://www.php.net/manual/en/book.pgsql.php)

---

**Production Database Ready!** ✅
Domain: test-sms-link.com.tr
Database: PostgreSQL at f04k88w8koc44c4wossw04w4:5432

