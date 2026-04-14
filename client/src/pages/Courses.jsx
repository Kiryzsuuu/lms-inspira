import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Container, Button, Input } from '../components/ui';
import { useAuth } from '../lib/auth';

function formatIdr(n) {
  try {
    return new Intl.NumberFormat('id-ID').format(Number(n) || 0);
  } catch {
    return String(n || 0);
  }
}

export default function Courses() {
  const { api, role, isAuthed } = useAuth();
  const [courses, setCourses] = useState([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/courses').then((res) => setCourses(res.data.courses)).catch(() => setCourses([]));
  }, []);

  async function addToCart(courseId) {
    setError('');
    try {
      await api.post('/cart/items', { courseId });
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal tambah ke cart');
    }
  }

  const filtered = courses.filter((c) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (c.title || '').toLowerCase().includes(s) || (c.description || '').toLowerCase().includes(s);
  });

  return (
    <section className="py-10">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Courses</h1>
            <p className="mt-1 text-sm text-slate-600">Pilih course, baca materi, lalu kerjakan quiz.</p>
          </div>
          <div className="w-full sm:w-80">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari course..." />
          </div>
        </div>

        {error ? <div className="mt-4 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c._id} className="p-5">
              <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                {c.coverImageUrl ? (
                  <img src={c.coverImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600">
                    Cover (opsional)
                  </div>
                )}
              </div>
              <div className="text-lg font-bold text-slate-900">{c.title}</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">Rp {formatIdr(c.priceIdr || 0)}</div>
              <p className="mt-2 text-sm text-slate-600">{c.description}</p>
              <div className="mt-4">
                <Link to={`/courses/${c._id}`}>
                  <Button className="w-full">Buka</Button>
                </Link>
              </div>
              {isAuthed && role === 'student' ? (
                <div className="mt-2">
                  <Button variant="outline" className="w-full" onClick={() => addToCart(c._id)}>
                    Tambah ke Cart
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}

          {filtered.length === 0 && (
            <Card className="p-8 sm:col-span-2 lg:col-span-3">
              <div className="text-sm text-slate-600">Course tidak ditemukan.</div>
            </Card>
          )}
        </div>
      </Container>
    </section>
  );
}
