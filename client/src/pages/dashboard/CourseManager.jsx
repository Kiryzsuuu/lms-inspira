import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Container, Button, Input, Label, Textarea } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { RichTextEditor } from '../../components/RichTextEditor';

export default function CourseManager() {
  const { api } = useAuth();

  const [courses, setCourses] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const selected = useMemo(() => courses.find((c) => c._id === selectedId) || null, [courses, selectedId]);

  const [courseForm, setCourseForm] = useState({ title: '', description: '', coverImageUrl: '', isPublished: false });
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploadingForSelected, setCoverUploadingForSelected] = useState(false);
  const [selectedCoverDraft, setSelectedCoverDraft] = useState('');

  const confirmActionRef = useRef(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: 'Konfirmasi',
    message: '',
    confirmText: 'OK',
    confirmVariant: 'primary',
  });

  function askConfirm({ title, message, confirmText, confirmVariant, onConfirm }) {
    confirmActionRef.current = onConfirm;
    setConfirmState({
      open: true,
      title: title || 'Konfirmasi',
      message: message || '',
      confirmText: confirmText || 'OK',
      confirmVariant: confirmVariant || 'primary',
    });
  }

  const [lessons, setLessons] = useState([]);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    contentMarkdown: '',
    contentHtml:
      '<h2>Tujuan Pembelajaran</h2><ul><li>Tulis tujuan 1</li><li>Tulis tujuan 2</li></ul><h2>Materi</h2><p>Tulis materi di sini...</p><h2>Ringkasan</h2><ul><li>Point penting 1</li><li>Point penting 2</li></ul><h2>Latihan</h2><ol><li>Pertanyaan latihan 1</li><li>Pertanyaan latihan 2</li></ol>',
    attachments: [],
    order: 1,
    isPublished: false,
  });
  const [pdfUploading, setPdfUploading] = useState(false);
  const [attachLink, setAttachLink] = useState({ name: '', url: '' });

  const [quizzes, setQuizzes] = useState([]);
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    timeLimitSec: 0,
    randomizeQuestions: false,
    isPublished: false,
  });

  const [activeQuizId, setActiveQuizId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [questionForm, setQuestionForm] = useState({
    type: 'mcq',
    promptHtml: '<p>Tulis pertanyaan di sini...</p>',
    rubric: '',
    order: 1,
    choices: [
      { id: 'a', text: '' },
      { id: 'b', text: '' },
      { id: 'c', text: '' },
      { id: 'd', text: '' },
    ],
    correctChoiceId: 'a',
    pairs: [
      { left: '', right: '' },
      { left: '', right: '' },
    ],
  });

  async function loadCourses() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/courses/_manage/mine');
      setCourses(res.data.courses || []);
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal memuat course');
    } finally {
      setLoading(false);
    }
  }

  async function loadCourseDetails(courseId) {
    if (!courseId) {
      setLessons([]);
      setQuizzes([]);
      setActiveQuizId('');
      setQuestions([]);
      return;
    }
    try {
      const [lRes, qRes] = await Promise.all([
        api.get(`/courses/${courseId}/lessons`),
        api.get(`/quizzes/course/${courseId}`),
      ]);
      setLessons(lRes.data.lessons || []);
      setQuizzes(qRes.data.quizzes || []);
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal memuat detail course');
    }
  }

  async function loadQuestions(quizId) {
    if (!quizId) {
      setQuestions([]);
      return;
    }
    try {
      const res = await api.get(`/quizzes/${quizId}/questions`);
      setQuestions(res.data.questions || []);
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal memuat soal');
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadCourseDetails(selectedId);
  }, [selectedId]);

  useEffect(() => {
    setSelectedCoverDraft(selected?.coverImageUrl || '');
  }, [selectedId, selected?.coverImageUrl]);

  useEffect(() => {
    if (!activeQuizId) return;
    loadQuestions(activeQuizId);
  }, [activeQuizId]);

  async function uploadCoverImage(file) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post('/uploads/image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  }

  async function uploadLessonPdf(file) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post('/uploads/pdf', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  }

  async function createCourse(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/courses', courseForm);
      await loadCourses();
      setSelectedId(res.data.course._id);
      setCourseForm({ title: '', description: '', coverImageUrl: '', isPublished: false });
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal membuat course');
    }
  }

  async function updateSelectedCourse(patch) {
    if (!selected) return;
    setError('');
    try {
      await api.put(`/courses/${selected._id}`, { ...selected, ...patch });
      await loadCourses();
      await loadCourseDetails(selected._id);
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal update course');
    }
  }

  async function deleteSelectedCourse() {
    if (!selected) return;
    askConfirm({
      title: 'Hapus course?',
      message: 'Semua materi & quiz ikut terhapus.',
      confirmText: 'Hapus',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setError('');
        try {
          await api.delete(`/courses/${selected._id}`);
          setSelectedId('');
          await loadCourses();
        } catch (e) {
          const status = e?.response?.status;
          const msg = e?.response?.data?.error?.message || e?.message || 'Gagal hapus course';
          setError(status ? `(${status}) ${msg}` : msg);
        }
      },
    });
  }

  async function createLesson(e) {
    e.preventDefault();
    if (!selected) return;
    setError('');
    try {
      await api.post(`/courses/${selected._id}/lessons`, lessonForm);
      setLessonForm((f) => ({
        ...f,
        title: '',
        contentMarkdown: '',
        contentHtml:
          '<h2>Tujuan Pembelajaran</h2><ul><li>Tulis tujuan 1</li><li>Tulis tujuan 2</li></ul><h2>Materi</h2><p>Tulis materi di sini...</p><h2>Ringkasan</h2><ul><li>Point penting 1</li><li>Point penting 2</li></ul><h2>Latihan</h2><ol><li>Pertanyaan latihan 1</li><li>Pertanyaan latihan 2</li></ol>',
        attachments: [],
        order: f.order + 1,
        isPublished: false,
      }));
      await loadCourseDetails(selected._id);
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal tambah materi');
    }
  }

  async function toggleLessonPublish(lesson) {
    if (!selected) return;
    setError('');
    try {
      await api.put(`/courses/${selected._id}/lessons/${lesson._id}`, { ...lesson, isPublished: !lesson.isPublished });
      await loadCourseDetails(selected._id);
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal update materi');
    }
  }

  async function deleteLesson(lesson) {
    if (!selected) return;
    askConfirm({
      title: 'Hapus materi?',
      message: 'Materi ini akan dihapus permanen.',
      confirmText: 'Hapus',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setError('');
        try {
          await api.delete(`/courses/${selected._id}/lessons/${lesson._id}`);
          await loadCourseDetails(selected._id);
        } catch (e) {
          setError(e?.response?.data?.error?.message || 'Gagal hapus materi');
        }
      },
    });
  }

  async function createQuiz(e) {
    e.preventDefault();
    if (!selected) return;
    setError('');
    try {
      const res = await api.post(`/quizzes/course/${selected._id}`, quizForm);
      setQuizForm({ title: '', description: '', timeLimitSec: 0, randomizeQuestions: false, isPublished: false });
      await loadCourseDetails(selected._id);
      setActiveQuizId(res.data.quiz._id);
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal tambah quiz');
    }
  }

  async function toggleQuizPublish(quiz) {
    setError('');
    try {
      await api.put(`/quizzes/${quiz._id}`, { ...quiz, isPublished: !quiz.isPublished });
      await loadCourseDetails(selected._id);
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal update quiz');
    }
  }

  async function deleteQuiz(quiz) {
    askConfirm({
      title: 'Hapus quiz?',
      message: 'Quiz ini beserta semua soalnya akan terhapus.',
      confirmText: 'Hapus',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setError('');
        try {
          await api.delete(`/quizzes/${quiz._id}`);
          setActiveQuizId('');
          setQuestions([]);
          await loadCourseDetails(selected._id);
        } catch (e) {
          setError(e?.response?.data?.error?.message || 'Gagal hapus quiz');
        }
      },
    });
  }

  async function createQuestion(e) {
    e.preventDefault();
    if (!activeQuizId) return;
    setError('');
    try {
      if (questionForm.type === 'essay') {
        await api.post(`/quizzes/${activeQuizId}/questions`, {
          type: 'essay',
          promptHtml: questionForm.promptHtml,
          rubric: questionForm.rubric,
          order: questionForm.order,
        });
      } else if (questionForm.type === 'matching') {
        const cleanedPairs = (questionForm.pairs || []).filter((p) => (p.left || '').trim() && (p.right || '').trim());
        await api.post(`/quizzes/${activeQuizId}/questions`, {
          type: 'matching',
          promptHtml: questionForm.promptHtml,
          order: questionForm.order,
          pairs: cleanedPairs,
        });
      } else {
        const cleanedChoices = questionForm.choices.filter((c) => c.text.trim());
        await api.post(`/quizzes/${activeQuizId}/questions`, {
          type: 'mcq',
          promptHtml: questionForm.promptHtml,
          order: questionForm.order,
          choices: cleanedChoices,
          correctChoiceId: questionForm.correctChoiceId,
        });
      }
      setQuestionForm((q) => ({
        ...q,
        type: 'mcq',
        promptHtml: '<p>Tulis pertanyaan di sini...</p>',
        rubric: '',
        order: q.order + 1,
        choices: q.choices.map((c) => ({ ...c, text: '' })),
        correctChoiceId: 'a',
        pairs: q.pairs?.map(() => ({ left: '', right: '' })) || [
          { left: '', right: '' },
          { left: '', right: '' },
        ],
      }));
      await loadQuestions(activeQuizId);
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal tambah soal');
    }
  }

  async function deleteQuestion(q) {
    if (!activeQuizId) return;
    askConfirm({
      title: 'Hapus soal?',
      message: 'Soal ini akan dihapus permanen.',
      confirmText: 'Hapus',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setError('');
        try {
          await api.delete(`/quizzes/${activeQuizId}/questions/${q._id}`);
          await loadQuestions(activeQuizId);
        } catch (e) {
          setError(e?.response?.data?.error?.message || 'Gagal hapus soal');
        }
      },
    });
  }

  return (
    <section className="py-10">
      <Container>
        <ConfirmDialog
          open={confirmState.open}
          title={confirmState.title}
          message={confirmState.message}
          confirmText={confirmState.confirmText}
          confirmVariant={confirmState.confirmVariant}
          onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
          onConfirm={async () => {
            const action = confirmActionRef.current;
            setConfirmState((s) => ({ ...s, open: false }));
            if (typeof action === 'function') await action();
          }}
        />

        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Kelola Course</h1>
            <p className="mt-1 text-sm text-slate-600">Buat course, tambah materi (markdown), buat quiz dan soal.</p>
          </div>
          <Button variant="outline" onClick={loadCourses} disabled={loading}>
            Refresh
          </Button>
        </div>

        {error ? <div className="mt-4 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-1">
            <div className="text-lg font-bold">Course Saya</div>
            <div className="mt-3 grid gap-2">
              {courses.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setSelectedId(c._id)}
                  className={
                    'px-3 py-2 text-left text-sm ' +
                    (selectedId === c._id ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200')
                  }
                >
                  <div className="font-semibold truncate">{c.title}</div>
                  <div className="text-xs opacity-80">Published: {String(c.isPublished)}</div>
                </button>
              ))}
              {!loading && courses.length === 0 ? <div className="text-sm text-slate-600">Belum ada course.</div> : null}
              {loading ? <div className="text-sm text-slate-600">Loading...</div> : null}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="text-sm font-semibold">Buat Course Baru</div>
              <form className="mt-3 grid gap-3" onSubmit={createCourse}>
                <div>
                  <Label>Title</Label>
                  <div className="mt-1">
                    <Input value={courseForm.title} onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <div className="mt-1">
                    <Textarea rows={3} value={courseForm.description} onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <Label>Cover (opsional)</Label>
                  {courseForm.coverImageUrl ? (
                    <div className="mt-2 aspect-[16/9] overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={courseForm.coverImageUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <div className="mt-2 grid gap-2">
                    <Input
                      value={courseForm.coverImageUrl}
                      onChange={(e) => setCourseForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
                      placeholder="Tempel URL gambar (atau upload file di bawah)"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      disabled={coverUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setError('');
                        setCoverUploading(true);
                        try {
                          const url = await uploadCoverImage(file);
                          setCourseForm((f) => ({ ...f, coverImageUrl: url }));
                        } catch (err) {
                          setError(err?.response?.data?.error?.message || err?.message || 'Gagal upload cover');
                        } finally {
                          setCoverUploading(false);
                          e.target.value = '';
                        }
                      }}
                    />
                    {coverUploading ? <div className="text-xs text-slate-600">Uploading...</div> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="coursePublished"
                    type="checkbox"
                    className="h-4 w-4"
                    checked={courseForm.isPublished}
                    onChange={(e) => setCourseForm((f) => ({ ...f, isPublished: e.target.checked }))}
                  />
                  <Label htmlFor="coursePublished">Publish</Label>
                </div>
                <Button type="submit">Tambah Course</Button>
              </form>
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2">
            {!selected ? (
              <div className="text-sm text-slate-600">Pilih course di kiri untuk kelola materi & quiz.</div>
            ) : (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-lg font-bold">{selected.title}</div>
                    <div className="mt-1 text-sm text-slate-600">Published: {String(selected.isPublished)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => updateSelectedCourse({ isPublished: !selected.isPublished })}>
                      Toggle Publish
                    </Button>
                    <Button variant="danger" onClick={deleteSelectedCourse}>
                      Hapus
                    </Button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  <Card className="p-5 xl:col-span-2">
                    <div className="font-bold">Sampul (Cover)</div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="aspect-[16/9] overflow-hidden border border-slate-200 bg-slate-100">
                        {selected.coverImageUrl ? (
                          <img src={selected.coverImageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600">
                            Cover (opsional)
                          </div>
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Input
                          value={selectedCoverDraft}
                          onChange={(e) => setSelectedCoverDraft(e.target.value)}
                          placeholder="Tempel URL gambar cover"
                        />
                        <Button
                          variant="outline"
                          onClick={() => updateSelectedCourse({ coverImageUrl: selectedCoverDraft })}
                          disabled={(selected.coverImageUrl || '') === selectedCoverDraft}
                        >
                          Simpan URL
                        </Button>
                        <label className="inline-flex items-center">
                          <span
                            className={
                              'inline-flex items-center justify-center px-4 py-2 text-sm font-semibold border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 ' +
                              (coverUploadingForSelected ? 'opacity-50 pointer-events-none' : '')
                            }
                          >
                            {coverUploadingForSelected ? 'Uploading...' : 'Upload Cover'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={coverUploadingForSelected}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setError('');
                              setCoverUploadingForSelected(true);
                              try {
                                const url = await uploadCoverImage(file);
                                await updateSelectedCourse({ coverImageUrl: url });
                              } catch (err) {
                                setError(err?.response?.data?.error?.message || err?.message || 'Gagal upload cover');
                              } finally {
                                setCoverUploadingForSelected(false);
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                        {coverUploadingForSelected ? <div className="text-xs text-slate-600">Uploading...</div> : null}

                        <Button
                          variant="outline"
                          onClick={() => updateSelectedCourse({ coverImageUrl: '' })}
                          disabled={!selected.coverImageUrl}
                        >
                          Hapus Cover
                        </Button>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <div className="font-bold">Materi (Lessons)</div>
                    <form className="mt-3 grid gap-3" onSubmit={createLesson}>
                      <div>
                        <Label>Judul Materi</Label>
                        <div className="mt-1">
                          <Input value={lessonForm.title} onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <RichTextEditor
                          label="Konten Materi (Word-like)"
                          valueHtml={lessonForm.contentHtml}
                          onChangeHtml={(html) => setLessonForm((f) => ({ ...f, contentHtml: html }))}
                          onUploadImage={async (file) => {
                            const fd = new FormData();
                            fd.append('file', file);
                            const res = await api.post('/uploads/image', fd, {
                              headers: { 'Content-Type': 'multipart/form-data' },
                            });
                            return res.data.url;
                          }}
                        />
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-slate-700">Lampiran (PDF / Link)</div>
                        <div className="mt-2 grid gap-2">
                          <div className="grid gap-2 sm:grid-cols-2">
                            <Input
                              value={attachLink.name}
                              onChange={(e) => setAttachLink((a) => ({ ...a, name: e.target.value }))}
                              placeholder="Nama link (opsional)"
                            />
                            <Input
                              value={attachLink.url}
                              onChange={(e) => setAttachLink((a) => ({ ...a, url: e.target.value }))}
                              placeholder="https://..."
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              type="button"
                              onClick={() => {
                                if (!attachLink.url.trim()) return;
                                setLessonForm((f) => ({
                                  ...f,
                                  attachments: [
                                    ...(f.attachments || []),
                                    { type: 'link', name: attachLink.name || attachLink.url, url: attachLink.url },
                                  ],
                                }));
                                setAttachLink({ name: '', url: '' });
                              }}
                            >
                              Tambah Link
                            </Button>

                            <label className="inline-flex items-center">
                              <span
                                className={
                                  'inline-flex items-center justify-center px-4 py-2 text-sm font-semibold border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 ' +
                                  (pdfUploading ? 'opacity-50 pointer-events-none' : '')
                                }
                              >
                                {pdfUploading ? 'Uploading PDF...' : 'Upload PDF'}
                              </span>
                              <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                disabled={pdfUploading}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setPdfUploading(true);
                                  setError('');
                                  try {
                                    const url = await uploadLessonPdf(file);
                                    setLessonForm((f) => ({
                                      ...f,
                                      attachments: [
                                        ...(f.attachments || []),
                                        { type: 'file', name: file.name, url },
                                      ],
                                    }));
                                  } catch (err) {
                                    setError(err?.response?.data?.error?.message || err?.message || 'Gagal upload PDF');
                                  } finally {
                                    setPdfUploading(false);
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>
                          </div>

                          {(lessonForm.attachments || []).length > 0 ? (
                            <div className="grid gap-2">
                              {(lessonForm.attachments || []).map((a, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-3 border border-slate-200 bg-white px-3 py-2 text-sm">
                                  <a className="min-w-0 truncate font-semibold text-slate-900 hover:underline" href={a.url} target="_blank" rel="noreferrer">
                                    {a.name || a.url}
                                  </a>
                                  <Button
                                    variant="danger"
                                    className="px-3"
                                    type="button"
                                    onClick={() =>
                                      setLessonForm((f) => ({
                                        ...f,
                                        attachments: (f.attachments || []).filter((_, i) => i !== idx),
                                      }))
                                    }
                                  >
                                    Hapus
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label>Order</Label>
                          <div className="mt-1">
                            <Input type="number" value={lessonForm.order} onChange={(e) => setLessonForm((f) => ({ ...f, order: Number(e.target.value) }))} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <input
                            id="lessonPublished"
                            type="checkbox"
                            className="h-4 w-4"
                            checked={lessonForm.isPublished}
                            onChange={(e) => setLessonForm((f) => ({ ...f, isPublished: e.target.checked }))}
                          />
                          <Label htmlFor="lessonPublished">Publish</Label>
                        </div>
                      </div>
                      <Button type="submit">Tambah Materi</Button>
                    </form>

                    <div className="mt-4 grid gap-2">
                      {lessons.map((l) => (
                        <Card key={l._id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{l.title}</div>
                              <div className="text-xs text-slate-500">Order: {l.order} • Published: {String(l.isPublished)}</div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" className="px-3" onClick={() => toggleLessonPublish(l)}>
                                Toggle
                              </Button>
                              <Button variant="danger" className="px-3" onClick={() => deleteLesson(l)}>
                                Hapus
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                      {lessons.length === 0 ? <div className="text-sm text-slate-600">Belum ada materi.</div> : null}
                    </div>
                  </Card>

                  <Card className="p-5">
                    <div className="font-bold">Quiz</div>
                    <form className="mt-3 grid gap-3" onSubmit={createQuiz}>
                      <div>
                        <Label>Judul Quiz</Label>
                        <div className="mt-1">
                          <Input value={quizForm.title} onChange={(e) => setQuizForm((f) => ({ ...f, title: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <div className="mt-1">
                          <Textarea rows={3} value={quizForm.description} onChange={(e) => setQuizForm((f) => ({ ...f, description: e.target.value }))} />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label>Time Limit (sec)</Label>
                          <div className="mt-1">
                            <Input type="number" value={quizForm.timeLimitSec} onChange={(e) => setQuizForm((f) => ({ ...f, timeLimitSec: Number(e.target.value) }))} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <input
                            id="quizPublished"
                            type="checkbox"
                            className="h-4 w-4"
                            checked={quizForm.isPublished}
                            onChange={(e) => setQuizForm((f) => ({ ...f, isPublished: e.target.checked }))}
                          />
                          <Label htmlFor="quizPublished">Publish</Label>
                        </div>
                      </div>
                      <Button type="submit">Tambah Quiz</Button>
                    </form>

                    <div className="mt-4 grid gap-2">
                      {quizzes.map((q) => (
                        <Card key={q._id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <button
                                className="text-left font-semibold text-slate-900 hover:underline"
                                onClick={() => setActiveQuizId(q._id)}
                                type="button"
                              >
                                {q.title}
                              </button>
                              <div className="text-xs text-slate-500">Published: {String(q.isPublished)}</div>
                            </div>
                            <div className="flex gap-2">
                              <div className="flex items-center gap-2 pt-6">
                                <input
                                  id="quizRandom"
                                  type="checkbox"
                                  checked={quizForm.randomizeQuestions}
                                  onChange={(e) => setQuizForm((f) => ({ ...f, randomizeQuestions: e.target.checked }))}
                                />
                                <Label htmlFor="quizRandom">Random urutan soal</Label>
                              </div>
                              <Button variant="outline" className="px-3" onClick={() => toggleQuizPublish(q)}>
                                Toggle
                              </Button>
                              <Button variant="danger" className="px-3" onClick={() => deleteQuiz(q)}>
                                Hapus
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                      {quizzes.length === 0 ? <div className="text-sm text-slate-600">Belum ada quiz.</div> : null}
                    </div>

                    <div className="mt-6 border-t border-slate-200 pt-4">
                      <div className="font-bold">Soal (untuk quiz terpilih)</div>
                      <div className="mt-1 text-sm text-slate-600">
                        Quiz aktif: <span className="font-semibold">{activeQuizId ? activeQuizId : '(belum dipilih)'}</span>
                      </div>

                      {activeQuizId ? (
                        <>
                          <form className="mt-3 grid gap-3" onSubmit={createQuestion}>
                            <div>
                              <Label>Tipe Soal</Label>
                              <div className="mt-1">
                                <select
                                  className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                  value={questionForm.type}
                                  onChange={(e) => setQuestionForm((f) => ({ ...f, type: e.target.value }))}
                                >
                                  <option value="mcq">Pilihan ganda</option>
                                  <option value="essay">Essay</option>
                                  <option value="matching">Mencocokan</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <RichTextEditor
                                label="Pertanyaan (Word-like)"
                                valueHtml={questionForm.promptHtml}
                                onChangeHtml={(html) => setQuestionForm((f) => ({ ...f, promptHtml: html }))}
                                onUploadImage={async (file) => {
                                  const fd = new FormData();
                                  fd.append('file', file);
                                  const res = await api.post('/uploads/image', fd, {
                                    headers: { 'Content-Type': 'multipart/form-data' },
                                  });
                                  return res.data.url;
                                }}
                              />
                            </div>

                            {questionForm.type === 'essay' ? (
                              <div>
                                <Label>Rubrik / Kriteria Penilaian (opsional)</Label>
                                <div className="mt-1">
                                  <Textarea
                                    rows={3}
                                    value={questionForm.rubric}
                                    onChange={(e) => setQuestionForm((f) => ({ ...f, rubric: e.target.value }))}
                                    placeholder="Contoh: Jelaskan dengan 3 poin utama; sertakan contoh; minimal 100 kata"
                                  />
                                </div>
                              </div>
                            ) : questionForm.type === 'matching' ? (
                              <div>
                                <div className="flex items-center justify-between gap-3">
                                  <Label>Pasangan (Kiri ↔ Kanan)</Label>
                                  <Button
                                    variant="outline"
                                    className="px-3"
                                    type="button"
                                    onClick={() =>
                                      setQuestionForm((f) => ({
                                        ...f,
                                        pairs: [...(f.pairs || []), { left: '', right: '' }],
                                      }))
                                    }
                                  >
                                    + Tambah Pair
                                  </Button>
                                </div>
                                <div className="mt-2 grid gap-2">
                                  {(questionForm.pairs || []).map((p, idx) => (
                                    <div key={idx} className="grid gap-2 sm:grid-cols-2">
                                      <Input
                                        value={p.left}
                                        onChange={(e) =>
                                          setQuestionForm((f) => ({
                                            ...f,
                                            pairs: (f.pairs || []).map((x, i) => (i === idx ? { ...x, left: e.target.value } : x)),
                                          }))
                                        }
                                        placeholder="Kiri"
                                      />
                                      <div className="flex gap-2">
                                        <Input
                                          value={p.right}
                                          onChange={(e) =>
                                            setQuestionForm((f) => ({
                                              ...f,
                                              pairs: (f.pairs || []).map((x, i) => (i === idx ? { ...x, right: e.target.value } : x)),
                                            }))
                                          }
                                          placeholder="Kanan"
                                        />
                                        <Button
                                          variant="danger"
                                          className="px-3"
                                          type="button"
                                          onClick={() =>
                                            setQuestionForm((f) => ({
                                              ...f,
                                              pairs: (f.pairs || []).filter((_, i) => i !== idx),
                                            }))
                                          }
                                        >
                                          Hapus
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">Minimal 2 pasangan.</div>
                              </div>
                            ) : (
                              <>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  {questionForm.choices.map((c, idx) => (
                                    <div key={c.id}>
                                      <Label>Pilihan {c.id.toUpperCase()}</Label>
                                      <div className="mt-1">
                                        <Input
                                          value={c.text}
                                          onChange={(e) =>
                                            setQuestionForm((f) => ({
                                              ...f,
                                              choices: f.choices.map((x, i) => (i === idx ? { ...x, text: e.target.value } : x)),
                                            }))
                                          }
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div>
                                  <Label>Jawaban Benar</Label>
                                  <div className="mt-1">
                                    <select
                                      className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                      value={questionForm.correctChoiceId}
                                      onChange={(e) => setQuestionForm((f) => ({ ...f, correctChoiceId: e.target.value }))}
                                    >
                                      {questionForm.choices.map((c) => (
                                        <option key={c.id} value={c.id}>
                                          {c.id.toUpperCase()}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </>
                            )}

                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <Label>Order</Label>
                                <div className="mt-1">
                                  <Input
                                    type="number"
                                    value={questionForm.order}
                                    onChange={(e) => setQuestionForm((f) => ({ ...f, order: Number(e.target.value) }))}
                                  />
                                </div>
                              </div>
                            </div>

                            <Button type="submit">Tambah Soal</Button>
                          </form>

                          <div className="mt-4 grid gap-2">
                            {questions.map((q) => (
                              <Card key={q._id} className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-slate-600">{(q.type || 'mcq').toUpperCase()}</div>
                                    <div className="mt-1 text-sm font-semibold text-slate-900" dangerouslySetInnerHTML={{ __html: q.promptHtml || '' }} />
                                    <div className="mt-1 text-xs text-slate-500">
                                      Order: {q.order}
                                      {q.type === 'mcq' ? ` • Correct: ${q.correctChoiceId}` : ''}
                                    </div>
                                  </div>
                                  <Button variant="danger" className="px-3" onClick={() => deleteQuestion(q)}>
                                    Hapus
                                  </Button>
                                </div>
                              </Card>
                            ))}
                            {questions.length === 0 ? <div className="text-sm text-slate-600">Belum ada soal.</div> : null}
                          </div>
                        </>
                      ) : (
                        <div className="mt-3 text-sm text-slate-600">Pilih quiz dulu untuk kelola soal.</div>
                      )}
                    </div>
                  </Card>
                </div>
              </>
            )}
          </Card>
        </div>
      </Container>
    </section>
  );
}
