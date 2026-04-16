import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui';
import { useAuth } from '../lib/auth';
import { ConfirmDialog } from './ConfirmDialog';

export function Navbar() {
  const { isAuthed, role, user, logout } = useAuth();
  const location = useLocation();
  const nav = useNavigate();
  const [exitOpen, setExitOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const path = location?.pathname || '';
  const minimalHeader =
    /^\/courses\/.+/.test(path) ||
    /^\/quiz\/.+/.test(path);

  const linkClass = ({ isActive }) =>
    `text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'}`;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const MobileMenuItem = ({ to, children }) => (
    <button
      type="button"
      className="w-full px-3 py-2 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50"
      onClick={() => {
        closeMobileMenu();
        nav(to);
      }}
    >
      {children}
    </button>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex h-16 w-full items-center justify-between px-[clamp(1rem,2vw,2.5rem)]">
        {minimalHeader ? (
          <>
            <div className="flex items-center gap-2 font-extrabold tracking-tight text-slate-900">
              <img src="/lms-logo.png" alt="LMS" className="h-6 w-auto sm:h-7" />
              <span className="hidden sm:block">Inspira Innovation</span>
            </div>

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
            <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight text-slate-900">
              <img src="/lms-logo.png" alt="LMS" className="h-6 w-auto sm:h-7" />
              <span className="hidden sm:block">Inspira Innovation</span>
            </Link>

            <nav className="hidden flex-1 items-center justify-center gap-4 sm:flex">
              <NavLink to="/courses" className={linkClass}>
                Courses
              </NavLink>
              {isAuthed && role === 'student' && (
                <NavLink to="/cart" className={linkClass}>
                  Cart
                </NavLink>
              )}
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
                      <MobileMenuItem to="/courses">Courses</MobileMenuItem>
                      {isAuthed && role === 'student' ? <MobileMenuItem to="/cart">Cart</MobileMenuItem> : null}
                      {isAuthed ? <MobileMenuItem to="/dashboard">Dashboard</MobileMenuItem> : null}
                      {role === 'admin' || role === 'teacher' ? (
                        <>
                          <MobileMenuItem to="/dashboard/heroes">Hero</MobileMenuItem>
                          <MobileMenuItem to="/dashboard/courses">Kelola</MobileMenuItem>
                        </>
                      ) : null}
                      {role === 'admin' ? <MobileMenuItem to="/dashboard/users">Users</MobileMenuItem> : null}
                      <div className="border-t border-slate-200" />
                      {!isAuthed ? (
                        <>
                          <MobileMenuItem to="/login">Login</MobileMenuItem>
                          <MobileMenuItem to="/register">Register</MobileMenuItem>
                        </>
                      ) : (
                        <>
                          <MobileMenuItem to="/my-profile">Profil Saya</MobileMenuItem>
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
