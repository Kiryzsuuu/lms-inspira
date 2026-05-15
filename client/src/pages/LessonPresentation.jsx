import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Container } from '../components/ui';
import { useAuth } from '../lib/auth';

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

function cleanLessonHtml(html) {
  let s = String(html || '');
  if (!s) return '';
  // Remove empty list items often produced by rich-text editors.
  s = s.replace(/<li>\s*<p>\s*(?:<br\s*\/?\s*>)\s*<\/p>\s*<\/li>/gi, '');
  s = s.replace(/<li>\s*<p>\s*<\/p>\s*<\/li>/gi, '');
  s = s.replace(/<li>\s*(?:<br\s*\/?\s*>)\s*<\/li>/gi, '');
  return s;
}

export default function LessonPresentation() {
  const { id, lessonId } = useParams();
  const nav = useNavigate();
  const { api, role, user } = useAuth();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [lessonProgress, setLessonProgress] = useState({});
  const [progress, setProgress] = useState({ activeCourseId: null });
  const [cert, setCert] = useState({ eligible: false, completed: 0, total: 0, quizzesEligible: true, quizzesSubmitted: 0, quizzesTotal: 0 });
  const [openAttachmentUrl, setOpenAttachmentUrl] = useState('');
  const [lockError, setLockError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api
      .get(`/courses/${id}`)
      .then((res) => {
        setCourse(res.data.course);
        setModules(res.data.modules || []);
        setLessons(res.data.lessons || []);
      })
      .catch(() => {
        setCourse(null);
        setModules([]);
        setLessons([]);
      });
  }, [id, api]);

  useEffect(() => {
    if (role !== 'student') return;
    api
      .get('/progress/me')
      .then((res) => setProgress(res.data))
      .catch(() => setProgress({ activeCourseId: null }));
  }, [role, api]);

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
  }, [role, id, api]);

  const isStudent = role === 'student';
  const priceIdr = course?.priceIdr || 0;
  const hasPurchased = isStudent && (user?.purchasedCourseIds || []).some((x) => String(x) === String(id));
  const isPaywalled = isStudent && priceIdr > 0 && !hasPurchased;

  const activeLesson = useMemo(() => {
    return lessons.find((l) => String(l._id) === String(lessonId)) || null;
  }, [lessons, lessonId]);

  const activeIdx = useMemo(() => {
    if (!activeLesson) return -1;
    return lessons.findIndex((l) => String(l._id) === String(activeLesson._id));
  }, [lessons, activeLesson]);

  function isLessonCompleted(lId) {
    return Boolean(lessonProgress[String(lId)]?.isCompleted);
  }

  function canOpenLessonByIndex(idx) {
    if (!isStudent) return true;
    if (idx <= 0) return true;
    const prev = lessons[idx - 1];
    if (!prev) return true;
    return isLessonCompleted(prev._id);
  }

  // For students: require course to be active (started via /courses/:id/start)
  const isActiveCourse = !isStudent || (progress?.activeCourseId && String(progress.activeCourseId) === String(id));
  const allowed = isActiveCourse && !isPaywalled && activeIdx >= 0 && canOpenLessonByIndex(activeIdx);
  const prevLessonId = activeIdx > 0 ? lessons[activeIdx - 1]?._id : null;
  const nextLessonId = activeIdx >= 0 && activeIdx < lessons.length - 1 ? lessons[activeIdx + 1]?._id : null;

  async function markLessonComplete(lessonToCompleteId) {
    if (!isStudent) return true;
    if (!lessonToCompleteId) return true;
    if (isLessonCompleted(lessonToCompleteId)) return true;

    try {
      await api.post(`/progress/lessons/${lessonToCompleteId}/complete`);
      setLessonProgress((cur) => ({
        ...cur,
        [String(lessonToCompleteId)]: {
          lessonId: lessonToCompleteId,
          isCompleted: true,
          completedAt: new Date().toISOString(),
        },
      }));
      try {
        const certRes = await api.get(`/progress/course/${id}/certificate`);
        setCert(certRes.data);
      } catch {
        // ignore
      }
      window.dispatchEvent(new Event('progress:changed'));
      return true;
    } catch (e) {
      setLockError(e?.response?.data?.error?.message || 'Gagal menyimpan progress materi');
      return false;
    }
  }


  const activeModule = useMemo(() => {
    if (!activeLesson?.moduleId) return null;
    return modules.find((m) => String(m._id) === String(activeLesson.moduleId)) || null;
  }, [activeLesson, modules]);

  return (
    <div className="min-h-screen bg-slate-50">
    <Container className="py-4">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm min-w-0">
          <button onClick={() => nav(`/courses/${id}`)} className="text-slate-500 hover:text-orange-600 transition-colors shrink-0">
            ← {course?.title || 'Kursus'}
          </button>
          {activeModule && (
            <>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500 truncate hidden sm:block">{activeModule.title}</span>
            </>
          )}
          {activeLesson && (
            <>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-900 truncate">{activeLesson.title}</span>
            </>
          )}
        </div>
        {modules.length > 0 && (
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-slate-600 hover:text-orange-600 transition-colors text-sm font-medium shrink-0 hidden sm:block"
          >
            {sidebarOpen ? 'Tutup Silabus' : 'Buka Silabus'}
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Silabus sidebar */}
        {sidebarOpen && modules.length > 0 && (
          <div className="hidden sm:block w-64 shrink-0">
            <div className="bg-white border border-slate-200 rounded-xl p-4 sticky top-20">
              <div className="font-semibold text-sm text-slate-900 mb-3">Silabus</div>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {modules.map((mod) => {
                  const modLessons = lessons.filter((l) => String(l.moduleId) === String(mod._id));
                  return (
                    <div key={mod._id}>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-1">{mod.title}</div>
                      {modLessons.map((l) => {
                        const isActive = String(l._id) === String(lessonId);
                        const completed = lessonProgress[String(l._id)]?.isCompleted;
                        return (
                          <button
                            key={l._id}
                            onClick={() => nav(`/courses/${id}/lessons/${l._id}`)}
                            className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors flex items-center gap-2 mb-0.5 ${isActive ? 'bg-orange-100 text-orange-800 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                          >
                            <span className="shrink-0">
                              {completed ? '✓' : isActive ? '▶' : '·'}
                            </span>
                            <span className="truncate">{l.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">

      {!activeLesson ? (
        <div className="mt-6 border border-slate-200 bg-white p-6 text-sm text-slate-600">Materi tidak ditemukan.</div>
      ) : !isActiveCourse ? (
        <div className="mt-6 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          ⚠️ Silakan mulai course ini terlebih dahulu dari halaman course detail.
        </div>
      ) : isPaywalled ? (
        <div className="mt-6 border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          🔒 Course ini berbayar dan belum dibeli. Materi tidak dapat diakses.
        </div>
      ) : !allowed ? (
        <div className="mt-6 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          ⚠️ Materi ini masih terkunci. Selesaikan materi sebelumnya terlebih dahulu.
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          <Card className="p-5">
            {getLessonBlocks(activeLesson).map((b, blockIdx) => {
              if (b.type === 'video') {
                if (!activeLesson.videoEmbedUrl) return null;
                return (
                  <div key={`${b.type}-${blockIdx}`} className={blockIdx === 0 ? '' : 'mt-6'}>
                    <div className="text-sm font-semibold">{b.title || 'Video'}</div>
                    <div className="mt-2 border border-slate-200 bg-white">
                      <div className="aspect-video bg-slate-100">
                        <iframe
                          title="Lesson video"
                          src={activeLesson.videoEmbedUrl}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              if (b.type === 'attachments') {
                if ((activeLesson.attachments || []).length === 0) return null;
                return (
                  <div key={`${b.type}-${blockIdx}`} className={blockIdx === 0 ? '' : 'mt-6'}>
                    <div className="text-sm font-semibold">{b.title || 'Lampiran'}</div>
                    <div className="mt-2 grid gap-2">
                      {(activeLesson.attachments || []).map((a, idx) => {
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

              return (
                <div key={`${b.type}-${blockIdx}`} className={blockIdx === 0 ? '' : 'mt-6'}>
                  <div className="text-sm font-semibold">{b.title || 'Materi'}</div>
                  <div className="mt-2">
                    {activeLesson.contentHtml ? (
                      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: cleanLessonHtml(activeLesson.contentHtml) }} />
                    ) : (
                      <Markdown text={activeLesson.contentMarkdown} />
                    )}
                  </div>
                </div>
              );
            })}

            {!isPaywalled && activeLesson?.quizId ? (
              <div className="mt-6 border-t border-slate-200 pt-4">
                <div className="text-sm font-semibold">Quiz Materi</div>
                <div className="mt-2 text-sm text-slate-600">
                  Kerjakan quiz setelah membaca materi. Setelah submit, kamu akan melihat nilai, benar/salah, dan progress akan tersimpan.
                </div>
                <div className="mt-3">
                  <Link to={`/quiz/${activeLesson.quizId}`}>
                    <Button className="w-full sm:w-auto">Mulai Quiz</Button>
                  </Link>
                </div>
              </div>
            ) : null}

            {lockError ? <div className="mt-4 bg-rose-50 p-3 text-sm text-rose-700">{lockError}</div> : null}
          </Card>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (!prevLessonId) return;
                nav(`/courses/${id}/lessons/${prevLessonId}`);
              }}
              disabled={!prevLessonId}
            >
              Sebelumnya
            </Button>

            {isStudent && isActiveCourse && !isPaywalled && !nextLessonId && !isLessonCompleted(activeLesson?._id) ? (
              <Button
                variant="outline"
                onClick={async () => {
                  setLockError('');
                  await markLessonComplete(activeLesson?._id);
                }}
              >
                Tandai Materi Selesai
              </Button>
            ) : null}

            <Button
              onClick={async () => {
                if (!nextLessonId) return;
                setLockError('');
                const ok = await markLessonComplete(activeLesson?._id);
                if (!ok) return;
                nav(`/courses/${id}/lessons/${nextLessonId}`);
              }}
              disabled={!nextLessonId}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
        </div>
      </div>
    </Container>
    </div>
  );
}
