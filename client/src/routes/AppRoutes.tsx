import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';

// Layouts
import { AuthLayout } from '../layouts/AuthLayout';
import { AppLayout } from '../layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Public Pages
import { LoginPage } from '../pages/public/LoginPage';
import { SignupPage } from '../pages/public/SignupPage';
import { UnauthorizedPage } from '../pages/public/UnauthorizedPage';
import { NotFoundPage } from '../pages/public/NotFoundPage';

// Employee Pages
import { EmployeeDashboard } from '../pages/employee/EmployeeDashboard';
import { PunchPage } from '../pages/employee/PunchPage';
import { MyAttendancePage } from '../pages/employee/MyAttendancePage';
import { OvertimeRequestsPage } from '../pages/employee/OvertimeRequestsPage';
import { EmployeeReportsPage } from '../pages/employee/EmployeeReportsPage';
import { ProfilePage } from '../pages/employee/ProfilePage';

// Manager Pages
import { ManagerDashboard } from '../pages/manager/ManagerDashboard';
import { TeamAttendancePage } from '../pages/manager/TeamAttendancePage';
import { AttendanceVerificationQueue } from '../pages/manager/AttendanceVerificationQueue';
import { OvertimeApprovalsPage } from '../pages/manager/OvertimeApprovalsPage';
import { TeamReportsPage } from '../pages/manager/TeamReportsPage';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { AllAttendancePage } from '../pages/admin/AllAttendancePage';
import { AdminReportsPage } from '../pages/admin/AdminReportsPage';

// Role-based Root Redirector
const RootRedirect: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'manager') return <Navigate to="/manager/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Standalone Error Routes */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected Application Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<RootRedirect />} />

          {/* Shared Punch & Profile */}
          <Route path="/punch" element={<PunchPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Employee Routes */}
          <Route path="/dashboard" element={<EmployeeDashboard />} />
          <Route path="/attendance" element={<MyAttendancePage />} />
          <Route path="/overtime" element={<OvertimeRequestsPage />} />
          <Route path="/reports" element={<EmployeeReportsPage />} />

          {/* Manager Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['manager', 'admin']} />}>
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/attendance" element={<TeamAttendancePage />} />
            <Route path="/manager/verification" element={<AttendanceVerificationQueue />} />
            <Route path="/manager/overtime" element={<OvertimeApprovalsPage />} />
            <Route path="/manager/reports" element={<TeamReportsPage />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/attendance" element={<AllAttendancePage />} />
            <Route path="/admin/verification" element={<AttendanceVerificationQueue />} />
            <Route path="/admin/overtime" element={<OvertimeApprovalsPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
