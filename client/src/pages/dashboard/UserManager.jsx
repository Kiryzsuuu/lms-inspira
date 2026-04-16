import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Label } from '../../components/ui';
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
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
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

  useEffect(() => {
    if (!isResizing) return;
    function handleMouseMove(e) {
      setSidebarWidth((prev) => {
        const newWidth = e.clientX;
        return Math.max(220, Math.min(newWidth, 600));
      });
    }
    function handleMouseUp() {
      setIsResizing(false);
    }
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

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

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-4 border-b border-slate-200 px-4 py-6 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex flex-col items-start gap-1 text-left">
            <h1 className="text-3xl font-extrabold tracking-tight">Kelola Users</h1>
            <p className="text-sm text-slate-600">Admin bisa mengubah role: student/teacher/admin.</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading} className="shrink-0">Refresh</Button>
        </div>
        {error ? <div className="bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
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

        {/* Sidebar */}
        <div
          className="flex flex-col gap-4 border-r border-slate-200 bg-slate-50 p-3 sm:p-4 overflow-auto"
          style={{ width: `${sidebarWidth}px` }}
          onMouseDown={() => setIsResizing(true)}
        >
          <div className="cursor-col-resize select-none" />
          
          <div>
            <div className="text-base font-bold text-slate-900">Info</div>
            <div className="mt-3 space-y-2 text-xs sm:text-sm text-slate-600">
              <div>
                <span className="font-semibold text-slate-900">Total Users:</span> {users.length}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Students:</span><br /> {users.filter((u) => u.role === 'student').length}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Teachers:</span><br /> {users.filter((u) => u.role === 'teacher').length}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Admins:</span><br /> {users.filter((u) => u.role === 'admin').length}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
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
                          className="bg-[#d76810] text-white hover:bg-[#c55a0a] text-xs sm:text-sm"
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
        </div>
      </div>
    </div>
  );
}
