import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui';
import { useAuth } from '../lib/auth';
import { ConfirmDialog } from './ConfirmDialog';

function MobileMenuItem({ onSelect, children }) {
  return (
    <button
      type="button"
      className="w-full px-3 py-2 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50"
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
  const [exitOpen, setExitOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

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

  const linkClass = ({ isActive }) =>
    `text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'}`;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex h-16 w-full items-center justify-between px-[clamp(1rem,2vw,2.5rem)]">
        {minimalHeader ? (
          <>
            <button
              type="button"
              className="flex items-center gap-2 font-extrabold tracking-tight text-slate-900"
              onClick={() => setExitOpen(true)}
              aria-label="Kembali"
            >
              <img src="/lms-logo.png" alt="LMS" className="h-6 w-auto sm:h-7" />
              <span className="hidden sm:block">Inspira Innovation</span>
            </button>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setExitOpen(true)}>
                Exit
              </Button>
            </div>

            <ConfirmDialog
              open={exitOpen}
              title="Keluar?"
              message="Kamu yakin ingin keluar dari halaman ini?"
              confirmText="Keluar"
              cancelText="Batal"
              confirmVariant="primary"
              onCancel={() => setExitOpen(false)}
              onConfirm={() => {
                setExitOpen(false);
                nav('/courses');
              }}
            />
          </>
        ) : (
          <>
            <Link to="/courses" className="flex items-center gap-2 font-extrabold tracking-tight text-slate-900">
              <img src="/lms-logo.png" alt="LMS" className="h-6 w-auto sm:h-7" />
              <span className="hidden sm:block">Inspira Innovation</span>
            </Link>

            <nav className="hidden flex-1 items-center justify-center gap-4 sm:flex">
              <NavLink to="/courses" className={linkClass}>
                Courses
              </NavLink>
              {isAuthed && (
                <NavLink to="/dashboard" className={linkClass}>
                  Dashboard
                </NavLink>
              )}
              {(role === 'admin' || role === 'teacher') && (
                <>
                  <NavLink to="/dashboard/heroes" className={linkClass}>
                    Hero
                  </NavLink>
                  <NavLink to="/dashboard/courses" className={linkClass}>
                    Kelola
                  </NavLink>
                </>
              )}
              {role === 'admin' && (
                <NavLink to="/dashboard/users" className={linkClass}>
                  Users
                </NavLink>
              )}
            </nav>

            <div className="flex items-center gap-2">
              {/* Desktop actions */}
              <div className="hidden items-center gap-2 sm:flex">
                {!isAuthed ? (
                  <>
                    <Link to="/login">
                      <Button variant="outline">Login</Button>
                    </Link>
                    <Link to="/register" className="hidden sm:inline">
                      <Button>Register</Button>
                    </Link>
                  </>
                ) : (
                  <>
                    {role === 'student' ? (
                      <Link to="/cart" className="relative hidden sm:inline-flex" aria-label="Cart">
                        <Button variant="outline" className="px-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                            aria-hidden="true"
                          >
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                          </svg>
                        </Button>
                        {cartCount > 0 ? (
                          <span
                            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"
                            aria-label="Cart berisi"
                          />
                        ) : null}
                      </Link>
                    ) : null}

                    <Link to="/my-profile">
                      <Button variant="outline" className="hidden sm:inline text-xs">
                        {user?.name || 'Profile'}
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile overflow menu */}
              <div className="relative sm:hidden">
                <Button
                  variant="outline"
                  className="px-3"
                  aria-haspopup="menu"
                  aria-expanded={mobileMenuOpen}
                  onClick={() => setMobileMenuOpen((s) => !s)}
                >
                  ⋮
                </Button>

                {mobileMenuOpen ? (
                  <>
                    <button
                      type="button"
                      aria-label="Tutup menu"
                      className="fixed inset-0 z-30"
                      onClick={closeMobileMenu}
                    />
                    <div
                      role="menu"
                      className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-56 overflow-hidden border border-slate-200 bg-white shadow-sm"
                    >
                      <MobileMenuItem
                        onSelect={() => {
                          closeMobileMenu();
                          nav('/courses');
                        }}
                      >
                        Courses
                      </MobileMenuItem>
                      {isAuthed && role === 'student' ? (
                        <MobileMenuItem
                          onSelect={() => {
                            closeMobileMenu();
                            nav('/cart');
                          }}
                        >
                          <span className="flex items-center justify-between">
                            <span>Cart</span>
                            {cartCount > 0 ? <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> : null}
                          </span>
                        </MobileMenuItem>
                      ) : null}
                      {isAuthed ? (
                        <MobileMenuItem
                          onSelect={() => {
                            closeMobileMenu();
                            nav('/dashboard');
                          }}
                        >
                          Dashboard
                        </MobileMenuItem>
                      ) : null}
                      {role === 'admin' || role === 'teacher' ? (
                        <>
                          <MobileMenuItem
                            onSelect={() => {
                              closeMobileMenu();
                              nav('/dashboard/heroes');
                            }}
                          >
                            Hero
                          </MobileMenuItem>
                          <MobileMenuItem
                            onSelect={() => {
                              closeMobileMenu();
                              nav('/dashboard/courses');
                            }}
                          >
                            Kelola
                          </MobileMenuItem>
                        </>
                      ) : null}
                      {role === 'admin' ? (
                        <MobileMenuItem
                          onSelect={() => {
                            closeMobileMenu();
                            nav('/dashboard/users');
                          }}
                        >
                          Users
                        </MobileMenuItem>
                      ) : null}
                      <div className="border-t border-slate-200" />
                      {!isAuthed ? (
                        <>
                          <MobileMenuItem
                            onSelect={() => {
                              closeMobileMenu();
                              nav('/login');
                            }}
                          >
                            Login
                          </MobileMenuItem>
                          <MobileMenuItem
                            onSelect={() => {
                              closeMobileMenu();
                              nav('/register');
                            }}
                          >
                            Register
                          </MobileMenuItem>
                        </>
                      ) : (
                        <>
                          <MobileMenuItem
                            onSelect={() => {
                              closeMobileMenu();
                              nav('/my-profile');
                            }}
                          >
                            Profil Saya
                          </MobileMenuItem>
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50"
                            onClick={() => {
                              closeMobileMenu();
                              logout();
                            }}
                          >
                            Logout
                          </button>
                        </>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
