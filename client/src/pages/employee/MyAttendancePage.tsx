import React, { useState } from 'react';
import { useGetMyAttendanceQuery } from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PaginationControl } from '../../components/common/PaginationControl';
import { SelfiePreviewModal } from '../../components/common/SelfiePreviewModal';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Calendar,
  Filter,
  Eye,
  Loader2,
  MapPin,
  MessageSquare,
} from 'lucide-react';

export const MyAttendancePage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [workingStatus, setWorkingStatus] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [selfieModal, setSelfieModal] = useState<{ id: string; type: 'in' | 'out' } | null>(null);

  const queryParams: any = { page, limit };
  if (startDate && endDate) {
    queryParams.startDate = startDate;
    queryParams.endDate = endDate;
  }
  if (workingStatus) queryParams.workingStatus = workingStatus;
  if (verificationStatus) queryParams.verificationStatus = verificationStatus;

  const { data, isLoading, isFetching } = useGetMyAttendanceQuery(queryParams);

  const records = data?.data?.records || [];
  const pagination = data?.data?.pagination || { page: 1, limit, total: 0, totalPages: 1 };

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setWorkingStatus('');
    setVerificationStatus('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">My Attendance Log</h1>
        <p className="text-xs text-slate-500 mt-1">
          Historical log of all shift punches, calculated durations, and manager verification remarks.
        </p>

        {/* Filter Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="block w-full rounded-md border border-slate-300 py-1.5 px-2.5 text-xs focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="block w-full rounded-md border border-slate-300 py-1.5 px-2.5 text-xs focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Working Status</label>
            <select
              value={workingStatus}
              onChange={(e) => {
                setWorkingStatus(e.target.value);
                setPage(1);
              }}
              className="block w-full rounded-md border border-slate-300 py-1.5 px-2.5 text-xs focus:border-brand-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed (8h+)</option>
              <option value="incomplete">Incomplete (&lt;8h)</option>
              <option value="in_progress">In Progress</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Verification</label>
            <select
              value={verificationStatus}
              onChange={(e) => {
                setVerificationStatus(e.target.value);
                setPage(1);
              }}
              className="block w-full rounded-md border border-slate-300 py-1.5 px-2.5 text-xs focus:border-brand-500 focus:outline-none"
            >
              <option value="">All Verification</option>
              <option value="pending">Pending</option>
              <option value="valid">Valid</option>
              <option value="invalid">Invalid</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button variant="secondary" size="sm" onClick={handleResetFilters} className="w-full">
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading || isFetching ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            title="No Attendance Records Found"
            description="You don't have any attendance records matching the current filter criteria."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Punch In</th>
                    <th className="px-5 py-3">Punch Out</th>
                    <th className="px-5 py-3">Working Time</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Verification</th>
                    <th className="px-5 py-3">Review Remarks</th>
                    <th className="px-5 py-3">Overtime</th>
                    <th className="px-5 py-3 text-right">Selfies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 font-medium text-slate-900">{r.attendanceDate}</td>
                      <td className="px-5 py-3.5 text-slate-600">
                        <div>
                          {new Date(r.punchInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {r.punchInLocation && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                            <MapPin className="w-2.5 h-2.5" />
                            {r.punchInLocation.latitude.toFixed(2)}, {r.punchInLocation.longitude.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {r.punchOutAt ? (
                          <>
                            <div>
                              {new Date(r.punchOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {r.punchOutLocation && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                                <MapPin className="w-2.5 h-2.5" />
                                {r.punchOutLocation.latitude.toFixed(2)}, {r.punchOutLocation.longitude.toFixed(2)}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        {r.totalWorkingMinutes ? formatMins(r.totalWorkingMinutes) : 'In progress'}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge status={r.workingStatus} />
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge status={r.verificationStatus} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">
                        {r.verificationRemarks ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            <MessageSquare className="w-3 h-3 text-slate-400" />
                            {r.verificationRemarks}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge status={r.overtimeStatus} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setSelfieModal({ id: r._id, type: 'in' })}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
                            title="View In Selfie"
                          >
                            <Eye className="w-3 h-3 text-slate-500" />
                            In
                          </button>
                          {r.punchOutSelfie && (
                            <button
                              onClick={() => setSelfieModal({ id: r._id, type: 'out' })}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-brand-600 bg-brand-50 hover:bg-brand-100 rounded"
                              title="View Out Selfie"
                            >
                              <Eye className="w-3 h-3" />
                              Out
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationControl
              pagination={pagination}
              onPageChange={(p) => setPage(p)}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

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
