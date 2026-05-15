import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, Container, Button } from '../components/ui';
import { useAuth } from '../lib/auth';

function formatIdr(n) {
  try {
    return new Intl.NumberFormat('id-ID').format(Number(n) || 0);
  } catch {
    return String(n || 0);
  }
}

function Markdown({ text }) {
  const lines = (text || '').split('\n');
  return (
    <div className="space-y-3">
      {lines.map((line, idx) => {
        if (line.startsWith('### ')) return <h3 key={idx}>{line.slice(4)}</h3>;
        if (line.startsWith('## ')) return <h2 key={idx}>{line.slice(3)}</h2>;
        if (line.startsWith('# ')) return <h1 key={idx}>{line.slice(2)}</h1>;
        if (!line.trim()) return <div key={idx} className="h-2" />;
        return <p key={idx}>{line}</p>;
      })}
    </div>
  );
}

function cleanHtml(html) {
  let s = String(html || '');
  if (!s) return '';
  s = s.replace(/<li>\s*<p>\s*(?:<br\s*\/?\s*>)\s*<\/p>\s*<\/li>/gi, '');
  s = s.replace(/<li>\s*<p>\s*<\/p>\s*<\/li>/gi, '');
  s = s.replace(/<li>\s*(?:<br\s*\/?\s*>)\s*<\/li>/gi, '');
  return s;
}

function toPlainTextFromHtml(html) {
  try {
    const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
    return (doc.body?.textContent || '').replace(/\s+/g, ' ').trim();
  } catch {
    return String(html || '').replace(/\s+/g, ' ').trim();
  }
}

