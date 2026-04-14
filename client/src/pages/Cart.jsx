import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Container } from '../components/ui';
import { useAuth } from '../lib/auth';

function formatIdr(n) {
  try {
    return new Intl.NumberFormat('id-ID').format(Number(n) || 0);
  } catch {
    return String(n || 0);
  }
}

function getSnapUrl(isProduction) {
  return isProduction
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';
}

function loadSnapScript({ clientKey, isProduction }) {
  return new Promise((resolve, reject) => {
    if (!clientKey) return reject(new Error('Midtrans client key belum diset'));
    if (window.snap) return resolve(window.snap);

    const existing = document.getElementById('midtrans-snap');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.snap));
      existing.addEventListener('error', () => reject(new Error('Gagal load Midtrans Snap')));
      return;
    }

    const s = document.createElement('script');
    s.id = 'midtrans-snap';
    s.src = getSnapUrl(isProduction);
    s.setAttribute('data-client-key', clientKey);
    s.onload = () => resolve(window.snap);
    s.onerror = () => reject(new Error('Gagal load Midtrans Snap'));
    document.body.appendChild(s);
  });
}

export default function Cart() {
  const { api } = useAuth();
  const [items, setItems] = useState([]);
  const [totalIdr, setTotalIdr] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [paying, setPaying] = useState(false);
  const [midtransConfig, setMidtransConfig] = useState(null);

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/cart');
      setItems(res.data.items || []);
      setTotalIdr(res.data.totalIdr || 0);
    } catch (e) {
      setItems([]);
      setTotalIdr(0);
      setError(e?.response?.data?.error?.message || 'Gagal load cart');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    api
      .get('/payments/config')
      .then((res) => setMidtransConfig(res.data))
      .catch(() => setMidtransConfig({ clientKey: '', isProduction: false }));
  }, []);

  async function remove(courseId) {
    setError('');
    try {
      await api.delete(`/cart/items/${courseId}`);
      refresh();
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal hapus item');
    }
  }

  const canCheckout = useMemo(() => !loading && items.length > 0 && !paying, [loading, items.length, paying]);

  async function checkout() {
    setPaying(true);
    setError('');
    try {
      const cfg = midtransConfig || (await api.get('/payments/config')).data;
      const res = await api.post('/payments/checkout', {});

      if (res.data?.paid) {
        await refresh();
        return;
      }

      await loadSnapScript({ clientKey: cfg.clientKey, isProduction: cfg.isProduction });
      if (!window.snap) throw new Error('Midtrans Snap tidak tersedia');

      window.snap.pay(res.data.snapToken, {
        onSuccess: async () => {
          await refresh();
        },
        onPending: () => {
          // pending payment; user can return later; webhook will unlock
        },
        onError: () => {
          setError('Pembayaran gagal / dibatalkan');
        },
        onClose: () => {
          // user closed popup
        },
      });
    } catch (e) {
      setError(e?.response?.data?.error?.message || e?.message || 'Gagal checkout');
    } finally {
      setPaying(false);
    }
  }

  return (
    <section className="py-10">
      <Container className="max-w-3xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Cart</h1>
            <p className="mt-1 text-sm text-slate-600">Checkout via Midtrans (VA / QRIS).</p>
          </div>
          <Link to="/courses">
            <Button variant="outline">Tambah course</Button>
          </Link>
        </div>

        {error ? <div className="mt-4 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

        <div className="mt-6 grid gap-3">
          {loading ? (
            <Card className="p-6 text-sm text-slate-600">Memuat...</Card>
          ) : items.length === 0 ? (
            <Card className="p-6">
              <div className="text-sm text-slate-600">Cart masih kosong.</div>
              <div className="mt-4">
                <Link to="/courses">
                  <Button>Browse course</Button>
                </Link>
              </div>
            </Card>
          ) : (
            items.map((it) => (
              <Card key={it.course._id} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-lg font-bold text-slate-900">{it.course.title}</div>
                    <div className="mt-1 text-sm text-slate-600">Rp {formatIdr(it.course.priceIdr || 0)}</div>
                    {it.course.description ? (
                      <div className="mt-2 text-sm text-slate-600">{it.course.description}</div>
                    ) : null}
                    <div className="mt-3">
                      <Link to={`/courses/${it.course._id}`}>
                        <Button variant="outline">Detail</Button>
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => remove(it.course._id)}>
                      Hapus
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}

          {items.length > 0 && !loading ? (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600">Total</div>
                  <div className="text-2xl font-extrabold">Rp {formatIdr(totalIdr)}</div>
                </div>
                <Button disabled={!canCheckout} onClick={checkout}>
                  {paying ? 'Memproses...' : 'Checkout & Bayar'}
                </Button>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                Course akan terbuka otomatis setelah status pembayaran <span className="font-semibold">settlement</span>.
              </div>
            </Card>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
