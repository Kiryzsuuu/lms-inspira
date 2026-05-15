import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../components/ui';
import { useAuth } from '../lib/auth';

function QuickActionCard({ label, description, href }) {
  return (
    <Link to={href}>
      <div
        className="h-full bg-white border border-gray-200 rounded-[16px] p-6 transition-all duration-[250ms] cursor-pointer"
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,.08),0 4px 6px rgba(0,0,0,.05)'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
      >
        <h3 className="font-display font-bold text-gray-900">{label}</h3>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
    </Link>
  );
}

function StatCard({ label, value, description }) {
  return (
    <div className="bg-white border border-gray-200 rounded-[16px] p-6">
      <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">{label}</p>
      <div className="mt-3 font-display font-extrabold text-3xl" style={{ color: '#0C628D' }}>{value}</div>
      <p className="mt-2 text-xs text-gray-500">{description}</p>
    </div>
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
    <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
      {/* Welcome Banner */}
      <section className="py-12 sm:py-16 text-white" style={{ background: 'linear-gradient(135deg, #0A0E1A 0%, #111827 100%)' }}>
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="section-eyebrow" style={{ color: 'rgba(255,255,255,.5)' }}>
                <span style={{ background: 'rgba(255,255,255,.3)' }} className="inline-block w-[18px] h-[2px] rounded-[2px] mr-2" />
                Dashboard
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-extrabold mt-2">Halo, {user?.name}!</h1>
              <p className="mt-3 text-lg" style={{ color: 'rgba(255,255,255,.6)' }}>
                Selamat datang di dashboard InspiraLearn
              </p>
            </div>
            <div
              className="inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', backdropFilter: 'blur(8px)' }}
            >
              {getRoleLabel()}
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
            <h2 className="font-display text-2xl font-extrabold text-gray-900 mb-6">Pembelajaran</h2>
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
              <h2 className="font-display text-2xl font-extrabold text-gray-900 mb-6">Manajemen Konten</h2>
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
              <h2 className="font-display text-2xl font-extrabold text-gray-900 mb-6">Administrasi</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <QuickActionCard
                  label="Kelola Pengguna"
                  description="Atur role, royalti, keahlian, dan kode referral setiap akun"
                  href="/dashboard/users"
                />
                <QuickActionCard
                  label="Kelola Kategori"
                  description="Tambah dan atur kategori dengan gambar sampul di halaman utama"
                  href="/dashboard/categories"
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
