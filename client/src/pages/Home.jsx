import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Container, Button } from '../components/ui';
import { HeroCarousel } from '../components/HeroCarousel';
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

export default function Home() {
  const { api, isAuthed, role } = useAuth();
  const [courses, setCourses] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);
  const [heroText, setHeroText] = useState({
    kicker: 'Belajar & Quiz Interaktif',
    heading: 'Belajar Skill Baru, Setiap Hari',
    subheading: 'Akses ribuan course dengan quiz interaktif untuk pengembangan skill Anda.',
  });

  useEffect(() => {
    api.get('/heroes/text').then((res) => setHeroText(res.data.text || heroText)).catch(() => {});
    api.get('/heroes').then((res) => setHeroSlides(res.data.slides || [])).catch(() => setHeroSlides([]));
    api.get('/courses').then((res) => setCourses(res.data.courses || [])).catch(() => setCourses([]));
  }, [api, heroText]);

  const publishedCourses = Array.isArray(courses) ? courses.filter(c => c.isPublished !== false) : [];
  const featuredCourses = publishedCourses.slice(0, 6);

  return (
    <div className="bg-white">
      {/* Hero Carousel with text overlay */}
      <HeroCarousel
        slides={heroSlides}
        kicker={heroText.kicker}
        heading={heroText.heading}
        subheading={heroText.subheading}
        showCta
        isAuthed={isAuthed}
      />

      {/* Stats Section */}
      <section className="py-16 relative z-10">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <div className="text-3xl font-extrabold text-primary">{publishedCourses.length}+</div>
              <p className="mt-2 text-sm text-slate-600">Kursus Berkualitas</p>
              <p className="text-xs text-slate-500 mt-1">Siap untuk Anda pelajari</p>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-3xl font-extrabold text-primary">500+</div>
              <p className="mt-2 text-sm text-slate-600">Peserta Aktif</p>
              <p className="text-xs text-slate-500 mt-1">Bergabung dan berkembang bersama</p>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-3xl font-extrabold text-primary">100%</div>
              <p className="mt-2 text-sm text-slate-600">Sertifikat Resmi</p>
              <p className="text-xs text-slate-500 mt-1">Setelah menyelesaikan kursus</p>
            </Card>
          </div>
        </Container>
      </section>

      {/* Featured Courses Section */}
      <section className="py-16">
        <Container>
          <div className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Kursus Unggulan</h2>
                <p className="mt-2 text-slate-600">Mulai perjalanan belajar Anda hari ini dengan kursus-kursus terbaik kami</p>
              </div>
              <Link to="/courses" className="hidden sm:block">
                <Button variant="outline">Lihat Semua Kursus</Button>
              </Link>
            </div>
          </div>

          {featuredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map((c) => {
                const isFree = !c.priceIdr || c.priceIdr === 0;
                return (
                  <Card key={c._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video overflow-hidden bg-slate-100 relative">
                      {c.coverImageUrl ? (
                        <img src={c.coverImageUrl} alt={c.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                          <svg className="h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {isFree && (
                        <span className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          GRATIS
                        </span>
                      )}
                      {!isFree && (
                        <span className="absolute top-3 right-3 bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Rp {formatIdr(c.priceIdr)}
                        </span>
                      )}
                    </div>
                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide">Kursus</p>
                      <h3 className="mt-2 text-lg font-bold text-slate-900 line-clamp-2">{c.title}</h3>
                      <p className="mt-3 text-sm text-slate-600 line-clamp-2">{stripHtml(c.description) || 'Tingkatkan skill dan pengetahuan Anda dengan kursus ini'}</p>
                      <div className="mt-6">
                        <Link to={`/courses/${c._id}`} className="block">
                          <Button className="w-full bg-primary  text-white">
                            Lihat Detail
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="text-slate-600">
                <svg className="h-12 w-12 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C6.5 6.253 2 9.866 2 14.5S6.5 22.747 12 22.747s10-3.613 10-8.247S17.5 6.253 12 6.253z" />
                </svg>
                <p className="text-lg font-semibold mb-2">Belum Ada Kursus</p>
                <p className="text-sm">Kursus baru akan segera tersedia. Pantau halaman ini untuk update terbaru.</p>
              </div>
            </Card>
          )}

          <div className="mt-8 sm:hidden">
            <Link to="/courses">
              <Button variant="outline" className="w-full">
                Lihat Semua Kursus
              </Button>
            </Link>
          </div>
        </Container>
      </section>

    </div>
  );
}
