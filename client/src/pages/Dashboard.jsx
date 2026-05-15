import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Container, Button } from '../components/ui';
import { useAuth } from '../lib/auth';

function QuickActionCard({ label, description, href }) {
  return (
    <Link to={href}>
      <div className="h-full bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer">
        <h3 className="font-semibold text-slate-900">{label}</h3>
        <p className="text-xs text-slate-600 mt-1">{description}</p>
      </div>
    </Link>
  );
}

function StatCard({ label, value, description }) {
  return (
    <Card className="p-6">
      <p className="text-xs font-semibold uppercase text-slate-600 tracking-wide">{label}</p>
      <div className="mt-3 inline-flex items-center justify-center h-12 w-12 rounded-lg bg-slate-100">
        <span className="text-2xl font-extrabold text-slate-900">{value}</span>
      </div>
      <p className="mt-3 text-xs text-slate-600">{description}</p>
    </Card>
  );
}

export default function Dashboard() {
  const { api, user, role } = useAuth();
  const [courseCount, setCourseCount] = useState(0);

  useEffect(() => {
    api
      .get('/courses')
      .then((res) => {
        const courses = Array.isArray(res.data.courses) ? res.data.courses : [];
        setCourseCount(courses.length);
      })
      .catch(() => setCourseCount(0));
  }, [api]);

  const getRoleLabel = () => {
    if (role === 'admin') return 'Administrator';
    if (role === 'teacher') return 'Pengajar';
    return 'Peserta Didik';
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Welcome Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-primary py-12 sm:py-16 text-white">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold">Halo, {user?.name}!</h1>
              <p className="mt-3 text-lg text-slate-200">
                Selamat datang di dashboard LMS Inspira
              </p>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-xl px-4 py-2">
              <span className="text-sm font-semibold">{getRoleLabel()}</span>
            </div>
          </div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-8 -mt-4 relative z-10">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {role === 'student' ? (
              <>
                <StatCard
                  label="Kursus Tersedia"
                  value={courseCount}
                  description="Total kursus yang dapat diikuti"
                />
                <StatCard
                  label="Kursus Diikuti"
                  value="0"
                  description="Dari semua kursus publik"
                />
                <StatCard
                  label="Sertifikat"
                  value="0"
                  description="Setelah menyelesaikan kursus"
                />
              </>
            ) : (
              <>
                <StatCard
                  label="Total Kursus"
                  value={courseCount}
                  description="Kursus yang dipublikasikan"
                />
                <StatCard
                  label="Peran Anda"
                  value={role === 'admin' ? 'Admin' : 'Pengajar'}
                  description="Dengan akses penuh ke sistem"
                />
                <StatCard
                  label="Status Sistem"
                  value="Aktif"
                  description="Semua layanan berjalan normal"
                />
              </>
            )}
          </div>
        </Container>
      </section>

      {/* Quick Access Section */}
      <section className="py-12">
        <Container className="space-y-12">
          {/* Pembelajaran Section - All Roles */}
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
               Pembelajaran
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {role === 'student' ? (
                <>
                  <QuickActionCard
                    label="Jelajahi Kursus"
                    description="Lihat semua kursus yang tersedia dan mulai belajar"
                    href="/courses"
                  />
                  <QuickActionCard
                    label="Profil Saya"
                    description="Kelola profil, riwayat kursus, dan sertifikat"
                    href="/my-profile"
                  />
                </>
              ) : (
                <>
                  <QuickActionCard
                    label="Jelajahi Kursus"
                    description="Lihat semua kursus yang tersedia"
                    href="/courses"
                  />
                  <QuickActionCard
                    label="Profil Saya"
                    description="Kelola akun dan pengaturan Anda"
                    href="/my-profile"
                  />
                </>
              )}
            </div>
          </div>

          {/* Manajemen Konten Section - Teacher & Admin */}
          {(role === 'admin' || role === 'teacher') && (
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                 Manajemen Konten
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <QuickActionCard
                  label="Kelola Kursus"
                  description="Buat, edit, dan kelola semua kursus Anda"
                  href="/dashboard/courses"
                />
                <QuickActionCard
                  label="Bank Soal"
                  description="Kelola koleksi soal dan pertanyaan kuis"
                  href="/dashboard/question-bank"
                />
                <QuickActionCard
                  label="Monitor Siswa"
                  description="Pantau progress dan hasil belajar siswa"
                  href="/dashboard/student-progress"
                />
                <QuickActionCard
                  label="Royalti Saya"
                  description="Lihat catatan royalti dari penjualan course Anda"
                  href="/dashboard/royalties"
                />
                <QuickActionCard
                  label="Hero Carousel"
                  description="Kelola slide hero di halaman utama"
                  href="/dashboard/heroes"
                />
              </div>
            </div>
          )}

          {/* Administrasi Section - Admin Only */}
          {role === 'admin' && (
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                 Administrasi
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <QuickActionCard
                  label="Kelola Pengguna"
                  description="Atur role, royalti, keahlian, dan kode referral setiap akun"
                  href="/dashboard/users"
                />
                <QuickActionCard
                  label="Royalti & Referral"
                  description="Lacak royalti pengajar dan statistik referral"
                  href="/dashboard/royalties"
                />
                <QuickActionCard
                  label="Template Outline Course"
                  description="Buat dan kelola template struktur course untuk pengajar"
                  href="/dashboard/course-templates"
                />
                <QuickActionCard
                  label="Pembukuan"
                  description="Lihat laporan keuangan dan transaksi"
                  href="/dashboard/accounting"
                />
                <QuickActionCard
                  label="Coupon"
                  description="Buat dan kelola kode diskon untuk peserta"
                  href="/dashboard/coupons"
                />
                <QuickActionCard
                  label="Kelola Tentang Kami"
                  description="Kelola info platform dan tim pengajar"
                  href="/dashboard/about"
                />
              </div>
            </div>
          )}
        </Container>
      </section>

    </div>
  );
}
