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
  footerTagline: 'Platform belajar online untuk profesional Indonesia yang ingin naik level karir dengan skill nyata dari industri.',
  footerSocials: [
    { label: 'IG', href: '#' },
    { label: 'YT', href: '#' },
    { label: 'in', href: '#' },
    { label: 'X', href: '#' },
  ],
  footerNavCols: [
    { title: 'Produk', links: [
      { label: 'Online Courses', href: '/courses' },
      { label: 'Sertifikasi', href: '/' },
      { label: 'Program Korporat', href: '/' },
    ]},
    { title: 'Perusahaan', links: [
      { label: 'Tentang Kami', href: '/tentang-kami' },
      { label: 'Blog', href: '/' },
      { label: 'Karir', href: '/' },
    ]},
    { title: 'Bantuan', links: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Hubungi Kami', href: 'mailto:support@inspiratekno.com' },
      { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
      { label: 'Syarat & Ketentuan', href: '/' },
    ]},
  ],
  footerBottomLinks: [
    { label: 'Privasi', href: '#' },
    { label: 'Syarat', href: '#' },
    { label: 'Cookie', href: '#' },
  ],
  footerCopyright: 'InspiraLearn by Inspiratekno. All rights reserved.',
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

        {/* Footer */}
        <section>
          <h2 className="font-display font-bold text-base text-gray-900 mb-1">Footer</h2>
          <p className="text-xs text-gray-400 mb-4">Semua teks dan link di footer halaman</p>
          <div className="space-y-5">
            {/* Tagline */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tagline brand</label>
              <textarea
                className="w-full rounded-[10px] border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none"
                style={{ minHeight: 64, fontFamily: 'inherit' }}
                value={form.footerTagline}
                onChange={e => setForm(f => ({ ...f, footerTagline: e.target.value }))}
              />
            </div>

            {/* Copyright */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Teks hak cipta (setelah © tahun)</label>
              <Input value={form.footerCopyright} onChange={e => setForm(f => ({ ...f, footerCopyright: e.target.value }))} />
            </div>

            {/* Socials */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block font-semibold">Ikon Sosial Media</label>
              <div className="space-y-2">
                {(form.footerSocials || DEFAULTS.footerSocials).map((sc, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input className="w-20" placeholder="Label" value={sc.label}
                      onChange={e => {
                        const arr = [...(form.footerSocials || DEFAULTS.footerSocials)];
                        arr[i] = { ...arr[i], label: e.target.value };
                        setForm(f => ({ ...f, footerSocials: arr }));
                      }} />
                    <Input className="flex-1" placeholder="URL (https://...)" value={sc.href}
                      onChange={e => {
                        const arr = [...(form.footerSocials || DEFAULTS.footerSocials)];
                        arr[i] = { ...arr[i], href: e.target.value };
                        setForm(f => ({ ...f, footerSocials: arr }));
                      }} />
                    <button type="button"
                      onClick={() => setForm(f => ({ ...f, footerSocials: (f.footerSocials || []).filter((_, idx) => idx !== i) }))}
                      className="text-rose-400 hover:text-rose-600 font-bold text-base px-1">×</button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm"
                  onClick={() => setForm(f => ({ ...f, footerSocials: [...(f.footerSocials || []), { label: '', href: '#' }] }))}>
                  + Tambah Sosial
                </Button>
              </div>
            </div>

            {/* Nav columns */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block font-semibold">Kolom Navigasi</label>
              <div className="space-y-5">
                {(form.footerNavCols || DEFAULTS.footerNavCols).map((col, ci) => (
                  <div key={ci} className="rounded-[10px] border border-gray-200 p-4 space-y-2">
                    <div className="flex gap-2 items-center mb-1">
                      <Input className="flex-1 font-semibold" placeholder="Judul kolom (Produk, dll)" value={col.title}
                        onChange={e => {
                          const cols = [...(form.footerNavCols || DEFAULTS.footerNavCols)];
                          cols[ci] = { ...cols[ci], title: e.target.value };
                          setForm(f => ({ ...f, footerNavCols: cols }));
                        }} />
                      <button type="button"
                        onClick={() => setForm(f => ({ ...f, footerNavCols: (f.footerNavCols || []).filter((_, idx) => idx !== ci) }))}
                        className="text-rose-400 hover:text-rose-600 text-xs font-bold px-2 py-1 border border-rose-200 rounded-lg">Hapus kolom</button>
                    </div>
                    {(col.links || []).map((link, li) => (
                      <div key={li} className="flex gap-2 items-center">
                        <Input className="w-[38%]" placeholder="Label" value={link.label}
                          onChange={e => {
                            const cols = [...(form.footerNavCols || DEFAULTS.footerNavCols)];
                            const links = [...cols[ci].links];
                            links[li] = { ...links[li], label: e.target.value };
                            cols[ci] = { ...cols[ci], links };
                            setForm(f => ({ ...f, footerNavCols: cols }));
                          }} />
                        <Input className="flex-1" placeholder="URL (/courses atau mailto:...)" value={link.href}
                          onChange={e => {
                            const cols = [...(form.footerNavCols || DEFAULTS.footerNavCols)];
                            const links = [...cols[ci].links];
                            links[li] = { ...links[li], href: e.target.value };
                            cols[ci] = { ...cols[ci], links };
                            setForm(f => ({ ...f, footerNavCols: cols }));
                          }} />
                        <button type="button"
                          onClick={() => {
                            const cols = [...(form.footerNavCols || DEFAULTS.footerNavCols)];
                            cols[ci] = { ...cols[ci], links: cols[ci].links.filter((_, idx) => idx !== li) };
                            setForm(f => ({ ...f, footerNavCols: cols }));
                          }}
                          className="text-rose-400 hover:text-rose-600 font-bold text-base px-1">×</button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm"
                      onClick={() => {
                        const cols = [...(form.footerNavCols || DEFAULTS.footerNavCols)];
                        cols[ci] = { ...cols[ci], links: [...(cols[ci].links || []), { label: '', href: '/' }] };
                        setForm(f => ({ ...f, footerNavCols: cols }));
                      }}>+ Link</Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm"
                  onClick={() => setForm(f => ({ ...f, footerNavCols: [...(f.footerNavCols || []), { title: 'Kolom Baru', links: [] }] }))}>
                  + Tambah Kolom
                </Button>
              </div>
            </div>

            {/* Bottom links */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block font-semibold">Link Bawah (Privasi, Syarat, dll)</label>
              <div className="space-y-2">
                {(form.footerBottomLinks || DEFAULTS.footerBottomLinks).map((link, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input className="w-[30%]" placeholder="Label" value={link.label}
                      onChange={e => {
                        const arr = [...(form.footerBottomLinks || DEFAULTS.footerBottomLinks)];
                        arr[i] = { ...arr[i], label: e.target.value };
                        setForm(f => ({ ...f, footerBottomLinks: arr }));
                      }} />
                    <Input className="flex-1" placeholder="URL" value={link.href}
                      onChange={e => {
                        const arr = [...(form.footerBottomLinks || DEFAULTS.footerBottomLinks)];
                        arr[i] = { ...arr[i], href: e.target.value };
                        setForm(f => ({ ...f, footerBottomLinks: arr }));
                      }} />
                    <button type="button"
                      onClick={() => setForm(f => ({ ...f, footerBottomLinks: (f.footerBottomLinks || []).filter((_, idx) => idx !== i) }))}
                      className="text-rose-400 hover:text-rose-600 font-bold text-base px-1">×</button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm"
                  onClick={() => setForm(f => ({ ...f, footerBottomLinks: [...(f.footerBottomLinks || []), { label: '', href: '#' }] }))}>
                  + Tambah Link
                </Button>
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
