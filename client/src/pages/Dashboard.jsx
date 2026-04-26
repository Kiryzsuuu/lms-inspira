import { Link } from 'react-router-dom';
import { Card, Container, Button } from '../components/ui';
import { useAuth } from '../lib/auth';

export default function Dashboard() {
  const { user, role } = useAuth();

  const quickStats = [
    { label: 'Role aktif', value: role || '-', tone: 'bg-orange-50 text-orange-900' },
    { label: 'Fokus hari ini', value: role === 'student' ? 'Belajar' : 'Kelola LMS', tone: 'bg-blue-50 text-blue-900' },
    { label: 'Workspace', value: 'LMS Inspira', tone: 'bg-emerald-50 text-emerald-900' },
  ];

  return (
    <section className="bg-slate-100/70 py-8 sm:py-10">
      <Container className="space-y-6">
        <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#d76810] px-6 py-8 text-white sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-100">Dashboard utama</div>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Halo, {user?.name}</h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-100/90">
                  Akses cepat ke course, operasional admin, dan area belajar dalam satu tampilan yang lebih rapi.
                </p>
              </div>
              <Link to="/courses">
                <Button variant="outline" className="rounded-2xl border-white/30 bg-white/10 text-white hover:bg-white/20">
                  Buka Courses
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-3">
            {quickStats.map((item) => (
              <div key={item.label} className={`rounded-2xl px-4 py-5 ${item.tone}`}>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{item.label}</div>
                <div className="mt-2 text-2xl font-extrabold">{item.value}</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card className="rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Area belajar</h2>
                  <p className="mt-1 text-sm text-slate-600">Masuk ke course publik, lanjutkan pembelajaran, dan kerjakan quiz.</p>
                </div>
                <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Student</div>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link to="/courses" className="flex-1">
                  <Button className="w-full rounded-2xl">Jelajahi Course</Button>
                </Link>
                <Link to="/my-profile" className="flex-1">
                  <Button variant="outline" className="w-full rounded-2xl">Profil Saya</Button>
                </Link>
              </div>
            </Card>

            {(role === 'admin' || role === 'teacher') && (
              <Card className="rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Operasional konten</h2>
                    <p className="mt-1 text-sm text-slate-600">Kelola hero, course, bank soal, dan monitoring progres siswa.</p>
                  </div>
                  <div className="rounded-2xl bg-orange-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-800">Teacher / Admin</div>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <Link to="/dashboard/heroes"><Button className="w-full rounded-2xl">Kelola Hero</Button></Link>
                  <Link to="/dashboard/courses"><Button variant="outline" className="w-full rounded-2xl">Kelola Course</Button></Link>
                  <Link to="/dashboard/question-bank"><Button className="w-full rounded-2xl">Bank Soal</Button></Link>
                  <Link to="/dashboard/student-progress"><Button variant="outline" className="w-full rounded-2xl">Monitor Siswa</Button></Link>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Panduan cepat</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-4">Gunakan menu profile untuk lihat riwayat course dan sertifikat.</div>
                <div className="rounded-2xl bg-slate-50 p-4">Kelola course dari dashboard untuk melihat statistik pendaftar.</div>
                <div className="rounded-2xl bg-slate-50 p-4">Pembayaran student berjalan via Midtrans dengan status settlement otomatis.</div>
              </div>
            </Card>

            {role === 'admin' && (
              <Card className="rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Kontrol admin</h2>
                <p className="mt-1 text-sm text-slate-600">Kelola user dan pantau pembukuan dari area admin.</p>
                <div className="mt-5 grid gap-3">
                  <Link to="/dashboard/users"><Button className="w-full rounded-2xl">Kelola Users</Button></Link>
                  <Link to="/dashboard/accounting"><Button variant="outline" className="w-full rounded-2xl">Pembukuan</Button></Link>
                </div>
              </Card>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
