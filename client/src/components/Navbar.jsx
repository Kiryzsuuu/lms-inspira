import { Link, NavLink } from 'react-router-dom';
import { Container, Button } from './ui';
import { useAuth } from '../lib/auth';

export function Navbar() {
  const { isAuthed, role, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'}`;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight text-slate-900">
          <img src="/lms-logo.png" alt="LMS" className="h-7 w-auto" />
          <span className="hidden sm:block">Inspira Innovation</span>
        </Link>

        <nav className="flex items-center gap-4">
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
              <span className="hidden sm:inline text-xs text-slate-500">Role: {role}</span>
              <Button variant="ghost" onClick={logout}>
                Logout
              </Button>
            </>
          )}
        </div>
      </Container>
    </header>
  );
}
