# LMS2 (MERN) — LMS + Quiz Interaktif

Aplikasi LMS sederhana (inspirasi Coursera) dengan fitur quiz interaktif (inspirasi Quizizz/Kahoot).

## Fitur

- Landing page dengan **Hero Carousel (slide)** yang bisa dikelola oleh **teacher/admin**
- Auth JWT + role: `admin`, `teacher`, `student`
- Teacher/Admin:
  - Buat & publish course
  - Tambah materi (lesson) berbasis markdown
  - Buat quiz + soal pilihan ganda + publish
- Student:
  - Lihat course publik
  - Baca materi
  - Kerjakan quiz dan dapat skor setelah submit

## Prasyarat

- Node.js LTS
- MongoDB (local) **atau** Mongo via Docker

## Setup Backend

1. Masuk ke folder backend:

   `cd server`

2. Buat file env:

   - Copy `server/.env.example` menjadi `server/.env`
   - Pastikan `MONGO_URI` dan `JWT_SECRET` terisi
   - (Opsional) Isi SMTP_* kalau mau fitur email di masa depan

3. (Opsional) Jalankan MongoDB via Docker:

   `docker run --name lms2-mongo -p 27017:27017 -d mongo:7`

4. Seed data (admin + teacher + contoh course/quiz/hero):

   `npm run seed`

5. Jalankan backend:

   `npm run dev`

Backend jalan di `http://localhost:4000`.

## Setup Frontend

1. Masuk ke folder frontend:

   `cd client`

2. Buat env:

   - Copy `client/.env.example` menjadi `client/.env`

3. Jalankan frontend:

   `npm run dev`

Frontend jalan di `http://localhost:5173`.

## Menjalankan Keduanya Sekaligus

Dari root repo:

`npm run dev`

## Akun Demo (setelah seed)

- Admin: `admin@lms.local` / `admin123`
- Teacher: `teacher@lms.local` / `teacher123`
- Student: daftar lewat halaman Register

## Endpoint Singkat

- `GET /api/heroes` (public)
- `GET /api/heroes/all` (teacher/admin)
- `POST /api/heroes` (teacher/admin)
- `GET /api/courses` (public)
- `GET /api/courses/:id` (public, published only)
- `GET /api/courses/_manage/mine` (teacher/admin)
- `POST /api/courses` (teacher/admin)
- `POST /api/courses/:courseId/lessons` (teacher/admin)
- `POST /api/quizzes/course/:courseId` (teacher/admin)
- `POST /api/quizzes/:quizId/questions` (teacher/admin)
- `GET /api/quizzes/play/:quizId` (student/auth)
- `POST /api/quizzes/play/:quizId/submit` (student/auth)

## Catatan

- Upload gambar belum dibuat; `imageUrl` pada hero/course masih berupa URL string.
- Markdown renderer di course detail dibuat minimal agar dependensi kecil.
