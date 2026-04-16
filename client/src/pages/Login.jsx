import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Card, Container, Button, Input, Label } from '../components/ui';
import { useAuth } from '../lib/auth';

export default function Login() {
  const { api, isAuthed, setToken } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const nextPath = location.state?.from?.pathname || '/courses';

  if (isAuthed) return <Navigate to={nextPath} replace />;

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setToken(res.data.token);
      nav(nextPath, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-10">
      <Container className="max-w-lg">
        <Card className="p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight">Login</h1>
          <p className="mt-1 text-sm text-slate-600">Masuk untuk mengerjakan quiz atau kelola konten.</p>

          {error ? <div className="mt-4 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

          <form className="mt-6 grid gap-4" onSubmit={submit}>
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
              {loading ? 'Masuk...' : 'Masuk'}
            </Button>
          </form>

          <div className="mt-4 text-sm text-slate-600">
            Belum punya akun?{' '}
            <Link to="/register" className="font-semibold text-slate-900 hover:underline">
              Register
            </Link>
          </div>

          <div className="mt-2 text-sm text-slate-600">
            Lupa password?{' '}
            <Link to="/forgot-password" className="font-semibold text-slate-900 hover:underline">
              Reset di sini
            </Link>
          </div>

          <div className="mt-6 bg-slate-50 p-4 text-xs text-slate-700">
            <div className="font-semibold">Demo login (setelah seed):</div>
            <div>Admin: admin@lms.local / admin123</div>
            <div>Teacher: teacher@lms.local / teacher123</div>
          </div>
        </Card>
      </Container>
    </section>
  );
}
