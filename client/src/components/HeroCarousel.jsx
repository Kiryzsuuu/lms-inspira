import { useEffect, useMemo, useState } from 'react';
import { Card, Container, Button } from './ui';

export function HeroCarousel({ slides }) {
  const activeSlides = useMemo(() => (slides || []).filter((s) => s.isActive !== false), [slides]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [activeSlides.length]);

  const slide = activeSlides[index] || null;

  return (
    <section className="py-10 sm:py-14">
      <Container>
        <Card className="p-3 sm:p-4">
          <div className="relative">
            <div className="aspect-video w-full overflow-hidden bg-slate-100">
              <img src={slide?.imageUrl || '/hero-frame.png'} alt="" className="h-full w-full object-cover" />
            </div>

            {activeSlides.length > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-2">
                  {activeSlides.map((_, i) => (
                    <button
                      key={i}
                      aria-label={`slide-${i + 1}`}
                      onClick={() => setIndex(i)}
                      className={'h-2 w-2 ' + (i === index ? 'bg-slate-900' : 'bg-slate-300 hover:bg-slate-400')}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="px-3"
                    onClick={() => setIndex((i) => (i - 1 + activeSlides.length) % activeSlides.length)}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    className="px-3"
                    onClick={() => setIndex((i) => (i + 1) % activeSlides.length)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="mt-7 sm:mt-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Belajar & Quiz Interaktif</p>
          <h1 className="mt-2 text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {slide?.title || 'Platform LMS + Quiz'}
          </h1>
          <p className="mt-3 text-pretty text-slate-600">{slide?.subtitle || 'Course singkat + quiz interaktif.'}</p>
        </div>
      </Container>
    </section>
  );
}
