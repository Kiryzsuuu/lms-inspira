import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Container, Label } from '../../components/ui';
import { useAuth } from '../../lib/auth';

const ROLES = ['student', 'teacher', 'admin'];

export default function UserManager() {
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [roleDrafts, setRoleDrafts] = useState({});

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [users]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/users');
      const list = res.data.users || [];
      setUsers(list);
      setRoleDrafts(Object.fromEntries(list.map((u) => [u._id, u.role])));
    } catch (e) {
      setError(e?.response?.data?.error?.message || e.message || 'Gagal memuat users');
    } finally {
      setLoading(false);
    }
  }

  async function saveRole(userId) {
    const role = roleDrafts[userId];
    if (!role) return;

    setSavingId(userId);
    setError('');
    try {
      const res = await api.put(`/admin/users/${userId}`, { role });
      const updated = res.data.user;
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? { ...u, role: updated.role } : u)));
    } catch (e) {
      setError(e?.response?.data?.error?.message || e.message || 'Gagal update role');
    } finally {
      setSavingId('');
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="py-10">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Kelola Users</h1>
            <p className="mt-1 text-sm text-slate-600">Admin bisa mengubah role: student/teacher/admin.</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>

        {error ? <div className="mt-4 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

        <Card className="mt-6 p-6">
          {loading ? (
            <div className="text-sm text-slate-600">Loading...</div>
          ) : (
            <div className="grid gap-4">
              {sortedUsers.map((u) => (
                <div key={u._id} className="flex flex-col gap-3 border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{u.name}</div>
                    <div className="text-sm text-slate-600 truncate">{u.email}</div>
                    <div className="mt-1 text-xs text-slate-500">Created: {new Date(u.createdAt).toLocaleString()}</div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div>
                      <Label>Role</Label>
                      <div className="mt-1">
                        <select
                          className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                          value={roleDrafts[u._id] || u.role}
                          onChange={(e) => setRoleDrafts((d) => ({ ...d, [u._id]: e.target.value }))}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <Button onClick={() => saveRole(u._id)} disabled={savingId === u._id}>
                      {savingId === u._id ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                  </div>
                </div>
              ))}

              {sortedUsers.length === 0 ? <div className="text-sm text-slate-600">Belum ada user.</div> : null}
            </div>
          )}
        </Card>
      </Container>
    </section>
  );
}
