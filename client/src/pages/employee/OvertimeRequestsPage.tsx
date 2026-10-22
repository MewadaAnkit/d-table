import React, { useState } from 'react';
import {
  useGetMyOvertimeRequestsQuery,
  useCreateOvertimeRequestMutation,
  useGetMyAttendanceQuery,
} from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { PaginationControl } from '../../components/common/PaginationControl';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Clock,
  Plus,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
} from 'lucide-react';

export const OvertimeRequestsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Request Form state
  const [selectedAttendanceId, setSelectedAttendanceId] = useState('');
  const [requestedMinutes, setRequestedMinutes] = useState(60);
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const { data, isLoading } = useGetMyOvertimeRequestsQuery({
    page,
    limit,
    status: statusFilter || undefined,
  });

  const { data: attendanceData } = useGetMyAttendanceQuery({ limit: 15 });
  const completedAttendance = (attendanceData?.data?.records || []).filter(
    (a) => a.workingStatus === 'completed' || !!a.punchOutAt
  );

  const [createOvertime, { isLoading: isSubmitting }] = useCreateOvertimeRequestMutation();

  const requests = data?.data?.requests || [];
  const pagination = data?.data?.pagination || { page: 1, limit, total: 0, totalPages: 1 };

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const handleOpenModal = () => {
    setFormError(null);
    setFormSuccess(null);
    setSelectedAttendanceId(completedAttendance[0]?._id || '');
    setRequestedMinutes(60);
    setReason('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!selectedAttendanceId) {
      setFormError('Please select a completed attendance record.');
      return;
    }

    if (reason.trim().length < 5) {
      setFormError('Reason must be at least 5 characters long.');
      return;
    }

    try {
      await createOvertime({
        attendanceId: selectedAttendanceId,
        requestedMinutes: Number(requestedMinutes),
        reason,
      }).unwrap();

      setFormSuccess('Overtime request submitted for manager review!');
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setFormError(err.data?.message || 'Failed to submit overtime request.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Overtime Requests</h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit extra hours worked on completed shifts and track manager approvals.
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenModal}>
          <Plus className="w-4 h-4" />
          Request Overtime
        </Button>
      </div>

      {/* Filter and Content Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Table Toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Filter by Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-slate-300 py-1 px-2 text-xs focus:border-brand-500 focus:outline-none"
            >
              <option value="">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No Overtime Requests"
            description="You have not submitted any overtime requests yet."
            action={
              <Button variant="outline" size="sm" onClick={handleOpenModal}>
                <Plus className="w-3.5 h-3.5" />
                Submit New Request
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Submitted On</th>
                    <th className="px-5 py-3">Attendance Date</th>
                    <th className="px-5 py-3">Requested Time</th>
                    <th className="px-5 py-3">Justification Reason</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Reviewed By</th>
                    <th className="px-5 py-3">Review Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 text-slate-600">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        {req.attendanceId?.attendanceDate || '-'}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        {formatMins(req.requestedMinutes)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-xs">{req.reason}</td>
                      <td className="px-5 py-3.5">
                        <Badge status={req.status} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {req.reviewedBy?.name ? `${req.reviewedBy.name}` : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 max-w-xs">
                        {req.reviewRemarks ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            <MessageSquare className="w-3 h-3 text-slate-400" />
                            {req.reviewRemarks}
                          </span>
                        ) : (
                          '-'
                        )}
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

      {/* New Overtime Request Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit Overtime Request">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Select Completed Shift
            </label>
            {completedAttendance.length === 0 ? (
              <p className="text-xs text-rose-600">
                You do not have any completed attendance shifts available to request overtime for.
              </p>
            ) : (
              <select
                value={selectedAttendanceId}
                onChange={(e) => setSelectedAttendanceId(e.target.value)}
                required
                className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-brand-500 focus:outline-none"
              >
                {completedAttendance.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.attendanceDate} — Worked: {formatMins(a.totalWorkingMinutes || 0)} ({a.workingStatus})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Requested Overtime (Minutes)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[30, 60, 90, 120].map((mins) => (
                <button
                  type="button"
                  key={mins}
                  onClick={() => setRequestedMinutes(mins)}
                  className={`py-1.5 text-xs rounded-md border font-medium transition-colors ${
                    requestedMinutes === mins
                      ? 'bg-brand-50 text-brand-700 border-brand-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {mins} min ({formatMins(mins)})
                </button>
              ))}
            </div>
            <input
              type="number"
              min={15}
              max={720}
              step={15}
              required
              value={requestedMinutes}
              onChange={(e) => setRequestedMinutes(Number(e.target.value))}
              className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Business Reason / Work Description
            </label>
            <textarea
              required
              rows={3}
              minLength={5}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Critical release verification, emergency client escalation, etc."
              className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              disabled={completedAttendance.length === 0}
            >
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
