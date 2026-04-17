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
  const [sidebarWidth, setSidebarWidth] = useState(320); // adjustable sidebar width
  const [isResizing, setIsResizing] = useState(false);

  const selected = useMemo(() => courses.find((c) => c._id === selectedId) || null, [courses, selectedId]);

  const [courseForm, setCourseForm] = useState({ title: '', description: '', coverImageUrl: '', priceIdr: 0, isPublished: false });
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
  const defaultLessonHtml =
    '<h2>Tujuan Pembelajaran</h2><ul><li>Tulis tujuan 1</li><li>Tulis tujuan 2</li></ul><h2>Materi</h2><p>Tulis materi di sini...</p><h2>Ringkasan</h2><ul><li>Point penting 1</li><li>Point penting 2</li></ul><h2>Latihan</h2><ol><li>Pertanyaan latihan 1</li><li>Pertanyaan latihan 2</li></ol>';

  function getDefaultLessonForm(nextOrder = 1) {
    return {
      title: '',
      contentMarkdown: '',
      contentHtml: defaultLessonHtml,
      videoEmbedUrl: '',
      attachments: [],
      contentBlocks: [
        { type: 'content', title: 'Materi' },
        { type: 'attachments', title: 'Lampiran' },
      ],
      order: nextOrder,
      isPublished: false,
    };
  }

  const [editingLessonId, setEditingLessonId] = useState('');
  const isEditingLesson = Boolean(editingLessonId);

  const [lessonForm, setLessonForm] = useState(() => getDefaultLessonForm(1));
  const [dragBlockIdx, setDragBlockIdx] = useState(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [attachLink, setAttachLink] = useState({ name: '', url: '' });

  const [quizzes, setQuizzes] = useState([]);
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    timeLimitSec: 0,
    randomizeQuestions: false,
    isPublished: false,
    lessonId: '',
  });

  const [activePanel, setActivePanel] = useState('course');

  const [activeQuizId, setActiveQuizId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [bankCollections, setBankCollections] = useState([]);
  const [bankCollectionId, setBankCollectionId] = useState('');
  const [bankCount, setBankCount] = useState(10);
  const [bankQuestionTypes, setBankQuestionTypes] = useState(['mcq', 'essay', 'matching']);
  const [editingQuestionId, setEditingQuestionId] = useState('');
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

  // Handle sidebar resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = Math.max(220, Math.min(e.clientX, 600)); // min 220px, max 600px
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

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
    // When switching course, exit edit mode and reset form
    setEditingLessonId('');
    setLessonForm((f) => getDefaultLessonForm(f?.order || 1));
    setAttachLink({ name: '', url: '' });
  }, [selectedId]);

  useEffect(() => {
    setSelectedCoverDraft(selected?.coverImageUrl || '');
  }, [selectedId, selected?.coverImageUrl]);

  useEffect(() => {
    // Populate course form when a course is selected
    if (!selected) {
      setCourseForm({ title: '', description: '', coverImageUrl: '', priceIdr: 0, isPublished: false });
      return;
    }
    setCourseForm({
      title: selected.title || '',
      description: selected.description || '',
      coverImageUrl: selected.coverImageUrl || '',
      priceIdr: selected.priceIdr || 0,
      isPublished: selected.isPublished || false,
    });
  }, [selected]);

  useEffect(() => {
    if (!activeQuizId) return;
    loadQuestions(activeQuizId);
  }, [activeQuizId]);

  useEffect(() => {
    if (activePanel !== 'quiz') return;
    loadBankCollections();
  }, [activePanel]);

  async function loadBankCollections() {
    try {
      const res = await api.get('/question-bank/collections');
      setBankCollections(res.data.collections || []);
    } catch (_) {
      // ignore; Bank Soal may be unused on this screen
    }
  }

  async function importQuestionsFromBank(e) {
    e.preventDefault();
    if (!activeQuizId) return;
    setError('');
    if (bankQuestionTypes.length === 0) {
      setError('Pilih minimal satu tipe soal');
      return;
    }
    try {
      const res = await api.post(`/quizzes/${activeQuizId}/import-from-bank`, {
        collectionId: bankCollectionId,
        count: bankCount,
        shuffle: true,
        questionTypes: bankQuestionTypes,
      });
      await loadQuestions(activeQuizId);
      const imported = Number(res.data?.imported || 0);
      if (!imported) setError('Tidak ada soal yang diimpor');
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.response?.data?.error?.message || 'Gagal impor soal dari Bank Soal');
    }
  }

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
      setCourseForm({ title: '', description: '', coverImageUrl: '', priceIdr: 0, isPublished: false });
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
      const payload = {
        ...lessonForm,
        attachments: lessonForm.attachments || [],
        contentBlocks: normalizeBlocks(lessonForm.contentBlocks, lessonForm.videoEmbedUrl, lessonForm.attachments || []),
      };
      await api.post(`/courses/${selected._id}/lessons`, payload);

      setEditingLessonId('');
      setLessonForm((f) => getDefaultLessonForm((f?.order || 1) + 1));
      setAttachLink({ name: '', url: '' });
      await loadCourseDetails(selected._id);
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal tambah materi');
    }
  }

  async function updateLesson(e) {
    e.preventDefault();
    if (!selected) return;
    if (!editingLessonId) return;
    setError('');
    try {
      const payload = {
        ...lessonForm,
        attachments: lessonForm.attachments || [],
        contentBlocks: normalizeBlocks(lessonForm.contentBlocks, lessonForm.videoEmbedUrl, lessonForm.attachments || []),
      };
      await api.put(`/courses/${selected._id}/lessons/${editingLessonId}`, payload);
      setEditingLessonId('');
      setLessonForm((f) => getDefaultLessonForm(f?.order || 1));
      setAttachLink({ name: '', url: '' });
      await loadCourseDetails(selected._id);
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal update materi');
    }
  }

  function beginEditLesson(lesson) {
    if (!lesson) return;
    const attachments = lesson.attachments || [];
    const videoEmbedUrl = lesson.videoEmbedUrl || '';
    const blocks = normalizeBlocks(lesson.contentBlocks || [], videoEmbedUrl, attachments);
    setEditingLessonId(lesson._id);
    setLessonForm({
      title: lesson.title || '',
      contentMarkdown: lesson.contentMarkdown || '',
      contentHtml: lesson.contentHtml || defaultLessonHtml,
      videoEmbedUrl,
      attachments,
      contentBlocks: blocks,
      order: typeof lesson.order === 'number' ? lesson.order : Number(lesson.order || 0),
      isPublished: Boolean(lesson.isPublished),
    });
    setAttachLink({ name: '', url: '' });
  }

  function cancelEditLesson() {
    setEditingLessonId('');
    setLessonForm((f) => getDefaultLessonForm(f?.order || 1));
    setAttachLink({ name: '', url: '' });
  }

  function normalizeBlocks(blocks, videoEmbedUrl, attachments) {
    const seen = new Set();
    const cleaned = (blocks || [])
      .filter((b) => b && b.type)
      .map((b) => ({ type: b.type, title: b.title || '' }))
      .filter((b) => {
        if (seen.has(b.type)) return false;
        seen.add(b.type);
        return true;
      });

    // content is mandatory
    if (!seen.has('content')) cleaned.unshift({ type: 'content', title: 'Materi' });

    // If no video url, remove video block
    if (!videoEmbedUrl) {
      return cleaned.filter((b) => b.type !== 'video');
    }

    // If video url exists but block missing, add it to top by default
    if (videoEmbedUrl && !cleaned.some((b) => b.type === 'video')) {
      cleaned.unshift({ type: 'video', title: 'Video' });
    }

    // If no attachments, keep block but it will render empty in student view; allow teachers to reorder regardless.
    // (No-op)
    void attachments;
    return cleaned;
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
      setQuizForm({ title: '', description: '', timeLimitSec: 0, randomizeQuestions: false, isPublished: false, lessonId: '' });
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

  function editQuestion(q) {
    setEditingQuestionId(q._id);
    setQuestionForm({
      type: q.type || 'mcq',
      promptHtml: q.promptHtml || '',
      rubric: q.rubric || '',
      order: q.order || 1,
      choices: Array.isArray(q.choices) ? q.choices : [{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }],
      correctChoiceId: q.correctChoiceId || 'a',
      pairs: Array.isArray(q.pairs) ? q.pairs : [{ left: '', right: '' }, { left: '', right: '' }],
    });
  }

  function cancelEditQuestion() {
    setEditingQuestionId('');
    setQuestionForm((q) => ({
      ...q,
      type: 'mcq',
      promptHtml: '<p>Tulis pertanyaan di sini...</p>',
      rubric: '',
      choices: q.choices.map((c) => ({ ...c, text: '' })),
      correctChoiceId: 'a',
      pairs: q.pairs?.map(() => ({ left: '', right: '' })) || [
        { left: '', right: '' },
        { left: '', right: '' },
      ],
    }));
  }

  async function createQuestion(e) {
    e.preventDefault();
    if (!activeQuizId) return;
    setError('');
    try {
      const payload = {};
      if (questionForm.type === 'essay') {
        payload.type = 'essay';
        payload.promptHtml = questionForm.promptHtml;
        payload.rubric = questionForm.rubric;
        if (!editingQuestionId) payload.order = questionForm.order;
      } else if (questionForm.type === 'matching') {
        const cleanedPairs = (questionForm.pairs || []).filter((p) => (p.left || '').trim() && (p.right || '').trim());
        payload.type = 'matching';
        payload.promptHtml = questionForm.promptHtml;
        payload.pairs = cleanedPairs;
        if (!editingQuestionId) payload.order = questionForm.order;
      } else {
        const cleanedChoices = questionForm.choices.filter((c) => c.text.trim());
        payload.type = 'mcq';
        payload.promptHtml = questionForm.promptHtml;
        payload.choices = cleanedChoices;
        payload.correctChoiceId = questionForm.correctChoiceId;
        if (!editingQuestionId) payload.order = questionForm.order;
      }

      if (editingQuestionId) {
        await api.put(`/quizzes/${activeQuizId}/questions/${editingQuestionId}`, payload);
      } else {
        await api.post(`/quizzes/${activeQuizId}/questions`, payload);
      }

      setEditingQuestionId('');
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
      setError(e?.response?.data?.error?.message || 'Gagal ' + (editingQuestionId ? 'update' : 'tambah') + ' soal');
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

  async function moveQuestion(q, direction) {
    if (!activeQuizId || !questions.length) return;
    setError('');
    try {
      const currentIdx = questions.findIndex((qi) => qi._id === q._id);
      const newIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
      if (newIdx < 0 || newIdx >= questions.length) return;

      const orderedByOrder = [...questions].sort((a, b) => a.order - b.order);
      const currentQuestion = orderedByOrder[currentIdx];
      const swapQuestion = orderedByOrder[newIdx];

      const tmp = currentQuestion.order;
      currentQuestion.order = swapQuestion.order;
      swapQuestion.order = tmp;

      await api.put(`/quizzes/${activeQuizId}/questions/${currentQuestion._id}`, { order: currentQuestion.order });
      await api.put(`/quizzes/${activeQuizId}/questions/${swapQuestion._id}`, { order: swapQuestion.order });
      await loadQuestions(activeQuizId);
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal pindah soal');
    }
  }

  async function randomizeQuestionOrder() {
    if (!activeQuizId || !questions.length) return;
    setError('');
    try {
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      const updates = shuffled.map((q, idx) => ({ ...q, order: idx + 1 }));
      
      // Update each question's order
      await Promise.all(
        updates.map((q) => api.put(`/quizzes/${activeQuizId}/questions/${q._id}`, { order: q.order }))
      );
      await loadQuestions(activeQuizId);
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Gagal acak urutan soal');
    }
  }

  return (
    <section className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
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

      <div className="flex shrink-0 flex-col gap-4 border-b border-slate-200 px-4 py-6 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex flex-col items-start gap-1 text-left">
            <h1 className="text-3xl font-extrabold tracking-tight">Kelola Course</h1>
            <p className="text-sm text-slate-600">Buat course, tambah materi (markdown), buat quiz dan soal.</p>
          </div>
          <Button variant="outline" onClick={loadCourses} disabled={loading} className="shrink-0">
            Refresh
          </Button>
        </div>
        {error ? <div className="bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
      </div>

      <div className="flex flex-1 min-h-0 flex-col overflow-auto px-4 py-4 lg:px-6 lg:py-4">
        <div className="flex flex-1 min-h-0 flex-col gap-4 lg:flex-row lg:gap-6">
          <div
            style={{ width: `${sidebarWidth}px` }}
            className="group relative lg:shrink-0"
          >
            {/* Resize handle: only this thin area should be draggable */}
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize sidebar"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsResizing(true);
              }}
              className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
              style={{ touchAction: 'none' }}
            />

            <aside className="flex min-h-0 h-full flex-col border border-slate-200 bg-white p-3 sm:p-4 overflow-auto">
            <div className="text-lg font-bold text-slate-900">Course Saya</div>
            <div className="mt-3 flex-1 min-h-0 overflow-auto space-y-3">
              <div className="grid gap-2">
                {courses.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => setSelectedId(c._id)}
                    className={
                      'px-2 py-2 text-left text-xs sm:text-sm font-medium rounded transition break-words ' +
                      (selectedId === c._id ? 'bg-[#d76810] text-white' : 'bg-slate-100 text-slate-900 hover:bg-slate-200')
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 font-semibold leading-snug line-clamp-2 break-words">{c.title}</div>
                      <span
                        className={
                          'mt-0.5 shrink-0 rounded border px-2 py-0.5 text-[10px] font-extrabold ' +
                          (c.isPublished
                            ? selectedId === c._id
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                            : selectedId === c._id
                              ? 'border-rose-300 bg-rose-50 text-rose-900'
                              : 'border-rose-200 bg-rose-50 text-rose-900')
                        }
                      >
                        {c.isPublished ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </div>
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
                    <RichTextEditor
                      label=""
                      valueHtml={courseForm.description || ''}
                      onChangeHtml={(html) => setCourseForm((f) => ({ ...f, description: html }))}
                      editorClassName="min-h-[160px]"
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
                <div>
                  <Label>Harga (Rp)</Label>
                  <div className="mt-1">
                    <Input
                      type="number"
                      min="0"
                      step="10000"
                      value={courseForm.priceIdr}
                      onChange={(e) => setCourseForm((f) => ({ ...f, priceIdr: parseInt(e.target.value) || 0 }))}
                      placeholder="0 untuk gratis"
                    />
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
            </div>
            </aside>
          </div>

          <div className="flex flex-1 min-h-0 flex-col">
            <Card
              className="flex min-h-0 w-full flex-col overflow-auto p-4 sm:p-6"
              onFocusCapture={() => setActivePanel('course')}
            >
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

                <div className="mt-6 grid flex-1 min-h-0 gap-4 overflow-auto pr-1">
                  <Card
                    className={
                      'p-5 xl:col-span-2 ' +
                      (activePanel === 'course' ? 'ring-2 ring-slate-900 ring-offset-2' : '')
                    }
                    onFocusCapture={() => setActivePanel('course')}
                  >
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

                  <Card
                    className={'p-5 ' + (activePanel === 'lesson' ? 'ring-2 ring-slate-900 ring-offset-2' : '')}
                    onFocusCapture={() => setActivePanel('lesson')}
                  >
                    <div className="font-bold">Materi (Lessons)</div>
                    <form className="mt-3 grid gap-3" onSubmit={isEditingLesson ? updateLesson : createLesson}>
                      <div>
                        <Label>Judul Materi</Label>
                        <div className="mt-1">
                          <Input value={lessonForm.title} onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <Label>Video Embed URL (opsional)</Label>
                        <div className="mt-1">
                          <Input
                            value={lessonForm.videoEmbedUrl || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLessonForm((f) => ({
                                ...f,
                                videoEmbedUrl: val,
                                contentBlocks: normalizeBlocks(f.contentBlocks, val, f.attachments),
                              }));
                            }}
                            placeholder="https://www.youtube.com/embed/..."
                          />
                        </div>
                        <div className="mt-1 text-xs text-slate-600">Gunakan URL embed (bukan URL watch).</div>
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-slate-700">Urutan Isi (Drag & Drop)</div>
                        <div className="mt-2 grid gap-2">
                          {(lessonForm.contentBlocks || []).map((b, idx) => {
                            const title = b.title || (b.type === 'video' ? 'Video' : b.type === 'attachments' ? 'Lampiran' : 'Materi');
                            const disabled = b.type === 'content';
                            return (
                              <div
                                key={b.type}
                                draggable={!disabled}
                                onDragStart={() => setDragBlockIdx(idx)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => {
                                  if (dragBlockIdx === null || dragBlockIdx === idx) return;
                                  setLessonForm((f) => {
                                    const arr = [...(f.contentBlocks || [])];
                                    const [moved] = arr.splice(dragBlockIdx, 1);
                                    arr.splice(idx, 0, moved);
                                    return { ...f, contentBlocks: arr };
                                  });
                                  setDragBlockIdx(null);
                                }}
                                className={
                                  'flex items-center justify-between gap-3 border border-slate-200 bg-white px-3 py-2 text-sm ' +
                                  (disabled ? 'opacity-70' : 'cursor-move')
                                }
                              >
                                <div className="min-w-0 truncate font-semibold text-slate-900">{title}</div>
                                <div className="text-xs font-semibold text-slate-600">{disabled ? 'WAJIB' : 'DRAG'}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <RichTextEditor
                          label="Konten Materi (Word-like)"
                          valueHtml={lessonForm.contentHtml}
                          onChangeHtml={(html) => setLessonForm((f) => ({ ...f, contentHtml: html }))}
                          editorClassName="min-h-[200px]"
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
                                  contentBlocks: normalizeBlocks(
                                    f.contentBlocks,
                                    f.videoEmbedUrl,
                                    [
                                      ...(f.attachments || []),
                                      { type: 'link', name: attachLink.name || attachLink.url, url: attachLink.url },
                                    ]
                                  ),
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
                                      contentBlocks: normalizeBlocks(f.contentBlocks, f.videoEmbedUrl, [
                                        ...(f.attachments || []),
                                        { type: 'file', name: file.name, url },
                                      ]),
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
                                        contentBlocks: normalizeBlocks(
                                          f.contentBlocks,
                                          f.videoEmbedUrl,
                                          (f.attachments || []).filter((_, i) => i !== idx)
                                        ),
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
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit">{isEditingLesson ? 'Simpan Perubahan' : 'Tambah Materi'}</Button>
                        {isEditingLesson ? (
                          <Button type="button" variant="outline" onClick={cancelEditLesson}>
                            Batal
                          </Button>
                        ) : null}
                      </div>
                    </form>

                    <div className="mt-4 grid gap-3">
                      {lessons.map((l) => (
                        <Card key={l._id} className="aspect-[16/9] p-4">
                          <div className="flex h-full flex-col justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold leading-snug line-clamp-2 break-words">{l.title}</div>
                              <div className="mt-1 text-xs text-slate-500">
                                <span className="whitespace-nowrap">Order: {l.order}</span>
                                <span className="px-1">•</span>
                                <span className="whitespace-nowrap">Published: {String(l.isPublished)}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button variant="outline" className="px-3" onClick={() => beginEditLesson(l)}>
                                Edit
                              </Button>
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

                  <Card
                    className={'p-5 ' + (activePanel === 'quiz' ? 'ring-2 ring-slate-900 ring-offset-2' : '')}
                    onFocusCapture={() => setActivePanel('quiz')}
                  >
                    <div className="font-bold">Quiz</div>
                    <form className="mt-3 grid gap-3" onSubmit={createQuiz}>
                      <div>
                        <Label>Judul Quiz</Label>
                        <div className="mt-1">
                          <Input value={quizForm.title} onChange={(e) => setQuizForm((f) => ({ ...f, title: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <Label>Quiz untuk Materi</Label>
                        <div className="mt-1">
                          <select
                            className="w-full border border-slate-200 bg-white px-3 py-2 text-sm"
                            value={quizForm.lessonId || ''}
                            onChange={(e) => setQuizForm((f) => ({ ...f, lessonId: e.target.value }))}
                          >
                            <option value="">(Pilih materi...)</option>
                            {lessons.map((l) => (
                              <option key={l._id} value={l._id}>
                                {l.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mt-1 text-xs text-slate-600">Menentukan quiz ini muncul setelah materi yang dipilih.</div>
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
                          <form className="mt-3 grid gap-3" onSubmit={importQuestionsFromBank}>
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="sm:col-span-2">
                                <Label>Ambil dari Bank Soal (koleksi)</Label>
                                <div className="mt-1">
                                  <select
                                    className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    value={bankCollectionId}
                                    onChange={(e) => setBankCollectionId(e.target.value)}
                                  >
                                    <option value="">(pilih koleksi)</option>
                                    {bankCollections.map((c) => (
                                      <option key={c._id} value={c._id}>
                                        {c.title}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div>
                                <Label>Jumlah Soal</Label>
                                <div className="mt-1">
                                  <Input type="number" min={1} max={200} value={bankCount} onChange={(e) => setBankCount(Number(e.target.value))} />
                                </div>
                              </div>
                            </div>

                            <div>
                              <Label>Tipe Soal (Campur atau pilih spesifik)</Label>
                              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                                {[
                                  { id: 'mcq', label: 'Pilihan Ganda' },
                                  { id: 'essay', label: 'Essay' },
                                  { id: 'matching', label: 'Mencocokan' },
                                ].map((type) => (
                                  <label key={type.id} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={bankQuestionTypes.includes(type.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setBankQuestionTypes([...bankQuestionTypes, type.id]);
                                        } else {
                                          setBankQuestionTypes(bankQuestionTypes.filter((t) => t !== type.id));
                                        }
                                      }}
                                      className="h-4 w-4 border border-slate-300 rounded"
                                    />
                                    <span className="text-sm text-slate-700">{type.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button type="submit" disabled={!bankCollectionId || bankQuestionTypes.length === 0}>
                                Ambil Soal
                              </Button>
                              <div className="text-xs text-slate-500">Soal dicampur & ditambahkan ke quiz aktif.</div>
                            </div>
                          </form>

                          <form className="mt-3 grid gap-3" onSubmit={createQuestion}>
                            {editingQuestionId && (
                              <div className="flex items-center justify-between rounded bg-slate-100 p-2">
                                <div className="text-xs font-semibold text-slate-700">Mode: Edit soal</div>
                                <Button type="button" variant="secondary" className="px-2 py-1 text-xs" onClick={cancelEditQuestion}>
                                  Batal
                                </Button>
                              </div>
                            )}
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
                                editorClassName="min-h-[160px]"
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

                            <Button type="submit">{editingQuestionId ? 'Update Soal' : 'Tambah Soal'}</Button>
                          </form>

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <Button type="button" onClick={randomizeQuestionOrder} disabled={questions.length < 2}>
                              Acak Soal
                            </Button>
                            <div className="text-xs text-slate-500">Klik untuk mengacak urutan soal yang sudah ada.</div>
                          </div>

                          <div className="mt-4 grid gap-2">
                            {questions.map((q, idx) => {
                              const orderedQuestions = [...questions].sort((a, b) => a.order - b.order);
                              const currentIdx = orderedQuestions.findIndex((qi) => qi._id === q._id);
                              return (
                                <Card key={q._id} className="p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-semibold text-slate-600">{(q.type || 'mcq').toUpperCase()}</div>
                                      <div className="mt-1 text-sm font-semibold text-slate-900" dangerouslySetInnerHTML={{ __html: q.promptHtml || '' }} />
                                      <div className="mt-1 text-xs text-slate-500">
                                        Order: {q.order}
                                        {q.type === 'mcq' ? ` • Correct: ${q.correctChoiceId}` : ''}
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <div className="flex gap-1">
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          className="px-2 py-1 text-xs"
                                          onClick={() => moveQuestion(q, 'up')}
                                          disabled={currentIdx === 0}
                                        >
                                          ↑
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          className="px-2 py-1 text-xs"
                                          onClick={() => moveQuestion(q, 'down')}
                                          disabled={currentIdx === orderedQuestions.length - 1}
                                        >
                                          ↓
                                        </Button>
                                      </div>
                                      <Button variant="primary" className="px-3" onClick={() => editQuestion(q)}>
                                        Edit
                                      </Button>
                                      <Button variant="danger" className="px-3" onClick={() => deleteQuestion(q)}>
                                        Hapus
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              );
                            })}
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
        </div>
      </div>
    </section>
  );
}
