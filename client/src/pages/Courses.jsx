import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeroCarousel } from '../components/HeroCarousel';
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
  const nav = useNavigate();
  const [courses, setCourses] = useState([]);
  const [purchasedCourseIds, setPurchasedCourseIds] = useState(new Set());
  const [slides, setSlides] = useState([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/heroes').then((res) => setSlides(res.data.slides)).catch(() => setSlides([]));
    api.get('/courses').then((res) => setCourses(res.data.courses)).catch(() => setCourses([]));

    // Clear purchased list if not authed
    if (!isAuthed) {
      setPurchasedCourseIds(new Set());
      return;
    }

    // Load purchased courses if authed
    api.get('/courses/my-courses')
      .then((res) => {
        const ids = new Set((res.data.courses || []).map(c => c._id));
        setPurchasedCourseIds(ids);
      })
      .catch(() => setPurchasedCourseIds(new Set()));
  }, [isAuthed, api]);

  async function addToCart(courseId) {
    setError('');
    try {
      await api.post('/cart/items', { courseId });
      window.dispatchEvent(new Event('cart:changed'));
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
    <>
      <HeroCarousel slides={slides} />

      <section className="mt-9 pb-14">
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
          {filtered.map((c) => {
            const isFree = !c.priceIdr || c.priceIdr === 0;
            const isPurchased = purchasedCourseIds.has(c._id);
            const shouldBeGrayed = isAuthed && !isFree && !isPurchased;

            return (
              <Card 
                key={c._id} 
                className={`flex h-full flex-col p-5 ${shouldBeGrayed ? 'opacity-60' : ''}`}
              >
                <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                  {c.coverImageUrl ? (
                    <img src={c.coverImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600">
                      Cover (opsional)
                    </div>
                  )}
                </div>
                <div className="mt-3 line-clamp-2 min-h-[3.25rem] text-lg font-bold leading-snug text-slate-900">
                  {c.title}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Rp {formatIdr(c.priceIdr || 0)}</div>

                <div className="mt-auto pt-4 flex gap-2 flex-col sm:flex-row">
                  {!isAuthed ? (
                    <Button
                      className="w-full"
                      onClick={() => nav('/login')}
                    >
                      Login untuk Lihat
                    </Button>
                  ) : purchasedCourseIds.has(c._id) ? (
                    <Link to={`/courses/${c._id}`} className="w-full">
                      <Button className="w-full">Buka</Button>
                    </Link>
                  ) : (
                    <>
                      <Link to={`/courses/${c._id}`} className="flex-1">
                        <Button variant="outline" className="w-full">Detail</Button>
                      </Link>
                      {role === 'student' && (
                        <Button
                          variant="default"
                          className="flex-1"
                          onClick={() => addToCart(c._id)}
                        >
                          Tambah ke Cart
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <Card className="p-8 sm:col-span-2 lg:col-span-3">
              <div className="text-sm text-slate-600">Course tidak ditemukan.</div>
            </Card>
          )}
        </div>
        </Container>
      </section>
    </>
  );
}
