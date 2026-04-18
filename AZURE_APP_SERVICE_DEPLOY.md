# Deploy ke Azure App Service (Frontend + Backend)

Dokumen ini untuk deploy **2 App Service Linux** terpisah:

- **Backend**: Express API (`/api/*`)
- **Frontend**: Vite build (`client/dist`) disajikan oleh `client/start.js` (SPA fallback)

## Prasyarat

- Azure Subscription
- MongoDB Atlas (atau Mongo yang bisa diakses publik)

---

## A. Deploy Backend (Express)

1) Buat App Service (Linux) untuk backend

- Runtime: **Node.js LTS**
- App name contoh: `lms-inspira-api`

2) Deploy source code dari repo ini

- Set **App Service → Deployment Center** ke GitHub repo ini
- Set **Root folder**: `server/`

3) Set App Settings (Configuration → Application settings)

Wajib:

- `MONGO_URI` = connection string Mongo
- `JWT_SECRET` = secret panjang (>=16 chars)
- `CLIENT_ORIGIN` = URL frontend (contoh: `https://lms-inspira-web.azurewebsites.net`)

Opsional:

- `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

Catatan:

- Azure menyediakan `PORT` otomatis. Server sudah membaca `PORT` dari env.

4) Verifikasi

- Buka: `https://<backend-app>.azurewebsites.net/api/health`
- Harus return `{ "ok": true }`

---

## B. Deploy Frontend (Vite)

1) Buat App Service (Linux) untuk frontend

- Runtime: **Node.js LTS**
- App name contoh: `lms-inspira-web`

2) Deploy source code dari repo ini

- Set **Deployment Center** ke GitHub repo ini
- Set **Root folder**: `client/`

3) Set Build & Start

Frontend butuh:

- Build: `npm run build`
- Start: `npm start` (menjalankan `node start.js`)

Jika App Service tidak auto-detect:

- Setting Startup Command: `npm start`

4) Set App Settings

- `VITE_API_BASE_URL` = `https://<backend-app>.azurewebsites.net/api`

Penting:

- `VITE_*` env harus tersedia saat **build**.
- Jika kamu memakai GitHub Actions/Oryx build, pastikan `VITE_API_BASE_URL` diset sebagai App Setting sebelum build terjadi.

5) Verifikasi

- Buka frontend URL
- Login, lalu cek Network tab: request harus mengarah ke `https://<backend-app>.azurewebsites.net/api/...`

---

## C. Troubleshooting Cepat

- **CORS error**:
  - Pastikan `CLIENT_ORIGIN` backend sama persis dengan origin frontend (contoh `https://...azurewebsites.net` tanpa trailing slash).
  - Kamu bisa set multiple origin: `CLIENT_ORIGIN=https://a.com,https://b.com`

- **Frontend blank / refresh 404**:
  - Frontend sudah pakai SPA fallback via `client/start.js`.

- **API 5xx / crash**:
  - Cek App Service → Log stream
  - Pastikan `MONGO_URI` dan `JWT_SECRET` valid.
