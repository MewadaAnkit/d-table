import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { Briefcase, CheckCircle2 } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (isAuthenticated && user) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'manager') return <Navigate to="/manager/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm mb-4">
          <Briefcase className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Attendly</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enterprise Attendance & Workforce Verification
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          <Outlet />
        </div>

        {/* Demo credentials banner */}
        <div className="mt-6 bg-slate-100/80 border border-slate-200 rounded-lg p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-900 flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Recruitment Assessment Demo Accounts
          </p>
          <div className="space-y-1 font-mono text-[11px] text-slate-700">
            <div>
              <span className="font-semibold text-slate-900">Admin:</span> admin@attendly.local
            </div>
            <div>
              <span className="font-semibold text-slate-900">Manager:</span> manager@attendly.local
            </div>
            <div>
              <span className="font-semibold text-slate-900">Employee:</span> alex@attendly.local
            </div>
            <div className="text-slate-500 pt-1">
              Password for all seeded accounts: <span className="font-semibold">Password123!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
