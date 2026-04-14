import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Container, Button, Input, Label } from '../components/ui';
import { useAuth } from '../lib/auth';

export default function Register() {
  const { api, setToken } = useAuth();
  const nav = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      setToken(res.data.token);
      nav('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Register gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-10">
      <Container className="max-w-lg">
        <Card className="p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight">Register</h1>
          <p className="mt-1 text-sm text-slate-600">Akun baru otomatis role: student.</p>

          {error ? <div className="mt-4 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

          <form className="mt-6 grid gap-4" onSubmit={submit}>
            <div>
              <Label>Nama</Label>
              <div className="mt-1">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <div className="mt-1">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <Label>Password</Label>
              <div className="mt-1">
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <Button disabled={loading} type="submit" className="w-full">
              {loading ? 'Membuat...' : 'Buat akun'}
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
