import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeroCarousel } from '../components/HeroCarousel';
import { Card, Container, Button } from '../components/ui';
import { useAuth } from '../lib/auth';

export default function Home() {
  const { api } = useAuth();
  const [slides, setSlides] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.get('/heroes').then((res) => setSlides(res.data.slides)).catch(() => setSlides([]));
    api.get('/courses').then((res) => setCourses(res.data.courses)).catch(() => setCourses([]));
  }, []);

  return (
    <>
      <HeroCarousel slides={slides} />

      <section className="pb-14">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Course Populer</h2>
              <p className="mt-1 text-sm text-slate-600">Mulai belajar, lalu lanjutkan dengan quiz interaktif.</p>
            </div>
            <Link to="/courses" className="hidden sm:block">
              <Button variant="outline">Lihat semua</Button>
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 6).map((c) => (
              <Card key={c._id} className="p-5">
                <div className="flex flex-col gap-2">
                  <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                    {c.coverImageUrl ? (
                      <img src={c.coverImageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600">
                        Cover (opsional)
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Course</div>
                  <div className="text-lg font-bold text-slate-900">{c.title}</div>
                  <div className="mt-2">
                    <Link to={`/courses/${c._id}`}>
                      <Button>Detail</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}

            {courses.length === 0 && (
              <Card className="p-8 text-left sm:col-span-2 lg:col-span-3">
                <div className="text-sm text-slate-600">Belum ada course dipublish. Jalankan seed untuk demo.</div>
              </Card>
            )}
          </div>

          <div className="mt-6 sm:hidden">
            <Link to="/courses">
              <Button variant="outline" className="w-full">Lihat semua</Button>
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
