import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetEmployeeDashboardQuery } from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { SelfiePreviewModal } from '../../components/common/SelfiePreviewModal';
import {
  CalendarCheck,
  Clock,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Eye,
  Loader2,
} from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const { data: dashboardData, isLoading } = useGetEmployeeDashboardQuery();
  const [selfieModal, setSelfieModal] = useState<{ id: string; type: 'in' | 'out' } | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const { todayAttendance, recentRecords, stats } = dashboardData?.data || {
    todayAttendance: null,
    recentRecords: [],
    stats: { completedDays: 0, incompleteDays: 0, totalPunchedDays: 0, overtime: { pending: 0, approved: 0, rejected: 0 } },
  };

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Employee Workspace</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track daily work shifts, record camera verified punches, and review overtime.
          </p>
        </div>

        <Link to="/punch">
          <Button variant={todayAttendance?.workingStatus === 'in_progress' ? 'danger' : 'primary'} size="md">
            <Camera className="w-4 h-4" />
            {todayAttendance?.workingStatus === 'in_progress' ? 'Punch Out Now' : 'Punch In for Today'}
          </Button>
        </Link>
      </div>

      {/* Active Shift / Missed Punch Notification Banner */}
      {todayAttendance?.workingStatus === 'in_progress' && (
        <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Shift In Progress Reminder
              </h4>
              <p className="text-[11px] text-amber-700">
                You checked in at {new Date(todayAttendance.punchInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Don't forget to record your punch-out selfie when your shift ends.
              </p>
            </div>
          </div>
          <Link to="/punch">
            <Button size="sm" variant="danger">
              Punch Out
            </Button>
          </Link>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Today's Shift</span>
            <CalendarCheck className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 mb-1">
            {todayAttendance ? (
              <Badge status={todayAttendance.workingStatus} />
            ) : (
              <span className="text-slate-400 font-normal text-sm">Not Started</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {todayAttendance?.punchInAt
              ? `In at ${new Date(todayAttendance.punchInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Punch in using live camera'}
          </p>
        </div>

        {/* Completed Working Days */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Completed Shifts (8h+)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {stats.completedDays}
          </div>
          <p className="text-[11px] text-slate-500">Full 480+ minute workdays</p>
        </div>

        {/* Incomplete Working Days */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Incomplete Shifts (&lt;8h)</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {stats.incompleteDays}
          </div>
          <p className="text-[11px] text-slate-500">Early checkouts or half-days</p>
        </div>

        {/* Overtime Overview */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Overtime Requests</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {stats.overtime.pending} Pending
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {stats.overtime.approved} Approved
            </span>
          </div>
          <p className="text-[11px] text-slate-500">{stats.overtime.rejected} Rejected</p>
        </div>
      </div>

      {/* Recent Attendance Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recent Attendance History</h3>
            <p className="text-xs text-slate-500">Past shifts and manager verification remarks</p>
          </div>
          <Link
            to="/attendance"
            className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700 gap-1"
          >
            View Full Log
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Punch In</th>
                <th className="px-6 py-3">Punch Out</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">Working Status</th>
                <th className="px-6 py-3">Verification</th>
                <th className="px-6 py-3">Overtime</th>
                <th className="px-6 py-3 text-right">Selfie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    No attendance records logged yet.
                  </td>
                </tr>
              ) : (
                recentRecords.map((r: any) => (
                  <tr key={r._id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-3.5 font-medium text-slate-900">{r.attendanceDate}</td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {new Date(r.punchInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {r.punchOutAt
                        ? new Date(r.punchOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '-'}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-800">
                      {r.totalWorkingMinutes ? formatMins(r.totalWorkingMinutes) : 'In progress'}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge status={r.workingStatus} />
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge status={r.verificationStatus} />
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge status={r.overtimeStatus} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setSelfieModal({ id: r._id, type: 'in' })}
                          className="inline-flex items-center p-1 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded"
                          title="View Punch-In Selfie"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {r.punchOutSelfie && (
                          <button
                            onClick={() => setSelfieModal({ id: r._id, type: 'out' })}
                            className="inline-flex items-center p-1 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded"
                            title="View Punch-Out Selfie"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
          <span className="text-xs text-slate-500">Showing recent shift activity</span>
          <Link
            to="/attendance"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
          >
            View full attendance log
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Selfie Preview Modal */}
      {selfieModal && (
        <SelfiePreviewModal
          isOpen={!!selfieModal}
          onClose={() => setSelfieModal(null)}
          attendanceId={selfieModal.id}
          type={selfieModal.type}
        />
      )}
    </div>
  );
};
