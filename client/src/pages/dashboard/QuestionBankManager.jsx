import React, { useState, useEffect } from 'react';
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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Bank Soal</h1>
          <button
            onClick={() => setShowNewCollectionModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            ➕ Koleksi Baru
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X size={20} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} /> {success}
            </div>
            <button onClick={() => setSuccess(null)}>
              <X size={20} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Collections List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Koleksi</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {collections.map((col) => (
                  <div
                    key={col._id}
                    onClick={() => setSelectedCollection(col)}
                    className={`p-3 rounded-lg cursor-pointer transition ${
                      selectedCollection?._id === col._id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className="font-medium text-sm">{col.title}</div>
                    <div className="text-xs opacity-75 mt-1">{col.numQuestions || 0} soal</div>
                  </div>
                ))}
              </div>

              {selectedCollection && (
                <button
                  onClick={() => deleteCollection(selectedCollection._id)}
                  className="mt-4 w-full px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                >
                  Hapus Koleksi
                </button>
              )}
            </div>
          </div>

          {/* Questions and Form */}
          <div className="lg:col-span-3">
            {selectedCollection ? (
              <div className="space-y-6">
                {/* Import Button */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    <Upload size={20} /> Impor dari TXT
                  </button>
                  <p className="text-sm text-gray-600 mt-2">Format Ayken: Soal X / A. Opsi / Jawaban: A</p>
                </div>

                {/* Add Question Form */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Tambah Soal</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pertanyaan</label>
                      <textarea
                        value={questionForm.question}
                        onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                        placeholder="Masukkan pertanyaan"
                        className="w-full border border-gray-300 rounded-lg p-2"
                        rows="3"
                      />
                    </div>

                    {questionForm.type === 'mcq' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Opsi</label>
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
                            <input
                              type="text"
                              value={option.text}
                              onChange={(e) => updateOption(idx, e.target.value)}
                              placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
                              className="flex-1 border border-gray-300 rounded-lg p-2"
                            />
                          </div>
                        ))}
                        <button
                          onClick={addOption}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          + Tambah Opsi
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Penjelasan (Opsional)</label>
                      <textarea
                        value={questionForm.explanation}
                        onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                        placeholder="Penjelasan jawaban"
                        className="w-full border border-gray-300 rounded-lg p-2"
                        rows="2"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={addQuestion}
                        disabled={loading}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {loading ? 'Menyimpan...' : 'Simpan Soal'}
                      </button>
                      <button
                        onClick={resetQuestionForm}
                        className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Soal dalam Koleksi ({questions.length})</h3>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {questions.map((question, idx) => (
                      <div key={question._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                              {idx + 1}. {question.prompt}
                            </div>
                            {question.type === 'mcq' && question.choices && (
                              <div className="mt-2 space-y-1 text-sm text-gray-600">
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
                            className="text-red-600 hover:text-red-700 ml-2"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                <p>Pilih koleksi atau buat koleksi baru</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Collection Modal */}
      {showNewCollectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Koleksi Baru</h2>
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Nama koleksi"
              className="w-full border border-gray-300 rounded-lg p-2 mb-4"
              onKeyPress={(e) => e.key === 'Enter' && createCollection()}
            />
            <div className="flex gap-2">
              <button
                onClick={createCollection}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Membuat...' : 'Buat'}
              </button>
              <button
                onClick={() => setShowNewCollectionModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Impor Soal dari TXT</h2>
            <p className="text-sm text-gray-600 mb-4">
              Format: Soal 1 / A. Opsi A / Jawaban: A
            </p>
            <input
              type="file"
              accept=".txt"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={importQuestions}
                disabled={loading || !importFile}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Mengimpor...' : 'Impor'}
              </button>
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
