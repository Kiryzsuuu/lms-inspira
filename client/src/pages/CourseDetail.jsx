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
  // Minimal markdown renderer (headings + paragraphs + code ticks) to keep deps small.
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

function cleanLessonHtml(html) {
  let s = String(html || '');
  if (!s) return '';
  s = s.replace(/<li>\s*<p>\s*(?:<br\s*\/?\s*>)\s*<\/p>\s*<\/li>/gi, '');
  s = s.replace(/<li>\s*<p>\s*<\/p>\s*<\/li>/gi, '');
  s = s.replace(/<li>\s*(?:<br\s*\/?\s*>)\s*<\/li>/gi, '');
  return s;
}

function cleanCourseHtml(html) {
  let s = String(html || '');
  if (!s) return '';
  // Remove empty list items that cause stray bullets.
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

export default function CourseDetail() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useNavigate();
  const { api, role, user, isAuthed } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [progress, setProgress] = useState({ activeCourseId: null, completedCourseIds: [], role: 'guest' });
  const [lessonProgress, setLessonProgress] = useState({});
  const [cert, setCert] = useState({ eligible: false, completed: 0, total: 0 });
  const [assignmentState, setAssignmentState] = useState({ loading: false, attempt: null, error: '' });
  const [assignmentAnswer, setAssignmentAnswer] = useState('');
  const [lockError, setLockError] = useState('');
  const [openAttachmentUrl, setOpenAttachmentUrl] = useState('');

  useEffect(() => {
    api
      .get(`/courses/${id}`)
      .then((res) => {
        setCourse(res.data.course);
        setLessons(res.data.lessons || []);
        setQuizzes(res.data.quizzes || []);
        const list = res.data.lessons || [];
        const lessonId = searchParams.get('lesson');
        const picked = lessonId ? list.find((l) => String(l._id) === String(lessonId)) : null;
        setSelectedLesson(picked || list[0] || null);
      })
      .catch(() => {
        setCourse(null);
        setLessons([]);
        setQuizzes([]);
        setSelectedLesson(null);
      });
  }, [id, searchParams]);

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
      .catch(() => setCert({ eligible: false, completed: 0, total: 0 }));
  }, [role, id]);

  const isStudent = role === 'student';
  const priceIdr = course?.priceIdr || 0;
  const hasPurchased = isStudent && (user?.purchasedCourseIds || []).some((x) => String(x) === String(id));
  const isPaywalled = isStudent && priceIdr > 0 && !hasPurchased;
  const isActive = isStudent && progress?.activeCourseId && String(progress.activeCourseId) === String(id);
  const isLocked = isStudent && progress?.activeCourseId && String(progress.activeCourseId) !== String(id);

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
    // Common patterns: query-based PDF links
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

    // Fallback order
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
      await api.post(`/courses/${id}/complete`);
      const res = await api.get('/progress/me');
      setProgress(res.data);
    } catch (e) {
      setLockError(e?.response?.data?.error?.message || 'Gagal menyelesaikan course');
    }
  }

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

  return (
    <section className="py-10">
      <Container>
        <div className="w-full">
          <div className="aspect-video overflow-hidden border border-slate-200 bg-slate-100">
            {course.coverImageUrl ? (
              <img src={course.coverImageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600">
                Cover (opsional)
              </div>
            )}
          </div>

          <div className="mt-6">
            <h1 className="text-3xl font-extrabold tracking-tight">{course.title}</h1>
            {course.description ? (
              <div
                className="mt-2 prose max-w-none text-slate-600"
                dangerouslySetInnerHTML={{ __html: cleanCourseHtml(course.description) }}
              />
            ) : null}
            <div className="mt-2 text-sm font-semibold text-slate-900">Harga: Rp {formatIdr(priceIdr)}</div>

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
                  <div className="text-sm font-semibold text-slate-700">Status: sedang dipelajari</div>
                ) : (
                  <Button onClick={startCourse} disabled={isLocked}>
                    {isLocked ? 'Terkunci (selesaikan course aktif)' : 'Mulai course ini'}
                  </Button>
                )}

                {(isActive || !progress?.activeCourseId) && (
                  <Button variant="outline" onClick={completeCourse}>
                    Tandai selesai
                  </Button>
                )}

                {!isPaywalled ? (
                  <Button variant="outline" onClick={downloadProgressPdf}>
                    Export PDF Progress
                  </Button>
                ) : null}
              </div>
            ) : null}

            {lockError ? <div className="mt-4 bg-rose-50 p-3 text-sm text-rose-700">{lockError}</div> : null}
            {isLocked ? (
              <div className="mt-4 bg-amber-50 p-3 text-sm text-amber-800">
                Kamu masih punya course aktif lain. Selesaikan dulu course aktif tersebut supaya bisa mulai course ini.
              </div>
            ) : null}

            {isPaywalled ? (
              <div className="mt-4 bg-red-50 border-2 border-red-300 p-4 text-sm text-red-800 rounded">
                🔒 Course Ini Berbayar - Belum Dibeli. Silakan lakukan pembayaran untuk mengakses materi.
              </div>
            ) : null}

                <div className="mt-6 grid gap-4 lg:grid-cols-4">
                  <Card className="p-5 lg:col-span-1">
                  <div className="text-sm font-semibold">Materi</div>
                  <div className="mt-3 flex flex-col gap-2">
                    {lessons.map((l, idx) => {
                      if (isPaywalled) {
                        return (
                          <button
                            key={l._id}
                            disabled
                            className="border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-400"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="truncate">{l.title}</span>
                              <span className="text-xs font-semibold opacity-80">LOCK</span>
                            </div>
                          </button>
                        );
                      }
                      const allowed = canOpenLessonByIndex(idx);
                      const completed = isLessonCompleted(l._id);
                      return (
                      <button
                        key={l._id}
                        onClick={() => {
                          if (!allowed) return;
                          if (isStudent) {
                            // Student: must call /start first to activate course (includes payment gating)
                            setLockError('');
                            api
                              .post(`/courses/${id}/start`)
                              .then(() => {
                                nav(`/courses/${id}/lessons/${l._id}`);
                              })
                              .catch((e) => {
                                setLockError(e?.response?.data?.error?.message || 'Gagal membuka materi');
                              });
                            return;
                          }
                          setSelectedLesson(l);
                          setSearchParams((prev) => {
                            const next = new URLSearchParams(prev);
                            next.set('lesson', l._id);
                            return next;
                          });
                        }}
                        disabled={!allowed}
                        className={
                          'border border-slate-200 px-3 py-2 text-left text-sm ' +
                          (!allowed
                            ? 'bg-slate-50 text-slate-400'
                            : selectedLesson?._id === l._id
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-900 hover:bg-slate-200')
                        }
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate">{l.title}</span>
                          <span className="text-xs font-semibold opacity-80">{completed ? 'SELESAI' : allowed ? 'BUKA' : 'LOCK'}</span>
                        </div>
                      </button>
                    );
                    })}
                    {lessons.length === 0 && <div className="text-sm text-slate-600">Belum ada materi.</div>}
                  </div>
                </Card>

                  <Card className="p-5 lg:col-span-2">
                  <div className="text-sm font-semibold">Isi Materi</div>
                  <div className="mt-3">
                    {isPaywalled ? (
                      <div className="text-sm text-slate-600">Materi terkunci sampai pembayaran terkonfirmasi.</div>
                    ) : selectedLesson ? (
                      <>
                        {isStudent ? (
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{selectedLesson.title}</div>
                            <div className="mt-2 text-sm text-slate-600">
                              {snippet(
                                selectedLesson.contentHtml
                                  ? toPlainTextFromHtml(selectedLesson.contentHtml)
                                  : toPlainTextFromMarkdown(selectedLesson.contentMarkdown),
                                260
                              ) || 'Klik BUKA pada materi untuk melihat isi lengkap.'}
                            </div>
                            <div className="mt-4">
                              <Link to={`/courses/${id}/lessons/${selectedLesson._id}`}>
                                <Button className="w-full sm:w-auto">Buka Materi</Button>
                              </Link>
                            </div>
                            <div className="mt-4 text-xs text-slate-500">
                              Isi lengkap (video, lampiran, quiz) ada di halaman materi.
                            </div>
                          </div>
                        ) : (
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
                                                <div className="px-3 py-2 text-xs text-slate-600">
                                                  Jika PDF tidak tampil, gunakan tombol di atas untuk membuka link.
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

                              // content
                              return (
                                <div key={`${b.type}-${blockIdx}`} className={blockIdx === 0 ? '' : 'mt-5'}>
                                  {selectedLesson.contentHtml ? (
                                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: cleanLessonHtml(selectedLesson.contentHtml) }} />
                                  ) : (
                                    <Markdown text={selectedLesson.contentMarkdown} />
                                  )}
                                </div>
                              );
                            })}
                          </>
                        )}

                        {isStudent && selectedLesson?.assignment?.instructionsHtml ? (
                          <div className="mt-6 border-t border-slate-200 pt-4">
                            <div className="text-sm font-semibold">Assignment</div>
                            <div className="mt-2 prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedLesson.assignment.instructionsHtml }} />

                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="text-xs text-slate-600">
                                {assignmentState.attempt?.dueAt ? `Deadline: ${new Date(assignmentState.attempt.dueAt).toLocaleString()}` : 'Deadline: mengikuti waktu close (atau unlimited)'}
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" onClick={() => loadAssignment(selectedLesson._id)} disabled={assignmentState.loading}>
                                  Refresh
                                </Button>
                                <Button onClick={startAssignment} disabled={Boolean(assignmentState.attempt?.startedAt)}>
                                  {assignmentState.attempt?.startedAt ? 'Started' : 'Start'}
                                </Button>
                              </div>
                            </div>

                            {assignmentState.error ? <div className="mt-3 bg-rose-50 p-3 text-sm text-rose-700">{assignmentState.error}</div> : null}

                            <div className="mt-3">
                              <textarea
                                className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                rows={6}
                                value={assignmentAnswer}
                                onChange={(e) => setAssignmentAnswer(e.target.value)}
                                disabled={!assignmentState.attempt?.startedAt || Boolean(assignmentState.attempt?.submittedAt)}
                                placeholder="Tulis jawaban assignment..."
                              />
                              <div className="mt-2 flex justify-end">
                                <Button onClick={submitAssignment} disabled={!assignmentState.attempt?.startedAt || Boolean(assignmentState.attempt?.submittedAt)}>
                                  {assignmentState.attempt?.submittedAt ? 'Sudah disubmit' : 'Submit Assignment'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="text-sm text-slate-600">Pilih materi di sebelah kiri.</div>
                    )}
                  </div>
                </Card>

                  <Card className="p-5 lg:col-span-1">
                    <div className="text-sm font-semibold">{isStudent ? 'Quiz Materi' : 'Sertifikat'}</div>
                    <div className="mt-3 flex flex-col gap-3">
                      {isPaywalled ? (
                        <div className="text-sm text-slate-600">Terkunci sampai pembayaran terkonfirmasi.</div>
                      ) : isStudent ? (
                        selectedLesson ? (
                          (() => {
                            const idx = lessons.findIndex((l) => String(l._id) === String(selectedLesson._id));
                            const allowed = idx >= 0 ? canOpenLessonByIndex(idx) : true;
                            if (!allowed) {
                              return (
                                <div className="bg-slate-50 p-3 text-sm text-slate-700">
                                  Selesaikan materi sebelumnya untuk membuka quiz.
                                </div>
                              );
                            }

                            if (!selectedLesson.quizId) {
                              return <div className="text-sm text-slate-600">Materi ini belum punya quiz.</div>;
                            }

                            return (
                              <>
                                <div className="text-sm text-slate-600">
                                  Quiz untuk: <span className="font-semibold text-slate-900">{selectedLesson.title}</span>
                                </div>
                                <Link to={`/quiz/${selectedLesson.quizId}`}>
                                  <Button className="w-full">Mulai Quiz</Button>
                                </Link>
                                <div className="text-xs text-slate-500">
                                  Quiz akan dibuka di halaman quiz. Kamu bisa lanjut/resume jika keluar.
                                </div>
                              </>
                            );
                          })()
                        ) : (
                          <div className="text-sm text-slate-600">Pilih materi untuk melihat quiz.</div>
                        )
                      ) : (
                        <>
                          <div className="text-sm text-slate-600">
                            Progress: <span className="font-semibold">{cert.completed || 0}/{cert.total || lessons.length}</span>
                          </div>
                          {cert.eligible ? (
                            <div className="grid gap-2">
                              <div className="bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Kamu eligible sertifikat.</div>
                              <Button variant="outline" onClick={shareCertificateLink}>Share Link</Button>
                            </div>
                          ) : (
                            <div className="bg-slate-50 p-3 text-sm text-slate-700">Selesaikan semua lesson untuk mendapatkan sertifikat.</div>
                          )}
                        </>
                      )}
                    </div>
                  </Card>
                </div>
            </div>
        </div>
      </Container>
    </section>
  );
}
