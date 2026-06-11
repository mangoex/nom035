// frontend/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SurveyPublic from "./pages/SurveyPublic";
import SurveyIntake from "./pages/SurveyIntake";
import DocumentManager from "./pages/DocumentManager";
import ActionPlanTracker from "./pages/ActionPlanTracker";

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem("user");
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Public Route Wrapper (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const user = localStorage.getItem("user");
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Paths */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />

        {/* Public Survey Path */}
        <Route path="/survey/public/:linkHash" element={<SurveyPublic />} />

        {/* Protected Admin Dashboard Paths */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/intake" 
          element={
            <ProtectedRoute>
              <SurveyIntake />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/documents" 
          element={
            <ProtectedRoute>
              <DocumentManager />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/action-plan" 
          element={
            <ProtectedRoute>
              <ActionPlanTracker />
            </ProtectedRoute>
          } 
        />

        {/* Fallback redirection */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
