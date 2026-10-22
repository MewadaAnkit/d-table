import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetManagerDashboardQuery } from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  Users,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Loader2,
  UserCheck,
} from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const { data, isLoading } = useGetManagerDashboardQuery({ date: selectedDate });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const {
    totalTeamMembers,
    summary,
    currentlyCheckedIn,
    pendingActions,
  } = data?.data || {
    totalTeamMembers: 0,
    summary: { totalAttendanceRecords: 0, completed: 0, incomplete: 0, inProgress: 0, notReported: 0 },
    currentlyCheckedIn: [],
    pendingActions: { pendingOvertime: 0, pendingVerification: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Team Management Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time workforce attendance overview, verification queues, and shift approval queues.
          </p>
        </div>

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

      {/* Pending Action Alerts Banner */}
      {(pendingActions.pendingVerification > 0 || pendingActions.pendingOvertime > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingActions.pendingVerification > 0 && (
            <div className="flex items-center justify-between p-4 bg-amber-50/80 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    {pendingActions.pendingVerification} Shifts Awaiting Verification
                  </h4>
                  <p className="text-[11px] text-amber-700">Selfies and GPS evidence ready for review</p>
                </div>
              </div>
              <Link to="/manager/verification">
                <Button size="sm" variant="outline" className="text-amber-800 border-amber-300 hover:bg-amber-100">
                  Verify Now
                </Button>
              </Link>
            </div>
          )}

          {pendingActions.pendingOvertime > 0 && (
            <div className="flex items-center justify-between p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-900">
                    {pendingActions.pendingOvertime} Pending Overtime Requests
                  </h4>
                  <p className="text-[11px] text-indigo-700">Team members submitted extra hours</p>
                </div>
              </div>
              <Link to="/manager/overtime">
                <Button size="sm" variant="outline" className="text-indigo-800 border-indigo-300 hover:bg-indigo-100">
                  Review Overtime
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Direct Reports</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{totalTeamMembers}</div>
          <p className="text-[11px] text-slate-500">Assigned team members</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Currently Active</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mb-1">{summary.inProgress}</div>
          <p className="text-[11px] text-slate-500">On duty right now</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Completed (8h+)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{summary.completed}</div>
          <p className="text-[11px] text-slate-500">Full shifts finished</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Incomplete (&lt;8h)</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{summary.incomplete}</div>
          <p className="text-[11px] text-slate-500">Early checkouts logged</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Not Checked In</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-600 mb-1">{summary.notReported}</div>
          <p className="text-[11px] text-slate-500">No shift started on date</p>
        </div>
      </div>

      {/* Currently Checked In Employees List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Currently Checked-in Team Members</h3>
            <p className="text-xs text-slate-500">Active sessions in progress today</p>
          </div>
          <Link
            to="/manager/attendance"
            className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700 gap-1"
          >
            Full Team Logs
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
                <th className="px-6 py-3">Check-In Time</th>
                <th className="px-6 py-3">Shift Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentlyCheckedIn.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No team members are currently checked in.
                  </td>
                </tr>
              ) : (
                currentlyCheckedIn.map((att: any) => (
                  <tr key={att._id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-3.5 font-medium text-slate-900">
                      {att.employeeId?.name || 'Unknown'}
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
                      <Link to="/manager/verification" className="text-xs font-semibold text-brand-600 hover:underline">
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
    </div>
  );
};
