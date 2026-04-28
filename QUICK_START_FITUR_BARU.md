# 🚀 QUICK START GUIDE - FITUR BARU

## Setup & Run

### 1. Install Dependencies (jika belum)
```bash
# Backend
cd server
npm install

# Frontend
cd client
npm install
```

### 2. Jalankan Aplikasi
```bash
# Dari root folder
npm run dev

# Atau manual:
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 3. Akses Aplikasi
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

---

## 🎯 Testing Fitur Baru

### A. SERTIFIKAT DIGITAL

#### Sebagai Student:
1. Login dengan akun student
2. Enroll ke course (gratis atau berbayar)
3. Selesaikan semua materi dan quiz
4. Klik "Complete Course"
5. Buka **My Profile** → Tab **Sertifikat**
6. Klik **"Lihat Sertifikat"**
7. Sertifikat akan muncul dengan design profesional
8. Klik **"Download / Print"** untuk print atau save as PDF

#### Fitur Sertifikat:
- ✅ Nomor sertifikat unik
- ✅ Nama siswa
- ✅ Nama course
- ✅ Tanggal penyelesaian
- ✅ Border design profesional
- ✅ Print-friendly

---

### B. SOAL QUIZ DENGAN GAMBAR

#### Sebagai Teacher/Admin:
1. Login dengan akun teacher/admin
2. Buka **Dashboard** → **Kelola Course**
3. Pilih course atau buat baru
4. Scroll ke bagian **Quiz**
5. Pilih quiz atau buat baru
6. Tambah soal baru
7. Di form soal, ada field **"Gambar Soal (opsional)"**
8. Upload gambar atau paste URL
9. Preview gambar akan muncul
10. Simpan soal
11. Publish quiz

#### Sebagai Student:
1. Login dan buka course
2. Kerjakan quiz
3. Gambar akan muncul di bawah pertanyaan
4. Gambar responsive dan max height 400px

#### Tips:
- Gunakan gambar dengan resolusi yang baik
- Format: JPG, PNG, GIF
- Ukuran recommended: max 2MB
- Aspect ratio: 16:9 atau 4:3 untuk hasil terbaik

---

### C. REKAP PENDAFTAR COURSE

#### Sebagai Teacher/Admin:
1. Login dengan akun teacher/admin
2. Buka **Dashboard** → **Kelola Course**
3. Pilih course yang ingin dilihat statistiknya
4. Klik tombol **"Lihat Stats"** (di sebelah Toggle Publish)
5. Halaman baru akan terbuka dengan:
   - **Total Pendaftar**: Jumlah siswa yang enroll
   - **Sedang Aktif**: Siswa yang sedang mengerjakan
   - **Selesai**: Siswa yang sudah complete
   - **Tabel Siswa**: Daftar lengkap dengan status

#### Data yang Ditampilkan:
- Nama lengkap siswa
- Email
- Tanggal terdaftar
- Status (Terdaftar/Aktif/Selesai)

#### Use Cases:
- Monitor engagement course
- Track completion rate
- Identify students yang perlu follow-up
- Export data (future enhancement)

---

### D. SIDEBAR RESPONSIVE

#### Desktop (> 1024px):
- Sidebar selalu terlihat
- Fixed width
- Smooth scrolling

#### Mobile (< 1024px):
1. Sidebar tersembunyi by default
2. Klik tombol **☰** di pojok kanan bawah
3. Sidebar slide in dari kiri
4. Klik **✕** atau overlay untuk close
5. Smooth animation

#### Halaman dengan Sidebar:
- **My Profile**
- **Kelola Users** (Admin)

---

## 🎨 UI/UX Improvements

### 1. Color Scheme
- Primary: Orange (#d76810)
- Background: Slate-50 (lebih soft dari putih)
- Text: Slate-900
- Borders: Slate-200

### 2. Scrollbar
- Custom scrollbar dengan styling modern
- Thin (8px)
- Rounded thumb
- Hover effect

### 3. Cards
- Border + shadow
- Hover effect (shadow-md)
- Consistent padding

### 4. Buttons
- Consistent sizing
- Clear hover states
- Loading states
- Disabled states

---

## 📱 Mobile Responsiveness

### Tested Breakpoints:
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

### Mobile Optimizations:
- ✅ Sidebar toggle
- ✅ Responsive tables
- ✅ Stack layout untuk forms
- ✅ Touch-friendly buttons (min 44px)
- ✅ Readable font sizes

---

## 🔐 Permissions

### Student:
- ✅ View certificates
- ✅ Generate certificate (after completion)
- ✅ Take quiz with images
- ❌ View course stats
- ❌ Upload question images

### Teacher:
- ✅ View course stats (own courses)
- ✅ Upload question images
- ✅ View all certificates
- ❌ Manage users

### Admin:
- ✅ View all course stats
- ✅ Upload question images
- ✅ View all certificates
- ✅ Manage users

---

## 🐛 Troubleshooting

### Sertifikat tidak muncul?
- Pastikan course sudah di-complete
- Refresh halaman My Profile
- Check console untuk error

### Gambar soal tidak muncul?
- Check URL gambar valid
- Pastikan gambar accessible (CORS)
- Try upload ulang

### Stats tidak akurat?
- Refresh halaman
- Check apakah ada siswa yang enroll
- Verify course ID

### Sidebar tidak responsive?
- Clear browser cache
- Check browser width < 1024px
- Try different browser

---

## 📊 Performance Tips

### Images:
- Compress images sebelum upload
- Use CDN untuk hosting images (future)
- Lazy load images

### Database:
- Index sudah dibuat untuk queries
- Certificate lookup by userId + courseId
- Course stats cached (future enhancement)

---

## 🎓 Best Practices

### Untuk Teacher:
1. **Gambar Soal**: Gunakan gambar yang jelas dan relevan
2. **Course Stats**: Check regularly untuk monitor engagement
3. **Sertifikat**: Pastikan course requirements jelas

### Untuk Admin:
1. **User Management**: Regular audit user roles
2. **Course Stats**: Monitor completion rates
3. **Certificates**: Verify certificate numbers unique

### Untuk Student:
1. **Sertifikat**: Download segera setelah complete
2. **Quiz**: Perhatikan gambar untuk context soal
3. **Profile**: Keep profile updated untuk sertifikat

---

## 📞 Need Help?

### Common Issues:
1. **Upload gagal**: Check file size < 5MB
2. **Permission denied**: Check user role
3. **Data tidak muncul**: Refresh atau re-login

### Contact:
- Technical issues: Check console logs
- Feature requests: Create issue
- Bug reports: Include screenshots

---

## ✅ Checklist Testing

### Before Production:
- [ ] Test all user roles (student, teacher, admin)
- [ ] Test on mobile devices
- [ ] Test image upload (various formats)
- [ ] Test certificate generation
- [ ] Test course stats accuracy
- [ ] Test sidebar on different screen sizes
- [ ] Test print certificate
- [ ] Verify permissions

### After Deployment:
- [ ] Monitor error logs
- [ ] Check certificate generation
- [ ] Verify image uploads working
- [ ] Test mobile responsiveness
- [ ] Collect user feedback

---

**Happy Testing! 🎉**
