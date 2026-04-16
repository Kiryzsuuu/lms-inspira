import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Container, Button, Input, Label } from '../components/ui';
import { useAuth } from '../lib/auth';

const EDUCATION_LEVELS = [
  'SD/MI', 'SMP/MTs', 'SMA/SMK/MA', 'D3', 'S1', 'S2', 'S3'
];

const REFERRAL_SOURCES = [
  'Media Sosial', 'Rekomendasi', 'Search Engine', 'Teman/Keluarga', 'Lainnya'
];

export default function Register() {
  const { api, setToken } = useAuth();
  const nav = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    email: '',
    password: '',
    whatsappNumber: '',
    institution: '',
    referralSource: '',
    reason: '',
    educationLevel: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Validate required fields
      if (!formData.name.trim()) throw new Error('Username harus diisi');
      if (!formData.fullName.trim()) throw new Error('Nama Lengkap harus diisi');
      if (!formData.email.trim()) throw new Error('Email harus diisi');
      if (!formData.password.trim()) throw new Error('Password harus diisi');

      const res = await api.post('/auth/register', formData);
      if (res?.data?.requiresOtp) {
        nav(`/otp?flow=register&email=${encodeURIComponent(res.data.email || formData.email)}`, {
          replace: true,
          state: { devOtp: res?.data?.devOtp || '' },
        });
        return;
      }
      setToken(res.data.token);
      nav('/courses', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Register gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-10">
      <Container className="max-w-2xl">
        <Card className="p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight">Daftar Akun Baru</h1>
          <p className="mt-1 text-sm text-slate-600">Isi form berikut untuk membuat akun. Akun baru otomatis role: student.</p>

          {error ? <div className="mt-4 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

          <form className="mt-6 grid gap-4" onSubmit={submit}>
            {/* Username & Password */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Minimal 6 karakter"
                />
              </div>
            </div>

            {/* Nama Lengkap */}
            <div>
              <Label>Nama Lengkap <span className="text-rose-600">*</span> (Pastikan sudah benar, untuk keperluan sertifikat)</Label>
              <Input
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="Nama lengkap Anda"
              />
            </div>

            {/* Email */}
            <div>
              <Label>Email <span className="text-rose-600">*</span> (Pastikan sudah benar)</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            {/* Asal Lembaga */}
            <div>
              <Label>Asal Lembaga/Instansi</Label>
              <Input
                value={formData.institution}
                onChange={(e) => handleChange('institution', e.target.value)}
                placeholder="Nama sekolah, universitas, atau perusahaan"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <Label>No WhatsApp <span className="text-rose-600">*</span> (Pastikan sudah benar)</Label>
              <Input
                value={formData.whatsappNumber}
                onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                placeholder="62812345678"
              />
            </div>

            {/* Dari mana tahunya */}
            <div>
              <Label>Dari mana tahunya tentang kami?</Label>
              <select
                value={formData.referralSource}
                onChange={(e) => handleChange('referralSource', e.target.value)}
                className="w-full border border-slate-200 bg-white px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">Pilih sumber</option>
                {REFERRAL_SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>

            {/* Alasan */}
            <div>
              <Label>Alasan bergabung dengan program ini</Label>
              <textarea
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                placeholder="Ceritakan motivasi Anda mengikuti program ini"
                className="w-full border border-slate-200 px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
                rows={3}
              />
            </div>

            {/* Pendidikan Terakhir */}
            <div>
              <Label>Pendidikan Terakhir</Label>
              <select
                value={formData.educationLevel}
                onChange={(e) => handleChange('educationLevel', e.target.value)}
                className="w-full border border-slate-200 bg-white px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">Pilih tingkat pendidikan</option>
                {EDUCATION_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <Button disabled={loading} type="submit" className="w-full bg-[#d76810] text-white hover:bg-[#c55a0a]">
              {loading ? 'Membuat Akun...' : 'Daftar'}
            </Button>
          </form>

          <div className="mt-4 text-sm text-slate-600">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-semibold text-slate-900 hover:underline">
              Login
            </Link>
          </div>
        </Card>
      </Container>
    </section>
  );
}
