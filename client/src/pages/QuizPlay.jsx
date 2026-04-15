import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, Container, Button } from '../components/ui';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../lib/auth';

export default function QuizPlay() {
  const { quizId } = useParams();
  const { api, isAuthed } = useAuth();
  const nav = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [pinnedById, setPinnedById] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [gradingByQuestionId, setGradingByQuestionId] = useState({});
  const [navInfo, setNavInfo] = useState({ courseId: null, lessonId: null, nextLessonId: null });
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isAuthed) return;
    api
      .get(`/quizzes/play/${quizId}`)
      .then((res) => {
        setQuiz(res.data.quiz);
        setQuestions(res.data.questions || []);
        setCurrentIdx(0);
        setPinnedById({});
        setConfirmOpen(false);
        setNavInfo({
          courseId: res.data.quiz?.courseId || null,
          lessonId: res.data.quiz?.lessonId || null,
          nextLessonId: null,
        });
      })
      .catch(() => {
        setQuiz(null);
        setQuestions([]);
      });
  }, [quizId, isAuthed]);

  function isQuestionAnswered(q) {
    const a = answers[q._id];
    if (!a) return false;
    if ((q.type || 'mcq') === 'essay') return Boolean(a.textAnswer && String(a.textAnswer).trim());
    if ((q.type || 'mcq') === 'matching') {
      const rows = a.matchingAnswer || [];
      if (!Array.isArray(rows) || rows.length === 0) return false;
      return rows.every((r) => (r.left || '').trim() && (r.right || '').trim());
    }
    return Boolean(a.choiceId);
  }

  const unanswered = useMemo(() => {
    return (questions || [])
      .map((q, idx) => ({ q, idx }))
      .filter(({ q }) => !isQuestionAnswered(q));
  }, [questions, answers]);

  async function submit() {
    setSubmitting(true);
    try {
      const payload = {
        answers: questions.map((q) => {
          const a = answers[q._id] || {};
          return {
            questionId: q._id,
            choiceId: a.choiceId,
            textAnswer: a.textAnswer,
            matchingAnswer: a.matchingAnswer,
          };
        }),
      };
      const res = await api.post(`/quizzes/play/${quizId}/submit`, payload);
      setResult(res.data.attempt);
      setGradingByQuestionId(res.data.gradingByQuestionId || {});
      setNavInfo({
        courseId: res.data.courseId || quiz?.courseId || null,
        lessonId: res.data.lessonId || null,
        nextLessonId: res.data.nextLessonId || null,
      });
    } finally {
      setSubmitting(false);
    }
  }

  function goToLesson(lessonId) {
    if (!lessonId || !navInfo.courseId) return;
    nav(`/courses/${navInfo.courseId}?lesson=${lessonId}`);
  }

  const currentQuestion = questions[currentIdx] || null;
  const lastIdx = Math.max(0, questions.length - 1);
  const isLastQuestion = currentIdx === lastIdx;
  const hasQuestions = questions.length > 0;

  if (!isAuthed) {
    return (
      <section className="py-10">
        <Container>
          <Card className="p-8">
            <div className="text-sm text-slate-600">Silakan login untuk mulai quiz.</div>
            <div className="mt-4">
              <Button onClick={() => nav('/login')}>Login</Button>
            </div>
          </Card>
        </Container>
      </section>
    );
  }

  if (!quiz) {
    return (
      <section className="py-10">
        <Container>
          <Card className="p-8">
            <div className="text-sm text-slate-600">Quiz tidak ditemukan / belum dipublish.</div>
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
        <ConfirmDialog
          open={confirmOpen}
          title="Submit quiz sekarang?"
          message={
            unanswered.length > 0 ? (
              <div className="mt-2 text-sm text-slate-600">
                <div className="font-semibold text-rose-700">Ada {unanswered.length} soal yang belum dijawab.</div>
                <div className="mt-2">
                  Soal belum dijawab:{' '}
                  <span className="font-semibold">
                    {unanswered.map(({ idx }) => idx + 1).join(', ')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-600">Semua soal sudah dijawab. Lanjut submit?</div>
            )
          }
          confirmText={submitting ? 'Mengirim...' : 'Submit'}
          cancelText="Batal"
          confirmVariant="primary"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={async () => {
            setConfirmOpen(false);
            await submit();
          }}
        />

        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{quiz.title}</h1>
            {quiz.description ? <p className="mt-1 text-sm text-slate-600">{quiz.description}</p> : null}
          </div>
          {result ? (
            <div className="text-right">
              <div className="text-sm text-slate-600">Skor</div>
              <div className="text-2xl font-extrabold">{result.score} / {result.maxScore}</div>
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {!hasQuestions ? (
              <Card className="p-8">
                <div className="text-sm text-slate-600">Belum ada soal.</div>
              </Card>
            ) : currentQuestion ? (
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-500">Soal {currentIdx + 1} / {questions.length}</div>
                  {!result ? (
                    <div
                      className={
                        'inline-flex items-center border px-2 py-1 text-xs font-semibold ' +
                        (isQuestionAnswered(currentQuestion)
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-slate-50 text-slate-700')
                      }
                    >
                      {isQuestionAnswered(currentQuestion) ? 'TERJAWAB' : 'BELUM'}
                    </div>
                  ) : null}
                </div>

                {result && gradingByQuestionId?.[currentQuestion._id]?.isAutoGradable ? (
                  <div
                    className={
                      'mt-2 inline-flex w-fit items-center border px-2 py-1 text-xs font-semibold ' +
                      (gradingByQuestionId[currentQuestion._id].isCorrect
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-rose-200 bg-rose-50 text-rose-800')
                    }
                  >
                    {gradingByQuestionId[currentQuestion._id].isCorrect ? 'BENAR' : 'SALAH'}
                  </div>
                ) : null}

                {currentQuestion.promptHtml ? (
                  <div
                    className="mt-2 text-lg font-bold text-slate-900"
                    dangerouslySetInnerHTML={{ __html: currentQuestion.promptHtml }}
                  />
                ) : (
                  <div className="mt-2 text-lg font-bold text-slate-900">{currentQuestion.prompt}</div>
                )}

                {(currentQuestion.type || 'mcq') === 'essay' ? (
                  <div className="mt-4">
                    <textarea
                      className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      rows={6}
                      value={answers[currentQuestion._id]?.textAnswer || ''}
                      disabled={Boolean(result)}
                      onChange={(e) =>
                        setAnswers((a) => ({
                          ...a,
                          [currentQuestion._id]: { ...(a[currentQuestion._id] || {}), textAnswer: e.target.value },
                        }))
                      }
                      placeholder="Tulis jawabanmu..."
                    />
                    <div className="mt-1 text-xs text-slate-500">Essay tidak otomatis dinilai.</div>
                  </div>
                ) : (currentQuestion.type || 'mcq') === 'matching' ? (
                  <div className="mt-4 grid gap-2">
                    {(() => {
                      const pairs = currentQuestion.pairs || [];
                      const rights = pairs.map((p) => p.right);
                      const current = answers[currentQuestion._id]?.matchingAnswer;
                      const init = Array.isArray(current)
                        ? current
                        : pairs.map((p) => ({ left: p.left, right: '' }));

                      return pairs.map((p, rowIdx) => (
                        <div key={rowIdx} className="grid gap-2 sm:grid-cols-2">
                          <div className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                            {p.left}
                          </div>
                          <select
                            className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            disabled={Boolean(result)}
                            value={init[rowIdx]?.right || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAnswers((a) => {
                                const base = Array.isArray(a[currentQuestion._id]?.matchingAnswer)
                                  ? [...a[currentQuestion._id].matchingAnswer]
                                  : pairs.map((x) => ({ left: x.left, right: '' }));
                                base[rowIdx] = { left: p.left, right: val };
                                return { ...a, [currentQuestion._id]: { ...(a[currentQuestion._id] || {}), matchingAnswer: base } };
                              });
                            }}
                          >
                            <option value="">Pilih pasangan...</option>
                            {rights.map((r, i) => (
                              <option key={i} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                      ));
                    })()}
                    <div className="text-xs text-slate-500">Matching tidak otomatis dinilai.</div>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-2">
                    {currentQuestion.choices.map((c) => {
                      const selected = answers[currentQuestion._id]?.choiceId === c.id;
                      const g = gradingByQuestionId?.[currentQuestion._id];
                      const isCorrectChoice = Boolean(result && g?.isAutoGradable && g.correctChoiceId === c.id);
                      const isSelectedWrong = Boolean(result && g?.isAutoGradable && selected && g.correctChoiceId !== c.id);
                      return (
                        <button
                          key={c.id}
                          disabled={Boolean(result)}
                          onClick={() =>
                            setAnswers((a) => ({
                              ...a,
                              [currentQuestion._id]: { ...(a[currentQuestion._id] || {}), choiceId: c.id },
                            }))
                          }
                          className={
                            'border px-4 py-3 text-left text-sm transition ' +
                            (isCorrectChoice
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                              : isSelectedWrong
                                ? 'border-rose-300 bg-rose-50 text-rose-900'
                                : selected
                                  ? 'border-slate-900 bg-slate-900 text-white'
                                  : 'border-slate-200 bg-white hover:bg-slate-50')
                          }
                        >
                          {c.text}
                        </button>
                      );
                    })}
                  </div>
                )}

                {!result ? (
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      disabled={currentIdx === 0}
                      onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                    >
                      Previous
                    </Button>
                    <div className="flex flex-wrap gap-2">
                      {!isLastQuestion ? (
                        <Button onClick={() => setCurrentIdx((i) => Math.min(lastIdx, i + 1))}>Next</Button>
                      ) : (
                        <Button disabled={submitting} onClick={() => setConfirmOpen(true)}>
                          Submit
                        </Button>
                      )}
                    </div>
                  </div>
                ) : null}
              </Card>
            ) : null}
          </div>

          <div>
            <Card className="p-5">
              <div className="font-bold">Navigasi Soal</div>
              <div className="mt-1 text-xs text-slate-600">Klik nomor untuk pindah soal. Gunakan Pin untuk menandai.</div>

              {!result && unanswered.length > 0 ? (
                <div className="mt-3 border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                  Belum dijawab: {unanswered.length} soal
                </div>
              ) : null}

              <div className="mt-4 grid gap-2">
                {questions.map((q, idx) => {
                  const answered = isQuestionAnswered(q);
                  const pinned = Boolean(pinnedById[q._id]);
                  const active = idx === currentIdx;
                  return (
                    <div key={q._id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentIdx(idx)}
                        className={
                          'flex-1 border px-3 py-2 text-left text-sm font-semibold transition ' +
                          (active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : answered
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                              : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50')
                        }
                      >
                        Soal {idx + 1}
                        {pinned ? <span className="ml-2 text-xs font-extrabold">PIN</span> : null}
                      </button>
                      {!result ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="px-3"
                          onClick={() =>
                            setPinnedById((m) => {
                              const next = { ...(m || {}) };
                              if (next[q._id]) delete next[q._id];
                              else next[q._id] = true;
                              return next;
                            })
                          }
                        >
                          {pinned ? 'Unpin' : 'Pin'}
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {!result ? (
                <div className="mt-4 text-xs text-slate-600">
                  Submit hanya muncul di soal terakhir.
                </div>
              ) : null}
            </Card>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Link to="/courses">
            <Button variant="outline" className="w-full sm:w-auto">Kembali</Button>
          </Link>
          {result ? (
            <>
              {navInfo.courseId && navInfo.lessonId ? (
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => goToLesson(navInfo.lessonId)}>
                  Kembali ke Materi
                </Button>
              ) : null}
              {navInfo.courseId && navInfo.nextLessonId ? (
                <Button className="w-full sm:w-auto" onClick={() => goToLesson(navInfo.nextLessonId)}>
                  Lanjut Materi Berikutnya
                </Button>
              ) : null}
              <Button className="w-full sm:w-auto" onClick={() => window.location.reload()}>
                Coba Lagi
              </Button>
            </>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
