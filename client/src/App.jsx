import { Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import LessonPresentation from './pages/LessonPresentation';
import QuizPlay from './pages/QuizPlay';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OtpVerify from './pages/OtpVerify';
import MyProfile from './pages/MyProfile';
import Dashboard from './pages/Dashboard';
import HeroManager from './pages/dashboard/HeroManager';
import CourseManager from './pages/dashboard/CourseManager';
import UserManager from './pages/dashboard/UserManager';
import Accounting from './pages/dashboard/Accounting';
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
        <Route path="/courses/:id/lessons/:lessonId" element={<LessonPresentation />} />
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
        <Route path="/otp" element={<OtpVerify />} />

        <Route
          path="/my-profile"
          element={
            <RequireAuth>
              <MyProfile />
            </RequireAuth>
          }
        />

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
          path="/dashboard/accounting"
          element={
            <RequireAuth roles={['admin']}>
              <Accounting />
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
