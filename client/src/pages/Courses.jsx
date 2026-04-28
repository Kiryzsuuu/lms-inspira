import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Container, Button, Input } from '../components/ui';
import { useAuth } from '../lib/auth';

function formatIdr(n) {
  try {
    return new Intl.NumberFormat('id-ID').format(Number(n) || 0);
  } catch {
    return String(n || 0);
  }
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

export default function Courses() {
  const { api, role, isAuthed } = useAuth();
  const nav = useNavigate();
  const [courses, setCourses] = useState([]);
  const [purchasedCourseIds, setPurchasedCourseIds] = useState(new Set());
  const [completedCourseIds, setCompletedCourseIds] = useState(new Set());
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [q, setQ] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    api.get('/courses').then((res) => setCourses(res.data.courses || [])).catch(() => setCourses([]));

    function onProgressChanged() {
      loadStudentState();
    }

    async function loadStudentState() {
      if (!isAuthed) {
        if (!cancelled) {
          setPurchasedCourseIds(new Set());
          setCompletedCourseIds(new Set());
          setActiveCourseId(null);
        }
        return;
      }

      try {
        const [myRes, progRes] = await Promise.all([api.get('/courses/my-courses'), api.get('/progress/me')]);
        const purchasedIds = new Set((myRes.data.courses || []).map((c) => c._id));
        const completedIds = new Set((progRes.data.completedCourseIds || []).map((x) => String(x)));
        const activeId = progRes.data.activeCourseId ? String(progRes.data.activeCourseId) : null;
        if (!cancelled) {
          setPurchasedCourseIds(purchasedIds);
          setCompletedCourseIds(completedIds);
          setActiveCourseId(activeId);
        }
      } catch {
        if (!cancelled) {
          setPurchasedCourseIds(new Set());
          setCompletedCourseIds(new Set());
          setActiveCourseId(null);
        }
      }
    }

    window.addEventListener('progress:changed', onProgressChanged);
    loadStudentState();

    return () => {
      cancelled = true;
      window.removeEventListener('progress:changed', onProgressChanged);
    };
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
    const isFree = !c.priceIdr || c.priceIdr === 0;

    const matchesSearch = !q.trim() ||
      (c.title || '').toLowerCase().includes(q.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(q.toLowerCase());

    const matchesPrice =
      priceFilter === 'all' ||
      (priceFilter === 'free' && isFree) ||
      (priceFilter === 'paid' && !isFree);

    return matchesSearch && matchesPrice;
  });

  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="py-12">
        <Container>
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-3">Jelajahi Kursus</h1>
            <p className="text-lg text-slate-600">Pilih kursus yang sesuai dengan kebutuhan Anda dan mulai belajar hari ini</p>
          </div>

          {/* Search and Filter */}
          <div className="space-y-6">
            {/* Search Bar */}
            <div>
              <div className="relative">
                <svg className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari kursus berdasarkan nama atau deskripsi..."
                  className="pl-12 py-3 text-base"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setPriceFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  priceFilter === 'all'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
              >
                Semua Kursus ({courses.length})
              </button>
              <button
                onClick={() => setPriceFilter('free')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  priceFilter === 'free'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
              >
                Gratis ({courses.filter(c => !c.priceIdr || c.priceIdr === 0).length})
              </button>
              <button
                onClick={() => setPriceFilter('paid')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  priceFilter === 'paid'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
              >
                Berbayar ({courses.filter(c => c.priceIdr && c.priceIdr > 0).length})
              </button>
            </div>
          </div>

          {error && <div className="mt-6 bg-rose-50 border border-rose-200 rounded-lg p-4 text-sm text-rose-700">{error}</div>}

          {/* Course Grid */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => {
              const isFree = !c.priceIdr || c.priceIdr === 0;
              const isPurchased = purchasedCourseIds.has(c._id);
              const isCompleted = completedCourseIds.has(String(c._id));
              const isOngoing = isAuthed && activeCourseId && String(c._id) === String(activeCourseId) && !isCompleted;
              const shouldBeGrayed = isAuthed && !isFree && !isPurchased;

              return (
                <Card
                  key={c._id}
                  className={`overflow-hidden flex h-full flex-col hover:shadow-lg transition-shadow ${shouldBeGrayed ? 'opacity-60' : ''}`}
                >
                  {/* Course Image */}
                  <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
                    {c.coverImageUrl ? (
                      <img src={c.coverImageUrl} alt={c.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-200">
                        <svg className="h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute top-3 right-3">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white px-3 py-1 text-xs font-bold shadow-lg">
                          <span>✓</span> Selesai
                        </span>
                      ) : isOngoing ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-white px-3 py-1 text-xs font-bold shadow-lg">
                          ► Berlangsung
                        </span>
                      ) : isFree ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500 text-white px-3 py-1 text-xs font-bold shadow-lg">
                          Gratis
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="flex-1 p-5 flex flex-col">
                    <h3 className="font-bold text-lg text-slate-900 line-clamp-2">{c.title}</h3>

                    <p className="mt-2 text-sm text-slate-600 line-clamp-2 flex-1">{stripHtml(c.description) || 'Kursus berkualitas untuk pengembangan skill Anda'}</p>

                    {/* Price */}
                    {!isFree && (
                      <div className="mt-4 text-lg font-bold text-primary">
                        Rp {formatIdr(c.priceIdr)}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-4 space-y-2 sm:space-y-0 sm:flex gap-2">
                      {!isAuthed ? (
                        <Button className="w-full bg-primary  text-white" onClick={() => nav('/login')}>
                          Login untuk Lihat
                        </Button>
                      ) : purchasedCourseIds.has(c._id) ? (
                        <Link to={`/courses/${c._id}`} className="w-full">
                          <Button className="w-full bg-primary  text-white">
                            Buka Kursus
                          </Button>
                        </Link>
                      ) : (
                        <>
                          <Link to={`/courses/${c._id}`} className="flex-1">
                            <Button variant="outline" className="w-full">Detail</Button>
                          </Link>
                          {role === 'student' && (
                            <Button
                              className="flex-1 bg-primary  text-white"
                              onClick={() => addToCart(c._id)}
                            >
                              + Cart
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            {filtered.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3">
                <Card className="p-12 text-center">
                  <div className="text-slate-600">
                    <svg className="h-16 w-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-semibold mb-2">Kursus Tidak Ditemukan</p>
                    <p className="text-sm text-slate-500">Coba ubah filter atau cari dengan kata kunci lain</p>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </Container>
      </section>
    </div>
  );
}
