import { useEffect, useState } from 'react';
import { Card, Container, Button, Input, Label } from '../../components/ui';
import { useAuth } from '../../lib/auth';

export default function HeroManager() {
  const { api } = useAuth();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', subtitle: '', ctaText: 'Mulai', ctaHref: '/courses', imageUrl: '', order: 0, isActive: true });
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/heroes/all');
      setSlides(res.data.slides || []);
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal memuat hero');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createSlide(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/heroes', form);
      setForm({ title: '', subtitle: '', ctaText: 'Mulai', ctaHref: '/courses', imageUrl: '', order: 0, isActive: true });
      await load();
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal membuat hero');
    }
  }

  async function updateSlide(id, patch) {
    setError('');
    try {
      const current = slides.find((s) => s._id === id);
      await api.put(`/heroes/${id}`, { ...current, ...patch });
      await load();
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal update hero');
    }
  }

  async function removeSlide(id) {
    if (!confirm('Hapus slide ini?')) return;
    setError('');
    try {
      await api.delete(`/heroes/${id}`);
      await load();
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal hapus hero');
    }
  }

  return (
    <section className="py-10">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Kelola Hero Carousel</h1>
            <p className="mt-1 text-sm text-slate-600">Tambah/ubah slide. Landing page akan otomatis jadi slider bergeser.</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>

        {error ? <div className="mt-4 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="text-lg font-bold">Buat Slide Baru</div>
            <form className="mt-4 grid gap-3" onSubmit={createSlide}>
              <div>
                <Label>Title</Label>
                <div className="mt-1">
                  <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Subtitle</Label>
                <div className="mt-1">
                  <Input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>CTA Text</Label>
                  <div className="mt-1">
                    <Input value={form.ctaText} onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>CTA Href</Label>
                  <div className="mt-1">
                    <Input value={form.ctaHref} onChange={(e) => setForm((f) => ({ ...f, ctaHref: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Image URL (opsional)</Label>
                  <div className="mt-1">
                    <Input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Order</Label>
                  <div className="mt-1">
                    <Input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <Button type="submit">Tambah Slide</Button>
            </form>
          </Card>

          <Card className="p-6">
            <div className="text-lg font-bold">Daftar Slide</div>
            <div className="mt-4 grid gap-3">
              {slides.map((s) => (
                <Card key={s._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{s.title}</div>
                      <div className="mt-1 text-sm text-slate-600">{s.subtitle}</div>
                      <div className="mt-2 text-xs text-slate-500">Order: {s.order} • Active: {String(s.isActive)}</div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      <Button variant="outline" className="px-3" onClick={() => updateSlide(s._id, { isActive: !s.isActive })}>
                        Toggle
                      </Button>
                      <Button variant="danger" className="px-3" onClick={() => removeSlide(s._id)}>
                        Hapus
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {!loading && slides.length === 0 ? <div className="text-sm text-slate-600">Belum ada slide.</div> : null}
              {loading ? <div className="text-sm text-slate-600">Loading...</div> : null}
            </div>
          </Card>
        </div>
      </Container>
    </section>
  );
}
