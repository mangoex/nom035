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
import Settings from "./pages/Settings";
import SuperadminCompanies from "./pages/SuperadminCompanies";
import SuperadminConsultants from "./pages/SuperadminConsultants";
import ConsultantDashboard from "./pages/ConsultantDashboard";
import ConsultantCompanies from "./pages/ConsultantCompanies";
import ConsultantUsers from "./pages/ConsultantUsers";
import CompanyTrainings from "./pages/CompanyTrainings";
import PrivacyNotice from "./pages/PrivacyNotice";

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }
  const user = JSON.parse(userStr);
  if (user.role === "superadmin") {
    return <Navigate to="/superadmin/companies" replace />;
  }
  if (user.role === "consultor") {
    return <Navigate to="/consultant/dashboard" replace />;
  }
  return children;
};

// Superadmin Exclusive Route Wrapper
const SuperadminRoute = ({ children }) => {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }
  const user = JSON.parse(userStr);
  if (user.role !== "superadmin") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Consultant Exclusive Route Wrapper
const ConsultantRoute = ({ children }) => {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }
  const user = JSON.parse(userStr);
  if (user.role !== "consultor") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Public Route Wrapper (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user.role === "superadmin") {
      return <Navigate to="/superadmin/companies" replace />;
    }
    if (user.role === "consultor") {
      return <Navigate to="/consultant/dashboard" replace />;
    }
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
        <Route path="/aviso-de-privacidad" element={<PrivacyNotice />} />

        {/* Public Survey Path */}
        <Route path="/survey/public/:linkHash" element={<SurveyPublic />} />

        {/* Superadmin Exclusive Paths */}
        <Route 
          path="/superadmin/companies" 
          element={
            <SuperadminRoute>
              <SuperadminCompanies />
            </SuperadminRoute>
          } 
        />
        <Route 
          path="/superadmin/consultants" 
          element={
            <SuperadminRoute>
              <SuperadminConsultants />
            </SuperadminRoute>
          } 
        />

        {/* Consultant Exclusive Paths */}
        <Route 
          path="/consultant/dashboard" 
          element={
            <ConsultantRoute>
              <ConsultantDashboard />
            </ConsultantRoute>
          } 
        />
        <Route 
          path="/consultant/companies" 
          element={
            <ConsultantRoute>
              <ConsultantCompanies />
            </ConsultantRoute>
          } 
        />
        <Route 
          path="/consultant/users" 
          element={
            <ConsultantRoute>
              <ConsultantUsers />
            </ConsultantRoute>
          } 
        />
        <Route
          path="/consultant/results"
          element={
            <ConsultantRoute>
              <Dashboard consultantMode />
            </ConsultantRoute>
          }
        />

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
        <Route 
          path="/trainings" 
          element={
            <ProtectedRoute>
              <CompanyTrainings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />

        {/* Fallback redirection */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
