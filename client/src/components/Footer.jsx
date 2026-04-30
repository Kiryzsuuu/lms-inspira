import { Link } from 'react-router-dom';
import { Container } from './ui';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-300">
      <Container className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/lms-logo.png" alt="Inspira" className="h-6 w-auto" />
              <a href="https://www.inspiratekno.com/" target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:text-slate-300 transition-colors">
                Inspira Innovation
              </a>
            </div>
            <p className="text-sm text-slate-400">
              Platform pembelajaran online terpadu dengan fitur quiz interaktif untuk pengembangan skill Anda.
            </p>
          </div>

          {/* Navigasi */}
          <div>
            <h3 className="font-semibold text-white mb-4">Navigasi</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-white transition-colors">
                  Kursus
                </Link>
              </li>
              <li>
                <Link to="/tentang-kami" className="hover:text-white transition-colors">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Produk */}
          <div>
            <h3 className="font-semibold text-white mb-4">Produk</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/fitur-pembelajaran" className="hover:text-white transition-colors">
                  Fitur Pembelajaran
                </Link>
              </li>
              <li>
                <Link to="/quiz-sertifikat" className="hover:text-white transition-colors">
                  Quiz & Sertifikat
                </Link>
              </li>
              <li>
                <Link to="/analitik-pengguna" className="hover:text-white transition-colors">
                  Analitik Pengguna
                </Link>
              </li>
            </ul>
          </div>

          {/* Dukungan */}
          <div>
            <h3 className="font-semibold text-white mb-4">Dukungan</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:support@inspira.com" className="hover:text-white transition-colors">
                  Hubungi Kami
                </a>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/kebijakan-privasi" className="hover:text-white transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <p className="text-sm text-slate-400">
              © {currentYear} <a href="https://www.inspiratekno.com/" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors">Inspira Innovation</a>. Semua hak dilindungi.
            </p>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Facebook">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333H16V2.169c-.585-.089-1.308-.169-2.227-.169-2.753 0-4.773 1.236-4.773 4.619V8z" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Twitter">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7a10.6 10.6 0 01-9.56-4.3" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Instagram">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" fill="currentColor" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
