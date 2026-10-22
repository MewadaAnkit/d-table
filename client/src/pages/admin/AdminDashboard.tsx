import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetAdminDashboardQuery, useGetGeofenceConfigQuery } from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { GeofenceSettingsModal } from '../../components/admin/GeofenceSettingsModal';
import {
  Users,
  ShieldAlert,
  Clock,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Building,
  Loader2,
  UserCheck,
  Compass,
  MapPin,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
  const { data, isLoading } = useGetAdminDashboardQuery({ date: selectedDate });
  const { data: geofenceData } = useGetGeofenceConfigQuery();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const {
    totalActiveEmployees,
    totalUsers,
    summary,
    currentlyCheckedIn,
    pendingActions,
  } = data?.data || {
    totalActiveEmployees: 0,
    totalUsers: 0,
    summary: { totalAttendanceRecords: 0, completed: 0, incomplete: 0, inProgress: 0, notReported: 0 },
    currentlyCheckedIn: [],
    pendingActions: { pendingOvertime: 0, pendingVerification: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Enterprise Administration Portal</h1>
          <p className="text-xs text-slate-500 mt-1">
            System-wide workforce metrics, directory governance, and company-wide attendance monitoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsGeofenceModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-brand-600" />
            <span>Geofence Perimeter</span>
          </Button>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Shift Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Action shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/users"
          className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">User Management</h4>
              <p className="text-[11px] text-slate-500">Manage directory, roles & managers</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>

        <Link
          to="/admin/verification"
          className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Attendance Verification</h4>
              <p className="text-[11px] text-slate-500">{pendingActions.pendingVerification} shifts awaiting review</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>

        <Link
          to="/admin/overtime"
          className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Overtime Management</h4>
              <p className="text-[11px] text-slate-500">{pendingActions.pendingOvertime} pending requests</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>

        <button
          type="button"
          onClick={() => setIsGeofenceModalOpen(true)}
          className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-300 hover:shadow-sm transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Office Geofence</h4>
              <p className="text-[11px] text-slate-500 truncate max-w-[140px]">
                {geofenceData?.data
                  ? `${geofenceData.data.radiusMeters}m • ${geofenceData.data.enforceGeofence ? 'Strict' : 'Flexible'}`
                  : 'Configure Perimeter'}
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Active Employees</span>
            <Building className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{totalActiveEmployees}</div>
          <p className="text-[11px] text-slate-500">Across all departments</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Checked In Now</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mb-1">{summary.inProgress}</div>
          <p className="text-[11px] text-slate-500">Active sessions today</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Completed (8h+)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{summary.completed}</div>
          <p className="text-[11px] text-slate-500">Standard shifts met</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Incomplete (&lt;8h)</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{summary.incomplete}</div>
          <p className="text-[11px] text-slate-500">Early punch outs</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Not Checked In</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-600 mb-1">{summary.notReported}</div>
          <p className="text-[11px] text-slate-500">Pending arrival today</p>
        </div>
      </div>

      {/* Currently Checked In Employees */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Currently Active Workforce Sessions</h3>
            <p className="text-xs text-slate-500">Employees currently punched in today</p>
          </div>
          <Link
            to="/admin/attendance"
            className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700 gap-1"
          >
            All Attendance Logs
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Punch-In Time</th>
                <th className="px-6 py-3">Working Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentlyCheckedIn.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No active sessions found for the selected date.
                  </td>
                </tr>
              ) : (
                currentlyCheckedIn.map((att: any) => (
                  <tr key={att._id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-3.5 font-medium text-slate-900">
                      {att.employeeId?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-500">
                      {att.employeeId?.employeeCode || '-'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {att.employeeId?.department || '-'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-700 font-medium">
                      {new Date(att.punchInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge status="in_progress" />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link to="/admin/verification" className="text-xs font-semibold text-brand-600 hover:underline">
                        Review Shift
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Geofence Configuration Modal */}
      <GeofenceSettingsModal
        isOpen={isGeofenceModalOpen}
        onClose={() => setIsGeofenceModalOpen(false)}
      />
    </div>
  );
};