function toPlainTextFromMarkdown(md) {
  return String(md || '')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/`{1,3}/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function snippet(text, max = 220) {
  const s = String(text || '').trim();
  if (!s) return '';
  if (s.length <= max) return s;
  return s.slice(0, max).replace(/\s+\S*$/, '').trim() + '…';
}

function MateriTypeIcon({ lesson }) {
  if (lesson.videoEmbedUrl) return <span className="text-blue-500">▶</span>;
  if (lesson.quizId) return <span className="text-purple-500">?</span>;
  if (lesson.assignment?.instructionsHtml) return <span className="text-amber-500">✏</span>;
  return <span className="text-slate-400">≡</span>;
}

function ModuleAccordion({ module, lessons, selectedLesson, onSelectLesson, isPaywalled, isStudent, lessonProgress, canOpenLessonByIndex, lessonIndexOffset }) {
  const [open, setOpen] = useState(true);
  const completedCount = lessons.filter((l) => lessonProgress[String(l._id)]?.isCompleted).length;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="min-w-0">
          <div className="font-semibold text-sm text-slate-900 truncate">{module.title}</div>
          <div className="text-xs text-slate-500 mt-0.5">{lessons.length} materi · {completedCount} selesai</div>
        </div>
        <svg className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="divide-y divide-slate-100">
          {lessons.map((l, i) => {
            const globalIdx = lessonIndexOffset + i;
            const allowed = !isPaywalled && canOpenLessonByIndex(globalIdx);
            const completed = lessonProgress[String(l._id)]?.isCompleted;
            const isSelected = selectedLesson?._id === l._id;
            return (
              <button
                key={l._id}
                onClick={() => {
                  if (!isPaywalled && allowed) onSelectLesson(l, globalIdx);
                }}
                disabled={isPaywalled || !allowed}
                className={
                  'w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ' +
                  (isPaywalled || !allowed
                    ? 'text-slate-400 cursor-not-allowed bg-white'
                    : isSelected
                      ? 'bg-orange-50 text-orange-800 font-medium'
                      : 'text-slate-700 hover:bg-slate-50')
                }
              >
                <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                  {isPaywalled ? (
                    <svg className="h-3.5 w-3.5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17 11V7a5 5 0 0 0-10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
                    </svg>
                  ) : completed ? (
                    <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : !allowed ? (
                    <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : (
                    <div className={`h-2 w-2 rounded-full ${isSelected ? 'bg-orange-500' : 'bg-slate-300'}`} />
                  )}
                </div>
                <span className="flex-1 truncate">{l.title}</span>
                <MateriTypeIcon lesson={l} />
              </button>
            );
          })}
          {lessons.length === 0 && (
            <div className="px-4 py-3 text-xs text-slate-500 italic">Belum ada materi di modul ini.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useNavigate();
  const { api, role, user, isAuthed, refreshUser } = useAuth();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [progress, setProgress] = useState({ activeCourseId: null, completedCourseIds: [], role: 'guest' });
  const [lessonProgress, setLessonProgress] = useState({});
  const [cert, setCert] = useState({ eligible: false, completed: 0, total: 0, quizzesEligible: true, quizzesSubmitted: 0, quizzesTotal: 0 });
  const [assignmentState, setAssignmentState] = useState({ loading: false, attempt: null, error: '' });
  const [assignmentAnswer, setAssignmentAnswer] = useState('');
  const [lockError, setLockError] = useState('');
  const [openAttachmentUrl, setOpenAttachmentUrl] = useState('');
  const [quizAttempts, setQuizAttempts] = useState({});

  const isPreview = searchParams.get('preview') === '1';

  useEffect(() => {
    const endpoint = isPreview && (role === 'teacher' || role === 'admin')
      ? `/courses/${id}/preview`
      : `/courses/${id}`;

    api
      .get(endpoint)
      .then((res) => {
        setCourse(res.data.course);
        setModules(res.data.modules || []);
        setLessons(res.data.lessons || []);
        setQuizzes(res.data.quizzes || []);
        const list = res.data.lessons || [];
        const lessonId = searchParams.get('lesson');
        const picked = lessonId ? list.find((l) => String(l._id) === String(lessonId)) : null;
        setSelectedLesson(picked || list[0] || null);
      })
      .catch(() => {
        setCourse(null);
        setModules([]);
        setLessons([]);
        setQuizzes([]);
        setSelectedLesson(null);
      });
  }, [id, isPreview, role]);

  useEffect(() => {
    if (role !== 'student') return;
    api
      .get('/progress/me')
      .then((res) => setProgress(res.data))
      .catch(() => setProgress({ activeCourseId: null, completedCourseIds: [], role: 'student' }));
  }, [role]);

  useEffect(() => {
    if (role !== 'student') return;
    api
      .get(`/progress/course/${id}`)
      .then((res) => {
        const map = {};
        for (const row of res.data.lessons || []) map[String(row.lessonId)] = row;
        setLessonProgress(map);
      })
      .catch(() => setLessonProgress({}));

    api
      .get(`/progress/course/${id}/certificate`)
      .then((res) => setCert(res.data))
      .catch(() => setCert({ eligible: false, completed: 0, total: 0, quizzesEligible: true, quizzesSubmitted: 0, quizzesTotal: 0 }));
  }, [role, id]);

  useEffect(() => {
    if (selectedLesson?.quizId && isStudent) {
      loadQuizAttempts(selectedLesson.quizId);
    }
  }, [selectedLesson?._id]);

  const isStudent = role === 'student';
  const priceIdr = course?.priceIdr || 0;
  const hasPurchased = isStudent && (user?.purchasedCourseIds || []).some((x) => String(x) === String(id));
  const hasCompleted = isStudent && (user?.completedCourseIds || []).some((x) => String(x) === String(id));
  const isPaywalled = isStudent && priceIdr > 0 && !hasPurchased;
  const isActive = isStudent && progress?.activeCourseId && String(progress.activeCourseId) === String(id);
  const hasOtherActive = isStudent && progress?.activeCourseId && String(progress.activeCourseId) !== String(id);
  const isEnrolled = isStudent && (hasPurchased || isActive || hasCompleted || priceIdr === 0);

  function isLessonCompleted(lessonId) {
    return Boolean(lessonProgress[String(lessonId)]?.isCompleted);
  }

  function canOpenLessonByIndex(idx) {
    if (!isStudent) return true;
    if (idx === 0) return true;
    const prev = lessons[idx - 1];
    if (!prev) return true;
    return isLessonCompleted(prev._id);
  }

  function isPdfUrl(url) {
    const u = String(url || '').toLowerCase();
    if (!u) return false;
    if (u.endsWith('.pdf')) return true;
    if (u.includes('.pdf?')) return true;
    if (u.includes('application/pdf')) return true;
    return false;
  }

  function getLessonBlocks(lesson) {
    const blocks = Array.isArray(lesson?.contentBlocks) ? lesson.contentBlocks : [];
    const hasVideo = Boolean(lesson?.videoEmbedUrl);
    const hasAttachments = Boolean((lesson?.attachments || []).length);

    if (blocks.length > 0) {
      const seen = new Set();
      const cleaned = blocks
        .filter((b) => b && b.type)
        .map((b) => ({ type: b.type, title: b.title || '' }))
        .filter((b) => {
          if (seen.has(b.type)) return false;
          seen.add(b.type);
          return true;
        });

      if (!seen.has('content')) cleaned.unshift({ type: 'content', title: 'Materi' });
      if (!hasVideo) return cleaned.filter((b) => b.type !== 'video');
      return cleaned;
    }

    return [
      ...(hasVideo ? [{ type: 'video', title: 'Video' }] : []),
      { type: 'content', title: 'Materi' },
      ...(hasAttachments ? [{ type: 'attachments', title: 'Lampiran' }] : []),
    ];
  }

  async function completeLesson() {
    if (!selectedLesson) return;
    setLockError('');
    try {
      await api.post(`/progress/lessons/${selectedLesson._id}/complete`);
      const pRes = await api.get(`/progress/course/${id}`);
      const map = {};
      for (const row of pRes.data.lessons || []) map[String(row.lessonId)] = row;
      setLessonProgress(map);
      const cRes = await api.get(`/progress/course/${id}/certificate`);
      setCert(cRes.data);
    } catch (e) {
      setLockError(e?.response?.data?.error?.message || 'Gagal menyimpan progress lesson');
    }
  }

  function selectedQuiz() {
    if (!selectedLesson?.quizId) return null;
    return quizzes.find((q) => String(q._id) === String(selectedLesson.quizId)) || { _id: selectedLesson.quizId };
  }

  async function loadAssignment(lessonId) {
    if (!lessonId) return;
    setAssignmentState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const res = await api.get(`/assignments/lessons/${lessonId}/me`);
      setAssignmentState({ loading: false, attempt: res.data.attempt, error: '' });
      setAssignmentAnswer(res.data.attempt?.textAnswer || '');
    } catch (e) {
      setAssignmentState({ loading: false, attempt: null, error: e?.response?.data?.error?.message || 'Gagal memuat assignment' });
    }
  }

  async function loadQuizAttempts(quizId) {
    if (!quizId || !isStudent) return;
    try {
      const res = await api.get(`/quizzes/${quizId}/my-attempts`);
      setQuizAttempts((prev) => ({ ...prev, [String(quizId)]: res.data.attempts || [] }));
    } catch (e) {
      setQuizAttempts((prev) => ({ ...prev, [String(quizId)]: [] }));
    }
  }

  async function startAssignment() {
    if (!selectedLesson) return;
    setAssignmentState((s) => ({ ...s, error: '' }));
    try {
      const res = await api.post(`/assignments/lessons/${selectedLesson._id}/start`, {});
      setAssignmentState((s) => ({ ...s, attempt: res.data.attempt }));
    } catch (e) {
      setAssignmentState((s) => ({ ...s, error: e?.response?.data?.error?.message || 'Gagal start assignment' }));
    }
  }

  async function submitAssignment() {
    if (!selectedLesson) return;
    setAssignmentState((s) => ({ ...s, error: '' }));
    try {
      const res = await api.post(`/assignments/lessons/${selectedLesson._id}/submit`, { textAnswer: assignmentAnswer });
      setAssignmentState((s) => ({ ...s, attempt: { ...(s.attempt || {}), submittedAt: res.data.attempt.submittedAt, dueAt: res.data.attempt.dueAt } }));
    } catch (e) {
      setAssignmentState((s) => ({ ...s, error: e?.response?.data?.error?.message || 'Gagal submit assignment' }));
    }
  }

  async function shareCertificateLink() {
    const url = `${window.location.origin}/courses/${id}?certificate=1`;
    const data = { title: `Sertifikat: ${course?.title || 'Course'}`, text: 'Lihat sertifikat saya', url };
    try {
      if (navigator.share) return await navigator.share(data);
    } catch {
      // ignore
    }
    try {
      await navigator.clipboard.writeText(url);
      setLockError('Link sertifikat disalin ke clipboard.');
    } catch {
      setLockError(url);
    }
  }

  async function startCourse() {
    setLockError('');
    try {
      await api.post(`/courses/${id}/start`);
      const res = await api.get('/progress/me');
      setProgress(res.data);
    } catch (e) {
      setLockError(e?.response?.data?.error?.message || 'Gagal memulai course');
    }
  }

  async function addToCart() {
    setLockError('');
    try {
      await api.post('/cart/items', { courseId: id });
      window.dispatchEvent(new Event('cart:changed'));
      nav('/cart');
    } catch (e) {
      setLockError(e?.response?.data?.error?.message || 'Gagal tambah ke cart');
    }
  }

  async function downloadProgressPdf() {
    setLockError('');
    try {
      const res = await api.get(`/reports/courses/${id}/progress.pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `progress-${(course?.title || 'course').replace(/[^a-z0-9\- _]/gi, '').slice(0, 60) || 'course'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setLockError(e?.response?.data?.error?.message || 'Gagal export PDF');
    }
  }

  async function completeCourse() {
    setLockError('');
    try {
      const res = await api.post(`/courses/${id}/complete`);
      setProgress((cur) => ({
        ...cur,
        activeCourseId: res.data?.activeCourseId || null,
        completedCourseIds: res.data?.completedCourseIds || cur.completedCourseIds || [],
        role: cur.role || 'student',
      }));
      await refreshUser();
      window.dispatchEvent(new Event('progress:changed'));
    } catch (e) {
      setLockError(e?.response?.data?.error?.message || 'Gagal menyelesaikan course');
    }
  }

  function handleSelectLesson(lesson, globalIdx) {
    setLockError('');
    if (isStudent) {
      api
        .post(`/courses/${id}/start`)
        .then(() => {
          nav(`/courses/${id}/lessons/${lesson._id}`);
        })
        .catch((e) => {
          setLockError(e?.response?.data?.error?.message || 'Gagal membuka materi');
        });
      return;
    }
    setSelectedLesson(lesson);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('lesson', lesson._id);
      return next;
    });
  }

  // Build module groups for sidebar
  const moduleGroups = (() => {
    const groups = [];
    let lessonOffset = 0;

    if (modules.length > 0) {
      for (const mod of modules) {
        const modLessons = lessons.filter((l) => String(l.moduleId) === String(mod._id));
        groups.push({ module: mod, lessons: modLessons, offset: lessonOffset });
        lessonOffset += modLessons.length;
      }
      // Uncategorized
      const uncat = lessons.filter((l) => !l.moduleId || !modules.find((m) => String(m._id) === String(l.moduleId)));
      if (uncat.length > 0) {
        groups.push({ module: { _id: '__uncat', title: 'Materi Lainnya' }, lessons: uncat, offset: lessonOffset });
      }
    } else {
      // Flat list, no modules — show as single group
      groups.push({ module: { _id: '__all', title: 'Materi' }, lessons, offset: 0 });
    }
    return groups;
  })();

  if (!course) {
    return (
      <section className="py-10">
        <Container>
          <Card className="p-8">
            <div className="text-sm text-slate-600">Course tidak ditemukan / belum dipublish.</div>
            <div className="mt-4">
              <Link to="/courses">
                <Button variant="outline">Kembali</Button>
              </Link>
            </div>
          </Card>
        </Container>
      </section>
    );
  }

  // Enrolled student view: compact header + module accordion + content
  if (isStudent && isEnrolled) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Compact header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3">
          <Container>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Link to="/courses" className="text-slate-500 hover:text-orange-600 transition-colors text-sm shrink-0">
                  ← Kursus
                </Link>
                <span className="text-slate-300">/</span>
                <span className="font-semibold text-slate-900 truncate text-sm">{course.title}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isActive ? (
                  <Button variant="outline" className="text-xs" onClick={completeCourse} disabled={!cert?.eligible}>
                    Selesai Course
                  </Button>
                ) : (
                  <Button className="text-xs bg-orange-500 hover:bg-orange-600 text-white border-0" onClick={startCourse}>
                    {hasOtherActive ? 'Aktifkan' : 'Mulai'}
                  </Button>
                )}
                <Button variant="outline" className="text-xs" onClick={downloadProgressPdf}>
                  Export PDF
                </Button>
              </div>
            </div>
            {isActive && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all"
                      style={{ width: `${cert.total > 0 ? Math.round((cert.completed / cert.total) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">{cert.completed || 0}/{cert.total || lessons.length} materi</span>
                </div>
              </div>
            )}
          </Container>
        </div>

        {lockError ? (
          <Container>
            <div className="mt-3 bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 rounded-lg">{lockError}</div>
          </Container>
        ) : null}

        <Container className="py-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Sidebar: module accordion */}
            <div className="lg:col-span-1 space-y-2">
              {moduleGroups.map(({ module, lessons: mLessons, offset }) => (
                <ModuleAccordion
                  key={module._id}
                  module={module}
                  lessons={mLessons}
                  selectedLesson={selectedLesson}
                  onSelectLesson={handleSelectLesson}
                  isPaywalled={false}
                  isStudent={isStudent}
                  lessonProgress={lessonProgress}
                  canOpenLessonByIndex={canOpenLessonByIndex}
                  lessonIndexOffset={offset}
                />
              ))}
              {lessons.length === 0 && (
                <div className="text-sm text-slate-600 p-4 bg-white border border-slate-200 rounded-lg">Belum ada materi.</div>
              )}

              {/* Certificate card */}
              {cert.eligible ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-4">
                  <div className="font-semibold text-emerald-800 text-sm">Selamat! Kamu eligible sertifikat.</div>
                  <Button variant="outline" className="mt-2 text-xs w-full" onClick={shareCertificateLink}>Bagikan Sertifikat</Button>
                </div>
              ) : null}
            </div>

            {/* Content area */}
            <div className="lg:col-span-2">
              {selectedLesson ? (
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="font-bold text-lg text-slate-900">{selectedLesson.title}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {snippet(
                      selectedLesson.contentHtml
                        ? toPlainTextFromHtml(selectedLesson.contentHtml)
                        : toPlainTextFromMarkdown(selectedLesson.contentMarkdown),
                      280
                    ) || 'Klik Buka Materi untuk melihat isi lengkap.'}
                  </div>
                  <div className="mt-4">
                    <Link to={`/courses/${id}/lessons/${selectedLesson._id}`}>
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white border-0">Buka Materi</Button>
                    </Link>
                  </div>
                  <div className="mt-3 text-xs text-slate-500">
                    Video, lampiran, dan quiz tersedia di dalam halaman materi.
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-5 text-sm text-slate-600">
                  Pilih materi di sebelah kiri untuk mulai belajar.
                </div>
              )}
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Default view: course overview (not enrolled / teacher / admin / preview)
  return (
    <section className="py-10">
      <Container>
        <div className="w-full">
          {/* Teacher preview banner */}
          {isPreview && (role === 'teacher' || role === 'admin') && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-center justify-between gap-3">
              <span>Mode Preview — tampilan seperti yang dilihat siswa</span>
              <button onClick={() => setSearchParams({})} className="text-xs font-semibold hover:underline">Kembali ke Edit</button>
            </div>
          )}

          <div className="aspect-video overflow-hidden border border-slate-200 bg-slate-100 rounded-xl">
            {course.coverImageUrl ? (
              <img src={course.coverImageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600">
                Cover (opsional)
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">{course.title}</h1>
                {course.description ? (
                  <div
                    className="mt-2 prose max-w-none text-slate-600"
                    dangerouslySetInnerHTML={{ __html: cleanHtml(course.description) }}
                  />
                ) : null}
                <div className="mt-2 text-sm font-semibold text-slate-900">
                  {priceIdr === 0 ? <span className="text-emerald-600">Gratis</span> : `Rp ${formatIdr(priceIdr)}`}
                </div>
              </div>
              {(role === 'teacher' || role === 'admin') && !isPreview && (
                <a href={`/courses/${id}?preview=1`} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="text-sm shrink-0">
                    Preview sebagai Siswa
                  </Button>
                </a>
              )}
            </div>

            {isStudent ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {isPaywalled ? (
                  <>
                    <Button onClick={addToCart} disabled={!isAuthed}>
                      Tambah ke Cart
                    </Button>
                    <Link to="/cart">
                      <Button variant="outline">Checkout</Button>
                    </Link>
                  </>
                ) : null}
                {isActive ? (
                  <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-500 inline-block" />
                    Sedang dipelajari
                  </div>
                ) : (
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white border-0" onClick={startCourse}>
                    {hasOtherActive ? 'Aktifkan course ini' : priceIdr === 0 ? 'Mulai Belajar Gratis' : 'Mulai course ini'}
                  </Button>
                )}

                {isActive ? (
                  <Button variant="outline" onClick={completeCourse} disabled={!cert?.eligible}>
                    Selesai Course
                  </Button>
                ) : null}

                {!isPaywalled ? (
                  <Button variant="outline" onClick={downloadProgressPdf}>
                    Export PDF Progress
                  </Button>
                ) : null}
              </div>
            ) : null}

            {lockError ? <div className="mt-4 bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">{lockError}</div> : null}

            {isPaywalled ? (
              <div className="mt-4 bg-amber-50 border-2 border-amber-200 p-4 text-sm text-amber-800 rounded-xl">
                Kursus berbayar — silakan checkout untuk mengakses materi.
              </div>
            ) : null}

            {/* Module overview list */}
            {modules.length > 0 ? (
              <div className="mt-8">
                <h2 className="font-bold text-lg text-slate-900 mb-3">Silabus Kursus</h2>
                <div className="space-y-2">
                  {modules.map((mod) => {
                    const modLessons = lessons.filter((l) => String(l.moduleId) === String(mod._id));
                    return (
                      <div key={mod._id} className="border border-slate-200 rounded-lg px-4 py-3 bg-white">
                        <div className="font-semibold text-slate-900 text-sm">{mod.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{modLessons.length} materi</div>
                        {mod.description ? <div className="text-xs text-slate-600 mt-1">{mod.description}</div> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Lesson list for non-enrolled (teacher/admin inline view) */}
            {!isStudent && (
              <div className="mt-6 grid gap-4 lg:grid-cols-4">
                <Card className="p-5 lg:col-span-1">
                  <div className="text-sm font-semibold mb-3">Materi</div>
                  <div className="space-y-2">
                    {moduleGroups.map(({ module, lessons: mLessons, offset }) => (
                      <div key={module._id}>
                        {modules.length > 0 && (
                          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-1">{module.title}</div>
                        )}
                        {mLessons.map((l, i) => (
                          <button
                            key={l._id}
                            onClick={() => {
                              setSelectedLesson(l);
                              setSearchParams((prev) => {
                                const next = new URLSearchParams(prev);
                                next.set('lesson', l._id);
                                return next;
                              });
                            }}
                            className={
                              'w-full border border-slate-200 px-3 py-2 text-left text-sm mb-1 ' +
                              (selectedLesson?._id === l._id
                                ? 'bg-orange-500 text-white'
                                : 'bg-slate-50 text-slate-900 hover:bg-slate-100')
                            }
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="truncate">{l.title}</span>
                              <MateriTypeIcon lesson={l} />
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                    {lessons.length === 0 && <div className="text-sm text-slate-600">Belum ada materi.</div>}
                  </div>
                </Card>

                <Card className="p-5 lg:col-span-2">
                  <div className="text-sm font-semibold">Isi Materi</div>
                  <div className="mt-3">
                    {selectedLesson ? (
                      <>
                        {getLessonBlocks(selectedLesson).map((b, blockIdx) => {
                          if (b.type === 'video') {
                            if (!selectedLesson.videoEmbedUrl) return null;
                            return (
                              <div key={`${b.type}-${blockIdx}`} className="mb-5 border border-slate-200 bg-white">
                                <div className="border-b border-slate-200 px-3 py-2 text-sm font-semibold">{b.title || 'Video'}</div>
                                <div className="aspect-video bg-slate-100">
                                  <iframe
                                    title="Lesson video"
                                    src={selectedLesson.videoEmbedUrl}
                                    className="h-full w-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                  />
                                </div>
                              </div>
                            );
                          }

                          if (b.type === 'attachments') {
                            if ((selectedLesson.attachments || []).length === 0) return null;
                            return (
                              <div key={`${b.type}-${blockIdx}`} className="mt-6 border-t border-slate-200 pt-4">
                                <div className="text-sm font-semibold">{b.title || 'Lampiran'}</div>
                                <div className="mt-2 grid gap-2">
                                  {(selectedLesson.attachments || []).map((a, idx) => {
                                    const label = a.name || a.url;
                                    const pdf = isPdfUrl(a.url);
                                    const isOpen = pdf && openAttachmentUrl && String(openAttachmentUrl) === String(a.url);
                                    return (
                                      <div key={idx} className="border border-slate-200 bg-white">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!pdf) {
                                              window.open(a.url, '_blank', 'noreferrer');
                                              return;
                                            }
                                            setOpenAttachmentUrl((cur) => (cur === a.url ? '' : a.url));
                                          }}
                                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50"
                                        >
                                          <span className="truncate">{label}</span>
                                          <span className="text-xs font-semibold text-slate-600">{pdf ? (isOpen ? 'TUTUP' : 'BUKA') : 'LINK'}</span>
                                        </button>
                                        {isOpen ? (
                                          <div className="border-t border-slate-200 bg-slate-50">
                                            <div className="aspect-video">
                                              <iframe title={label} src={a.url} className="h-full w-full" />
                                            </div>
                                          </div>
                                        ) : null}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={`${b.type}-${blockIdx}`} className={blockIdx === 0 ? '' : 'mt-5'}>
                              {selectedLesson.contentHtml ? (
                                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: cleanHtml(selectedLesson.contentHtml) }} />
                              ) : (
                                <Markdown text={selectedLesson.contentMarkdown} />
                              )}
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <div className="text-sm text-slate-600">Pilih materi di sebelah kiri.</div>
                    )}
                  </div>
                </Card>

                <Card className="p-5 lg:col-span-1">
                  <div className="text-sm font-semibold">Sertifikat</div>
                  <div className="mt-3 text-xs text-slate-600">
                    Tampil setelah siswa menyelesaikan semua materi dan quiz.
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
