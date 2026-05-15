import { useEffect, useState } from 'react';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { SidebarShell } from '../../components/SidebarShell';

const DEFAULTS = {
  heroBadgePrefix: 'Platform Belajar #1 Indonesia',
  heroTitle: 'Kuasai Skill\nyang Dibutuhkan',
  heroAccent: 'Industri Sekarang',
  heroDesc: 'Belajar dari praktisi terbaik. Kurikulum dirancang langsung dari kebutuhan industri — bukan teori kosong.',
  heroBadge1Title: 'Sertifikat Diterima',
  heroBadge1Sub: 'Gojek · Tokopedia',
  heroBadge2Title: 'Baru bergabung',
  heroBadge2Sub: 'Budi S. · 2 menit lalu',
  tickerItems: ['Programming & Dev', 'Data Science', 'UI/UX Design', 'AI & Machine Learning', 'Cybersecurity', 'Digital Marketing', 'Bisnis & Karir', 'Mobile Dev', 'Cloud & DevOps', 'Video & Konten'],
  stats: [
    { num: '500+', label: 'Kursus Premium' },
    { num: '50K+', label: 'Pelajar Aktif' },
    { num: '120+', label: 'Instruktur Expert' },
    { num: '98%', label: 'Tingkat Kepuasan' },
  ],
  certSampleName: 'Arya Ramadhan',
  certSampleCourse: 'Python untuk Data Science & ML',
  partners: ['Tokopedia', 'Gojek', 'Traveloka', 'BCA Digital'],
  partnerCountText: 'Diakui oleh 300+ perusahaan termasuk',
  alumniSectionTitle: 'Alumni kami bekerja di lebih dari 300 perusahaan',
  alumniPartners: ['Tokopedia', 'Gojek', 'Traveloka', 'Bukalapak', 'Telkom', 'BCA Digital', 'Shopee', 'Halodoc', 'Akseleran', 'Blibli'],
  testimonialStat: '50K+',
  testimonialStatLabel: 'Pelajar bergabung',
  testimonialQuote: 'Lulusan InspiraLearn 3× lebih cepat mendapat pekerjaan dibanding rata-rata fresh graduate Indonesia.',
  ratingNum: '4.9',
  ratingLabel: 'dari 28.000+ ulasan',
};

function TagList({ items, onRemove, input, setInput, onAdd, placeholder }) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {(items || []).map((p, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: '#EBF6FC', color: '#0C628D' }}>
            {p}
            <button type="button" onClick={() => onRemove(i)} className="hover:text-red-500 font-bold leading-none">x</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder || 'Tambah item...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
        />
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>Tambah</Button>
      </div>
    </div>
  );
}

