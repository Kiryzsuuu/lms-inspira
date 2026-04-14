import { Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import QuizPlay from './pages/QuizPlay';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import HeroManager from './pages/dashboard/HeroManager';
import CourseManager from './pages/dashboard/CourseManager';
import UserManager from './pages/dashboard/UserManager';
import { RequireAuth } from './components/RequireAuth';
import { Container } from './components/ui';

export default function App() {
  return (
    <div className="min-h-full">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/quiz/:quizId" element={<QuizPlay />} />
        <Route
          path="/cart"
          element={
            <RequireAuth roles={['student']}>
              <Cart />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/heroes"
          element={
            <RequireAuth roles={['admin', 'teacher']}>
              <HeroManager />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/courses"
          element={
            <RequireAuth roles={['admin', 'teacher']}>
              <CourseManager />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/users"
          element={
            <RequireAuth roles={['admin']}>
              <UserManager />
            </RequireAuth>
          }
        />

        <Route
          path="*"
          element={
            <Container className="py-10">
              <div className="border border-slate-200 bg-white p-8 text-sm text-slate-600">
                Halaman tidak ditemukan. <a className="font-semibold text-slate-900 hover:underline" href="/">Kembali</a>
              </div>
            </Container>
          }
        />
      </Routes>
    </div>
  );
}
