# Azure CLI Deployment Guide

Panduan lengkap untuk deploy LMS Inspira ke Azure App Service menggunakan Azure CLI.

---

## **Daftar Isi**

1. [Prasyarat](#prasyarat)
2. [Step 1: Clear Azure Cache](#step-1-clear-azure-cache)
3. [Step 2: Login Azure](#step-2-login-azure)
4. [Step 3: Deploy Backend](#step-3-deploy-backend)
5. [Step 4: Deploy Frontend](#step-4-deploy-frontend)
6. [Verifikasi Deployment](#verifikasi-deployment)
7. [Troubleshooting](#troubleshooting)

---

## **Prasyarat**

- Azure Subscription aktif
- Azure CLI sudah ter-install (`az --version` untuk verify)
- Akun Azure dengan akses ke resource group `rg-innovation-inspirateknologi`
- Folder project LMS Inspira di: `C:\Users\Opet\Documents\CODING\lms-inspira`

---

## **Step 1: Clear Azure Cache**

Jika sebelumnya ada credential error, clear cache terlebih dahulu:

### **1.1 Buka PowerShell**

- Tekan `Win + R`
- Ketik: `powershell`
- Tekan Enter

Atau di VSCode:
- Tekan `Ctrl + Shift + `` (backtick)

### **1.2 Logout Azure**

```powershell
az logout
```

### **1.3 Clear Cache Folders**

```powershell
Remove-Item -Path $env:USERPROFILE\.azure -Recurse -Force -ErrorAction SilentlyContinue
```

```powershell
Remove-Item -Path $env:USERPROFILE\.config\azd -Recurse -Force -ErrorAction SilentlyContinue
```

### **1.4 Tutup & Buka PowerShell Baru**

- Tutup PowerShell sekarang
- Buka PowerShell baru

---

## **Step 2: Login Azure**

### **2.1 Jalankan Login Command**

```powershell
az login --use-device-code
```

### **2.2 Ikuti Instruksi**

Output akan menampilkan:

```
To sign in, use a web browser to open the page https://microsoft.com/devicelogin 
and enter the code XXXXXXXXX to authenticate.
```

### **2.3 Copy Device Code**

- **COPY** device code (string alfanumerik setelah "code")
- Buka browser baru
- Pergi ke: `https://microsoft.com/devicelogin`
- **PASTE** device code
- Login dengan akun Azure Anda
- Approve akses

### **2.4 Verify Login Berhasil**

Di PowerShell, jalankan:

```powershell
az account show
```

**Output yang benar** (JSON format):
```json
{
  "cloudName": "AzureCloud",
  "id": "aca4799c-...",
  "name": "Azure for Students",
  "state": "Enabled",
  ...
}
```

Jika ada output di atas, login **BERHASIL** ✅

---

## **Step 3: Deploy Backend**

Backend (Express API) akan di-deploy ke `lms-inspira-api` App Service.

### **3.1 Navigate ke Folder Server**

```powershell
cd C:\Users\Opet\Documents\CODING\lms-inspira
cd server
```

### **3.2 Deploy ke Azure**

```powershell
az webapp up --name lms-inspira-api --resource-group rg-innovation-inspirateknologi
```

### **3.3 Tunggu Deployment Selesai**

- Command akan berjalan selama **3-5 menit**
- Output akan menampilkan URL seperti:

```
https://lms-inspira-api.azurewebsites.net
```

Ini adalah **Backend URL** Anda. ✅

---

## **Step 4: Deploy Frontend**

Frontend (Vite React) akan di-deploy ke `lms-inspira-web` App Service.

### **4.1 Buka Terminal PowerShell Baru**

Di VSCode:
- Tekan `Ctrl + Shift + `` (backtick)

Atau terminal manual:
- Tekan `Win + R` → `powershell` → Enter

### **4.2 Navigate ke Folder Client**

```powershell
cd C:\Users\Opet\Documents\CODING\lms-inspira
cd client
```

### **4.3 Deploy ke Azure**

```powershell
az webapp up --name lms-inspira-web --resource-group rg-innovation-inspirateknologi
```

### **4.4 Tunggu Deployment Selesai**

- Command akan berjalan selama **3-5 menit**
- Output akan menampilkan URL seperti:

```
https://lms-inspira-web.azurewebsites.net
```

Ini adalah **Frontend URL** Anda. ✅

---

## **Verifikasi Deployment**

Setelah kedua deployment selesai, verify:

### **Backend Health Check**

Buka browser:
```
https://lms-inspira-api.azurewebsites.net/api/health
```

**Harus menampilkan:**
```json
{
  "ok": true
}
```

### **Frontend Access**

Buka browser:
```
https://lms-inspira-web.azurewebsites.net
```

**Harus menampilkan** halaman login LMS Inspira.

### **Check Azure Portal**

Buka: https://portal.azure.com
- Pergi ke: Resource Groups → `rg-innovation-inspirateknologi`
- Lihat 2 App Service:
  - `lms-inspira-api` (Backend)
  - `lms-inspira-web` (Frontend)

Pastikan status: **Running** ✅

---

## **Troubleshooting**

### **Error: Keyset does not exist**

**Solusi:** Repeat [Step 1: Clear Azure Cache](#step-1-clear-azure-cache)

Pastikan:
1. Close PowerShell sepenuhnya
2. Open PowerShell baru
3. Gunakan `az login --use-device-code` (bukan `az login` biasa)

### **Error: Resource not found**

Pastikan:
1. Nama resource group benar: `rg-innovation-inspirateknologi`
2. Akun Azure punya akses ke resource group ini
3. Jalankan `az account show` untuk verify

### **Deployment takes too long (>10 minutes)**

- Check internet connection
- Check `az webapp log tail --name lms-inspira-api --resource-group rg-innovation-inspirateknologi`

### **Frontend not connecting to Backend**

Check environment variable di Azure Portal:
- App Service → lms-inspira-web → Configuration
- `VITE_API_BASE_URL` harus = `https://lms-inspira-api.azurewebsites.net/api`

---

## **Environment Variables**

### **Backend (lms-inspira-api)**

Required:
- `MONGO_URI` = MongoDB connection string
- `JWT_SECRET` = Secret key
- `CLIENT_ORIGIN` = Frontend URL

Optional:
- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_CLIENT_KEY`
- `MIDTRANS_IS_PRODUCTION`
- `SMTP_*` = Email config

### **Frontend (lms-inspira-web)**

Required:
- `VITE_API_BASE_URL` = Backend API URL

---

## **Tips & Best Practices**

1. **Always clear cache** sebelum login jika ada credential error
2. **Use device code login** (`--use-device-code`) untuk lebih reliable
3. **Check logs** jika ada error:
   ```powershell
   az webapp log tail --name lms-inspira-api --resource-group rg-innovation-inspirateknologi
   ```
4. **Keep both terminals open** saat deploy untuk monitor progress
5. **Verify both services** setelah deployment selesai

---

## **Quick Reference Commands**

```powershell
# Login
az login --use-device-code

# Verify login
az account show

# Deploy backend
cd C:\Users\Opet\Documents\CODING\lms-inspira\server
az webapp up --name lms-inspira-api --resource-group rg-innovation-inspirateknologi

# Deploy frontend
cd C:\Users\Opet\Documents\CODING\lms-inspira\client
az webapp up --name lms-inspira-web --resource-group rg-innovation-inspirateknologi

# View backend logs
az webapp log tail --name lms-inspira-api --resource-group rg-innovation-inspirateknologi

# View frontend logs
az webapp log tail --name lms-inspira-web --resource-group rg-innovation-inspirateknologi

# Clear cache
Remove-Item -Path $env:USERPROFILE\.azure -Recurse -Force -ErrorAction SilentlyContinue
```

---

## **Support**

Jika ada error yang tidak terlist di [Troubleshooting](#troubleshooting):

1. Copy full error message
2. Check Azure Portal → App Service → Log stream
3. Contact Azure support atau check [Azure CLI docs](https://learn.microsoft.com/cli/azure/)

---

**Last Updated:** April 27, 2026  
**Status:** Ready for Deployment
