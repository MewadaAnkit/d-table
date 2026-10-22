import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Badge } from '../../components/common/Badge';
import { User, Mail, Hash, Building2, UserCheck, ShieldCheck } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700 font-bold text-xl border border-brand-200">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge status={user.role} />
              <Badge status={user.isActive ? 'active' : 'inactive'} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Employment Information</h3>
          <p className="text-xs text-slate-500">Corporate directory and reporting hierarchy</p>
        </div>

        <div className="divide-y divide-slate-100 px-6 text-xs">
          <div className="py-3.5 flex justify-between items-center">
            <span className="text-slate-500 flex items-center gap-2">
              <Hash className="w-4 h-4 text-slate-400" />
              Employee Identification Code
            </span>
            <span className="font-mono font-medium text-slate-900">{user.employeeCode}</span>
          </div>

          <div className="py-3.5 flex justify-between items-center">
            <span className="text-slate-500 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              Department
            </span>
            <span className="font-medium text-slate-900">{user.department}</span>
          </div>

          <div className="py-3.5 flex justify-between items-center">
            <span className="text-slate-500 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-slate-400" />
              Assigned Direct Manager
            </span>
            <span className="font-medium text-slate-900">
              {typeof user.managerId === 'object' && user.managerId?.name
                ? `${user.managerId.name} (${user.managerId.employeeCode})`
                : 'Direct to Executive'}
            </span>
          </div>

          <div className="py-3.5 flex justify-between items-center">
            <span className="text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              Access Role Level
            </span>
            <span className="font-medium text-slate-900 capitalize">{user.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
