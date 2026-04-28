import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Container } from '../components/ui';
import { useAuth } from '../lib/auth';

export default function CertificateView() {
  const { courseId } = useParams();
  const { api, isAuthed } = useAuth();
  const nav = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const certRef = useRef(null);

  useEffect(() => {
    if (!isAuthed) {
      nav('/login');
      return;
    }

    async function load() {
      try {
        const res = await api.get(`/certificates/course/${courseId}`);
        setCertificate(res.data.certificate);
      } catch (e) {
        if (e?.response?.status === 404) {
          // Try to generate certificate
          try {
            const genRes = await api.post(`/certificates/generate/${courseId}`);
            setCertificate(genRes.data.certificate);
          } catch (genErr) {
            setError(genErr?.response?.data?.error?.message || 'Sertifikat belum tersedia');
          }
        } else {
          setError(e?.response?.data?.error?.message || 'Gagal memuat sertifikat');
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [courseId, isAuthed]);

  function handleDownload() {
    if (!certRef.current) return;
    
    // Simple download as image (you can enhance this with html2canvas or similar)
    window.print();
  }

  if (loading) {
    return (
      <section className="py-10">
        <Container>
          <div className="text-center text-slate-600">Memuat sertifikat...</div>
        </Container>
      </section>
    );
  }

  if (error || !certificate) {
    return (
      <section className="py-10">
        <Container>
          <div className="bg-rose-50 border border-rose-200 rounded p-6 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-rose-900 mb-2">⚠️ Error</h2>
            <p className="text-sm text-rose-700 mb-4">{error || 'Sertifikat tidak ditemukan'}</p>
            <Button variant="outline" onClick={() => nav('/my-profile')}>
              Kembali ke Profil
            </Button>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-slate-100/70 py-8 sm:py-10">
      <Container className="space-y-6">
        <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-[#d76810] px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-100">Certificate</div>
              <h1 className="mt-2 text-2xl font-bold">Sertifikat Penyelesaian</h1>
              <p className="mt-1 text-sm text-slate-100/85">Template bawaan sistem dengan data peserta dan course dari LMS.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-2xl border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => nav('/my-profile')}>
                Kembali
              </Button>
              <Button onClick={handleDownload} className="rounded-2xl bg-white text-slate-900 hover:bg-slate-100">
                Download / Print
              </Button>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            <div
              ref={certRef}
              className="relative overflow-hidden rounded-[2rem] border-[14px] border-[#d76810] bg-white p-6 shadow-2xl sm:p-12"
              style={{ aspectRatio: '1.414/1' }}
            >
              <div className="absolute inset-x-6 top-6 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400 sm:inset-x-10 sm:top-10">
                <span>LMS Inspira</span>
                <span>Official Certificate</span>
              </div>
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="h-1.5 w-32 rounded-full bg-[#d76810]" />
                <div className="mt-6 text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Certificate of Completion</div>
                <div className="mt-6 text-lg text-slate-500">This certifies that</div>
                <div className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                  {certificate.metadata?.userName || 'Student Name'}
                </div>
                <div className="mt-6 text-lg text-slate-500">has successfully completed the course</div>
                <div className="mt-4 max-w-3xl text-2xl font-bold text-[#d76810] sm:text-3xl">
                  {certificate.metadata?.courseName || 'Course Name'}
                </div>
                <div className="mt-6 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
                  Completion date:{' '}
                  {new Date(certificate.completionDate).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>

                <div className="mt-10 grid w-full gap-6 border-t border-slate-200 pt-8 sm:grid-cols-2">
                  <div className="text-left">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Certificate Number</div>
                    <div className="mt-2 text-sm font-semibold text-slate-800">{certificate.certificateNumber}</div>
                    <div className="mt-4 text-xs text-slate-500">Sertifikat ini dibuat otomatis oleh sistem berdasarkan penyelesaian course.</div>
                  </div>
                  <div className="text-right">
                    <div className="mx-auto mb-2 h-px w-40 bg-slate-300 sm:ml-auto sm:mr-0" />
                    <div className="text-base font-semibold text-slate-900">{certificate.metadata?.instructorName || 'LMS Inspira'}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Authorized Signature</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-slate-600">
          <p>Sertifikat ini dapat diverifikasi dengan nomor: <span className="font-mono font-semibold">{certificate.certificateNumber}</span></p>
        </div>
      </Container>
    </section>
  );
}