export default function SiteSettingsManager() {
  const { api } = useAuth();
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [tickerInput, setTickerInput] = useState('');
  const [partnerInput, setPartnerInput] = useState('');
  const [alumniInput, setAlumniInput] = useState('');

  useEffect(() => {
    api.get('/settings/homePage')
      .then(r => setForm({ ...DEFAULTS, ...r.data.value }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      await api.put('/settings/homePage', form);
      setMsg('Tersimpan!');
    } catch {
      setMsg('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  }

  function updateStat(i, field, value) {
    const stats = [...(form.stats || DEFAULTS.stats)];
    stats[i] = { ...stats[i], [field]: value };
    setForm(f => ({ ...f, stats }));
  }

  function removeFrom(key, i) {
    setForm(f => ({ ...f, [key]: (f[key] || []).filter((_, idx) => idx !== i) }));
  }

  function addTo(key, value, clearFn) {
    const v = value.trim();
    if (!v) return;
    setForm(f => ({ ...f, [key]: [...(f[key] || []), v] }));
    clearFn('');
  }

  if (loading) return <SidebarShell title="Pengaturan Situs"><div className="p-8 text-sm text-gray-500">Memuat...</div></SidebarShell>;

  return (
    <SidebarShell title="Pengaturan Situs" description="Edit konten halaman utama (Home)">
      <div className="space-y-10 max-w-2xl">

        {/* Hero Content */}
        <section>
          <h2 className="font-display font-bold text-base text-gray-900 mb-1">Konten Hero</h2>
          <p className="text-xs text-gray-400 mb-4">Judul, deskripsi, dan teks badge di bagian atas halaman</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Badge (sebelum jumlah kursus)</label>
              <Input value={form.heroBadgePrefix} onChange={e => setForm(f => ({ ...f, heroBadgePrefix: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Judul utama (gunakan Enter untuk baris baru)</label>
              <textarea
                className="w-full rounded-[10px] border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none"
                style={{ minHeight: 64, fontFamily: 'inherit' }}
                value={form.heroTitle}
                onChange={e => setForm(f => ({ ...f, heroTitle: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Kata aksen (warna oranye)</label>
              <Input value={form.heroAccent} onChange={e => setForm(f => ({ ...f, heroAccent: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Deskripsi singkat</label>
              <textarea
                className="w-full rounded-[10px] border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none"
                style={{ minHeight: 72, fontFamily: 'inherit' }}
                value={form.heroDesc}
                onChange={e => setForm(f => ({ ...f, heroDesc: e.target.value }))}
              />
            </div>
          </div>
        </section>

        {/* Running Text */}
        <section>
          <h2 className="font-display font-bold text-base text-gray-900 mb-1">Running Text (Ticker)</h2>
          <p className="text-xs text-gray-400 mb-4">Item yang bergulir di bar gelap. Kosongkan untuk menggunakan nama kategori dari DB.</p>
          <TagList
            items={form.tickerItems}
            onRemove={i => removeFrom('tickerItems', i)}
            input={tickerInput}
            setInput={setTickerInput}
            onAdd={() => addTo('tickerItems', tickerInput, setTickerInput)}
            placeholder="Tambah item ticker..."
          />
        </section>

        {/* Stats bar */}
        <section>
          <h2 className="font-display font-bold text-base text-gray-900 mb-4">Statistik (Bar Angka)</h2>
          <div className="space-y-3">
            {(form.stats || DEFAULTS.stats).map((s, i) => (
              <div key={i} className="flex gap-3 items-center">
                <Input className="w-28" placeholder="50K+" value={s.num} onChange={e => updateStat(i, 'num', e.target.value)} />
                <Input className="flex-1" placeholder="Label" value={s.label} onChange={e => updateStat(i, 'label', e.target.value)} />
              </div>
            ))}
          </div>
        </section>

        {/* Hero floating badges */}
        <section>
          <h2 className="font-display font-bold text-base text-gray-900 mb-4">Badge Mengambang di Hero</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Badge 1</div>
              <Input placeholder="Judul" value={form.heroBadge1Title} onChange={e => setForm(f => ({ ...f, heroBadge1Title: e.target.value }))} />
              <Input placeholder="Subteks" value={form.heroBadge1Sub} onChange={e => setForm(f => ({ ...f, heroBadge1Sub: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Badge 2</div>
              <Input placeholder="Judul" value={form.heroBadge2Title} onChange={e => setForm(f => ({ ...f, heroBadge2Title: e.target.value }))} />
              <Input placeholder="Subteks" value={form.heroBadge2Sub} onChange={e => setForm(f => ({ ...f, heroBadge2Sub: e.target.value }))} />
            </div>
          </div>
        </section>

        {/* Certificate */}
        <section>
          <h2 className="font-display font-bold text-base text-gray-900 mb-4">Contoh Sertifikat</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nama penerima</label>
              <Input value={form.certSampleName} onChange={e => setForm(f => ({ ...f, certSampleName: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nama kursus</label>
              <Input value={form.certSampleCourse} onChange={e => setForm(f => ({ ...f, certSampleCourse: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Teks di atas logo (di kartu sertifikat)</label>
              <Input value={form.partnerCountText} onChange={e => setForm(f => ({ ...f, partnerCountText: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Logo perusahaan (di kartu sertifikat)</label>
              <TagList
                items={form.partners}
                onRemove={i => removeFrom('partners', i)}
                input={partnerInput}
                setInput={setPartnerInput}
                onAdd={() => addTo('partners', partnerInput, setPartnerInput)}
                placeholder="Tambah nama perusahaan..."
              />
            </div>
          </div>
        </section>

        {/* Alumni partners */}
        <section>
          <h2 className="font-display font-bold text-base text-gray-900 mb-1">Mitra Alumni</h2>
          <p className="text-xs text-gray-400 mb-4">Logo perusahaan di bagian "Alumni kami bekerja di..."</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Teks judul seksi</label>
              <Input value={form.alumniSectionTitle} onChange={e => setForm(f => ({ ...f, alumniSectionTitle: e.target.value }))} />
            </div>
            <TagList
              items={form.alumniPartners}
              onRemove={i => removeFrom('alumniPartners', i)}
              input={alumniInput}
              setInput={setAlumniInput}
              onAdd={() => addTo('alumniPartners', alumniInput, setAlumniInput)}
              placeholder="Tambah nama perusahaan..."
            />
          </div>
        </section>

        {/* Testimonials sidebar */}
        <section>
          <h2 className="font-display font-bold text-base text-gray-900 mb-4">Sidebar Testimoni</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Angka besar</label>
                <Input value={form.testimonialStat} onChange={e => setForm(f => ({ ...f, testimonialStat: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Label</label>
                <Input value={form.testimonialStatLabel} onChange={e => setForm(f => ({ ...f, testimonialStatLabel: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Kutipan</label>
              <textarea
                className="w-full rounded-[10px] border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none"
                style={{ minHeight: 80, fontFamily: 'inherit' }}
                value={form.testimonialQuote}
                onChange={e => setForm(f => ({ ...f, testimonialQuote: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Angka rating</label>
                <Input value={form.ratingNum} onChange={e => setForm(f => ({ ...f, ratingNum: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Label rating</label>
                <Input value={form.ratingLabel} onChange={e => setForm(f => ({ ...f, ratingLabel: e.target.value }))} />
              </div>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-3 pt-2 pb-8">
          <Button onClick={save} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Semua'}</Button>
          {msg && <span className="text-sm" style={{ color: msg === 'Tersimpan!' ? '#0FADA8' : '#EF4444' }}>{msg}</span>}
        </div>
      </div>
    </SidebarShell>
  );
}
