import { Link } from 'react-router-dom';
import { Card, Container, Button } from '../components/ui';
import { useAuth } from '../lib/auth';

export default function Dashboard() {
  const { user, role } = useAuth();

  return (
    <section className="py-10">
      <Container>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Halo, <span className="font-semibold text-slate-900">{user?.name}</span> ({role})
            </p>
          </div>
          <Link to="/courses">
            <Button variant="outline">Buka Courses</Button>
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <div className="text-lg font-bold">Student</div>
            <p className="mt-1 text-sm text-slate-600">Akses course publik, kerjakan quiz, lihat skor setelah submit.</p>
          </Card>

          <Card className="p-6">
            <div className="text-lg font-bold">Teacher/Admin</div>
            <p className="mt-1 text-sm text-slate-600">Kelola hero carousel, tambah course, materi, quiz, dan soal.</p>
            {(role === 'admin' || role === 'teacher') && (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Link to="/dashboard/heroes" className="flex-1">
                  <Button className="w-full">Kelola Hero</Button>
                </Link>
                <Link to="/dashboard/courses" className="flex-1">
                  <Button variant="outline" className="w-full">Kelola Course</Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        {role === 'admin' && (
          <Card className="mt-4 p-6">
            <div className="text-lg font-bold">Admin</div>
            <p className="mt-1 text-sm text-slate-600">Kelola user dan role di menu header: Users.</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link to="/dashboard/users" className="flex-1">
                <Button className="w-full">Kelola Users</Button>
              </Link>
              <Link to="/dashboard/accounting" className="flex-1">
                <Button variant="outline" className="w-full">Pembukuan</Button>
              </Link>
            </div>
          </Card>
        )}
      </Container>
    </section>
  );
}
