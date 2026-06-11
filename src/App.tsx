import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { LibraryPage } from './pages/LibraryPage';
import { BookReaderPage } from './pages/BookReaderPage';
import { BookEditPage } from './pages/BookEditPage';
import { TeacherCategoriesPage } from './pages/TeacherCategoriesPage';
import { TeacherStudentsPage } from './pages/TeacherStudentsPage';
import { AccountPage } from './pages/AccountPage';
import { ImportLocalPage } from './pages/ImportLocalPage';
import { TeacherSettingsPage } from './pages/TeacherSettingsPage';
import './App.css';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route path="/library" element={
        <ProtectedRoute><LibraryPage /></ProtectedRoute>
      } />
      <Route path="/library/:bookId" element={
        <ProtectedRoute><BookReaderPage /></ProtectedRoute>
      } />
      <Route path="/library/:bookId/edit" element={
        <ProtectedRoute requireTeacher><BookEditPage /></ProtectedRoute>
      } />

      <Route path="/teacher/categories" element={
        <ProtectedRoute requireTeacher><TeacherCategoriesPage /></ProtectedRoute>
      } />
      <Route path="/teacher/students" element={
        <ProtectedRoute requireTeacher><TeacherStudentsPage /></ProtectedRoute>
      } />
      <Route path="/teacher/settings" element={
        <ProtectedRoute requireTeacher><TeacherSettingsPage /></ProtectedRoute>
      } />
      <Route path="/import-local" element={
        <ProtectedRoute requireTeacher><ImportLocalPage /></ProtectedRoute>
      } />

      <Route path="/account" element={
        <ProtectedRoute><AccountPage /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
