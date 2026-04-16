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
  const { api, user, refreshUser } = useAuth();
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
      console.log('[Cart] Loaded items:', res.data.items?.length || 0);
      setItems(res.data.items || []);
      setTotalIdr(res.data.totalIdr || 0);
    } catch (e) {
      console.error('[Cart] Gagal load cart:', e?.response?.data?.error?.message);
      setItems([]);
      setTotalIdr(0);
      setError(e?.response?.data?.error?.message || 'Gagal load cart');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log('[Cart] Component mounted, loading cart...');
    refresh();
    api
      .get('/payments/config')
      .then((res) => {
        console.log('[Cart] Midtrans config loaded');
        setMidtransConfig(res.data);
      })
      .catch(() => {
        console.warn('[Cart] Failed to load Midtrans config');
        setMidtransConfig({ clientKey: '', isProduction: false });
      });
  }, []);

  async function remove(courseId) {
    setError('');
    try {
      await api.delete(`/cart/items/${courseId}`);
      await refresh();
      window.dispatchEvent(new Event('cart:changed'));
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
          // "Success" from Snap does not always mean the transaction is already settled.
          // Course access will be unlocked only after webhook status becomes "settlement".
          await refresh();
          setError('');
          alert('Pembayaran diterima. Course akan terbuka otomatis setelah status settlement.');
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
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="w-full sm:w-56">
                    <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                      {it.course.coverImageUrl ? (
                        <img src={it.course.coverImageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600">
                          Cover (opsional)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="line-clamp-2 text-lg font-bold leading-snug text-slate-900">{it.course.title}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">Rp {formatIdr(it.course.priceIdr || 0)}</div>

                    <div className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <Link to={`/courses/${it.course._id}`}>
                        <Button variant="outline">Detail</Button>
                      </Link>
                      <Button variant="ghost" onClick={() => remove(it.course._id)}>
                        Hapus
                      </Button>
                    </div>
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
