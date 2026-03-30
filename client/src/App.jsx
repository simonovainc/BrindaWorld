import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider }   from './context/AuthContext';
import ProtectedRoute     from './components/ProtectedRoute';
import DemoModeBanner, { isDemoMode, DEMO_DATA } from './components/DemoModeBanner';

import Home      from './pages/Home';
import Login     from './pages/Login';
import Register  from './pages/Register';
import About     from './pages/About';
import Contact   from './pages/Contact';
import NotFound  from './pages/NotFound';

// Lazy-loaded heavy pages (P5 perf + S5/S6/S7)
const Dashboard        = React.lazy(() => import('./pages/Dashboard'));
const TeacherRegister  = React.lazy(() => import('./pages/TeacherRegister'));
const TeacherLogin     = React.lazy(() => import('./pages/TeacherLogin'));
const TeacherDashboard = React.lazy(() => import('./pages/TeacherDashboard'));
const PrivacyPage      = React.lazy(() => import('./pages/PrivacyPage'));
const TeachersPage     = React.lazy(() => import('./pages/TeachersPage'));
const AboutPage        = React.lazy(() => import('./pages/AboutPage'));
const CurriculumPage   = React.lazy(() => import('./pages/CurriculumPage'));
const AdminAnalytics   = React.lazy(() => import('./pages/AdminAnalytics'));

const LoadingFallback = () => (
  <div style={{ padding: 40, textAlign: 'center', color: '#e91e8c' }}>Loading... 🌸</div>
);

function App() {
  return (
    <AuthProvider>
      <DemoModeBanner />
      <div id="main-content">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/"          element={<Home />} />
            <Route path="/login"     element={<Login />} />
            <Route path="/register"  element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/teacher/register"  element={<TeacherRegister />} />
            <Route path="/teacher/login"     element={<TeacherLogin />} />
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/privacy"           element={<PrivacyPage />} />
            <Route path="/teachers"          element={<TeachersPage />} />
            <Route path="/about-us"          element={<AboutPage />} />
            <Route path="/curriculum"        element={<CurriculumPage />} />
            <Route path="/admin/analytics"   element={<AdminAnalytics />} />
            <Route path="/about"   element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*"        element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </AuthProvider>
  );
}

export default App;
