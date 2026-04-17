import { useEffect, useMemo, useState } from 'react';
import { Container } from './ui';

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
    <section className="pt-0">
      {/* Full-width hero image (edge-to-edge, no box, no top gap) */}
      <Container className="max-w-none px-0 mx-0">
        <div className="aspect-video w-full overflow-hidden bg-slate-100">
          <img src={slide?.imageUrl || '/hero-frame.png'} alt="" className="h-full w-full object-cover" />
        </div>
      </Container>
    </section>
  );
}

