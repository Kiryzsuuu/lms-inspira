import React, { useState, useEffect } from 'react';
import { Card, Container, Button, Input, Textarea, Label } from '../../components/ui';
import { useAuth } from '../../lib/auth';

export default function QuestionBankManager() {
  const { api } = useAuth();
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Edit mode for question
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    type: 'mcq',
    question: '',
    options: [
      { id: '1', text: '' },
      { id: '2', text: '' },
    ],
    correctAnswer: '1',
    explanation: '',
  });

  useEffect(() => {
    loadCollections();
  }, []);

  useEffect(() => {
    if (selectedCollection) {
      loadQuestions(selectedCollection._id);
    }
  }, [selectedCollection]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const res = await api.get('/question-bank/collections');
      setCollections(res.data.collections || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat koleksi');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async (collectionId) => {
    try {
      setLoading(true);
      const res = await api.get(`/question-bank/collections/${collectionId}/questions`);
      setQuestions(res.data.questions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat soal');
    } finally {
      setLoading(false);
    }
  };

  const createCollection = async () => {
    if (!newCollectionName.trim()) {
      setError('Nama koleksi harus diisi');
      return;
    }

    try {
      setLoading(true);
      await api.post('/question-bank/collections', {
        name: newCollectionName,
      });
      setSuccess('Koleksi dibuat');
      setNewCollectionName('');
      setShowNewCollectionModal(false);
      loadCollections();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat koleksi');
    } finally {
      setLoading(false);
    }
  };

  const deleteCollection = async (id) => {
    if (!confirm('Hapus koleksi ini? Semua soal akan dihapus.')) return;

    try {
      setLoading(true);
      await api.delete(`/question-bank/collections/${id}`);
      setSuccess('Koleksi dihapus');
      setSelectedCollection(null);
      loadCollections();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus koleksi');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = async () => {
    if (!selectedCollection) {
      setError('Pilih koleksi terlebih dahulu');
      return;
    }

    if (!questionForm.question.trim()) {
      setError('Pertanyaan harus diisi');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        type: questionForm.type,
        prompt: questionForm.question,
        rubric: questionForm.explanation,
      };

      if (questionForm.type === 'mcq') {
        payload.choices = questionForm.options.filter((o) => o.text.trim());
        payload.correctChoiceId = questionForm.correctAnswer;
      }

      await api.post(`/question-bank/collections/${selectedCollection._id}/questions`, payload);
      setSuccess('Soal ditambahkan');
      resetQuestionForm();
      loadQuestions(selectedCollection._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambah soal');
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!confirm('Hapus soal ini?')) return;

    try {
      setLoading(true);
      await api.delete(`/question-bank/collections/${selectedCollection._id}/questions/${questionId}`);
      setSuccess('Soal dihapus');
      loadQuestions(selectedCollection._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus soal');
    } finally {
      setLoading(false);
    }
  };

  const importQuestions = async () => {
    if (!importFile) {
      setError('Pilih file terlebih dahulu');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);
        const content = e.target.result;

        // Parse Ayken format: Soal X / A. Option / Jawaban: A
        const lines = content.split('\n');
        const parsedQuestions = [];
        let currentQuestion = null;

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('Soal')) {
            if (currentQuestion && currentQuestion.question) {
              parsedQuestions.push(currentQuestion);
            }
            currentQuestion = {
              question: trimmed.replace(/^Soal\s+\d+[\s\.]+/, ''),
              options: [],
              correctAnswer: null,
            };
          } else if (trimmed.match(/^[A-E]\.\s/)) {
            const letter = trimmed.charAt(0);
            const text = trimmed.replace(/^[A-E]\.\s+/, '');
            currentQuestion.options.push({ letter, text });
          } else if (trimmed.startsWith('Jawaban')) {
            const answer = trimmed.split(':')[1]?.trim();
            if (answer) {
              currentQuestion.correctAnswer = answer;
            }
          }
        }

        if (currentQuestion && currentQuestion.question) {
          parsedQuestions.push(currentQuestion);
        }

        // Upload parsed questions
        for (const q of parsedQuestions) {
          if (!q.question || q.options.length === 0) continue;

          const optionIds = ['A', 'B', 'C', 'D', 'E'];
          const choices = q.options.map((o, idx) => ({
            id: optionIds[idx] || String(idx),
            text: o.text,
          }));

          const correctIdx = optionIds.indexOf(q.correctAnswer || 'A');
          const payload = {
            type: 'mcq',
            prompt: q.question,
            choices,
            correctChoiceId: optionIds[correctIdx] || 'A',
          };

          await api.post(`/question-bank/collections/${selectedCollection._id}/questions`, payload);
        }

        setSuccess(`${parsedQuestions.length} soal berhasil diimpor`);
        setImportFile(null);
        setShowImportModal(false);
        loadQuestions(selectedCollection._id);
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal impor soal');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(importFile);
  };

  const resetQuestionForm = () => {
    setEditingQuestion(null);
    setQuestionForm({
      type: 'mcq',
      question: '',
      options: [
        { id: '1', text: '' },
        { id: '2', text: '' },
      ],
      correctAnswer: '1',
      explanation: '',
    });
  };

  const updateOption = (idx, text) => {
    const newOptions = [...questionForm.options];
    newOptions[idx].text = text;
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  const addOption = () => {
    const newId = Math.max(...questionForm.options.map((o) => parseInt(o.id) || 0)) + 1;
    setQuestionForm({
      ...questionForm,
      options: [...questionForm.options, { id: String(newId), text: '' }],
    });
  };

  return (
    <section className="py-10">
      <Container>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Bank Soal</h1>
            <p className="mt-1 text-sm text-slate-600">Kelola koleksi soal dan impor pertanyaan</p>
          </div>
          <Button onClick={() => setShowNewCollectionModal(true)}>
            ➕ Koleksi Baru
          </Button>
        </div>

        {error && (
          <Card className="mb-6 p-4 border-l-4 border-l-red-500 bg-red-50">
            <div className="flex justify-between items-center">
              <span className="text-red-700 font-medium">{error}</span>
              <button onClick={() => setError(null)} className="text-sm text-red-600 hover:text-red-800 font-medium">
                Tutup
              </button>
            </div>
          </Card>
        )}

        {success && (
          <Card className="mb-6 p-4 border-l-4 border-l-green-500 bg-green-50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✓</span>
                <span className="text-green-700 font-medium">{success}</span>
              </div>
              <button onClick={() => setSuccess(null)} className="text-sm text-green-600 hover:text-green-800 font-medium">
                Tutup
              </button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Collections List */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h2 className="font-semibold mb-4 text-slate-900">Koleksi</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {collections.map((col) => (
                  <button
                    key={col._id}
                    onClick={() => setSelectedCollection(col)}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedCollection?._id === col._id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
                    }`}
                  >
                    <div className="font-medium text-sm">{col.title}</div>
                    <div className="text-xs opacity-75 mt-1">{col.numQuestions || 0} soal</div>
                  </button>
                ))}
              </div>

              {selectedCollection && (
                <Button
                  onClick={() => deleteCollection(selectedCollection._id)}
                  variant="destructive"
                  className="mt-4 w-full text-sm"
                >
                  Hapus Koleksi
                </Button>
              )}
            </Card>
          </div>

          {/* Questions and Form */}
          <div className="lg:col-span-3">
            {selectedCollection ? (
              <div className="space-y-6">
                {/* Import Button */}
                <Card className="p-4 border border-blue-200 bg-blue-50">
                  <Button onClick={() => setShowImportModal(true)}>
                    ⬆️ Impor dari TXT
                  </Button>
                  <p className="text-sm text-slate-600 mt-2">Format Ayken: Soal X / A. Opsi / Jawaban: A</p>
                </Card>

                {/* Add Question Form */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 text-slate-900">Tambah Soal</h3>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-1">Pertanyaan</Label>
                      <Textarea
                        value={questionForm.question}
                        onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                        placeholder="Masukkan pertanyaan"
                        className="w-full"
                        rows={3}
                      />
                    </div>

                    {questionForm.type === 'mcq' && (
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2">Opsi</Label>
                        {questionForm.options.map((option, idx) => (
                          <div key={option.id} className="flex gap-2 mb-2">
                            <input
                              type="radio"
                              name="correctAnswer"
                              value={option.id}
                              checked={questionForm.correctAnswer === option.id}
                              onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                              className="mt-2"
                            />
                            <Input
                              type="text"
                              value={option.text}
                              onChange={(e) => updateOption(idx, e.target.value)}
                              placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
                            />
                          </div>
                        ))}
                        <Button
                          onClick={addOption}
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                        >
                          + Tambah Opsi
                        </Button>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-1">Penjelasan (Opsional)</Label>
                      <Textarea
                        value={questionForm.explanation}
                        onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                        placeholder="Penjelasan jawaban"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={addQuestion}
                        disabled={loading}
                      >
                        {loading ? 'Menyimpan...' : 'Simpan Soal'}
                      </Button>
                      <Button
                        onClick={resetQuestionForm}
                        variant="outline"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Questions List */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 text-slate-900">Soal dalam Koleksi ({questions.length})</h3>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {questions.map((question, idx) => (
                      <div key={question._id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-slate-900">
                              {idx + 1}. {question.prompt}
                            </div>
                            {question.type === 'mcq' && question.choices && (
                              <div className="mt-2 space-y-1 text-sm text-slate-600">
                                {question.choices.map((choice, idx) => (
                                  <div
                                    key={choice.id}
                                    className={choice.id === question.correctChoiceId ? 'text-green-600 font-medium' : ''}
                                  >
                                    {String.fromCharCode(65 + idx)}. {choice.text}
                                    {choice.id === question.correctChoiceId && ' ✓'}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => deleteQuestion(question._id)}
                            className="text-red-600 hover:text-red-700 ml-2 font-medium"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-slate-500">Pilih koleksi atau buat koleksi baru</p>
              </Card>
            )}
          </div>
        </div>

      {/* New Collection Modal */}
      {showNewCollectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Koleksi Baru</h2>
            <Input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Nama koleksi"
              className="mb-4"
              onKeyPress={(e) => e.key === 'Enter' && createCollection()}
            />
            <div className="flex gap-2">
              <Button
                onClick={createCollection}
                disabled={loading}
              >
                {loading ? 'Membuat...' : 'Buat'}
              </Button>
              <Button
                onClick={() => setShowNewCollectionModal(false)}
                variant="outline"
              >
                Batal
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Impor Soal dari TXT</h2>
            <p className="text-sm text-slate-600 mb-4">
              Format: Soal 1 / A. Opsi A / Jawaban: A
            </p>
            <Input
              type="file"
              accept=".txt"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button
                onClick={importQuestions}
                disabled={loading || !importFile}
              >
                {loading ? 'Mengimpor...' : 'Impor'}
              </Button>
              <Button
                onClick={() => setShowImportModal(false)}
                variant="outline"
              >
                Batal
              </Button>
            </div>
          </Card>
        </div>
      )}
      </Container>
    </section>
  );
}
