import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Label } from '../../components/ui';
import { SidebarShell } from '../../components/SidebarShell';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useAuth } from '../../lib/auth';

const ROLES = ['student', 'teacher', 'admin'];

export default function UserManager() {
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [roleDrafts, setRoleDrafts] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState('');

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

  useEffect(() => {
    load();
  }, []);

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

  async function confirmDelete() {
    if (!deleteTarget?._id) return;
    setDeletingId(deleteTarget._id);
    setError('');
    try {
      await api.delete(`/admin/users/${deleteTarget._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (e) {
      setError(e?.response?.data?.error?.message || e?.response?.data?.message || e.message || 'Gagal menghapus user');
    } finally {
      setDeletingId('');
    }
  }

  const renderUserSidebar = () => (
    <div className="space-y-4">
      <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Ringkasan</div>
        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="text-xs font-medium text-slate-500">Total users</div>
            <div className="mt-1 text-2xl font-extrabold text-slate-900">{users.length}</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-2xl bg-blue-50 px-2 py-3 text-blue-900">
              <div className="font-semibold">Student</div>
              <div className="mt-1 text-lg font-extrabold">{users.filter((u) => u.role === 'student').length}</div>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-2 py-3 text-emerald-900">
              <div className="font-semibold">Teacher</div>
              <div className="mt-1 text-lg font-extrabold">{users.filter((u) => u.role === 'teacher').length}</div>
            </div>
            <div className="rounded-2xl bg-orange-50 px-2 py-3 text-orange-900">
              <div className="font-semibold">Admin</div>
              <div className="mt-1 text-lg font-extrabold">{users.filter((u) => u.role === 'admin').length}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus user?"
        message={
          deleteTarget
            ? `User: ${deleteTarget.name} (${deleteTarget.email}) akan dihapus permanen.`
            : ''
        }
        confirmText="Hapus"
        cancelText="Batal"
        confirmVariant="danger"
        onCancel={() => (deletingId ? null : setDeleteTarget(null))}
        onConfirm={confirmDelete}
      />

      <SidebarShell
        title="Kelola Users"
        description="Atur role akun, cek komposisi pengguna, dan rapikan administrasi user dari satu workspace yang lebih nyaman dipakai."
        actions={<Button variant="outline" onClick={load} disabled={loading} className="rounded-2xl">Refresh</Button>}
        sidebarTitle="Insight pengguna"
        renderSidebar={renderUserSidebar}
        sidebarWidth="w-80"
      >
        {error ? <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        <Card className="p-4 sm:p-6">
            {loading ? (
              <div className="text-sm text-slate-600">Loading...</div>
            ) : (
              <div className="grid gap-3">
                {sortedUsers.map((u) => (
                  <div key={u._id} className="flex flex-col gap-3 border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 break-words">
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-sm text-slate-600">{u.email}</div>
                      <div className="mt-1 text-xs text-slate-500">Created: {new Date(u.createdAt).toLocaleString()}</div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div>
                        <Label className="text-xs sm:text-sm">Role</Label>
                        <div className="mt-1">
                          <select
                            className="w-full border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
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
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Button
                          onClick={() => saveRole(u._id)}
                          disabled={savingId === u._id || deletingId === u._id}
                          className="text-xs sm:text-sm"
                        >
                          {savingId === u._id ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setDeleteTarget(u)}
                          disabled={savingId === u._id || deletingId === u._id}
                          className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs sm:text-sm"
                        >
                          {deletingId === u._id ? 'Menghapus...' : 'Hapus'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {sortedUsers.length === 0 ? <div className="text-sm text-slate-600">Belum ada user.</div> : null}
              </div>
            )}
        </Card>
      </SidebarShell>
    </>
  );
}
