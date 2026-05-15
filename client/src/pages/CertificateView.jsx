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
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef(null);

  useEffect(() => {
    if (!isAuthed) { nav('/login'); return; }
    async function load() {
      try {
        const res = await api.get(`/certificates/course/${courseId}`);
        setCertificate(res.data.certificate);
      } catch (e) {
        if (e?.response?.status === 404) {
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

  async function handleDownload() {
    if (!certRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      const fileName = `Sertifikat-${(certificate?.metadata?.courseName || 'Course').replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 40)}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      window.print();
    } finally {
      setDownloading(false);
    }
  }

  const issueDate = certificate?.completionDate
    ? new Date(certificate.completionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '-';

  if (loading) {
    return (
      <section className="py-20">
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
          <div className="bg-rose-50 border border-rose-200 rounded-[14px] p-6 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-rose-900 mb-2">⚠️ Error</h2>
            <p className="text-sm text-rose-700 mb-4">{error || 'Sertifikat tidak ditemukan'}</p>
            <Button variant="outline" onClick={() => nav('/')}>Kembali ke Home</Button>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <div style={{ background: '#F7F8FA', minHeight: '100vh' }}>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #cert-printable, #cert-printable * { visibility: visible !important; }
          #cert-printable { position: fixed !important; inset: 0 !important; z-index: 9999 !important; }
          @page { size: A4 landscape; margin: 0; }
        }
      `}</style>

      {/* Top bar */}
      <div style={{ background: 'linear-gradient(90deg, #0C628D 0%, #0FADA8 100%)', padding: '0' }}>
        <Container>
          <div className="flex items-center justify-between py-4 gap-3">
            <div className="flex items-center gap-3">
              <img src="/logo-putih.png" alt="Inspira" style={{ height: 28 }} />
              <span className="text-white font-semibold text-sm hidden sm:block">Sertifikat Penyelesaian</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="text-sm"
                style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff', background: 'rgba(255,255,255,0.12)' }}
                onClick={() => nav('/')}
              >
                Home
              </Button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="text-sm font-semibold px-4 py-2 rounded-[10px] transition-all"
                style={{ background: '#F3921B', color: '#fff', opacity: downloading ? 0.7 : 1, cursor: downloading ? 'not-allowed' : 'pointer' }}
              >
                {downloading ? 'Menyiapkan...' : 'Unduh PDF'}
              </button>
            </div>
          </div>
        </Container>
      </div>

      {/* Certificate wrapper */}
      <div className="py-8 px-4">
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          {/* Certificate card */}
          <div id="cert-printable">
            <div
              ref={certRef}
              style={{
                width: '100%',
                aspectRatio: '297/210',
                background: '#fff',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: '"Inter", "Helvetica Neue", sans-serif',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                borderRadius: 12,
              }}
            >
              {/* Left accent bar */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 10,
                background: 'linear-gradient(180deg, #0C628D 0%, #0FADA8 50%, #F3921B 100%)',
              }} />

              {/* Top decorative strip */}
              <div style={{
                position: 'absolute', top: 0, left: 10, right: 0, height: 6,
                background: 'linear-gradient(90deg, #0C628D 0%, #0FADA8 60%, #F3921B 100%)',
              }} />

              {/* Watermark circle */}
              <div style={{
                position: 'absolute', right: -80, top: -80,
                width: 320, height: 320, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(12,98,141,0.05) 0%, transparent 70%)',
                border: '2px solid rgba(12,98,141,0.06)',
              }} />
              <div style={{
                position: 'absolute', right: -40, top: -40,
                width: 200, height: 200, borderRadius: '50%',
                background: 'transparent',
                border: '1.5px solid rgba(243,146,27,0.1)',
              }} />

              {/* Bottom left decorative */}
              <div style={{
                position: 'absolute', left: 30, bottom: -60,
                width: 180, height: 180, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(15,173,168,0.05) 0%, transparent 70%)',
              }} />

              {/* Content area */}
              <div style={{
                position: 'absolute', inset: 0, left: 10, top: 6,
                display: 'flex', flexDirection: 'column',
                padding: '5% 7% 5% 6%',
              }}>
                {/* Header row: logo left, cert number right */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4%' }}>
                  <img src="/logo-inspira.png" alt="Inspira Innovation" style={{ height: '8%', maxHeight: 44, objectFit: 'contain' }} />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.55em', fontWeight: 700, letterSpacing: '0.15em', color: '#9CA3AF', textTransform: 'uppercase' }}>
                      No. Sertifikat
                    </div>
                    <div style={{ fontSize: '0.6em', fontWeight: 600, color: '#374151', fontFamily: 'monospace', marginTop: 2 }}>
                      {certificate.certificateNumber}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {/* Sub-label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '3%' }}>
                    <div style={{ height: 2, width: 32, background: '#F3921B', borderRadius: 2 }} />
                    <span style={{ fontSize: '0.62em', fontWeight: 700, letterSpacing: '0.2em', color: '#F3921B', textTransform: 'uppercase' }}>
                      Certificate of Completion
                    </span>
                    <div style={{ height: 2, flex: 1, background: 'linear-gradient(90deg, #F3921B, transparent)', borderRadius: 2 }} />
                  </div>

                  {/* "Diberikan kepada" */}
                  <div style={{ fontSize: '0.75em', color: '#6B7280', marginBottom: '1.5%' }}>
                    Dengan bangga diberikan kepada
                  </div>

                  {/* Student name */}
                  <div style={{
                    fontSize: '2.2em', fontWeight: 800,
                    color: '#0A0E1A', letterSpacing: '-0.01em',
                    lineHeight: 1.15,
                    marginBottom: '2%',
                    fontFamily: '"Bricolage Grotesque", "Inter", sans-serif',
                  }}>
                    {certificate.metadata?.userName || 'Nama Peserta'}
                  </div>

                  {/* "atas penyelesaian" */}
                  <div style={{ fontSize: '0.75em', color: '#6B7280', marginBottom: '1%' }}>
                    atas keberhasilan menyelesaikan kursus
                  </div>

                  {/* Course name */}
                  <div style={{
                    fontSize: '1.1em', fontWeight: 700,
                    color: '#0C628D',
                    lineHeight: 1.35,
                    marginBottom: '4%',
                    maxWidth: '75%',
                  }}>
                    {certificate.metadata?.courseName || 'Nama Kursus'}
                  </div>

                  {/* Footer row */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                    paddingTop: '3%',
                    borderTop: '1px solid #F3F4F6',
                  }}>
                    {/* Date & platform */}
                    <div>
                      <div style={{ fontSize: '0.55em', fontWeight: 600, letterSpacing: '0.12em', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 }}>
                        Tanggal Penyelesaian
                      </div>
                      <div style={{ fontSize: '0.72em', fontWeight: 600, color: '#374151' }}>
                        {issueDate}
                      </div>
                      <div style={{ fontSize: '0.55em', color: '#9CA3AF', marginTop: 6 }}>
                        Platform: Inspira Innovation LMS
                      </div>
                    </div>

                    {/* Instructor signature */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: 120, height: 1, background: '#D1D5DB', margin: '0 auto 6px' }} />
                      <div style={{ fontSize: '0.68em', fontWeight: 600, color: '#374151' }}>
                        {certificate.metadata?.instructorName || 'Inspira Innovation'}
                      </div>
                      <div style={{ fontSize: '0.52em', letterSpacing: '0.12em', color: '#9CA3AF', textTransform: 'uppercase', marginTop: 2 }}>
                        Instruktur / Authorized
                      </div>
                    </div>

                    {/* Seal / badge */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0C628D 0%, #0FADA8 100%)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(12,98,141,0.3)',
                      }}>
                        <span style={{ color: '#fff', fontSize: '1.4em', lineHeight: 1 }}>✓</span>
                        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.38em', fontWeight: 700, letterSpacing: '0.05em', marginTop: 2 }}>
                          VERIFIED
                        </span>
                      </div>
                      <div style={{ fontSize: '0.45em', color: '#9CA3AF', textAlign: 'center' }}>
                        Inspira Innovation
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info below */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Verifikasi sertifikat dengan nomor:{' '}
              <span className="font-mono font-semibold text-gray-700">{certificate.certificateNumber}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
