# ⚠️ DPAPI Windows Corruption - Unable to Fix via CLI

## Status
- ❌ `az login` blocked: "Keyset does not exist"
- ❌ `azd deploy` blocked: Cannot authenticate  
- ❌ Device code: Blocked by credential manager
- ✓ Local config: All Midtrans credentials ready

## Root Cause
Windows DPAPI encryption keys corrupted at system level.
Requires either:
1. Windows system restart + system file repair
2. Manual Azure Portal update (no CLI needed)
3. New user profile (extreme)

---

## ✅ IMMEDIATE SOLUTION: Manual Portal Update

### Langkah Cepat (5 minutes)

1. **Open Azure Portal**: https://portal.azure.com

2. **Find Your Backend App Service**:
   - Go to: Resource Groups → `lms-inspira`
   - Look for Web App yang berisi backend
   - Mungkin namanya berbeda dari `lms-inspira-api`

3. **Go to Configuration**:
   - Left menu: Click `Configuration`
   - Tab: `Application settings`

4. **Add/Update Midtrans Settings**:
   
   Cari atau tambah 4 keys ini:
   ```
   MIDTRANS_MERCHANT_ID     = M377060101
   MIDTRANS_CLIENT_KEY      = <REDACTED>
   MIDTRANS_SERVER_KEY      = <REDACTED>
   MIDTRANS_IS_PRODUCTION   = false
   ```

5. **Save & Restart**:
   - Click "Save" button
   - App akan auto-restart (2-3 minutes)
   - Status berubah dari "Running" → restart
   - Tunggu sampai "Running" lagi

6. **Verify**:
   - Open: https://<backend-app>.azurewebsites.net/api/health
   - Expected: `{"ok": true}`

---

## 🔧 Alternative: Reset Windows DPAPI (Nuclear Option)

Jika Anda ingin fix di Windows level:

```powershell
# Run as Administrator
gpupdate /force

# Or full reset credential manager
Remove-Item -Path "HKCU:\Software\Microsoft\Credential Manager" -Recurse -Force -ErrorAction SilentlyContinue

# Restart Windows
Restart-Computer -Force
```

Setelah restart, coba lagi:
```powershell
az login --use-device-code
azd env select prod
azd deploy
```

---

## 📝 Local Config Status (All Ready)

✓ `server/.env` - Midtrans updated
✓ `server/.env.example` - Template updated
✓ `.env.production` - Updated
✓ `.azure/prod/.env` - All credentials configured
✓ `azure.yaml` - Generated
✓ DPAPI config - Attempted workaround

---

## 🎯 Recommendation

**Go with Manual Portal Update** - Fastest, guaranteed to work, no Windows-level issues.

Just find your backend app service name dan update 4 Midtrans settings di Configuration tab.

---

## ❓ Questions?

- Apa nama backend app service di resource group `lms-inspira`?
- Sudah bisa akses Portal normal?

Share screenshot dari Portal atau app names yang ada!
