import { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui';
import { useAuth } from '../lib/auth';
import { ConfirmDialog } from './ConfirmDialog';

function NavDropdown({ label, isOpen, onHover, children }) {
  return (
    <div className="relative" onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}>
      <button className="text-white font-medium text-sm hover:scale-105 transition-transform py-2">
        {label}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-0 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
          {children}
        </div>
      )}
    </div>
  );
}

function MobileMenuGroup({ label, children }) {
  return (
    <>
      <div className="px-4 py-2 text-xs font-semibold uppercase text-slate-500 border-t border-slate-100">
        {label}
      </div>
      {children}
    </>
  );
}

function MobileMenuItem({ onSelect, children }) {
  return (
    <button
      type="button"
      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
      onClick={onSelect}
    >
      {children}
    </button>
  );
}

export function Navbar() {
  const { api, isAuthed, role, user, logout } = useAuth();
  const location = useLocation();
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const confirmExitRef = useRef(() => {});

  useEffect(() => {
    let cancelled = false;

    async function loadCartCount() {
      if (!isAuthed || role !== 'student') {
        setCartCount(0);
        return;
      }
      try {
        const res = await api.get('/cart');
        const count = Array.isArray(res.data?.items) ? res.data.items.length : 0;
        if (!cancelled) setCartCount(count);
      } catch {
        if (!cancelled) setCartCount(0);
      }
    }

    const onCartChanged = () => loadCartCount();

    window.addEventListener('cart:changed', onCartChanged);
    loadCartCount();

    return () => {
      cancelled = true;
      window.removeEventListener('cart:changed', onCartChanged);
    };
  }, [api, isAuthed, role, location?.pathname]);

  const path = location?.pathname || '';
  const minimalHeader =
    /^\/courses\/.+/.test(path) ||
    /^\/quiz\/.+/.test(path);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleExitClick = () => {
    setExitConfirmOpen(true);
    confirmExitRef.current = () => nav('/');
  };

  return (
    <>
      <ConfirmDialog
        open={exitConfirmOpen}
        title="Keluar dari Course"
        message="Anda akan meninggalkan course ini. Pastikan semua perubahan sudah tersimpan sebelum meninggalkan halaman ini."
        confirmText="Ya, Keluar"
        confirmVariant="danger"
        onCancel={() => setExitConfirmOpen(false)}
        onConfirm={() => {
          setExitConfirmOpen(false);
          confirmExitRef.current();
        }}
      />
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800">
      <div className="flex h-16 w-full items-center justify-between px-[clamp(1rem,2vw,2.5rem)]">
        {minimalHeader ? (
          <>
            <button
              type="button"
              className="flex items-center gap-2 font-extrabold tracking-tight text-white hover:scale-105 transition-transform"
              onClick={handleExitClick}
              aria-label="Kembali ke home"
            >
              <img src="/lms-logo.png" alt="LMS" className="h-6 w-auto sm:h-7" />
              <span className="hidden sm:block font-bold">Inspira Innovation</span>
            </button>

            <div className="flex items-center gap-2">
              <Button className="bg-primary text-white" onClick={handleExitClick}>
                Exit
              </Button>
            </div>
          </>
        ) : (
          <>
            <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight text-white hover:scale-105 transition-transform">
              <img src="/lms-logo.png" alt="LMS" className="h-6 w-auto sm:h-7" />
              <span className="hidden sm:block font-bold">Inspira Innovation</span>
            </Link>

            <nav className="hidden flex-1 items-center justify-center gap-8 sm:flex">
              <Link to="/courses" className="text-white font-medium text-sm hover:scale-105 transition-transform py-2">
                Kursus
              </Link>

              {(role === 'admin' || role === 'teacher') && (
                <NavDropdown
                  label="Pembelajaran"
                  isOpen={dropdownOpen === 'pembelajaran'}
                  onHover={(open) => setDropdownOpen(open ? 'pembelajaran' : null)}
                >
                  <Link to="/dashboard/courses" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100">
                    Kelola Kursus
                  </Link>
                  <Link to="/dashboard/question-bank" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100">
                    Bank Soal
                  </Link>
                  <Link to="/dashboard/student-progress" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100">
                    Monitor Siswa
                  </Link>
                  <Link to="/dashboard/heroes" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    Hero Carousel
                  </Link>
                </NavDropdown>
              )}

              {role === 'admin' && (
                <NavDropdown
                  label="Administrasi"
                  isOpen={dropdownOpen === 'admin'}
                  onHover={(open) => setDropdownOpen(open ? 'admin' : null)}
                >
                  <Link to="/dashboard/users" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100">
                    Kelola Pengguna
                  </Link>
                  <Link to="/dashboard/accounting" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100">
                    Pembukuan
                  </Link>
                  <Link to="/dashboard/coupons" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    Kelola Kupon
                  </Link>
                </NavDropdown>
              )}
            </nav>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex items-center gap-3">
                {!isAuthed ? (
                  <>
                    <Link to="/login">
                      <Button variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
                        Masuk
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button className="bg-primary text-white">
                        Daftar
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    {role === 'student' && (
                      <Link to="/cart" className="relative inline-flex" aria-label="Keranjang">
                        <div className="text-white p-2 rounded-lg hover:scale-110 transition-transform">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5"
                            aria-hidden="true"
                          >
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                          </svg>
                        </div>
                        {cartCount > 0 && (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900" />
                        )}
                      </Link>
                    )}

                    <div className="relative">
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-white hover:scale-105 transition-transform"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                        </div>
                        <span className="text-sm hidden md:block text-white">{user?.name || 'Profile'}</span>
                      </button>

                      {userMenuOpen && (
                        <>
                          <button type="button" className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-40">
                            <Link to="/dashboard" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100">
                              Dashboard
                            </Link>
                            <Link to="/my-profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100">
                              Profil Saya
                            </Link>
                            <button
                              type="button"
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              onClick={() => {
                                setUserMenuOpen(false);
                                logout();
                              }}
                            >
                              Logout
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="relative sm:hidden">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={mobileMenuOpen}
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex items-center justify-center h-10 w-10 rounded-lg text-white hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {mobileMenuOpen && (
                  <>
                    <button type="button" className="fixed inset-0 z-30" onClick={closeMobileMenu} />
                    <div className="absolute right-0 top-full mt-2 z-40 w-64 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-[80vh] overflow-y-auto">
                      <MobileMenuGroup label="Utama">
                        <MobileMenuItem onSelect={() => { closeMobileMenu(); nav('/courses'); }}>
                          Kursus
                        </MobileMenuItem>
                        {isAuthed && (
                          <MobileMenuItem onSelect={() => { closeMobileMenu(); nav('/dashboard'); }}>
                            Dashboard
                          </MobileMenuItem>
                        )}
                      </MobileMenuGroup>

                      {role === 'student' && (
                        <MobileMenuGroup label="Pembelajaran">
                          <MobileMenuItem onSelect={() => { closeMobileMenu(); nav('/cart'); }}>
                            <span className="flex items-center justify-between">
                              Keranjang
                              {cartCount > 0 && <span className="h-2 w-2 rounded-full bg-rose-500" />}
                            </span>
                          </MobileMenuItem>
                        </MobileMenuGroup>
                      )}

                      {(role === 'admin' || role === 'teacher') && (
                        <MobileMenuGroup label="Pembelajaran">
                          <MobileMenuItem onSelect={() => { closeMobileMenu(); nav('/dashboard/courses'); }}>
                            Kelola Kursus
                          </MobileMenuItem>
                          <MobileMenuItem onSelect={() => { closeMobileMenu(); nav('/dashboard/question-bank'); }}>
                            Bank Soal
                          </MobileMenuItem>
                          <MobileMenuItem onSelect={() => { closeMobileMenu(); nav('/dashboard/student-progress'); }}>
                            Monitor Siswa
                          </MobileMenuItem>
                          <MobileMenuItem onSelect={() => { closeMobileMenu(); nav('/dashboard/heroes'); }}>
                            Hero Carousel
                          </MobileMenuItem>
                        </MobileMenuGroup>
                      )}

                      {role === 'admin' && (
                        <MobileMenuGroup label="Administrasi">
                          <MobileMenuItem onSelect={() => { closeMobileMenu(); nav('/dashboard/users'); }}>
                            Kelola Pengguna
                          </MobileMenuItem>
                          <MobileMenuItem onSelect={() => { closeMobileMenu(); nav('/dashboard/accounting'); }}>
                            Pembukuan
                          </MobileMenuItem>
                          <MobileMenuItem onSelect={() => { closeMobileMenu(); nav('/dashboard/coupons'); }}>
                            Kelola Kupon
                          </MobileMenuItem>
                        </MobileMenuGroup>
                      )}

                      {!isAuthed && (
                        <MobileMenuGroup label="Akun">
                          <MobileMenuItem onSelect={() => { closeMobileMenu(); nav('/login'); }}>
                            Masuk
                          </MobileMenuItem>
                          <MobileMenuItem onSelect={() => { closeMobileMenu(); nav('/register'); }}>
                            Daftar
                          </MobileMenuItem>
                        </MobileMenuGroup>
                      )}

                      {isAuthed && (
                        <MobileMenuGroup label="Akun">
                          <MobileMenuItem onSelect={() => { closeMobileMenu(); nav('/my-profile'); }}>
                            Profil Saya
                          </MobileMenuItem>
                          <MobileMenuItem
                            onSelect={() => {
                              closeMobileMenu();
                              logout();
                            }}
                          >
                            Logout
                          </MobileMenuItem>
                        </MobileMenuGroup>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
    </>
  );
}
