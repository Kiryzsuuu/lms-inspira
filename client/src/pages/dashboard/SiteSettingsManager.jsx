import { useEffect, useState } from 'react';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { SidebarShell } from '../../components/SidebarShell';

const DEFAULTS = {
  stats: [
    { num: '500+', label: 'Kursus Premium' },
    { num: '50K+', label: 'Pelajar Aktif' },
    { num: '120+', label: 'Instruktur Expert' },
    { num: '98%', label: 'Tingkat Kepuasan' },
  ],
  heroBadge1Title: 'Sertifikat Diterima',
  heroBadge1Sub: 'Gojek · Tokopedia',
  heroBadge2Title: 'Baru bergabung',
  heroBadge2Sub: 'Budi S. · 2 menit lalu',
  certSampleName: 'Arya Ramadhan',
  certSampleCourse: 'Python untuk Data Science & ML',
  partners: ['Tokopedia', 'Gojek', 'Traveloka', 'BCA Digital'],
  partnerCountText: 'Diakui oleh 300+ perusahaan termasuk',
  testimonialStat: '50K+',
  testimonialStatLabel: 'Pelajar bergabung',
  testimonialQuote: 'Lulusan InspiraLearn 3× lebih cepat mendapat pekerjaan dibanding rata-rata fresh graduate Indonesia.',
  ratingNum: '4.9',
  ratingLabel: 'dari 28.000+ ulasan',
};

export default function SiteSettingsManager() {
  const { api } = useAuth();
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [partnerInput, setPartnerInput] = useState('');

  useEffect(() => {
    api.get('/settings/homePage')
      .then(r => { setForm({ ...DEFAULTS, ...r.data.value }); })
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
    const stats = [...form.stats];
    stats[i] = { ...stats[i], [field]: value };
    setForm(f => ({ ...f, stats }));
  }

  function removePartner(i) {
    setForm(f => ({ ...f, partners: f.partners.filter((_, idx) => idx !== i) }));
  }

  function addPartner() {
    const v = partnerInput.trim();
    if (!v) return;
    setForm(f => ({ ...f, partners: [...(f.partners || []), v] }));
    setPartnerInput('');
  }

  if (loading) return <SidebarShell title="Pengaturan Situs"><div className="p-8 text-sm text-gray-500">Memuat...</div></SidebarShell>;

  return (
    <SidebarShell title="Pengaturan Situs" description="Edit konten halaman utama (Home)">
      <div className="space-y-8 max-w-2xl">

        {/* Stats */}
        <section>
          <h2 className="font-display font-bold text-base text-gray-900 mb-4">Statistik (Bar angka)</h2>
          <div className="space-y-3">
            {(form.stats || DEFAULTS.stats).map((s, i) => (
              <div key={i} className="flex gap-3 items-center">
                <Input
                  className="w-28"
                  placeholder="50K+"
                  value={s.num}
                  onChange={e => updateStat(i, 'num', e.target.value)}
                />
                <Input
                  className="flex-1"
                  placeholder="Label"
                  value={s.label}
                  onChange={e => updateStat(i, 'label', e.target.value)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Hero badges */}
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
              <label className="text-xs text-gray-500 mb-1 block">Nama Penerima</label>
              <Input value={form.certSampleName} onChange={e => setForm(f => ({ ...f, certSampleName: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nama Kursus</label>
              <Input value={form.certSampleCourse} onChange={e => setForm(f => ({ ...f, certSampleCourse: e.target.value }))} />
            </div>
          </div>
        </section>

        {/* Partners */}
        <section>
          <h2 className="font-display font-bold text-base text-gray-900 mb-4">Mitra / Partner</h2>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Teks di atas logo</label>
            <Input className="mb-3" value={form.partnerCountText} onChange={e => setForm(f => ({ ...f, partnerCountText: e.target.value }))} />
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {(form.partners || []).map((p, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: '#EBF6FC', color: '#0C628D' }}>
                {p}
                <button type="button" onClick={() => removePartner(i)} className="hover:text-red-500 font-bold">x</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Tambah nama mitra..." value={partnerInput} onChange={e => setPartnerInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPartner(); } }} />
            <Button type="button" variant="outline" size="sm" onClick={addPartner}>Tambah</Button>
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
                className="w-full rounded-[10px] border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2"
                style={{ minHeight: 80 }}
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

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={save} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Semua'}</Button>
          {msg && <span className="text-sm" style={{ color: msg === 'Tersimpan!' ? '#0FADA8' : '#EF4444' }}>{msg}</span>}
        </div>
      </div>
    </SidebarShell>
  );
}
