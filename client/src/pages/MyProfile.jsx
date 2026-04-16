import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Label } from '../components/ui';
import { useAuth } from '../lib/auth';
import { ConfirmDialog } from '../components/ConfirmDialog';

const EDUCATION_LEVELS = ['SD/MI', 'SMP/MTs', 'SMA/SMK/MA', 'D3', 'S1', 'S2', 'S3'];
const REFERRAL_SOURCES = ['Media Sosial', 'Rekomendasi', 'Search Engine', 'Teman/Keluarga', 'Lainnya'];

export default function MyProfile() {
  const { api, user: authUser, logout } = useAuth();
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState('profile'); // profile, courses, certificates
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile data
  const [user, setUser] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({});

  // Email update
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  // Password update
  const [editingPassword, setEditingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Course history
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Logout confirmation
  const [logoutOpen, setLogoutOpen] = useState(false);

  async function loadProfile() {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setProfileData(res.data.user);
      setNewEmail(res.data.user.email);
    } catch (e) {
      setError('Gagal memuat profil');
    }
  }

  async function loadCourses() {
    setCoursesLoading(true);
    try {
      const res = await api.get('/courses/my-courses'); // Assuming this endpoint exists
      setCourses(res.data.courses || []);
    } catch (e) {
      console.log('Courses endpoint not available');
    } finally {
      setCoursesLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
    loadCourses();
  }, []);

  async function saveProfile() {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const updates = {
        fullName: profileData.fullName,
        institution: profileData.institution,
        whatsappNumber: profileData.whatsappNumber,
        referralSource: profileData.referralSource,
        reason: profileData.reason,
        educationLevel: profileData.educationLevel,
      };
      const res = await api.put('/auth/me', updates);
      setUser(res.data.user);
      setEditingProfile(false);
      setSuccess('Profil berhasil diperbarui');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal update profil');
    } finally {
      setLoading(false);
    }
  }

  async function updateEmail() {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (!newEmail.trim()) throw new Error('Email tidak boleh kosong');
      const res = await api.put('/auth/email', { newEmail });
      setUser(res.data.user);
      setEditingEmail(false);
      setSuccess('Email berhasil diperbarui');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal update email');
    } finally {
      setLoading(false);
    }
  }

  async function updatePassword() {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (!passwordData.currentPassword.trim()) throw new Error('Password saat ini harus diisi');
      if (!passwordData.newPassword.trim()) throw new Error('Password baru harus diisi');
      if (passwordData.newPassword !== passwordData.confirmPassword) throw new Error('Password baru tidak cocok');
      if (passwordData.newPassword.length < 6) throw new Error('Password minimal 6 karakter');

      await api.put('/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setEditingPassword(false);
      setSuccess('Password berhasil diperbarui');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e?.response?.data?.error?.message || e?.message || 'Gagal update password');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    nav('/', { replace: true });
  }

  function handleLogoutClick() {
    setLogoutOpen(true);
  }

  function confirmLogout() {
    setLogoutOpen(false);
    handleLogout();
  }

  if (!user) return <div className="py-10 text-center">Memuat...</div>;

  const purchasedCourses = courses.filter((c) => user.purchasedCourseIds?.includes(c._id));
  const completedCourses = courses.filter((c) => user.completedCourseIds?.includes(c._id));
  const activeCourse = user.activeCourseId ? courses.find((c) => c._id === user.activeCourseId) : null;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-4 border-b border-slate-200 px-4 py-6 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex flex-col items-start gap-1 text-left">
            <h1 className="text-3xl font-extrabold tracking-tight">Profil Saya</h1>
            <p className="text-sm text-slate-600">Kelola informasi pribadi dan lihat riwayat belajar Anda</p>
          </div>
        </div>
        {error ? <div className="bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
        {success ? <div className="bg-green-50 p-3 text-sm text-green-700">{success}</div> : null}
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 border-r border-slate-200 bg-slate-50 p-4 overflow-auto">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition ${
                activeTab === 'profile'
                  ? 'bg-orange-100 text-orange-900'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Informasi Pribadi
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition ${
                activeTab === 'courses'
                  ? 'bg-orange-100 text-orange-900'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Riwayat Courses
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition ${
                activeTab === 'certificates'
                  ? 'bg-orange-100 text-orange-900'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Sertifikat
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-6 flex flex-col">
                  {/* Informasi Dasar */}
                  <Card className="p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex-1">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Informasi Dasar</h2>
                    <div className="mt-4 space-y-4 text-sm">
                      <div className="pb-3 border-b border-slate-100">
                        <span className="text-slate-600 text-xs uppercase tracking-wider">Username</span>
                        <p className="font-semibold text-slate-900 mt-1">{user.name}</p>
                      </div>
                      <div className="pb-3 border-b border-slate-100">
                        <span className="text-slate-600 text-xs uppercase tracking-wider">Role</span>
                        <p className="font-semibold text-slate-900 mt-1 capitalize">{user.role}</p>
                      </div>
                      <div>
                        <span className="text-slate-600 text-xs uppercase tracking-wider">Bergabung</span>
                        <p className="font-semibold text-slate-900 mt-1">{new Date(user.createdAt).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Profil Pribadi */}
                  <Card className="p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex-1">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <h2 className="text-lg font-bold text-slate-900">Profil Pribadi</h2>
                      {!editingProfile && (
                        <Button
                          variant="outline"
                          onClick={() => setEditingProfile(true)}
                          className="shrink-0 text-sm"
                        >
                          Edit
                        </Button>
                      )}
                    </div>

                    {editingProfile ? (
                      <div className="mt-4 space-y-4">
                        <div>
                          <Label>Nama Lengkap</Label>
                          <Input
                            value={profileData.fullName || ''}
                            onChange={(e) => setProfileData((p) => ({ ...p, fullName: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Asal Lembaga/Instansi</Label>
                          <Input
                            value={profileData.institution || ''}
                            onChange={(e) => setProfileData((p) => ({ ...p, institution: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>No WhatsApp</Label>
                          <Input
                            value={profileData.whatsappNumber || ''}
                            onChange={(e) => setProfileData((p) => ({ ...p, whatsappNumber: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Dari mana tahunya tentang kami?</Label>
                          <select
                            value={profileData.referralSource || ''}
                            onChange={(e) => setProfileData((p) => ({ ...p, referralSource: e.target.value }))}
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
                        <div>
                          <Label>Alasan</Label>
                          <textarea
                            value={profileData.reason || ''}
                            onChange={(e) => setProfileData((p) => ({ ...p, reason: e.target.value }))}
                            className="w-full border border-slate-200 px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Pendidikan Terakhir</Label>
                          <select
                            value={profileData.educationLevel || ''}
                            onChange={(e) => setProfileData((p) => ({ ...p, educationLevel: e.target.value }))}
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
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={saveProfile}
                            disabled={loading}
                            className="bg-[#d76810] text-white hover:bg-[#c55a0a]"
                          >
                            Simpan
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingProfile(false);
                              setProfileData(user);
                            }}
                          >
                            Batal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3 text-sm">
                        <div>
                          <span className="font-semibold text-slate-700">Nama Lengkap:</span> {profileData.fullName || '-'}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">Asal Lembaga:</span> {profileData.institution || '-'}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">No WhatsApp:</span> {profileData.whatsappNumber || '-'}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">Dari mana tahunya:</span> {profileData.referralSource || '-'}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">Alasan:</span> {profileData.reason || '-'}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">Pendidikan Terakhir:</span> {profileData.educationLevel || '-'}
                        </div>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6 flex flex-col">
                  {/* Email Management */}
                  <Card className="p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex-1">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <h2 className="text-lg font-bold text-slate-900">Update Email</h2>
                      {!editingEmail && (
                        <Button
                          variant="outline"
                          onClick={() => setEditingEmail(true)}
                          className="shrink-0 text-sm"
                        >
                          Ubah
                        </Button>
                      )}
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <Label>Email Saat Ini</Label>
                        <Input value={user.email} disabled className="bg-slate-100 text-slate-600" />
                      </div>
                      <div>
                        <Label>Email Baru</Label>
                        <Input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          disabled={!editingEmail}
                          placeholder="email@baru.com"
                          className={!editingEmail ? "bg-slate-100 text-slate-600" : ""}
                        />
                      </div>
                      {editingEmail && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={updateEmail}
                            disabled={loading}
                            className="bg-[#d76810] text-white hover:bg-[#c55a0a]"
                          >
                            Simpan
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingEmail(false);
                              setNewEmail(user.email);
                            }}
                          >
                            Batal
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Password Management */}
                  <Card className="p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex-1">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <h2 className="text-lg font-bold text-slate-900">Update Password</h2>
                      {!editingPassword && (
                        <Button
                          variant="outline"
                          onClick={() => setEditingPassword(true)}
                          className="shrink-0 text-sm"
                        >
                          Ubah
                        </Button>
                      )}
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <Label>Password Saat Ini</Label>
                        <Input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))
                          }
                          disabled={!editingPassword}
                          placeholder="Password saat ini"
                          className={!editingPassword ? "bg-slate-100 text-slate-600" : ""}
                        />
                      </div>
                      <div>
                        <Label>Password Baru</Label>
                        <Input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData((p) => ({ ...p, newPassword: e.target.value }))
                          }
                          disabled={!editingPassword}
                          placeholder="Password baru (minimal 6 karakter)"
                          className={!editingPassword ? "bg-slate-100 text-slate-600" : ""}
                        />
                      </div>
                      <div>
                        <Label>Konfirmasi Password Baru</Label>
                        <Input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))
                          }
                          disabled={!editingPassword}
                          placeholder="Konfirmasi password baru"
                          className={!editingPassword ? "bg-slate-100 text-slate-600" : ""}
                        />
                      </div>
                      {editingPassword && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={updatePassword}
                            disabled={loading}
                            className="bg-[#d76810] text-white hover:bg-[#c55a0a]"
                          >
                            Simpan
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingPassword(false);
                              setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                            }}
                          >
                            Batal
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>

              {/* Logout Button di bawah */}
              <div className="pt-6 mt-2 border-t border-slate-200 flex lg:justify-end">
                <Button
                  onClick={handleLogoutClick}
                  className="w-full sm:w-auto bg-rose-600 text-white hover:bg-rose-700 shadow-md hover:shadow-lg transition-all font-semibold"
                >
                  🚪 Logout
                </Button>
              </div>

              {/* Logout Confirmation Dialog */}
              <ConfirmDialog
                open={logoutOpen}
                title="Logout?"
                message="Apakah Anda yakin ingin logout dari akun ini?"
                confirmText="Ya, Keluar"
                cancelText="Batal"
                confirmVariant="primary"
                onCancel={() => setLogoutOpen(false)}
                onConfirm={confirmLogout}
              />
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="space-y-4 max-w-3xl">
              {/* Sedang dikerjakan */}
              {activeCourse && (
                <Card className="p-6 border-l-4 border-l-orange-500">
                  <h3 className="font-bold text-slate-900">Sedang Dikerjakan</h3>
                  <div className="mt-3">
                    <h4 className="font-semibold text-slate-700">{activeCourse.title}</h4>
                    <p className="mt-1 text-sm text-slate-600">{activeCourse.description}</p>
                  </div>
                </Card>
              )}

              {/* Riwayat Courses - Selesai */}
              <div>
                <h3 className="font-bold text-slate-900 mb-3">
                  Course yang Selesai <span className="text-sm text-slate-600">({completedCourses.length})</span>
                </h3>
                {completedCourses.length > 0 ? (
                  <div className="grid gap-3">
                    {completedCourses.map((c) => (
                      <Card key={c._id} className="p-4 border border-slate-200 border-l-4 border-l-green-500">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-semibold text-slate-900">✓ {c.title}</h4>
                            <p className="mt-1 text-sm text-slate-600">{c.description}</p>
                          </div>
                          <span className="text-xs font-medium bg-green-100 text-green-900 px-2 py-1 rounded">
                            Selesai
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">Belum ada course yang diselesaikan.</p>
                )}
              </div>
            </div>
          )}

          {/* Certificates Tab */}
          {activeTab === 'certificates' && (
            <div className="space-y-4 max-w-3xl">
              <div>
                <h3 className="font-bold text-slate-900 mb-3">
                  Sertifikat yang Diperoleh <span className="text-sm text-slate-600">({completedCourses.length})</span>
                </h3>
                {completedCourses.length > 0 ? (
                  <div className="grid gap-3">
                    {completedCourses.map((c) => (
                      <Card key={c._id} className="p-4 border border-slate-200 border-l-4 border-l-green-500">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-semibold text-slate-900">✓ {c.title}</h4>
                            <p className="mt-1 text-sm text-slate-600">Selesai 100%</p>
                          </div>
                          <Button variant="outline" className="shrink-0 text-xs">
                            Download
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">Belum ada sertifikat. Selesaikan course untuk mendapatkan sertifikat!</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
