import React, { useState, useEffect } from 'react';

import { useAuth } from '../../lib/auth';

export default function StudentProgressMonitor() {
  const { api } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/courses?role=teacher');
      setCourses(res.data.courses || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat course');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (courseId) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/reports/course/${courseId}/students`);
      setStudents(res.data.students || []);
      setSelectedStudent(null);
      setStudentDetail(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data siswa');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentDetail = async (courseId, studentId) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/reports/course/${courseId}/students/${studentId}`);
      setStudentDetail(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat detail siswa');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    loadStudents(course._id);
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    loadStudentDetail(selectedCourse._id, student._id);
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 size={28} className="text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Monitor Progres Siswa</h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X size={20} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Course Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Course</h2>
              <div className="space-y-2">
                {courses.map((course) => (
                  <button
                    key={course._id}
                    onClick={() => handleCourseSelect(course)}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedCourse?._id === course._id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    <div className="font-medium truncate">{course.title}</div>
                    <div className={`text-xs ${selectedCourse?._id === course._id ? 'opacity-75' : 'text-gray-600'}`}>
                      {course.studentCount || 0} siswa
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {!selectedCourse ? (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                <p>Pilih course untuk melihat progres siswa</p>
              </div>
            ) : !selectedStudent ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">{selectedCourse.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">Total: {students.length} siswa</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Nama Siswa
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Progres
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Materi
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="5" className="text-center py-8 text-gray-500">
                            Memuat data...
                          </td>
                        </tr>
                      ) : students.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-8 text-gray-500">
                            Tidak ada siswa
                          </td>
                        </tr>
                      ) : (
                        students.map((student) => (
                          <tr
                            key={student._id}
                            className="border-b border-gray-200 hover:bg-gray-50 transition"
                          >
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{student.name}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${getProgressColor(student.progressPercent || 0)} transition-all`}
                                    style={{ width: `${student.progressPercent || 0}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-900 w-12 text-right">
                                  {Math.round(student.progressPercent || 0)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {student.lessonCount || 0} materi
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleStudentSelect(student)}
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                              >
                                Detail <ChevronRight size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Student Detail View */
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6">
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4"
                  >
                    ← Kembali ke Daftar Siswa
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedStudent.name}</h2>
                  <p className="text-gray-600">{selectedStudent.email}</p>
                </div>

                {loading ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat detail...</p>
                  </div>
                ) : studentDetail ? (
                  <>
                    {/* Progress Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-sm text-gray-600 mb-1">Progres Keseluruhan</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {Math.round(studentDetail.overallProgress || 0)}%
                        </p>
                      </div>
                      <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-sm text-gray-600 mb-1">Materi Selesai</p>
                        <p className="text-3xl font-bold text-green-600">
                          {studentDetail.completedLessons || 0} / {studentDetail.totalLessons || 0}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-sm text-gray-600 mb-1">Quiz Tercoba</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {studentDetail.quizAttempts?.length || 0}
                        </p>
                      </div>
                    </div>

                    {/* Lessons Progress */}
                    {studentDetail.lessons && studentDetail.lessons.length > 0 && (
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Progres Materi</h3>
                        <div className="space-y-3">
                          {studentDetail.lessons.map((lesson, idx) => (
                            <div key={lesson._id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {idx + 1}. {lesson.title}
                                  </p>
                                </div>
                                {lesson.isCompleted ? (
                                  <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-800 rounded">
                                    ✓ Selesai
                                  </span>
                                ) : (
                                  <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-800 rounded">
                                    Belum
                                  </span>
                                )}
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${lesson.isCompleted ? 'bg-green-500' : 'bg-gray-400'}`}
                                  style={{ width: lesson.isCompleted ? '100%' : '0%' }}
                                />
                              </div>
                              {lesson.completedAt && (
                                <p className="text-xs text-gray-600 mt-2">
                                  Selesai: {new Date(lesson.completedAt).toLocaleDateString('id-ID')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quiz Attempts */}
                    {studentDetail.quizAttempts && studentDetail.quizAttempts.length > 0 && (
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Percobaan Quiz</h3>
                        <div className="space-y-3">
                          {studentDetail.quizAttempts.map((attempt, idx) => (
                            <div key={attempt._id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-medium text-gray-900">Attempt {idx + 1}</p>
                                  <p className="text-sm text-gray-600">
                                    {new Date(attempt.submittedAt).toLocaleString('id-ID')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg">
                                    {attempt.score}/{attempt.maxScore}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {Math.round((attempt.score / attempt.maxScore) * 100)}%
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assignment Attempts */}
                    {studentDetail.assignmentAttempts && studentDetail.assignmentAttempts.length > 0 && (
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Assignment</h3>
                        <div className="space-y-3">
                          {studentDetail.assignmentAttempts.map((attempt) => (
                            <div key={attempt._id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-medium text-gray-900">{attempt.assignmentTitle}</p>
                                  <p className="text-sm text-gray-600">
                                    Submitted: {new Date(attempt.submittedAt).toLocaleString('id-ID')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  {attempt.grade ? (
                                    <>
                                      <p className="font-bold text-lg">{attempt.score}/{attempt.maxScore}</p>
                                      <p className="text-sm font-medium text-gray-600">Grade: {attempt.grade}</p>
                                    </>
                                  ) : (
                                    <p className="text-sm text-yellow-600 font-medium">Menunggu penilaian</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {(!studentDetail.lessons || studentDetail.lessons.length === 0) &&
                      (!studentDetail.quizAttempts || studentDetail.quizAttempts.length === 0) &&
                      (!studentDetail.assignmentAttempts || studentDetail.assignmentAttempts.length === 0) && (
                        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                          <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                          <p>Siswa ini belum memulai course</p>
                        </div>
                      )}
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
