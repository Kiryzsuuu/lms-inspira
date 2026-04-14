import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Container, Input, Label } from '../components/ui';
import { useAuth } from '../lib/auth';

export default function ForgotPassword() {
  const { api } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setStatus('');
    setDevResetUrl('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setStatus('Jika email terdaftar, link reset akan dikirim.');
      if (res?.data?.devResetUrl) setDevResetUrl(res.data.devResetUrl);
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Gagal memproses permintaan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-10">
      <Container className="max-w-lg">
        <Card className="p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight">Lupa Password</h1>
          <p className="mt-1 text-sm text-slate-600">Masukkan email untuk menerima link reset password.</p>

          {error ? <div className="mt-4 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
          {status ? <div className="mt-4 bg-emerald-50 p-3 text-sm text-emerald-700">{status}</div> : null}

          <form className="mt-6 grid gap-4" onSubmit={submit}>
            <div>
              <Label>Email</Label>
              <div className="mt-1">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </div>

            <Button disabled={loading} type="submit" className="w-full">
              {loading ? 'Mengirim...' : 'Kirim link reset'}
            </Button>
          </form>

          {devResetUrl ? (
            <div className="mt-6 bg-slate-50 p-4 text-xs text-slate-700">
              <div className="font-semibold">Dev reset URL (SMTP belum dikonfigurasi):</div>
              <a className="break-all font-semibold text-slate-900 hover:underline" href={devResetUrl}>
                {devResetUrl}
              </a>
            </div>
          ) : null}

          <div className="mt-4 text-sm text-slate-600">
            Kembali ke{' '}
            <Link to="/login" className="font-semibold text-slate-900 hover:underline">
              Login
            </Link>
          </div>
        </Card>
      </Container>
    </section>
  );
}
