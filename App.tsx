import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import Quiz from './pages/Quiz';
import MyLearning from './pages/MyLearning';
import Assessment from './pages/Assessment';
import SkillAssessment from './pages/SkillAssessment';
import TalentProfile from './pages/TalentProfile';
import AdminDashboard from './pages/AdminDashboard';
import AdminCourseManagement from './pages/AdminCourseCreate';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminLearningRecords from './pages/AdminLearningRecords';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({ children, requireAdmin }) => {
  const { user } = useStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { user } = useStore();
  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <CourseList />
          </ProtectedRoute>
        } />
        
        <Route path="/course/:id" element={
          <ProtectedRoute>
            <CourseDetail />
          </ProtectedRoute>
        } />

        <Route path="/course/:id/quiz" element={
          <ProtectedRoute>
            <Quiz />
          </ProtectedRoute>
        } />

        <Route path="/my-learning" element={
          <ProtectedRoute>
            <MyLearning />
          </ProtectedRoute>
        } />

        <Route path="/assessment" element={
          <ProtectedRoute>
            <Assessment />
          </ProtectedRoute>
        } />

        <Route path="/skill-assessment" element={
          <ProtectedRoute>
            <SkillAssessment />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <TalentProfile />
          </ProtectedRoute>
        } />

        <Route path="/profile/:userId" element={
          <ProtectedRoute requireAdmin>
             <TalentProfile />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/admin/create-course" element={
          <ProtectedRoute requireAdmin>
            <AdminCourseManagement />
          </ProtectedRoute>
        } />

        <Route path="/admin/users" element={
          <ProtectedRoute requireAdmin>
            <AdminUserManagement />
          </ProtectedRoute>
        } />

        <Route path="/admin/records" element={
          <ProtectedRoute requireAdmin>
            <AdminLearningRecords />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

const App: React.FC = () => {
  return (
    <StoreProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </StoreProvider>
  );
};

export default App;