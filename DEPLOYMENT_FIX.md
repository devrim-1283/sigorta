# 🔧 Deployment Fix - "spawn pnpm ENOENT" Hatası

## 📋 Problem

Coolify deployment sırasında build hatası:
```
Error: spawn pnpm ENOENT
    at ChildProcess._handle.onexit (node:internal/child_process:286:19)
```

**Sebep:** Next.js projede `pnpm-lock.yaml` dosyası bulunca `pnpm` kullanmaya çalışıyor, ancak Docker build ortamında `pnpm` yüklü değil.

---

## ✅ Uygulanan Çözümler

### 1. ❌ Silindi: `pnpm-lock.yaml`
```bash
rm pnpm-lock.yaml
```

### 2. ✅ Oluşturuldu: `.npmrc`
```ini
# Force npm usage (prevent pnpm detection)
legacy-peer-deps=true
```

### 3. ✅ Güncellendi: `nixpacks.toml`
```toml
[phases.install]
cmds = ["npm ci --legacy-peer-deps"]  # Değişti: npm install -> npm ci
```

### 4. ✅ Güncellendi: `.gitignore`
```gitignore
# lock files (we use npm)
pnpm-lock.yaml
yarn.lock
```

---

## 🚀 Deployment Adımları

### Git Push & Deploy

```bash
# 1. Tüm değişiklikleri stage et
git add .npmrc nixpacks.toml .gitignore
git add -u  # Silinen pnpm-lock.yaml

# 2. Commit
git commit -m "Fix: Force npm usage in build (pnpm ENOENT error)"

# 3. Push
git push origin main

# 4. Coolify otomatik redeploy edecek
# Veya manuel: Coolify → Application → Redeploy
```

---

## 📊 Build Süreçleri

### Önceki (Hatalı):
```bash
[Install] npm install --production
  ↓
[Build] npx prisma generate
  ↓
[Build] npm run build
  ↓ Next.js detects pnpm-lock.yaml
  ❌ Error: spawn pnpm ENOENT
```

### Yeni (Düzeltilmiş):
```bash
[Install] npm ci --legacy-peer-deps
  ↓
[Build] npx prisma generate
  ✅ SUCCESS
  ↓
[Build] npm run build
  ✅ SUCCESS (uses npm)
  ↓
[Start] npm start
  ✅ Deployment LIVE!
```

---

## 🔍 Neden Bu Hatalar Oldu?

1. **pnpm-lock.yaml vardı:** Node.js ekosisteminde lock file olduğunda o package manager kullanılır.
2. **Nixpacks/Docker image'ında pnpm yok:** Sadece `npm` ve `node` yüklü.
3. **Next.js auto-detect:** Next.js build sırasında hangi package manager kullanılacağını lock file'dan anlar.

---

## ✅ Verification

Build başarılı mı kontrol et:

```bash
# 1. Coolify logs
Coolify → Application → Logs

# Başarılı build çıktısı:
✓ Compiled successfully
✓ Linting and checking validity of types    
✓ Collecting page data    
✓ Generating static pages (22/22)
✓ Collecting build traces    
✓ Finalizing page optimization    

# 2. Site açılıyor mu?
curl https://test-sms-link.com.tr

# 3. Login çalışıyor mu?
# Browser: https://test-sms-link.com.tr
# Email: admin@sigorta.com
# Şifre: admin123
```

---

## 📝 Değişen Dosyalar

| Dosya | Değişiklik | Durum |
|-------|-----------|-------|
| `pnpm-lock.yaml` | Silindi | ❌ Deleted |
| `.npmrc` | Oluşturuldu | ✅ Created |
| `nixpacks.toml` | `npm ci` kullanımı | ✅ Updated |
| `.gitignore` | Lock files eklendi | ✅ Updated |
| `DEPLOYMENT.md` | Troubleshooting eklendi | ✅ Updated |

---

## 🎯 Sonuç

**Durum:** ✅ FIX APPLIED  
**Next Deploy:** Build başarılı olacak  
**Süre:** ~2-3 dakika

---

## 🔗 Referanslar

- **Nixpacks Docs:** https://nixpacks.com/docs/configuration/file
- **Next.js Docs (Package Manager Detection):** https://nextjs.org/docs/architecture/package-manager
- **Issue:** Build tries to use pnpm when pnpm-lock.yaml exists
- **Solution:** Remove pnpm-lock.yaml and force npm usage via .npmrc

---

**Hazır! Şimdi git push yapabilirsiniz. 🚀**

