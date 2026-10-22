import React, { useState } from 'react';
import {
  useGetOvertimeRequestsQuery,
  useReviewOvertimeRequestMutation,
} from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { PaginationControl } from '../../components/common/PaginationControl';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Clock,
  Check,
  X,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export const OvertimeApprovalsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('pending');

  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  const { data, isLoading } = useGetOvertimeRequestsQuery({
    page,
    limit,
    status: statusFilter || undefined,
  });

  const [reviewOvertimeApi, { isLoading: isReviewing }] = useReviewOvertimeRequestMutation();

  const requests = data?.data?.requests || [];
  const pagination = data?.data?.pagination || { page: 1, limit, total: 0, totalPages: 1 };

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const handleOpenReviewModal = (req: any, action: 'approved' | 'rejected') => {
    setSelectedRequest(req);
    setReviewAction(action);
    setReviewRemarks(action === 'approved' ? 'Overtime authorized and verified' : '');
    setReviewError(null);
    setReviewSuccess(null);
  };

  const handleConfirmReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setReviewError(null);
    setReviewSuccess(null);

    if (reviewAction === 'rejected' && (!reviewRemarks || reviewRemarks.trim().length < 3)) {
      setReviewError('A rejection reason of at least 3 characters is mandatory when rejecting overtime.');
      return;
    }

    try {
      await reviewOvertimeApi({
        id: selectedRequest._id,
        status: reviewAction,
        reviewRemarks: reviewRemarks.trim(),
      }).unwrap();

      setReviewSuccess(`Overtime request has been ${reviewAction.toUpperCase()}`);
      setTimeout(() => {
        setSelectedRequest(null);
      }, 1000);
    } catch (err: any) {
      setReviewError(err.data?.message || 'Failed to review overtime request.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Overtime Approvals</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review extra working hour claims submitted by employees. Authorize or reject requests with remarks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs focus:border-brand-500 focus:outline-none"
          >
            <option value="pending">Pending Approvals</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="">All Overtime</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No Overtime Requests"
            description="There are currently no overtime requests matching the selected filter."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Shift Date</th>
                    <th className="px-5 py-3">Requested Overtime</th>
                    <th className="px-5 py-3">Work Reason / Task</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Review Remarks</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{req.employeeId?.name || 'N/A'}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {req.employeeId?.employeeCode || '-'} • {req.employeeId?.department || '-'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {req.attendanceId?.attendanceDate || '-'}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {formatMins(req.requestedMinutes)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-xs">{req.reason}</td>
                      <td className="px-5 py-3.5">
                        <Badge status={req.status} />
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
                      <td className="px-5 py-3.5 text-right">
                        {req.status === 'pending' ? (
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenReviewModal(req, 'approved')}
                              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 px-2.5 py-1 text-xs"
                            >
                              <Check className="w-3 h-3 text-emerald-600" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenReviewModal(req, 'rejected')}
                              className="text-rose-700 border-rose-300 hover:bg-rose-50 px-2.5 py-1 text-xs"
                            >
                              <X className="w-3 h-3 text-rose-600" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 capitalize">
                            {req.status} by {req.reviewedBy?.name || 'Manager'}
                          </span>
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

      {/* Review Confirmation Modal */}
      {selectedRequest && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title={`Confirm Overtime as ${reviewAction.toUpperCase()}`}
        >
          <form onSubmit={handleConfirmReview} className="space-y-4">
            {reviewError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            {reviewSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{reviewSuccess}</span>
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee:</span>
                <span className="font-semibold text-slate-900">{selectedRequest.employeeId?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shift Date:</span>
                <span className="font-medium text-slate-800">
                  {selectedRequest.attendanceId?.attendanceDate || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Requested Time:</span>
                <span className="font-bold text-slate-900">
                  {formatMins(selectedRequest.requestedMinutes)}
                </span>
              </div>
              <div className="pt-1 text-slate-600 italic">
                "{selectedRequest.reason}"
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {reviewAction === 'rejected'
                  ? 'Rejection Reason (Mandatory)'
                  : 'Review Remarks (Optional)'}
              </label>
              <textarea
                required={reviewAction === 'rejected'}
                rows={3}
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                placeholder={
                  reviewAction === 'rejected'
                    ? 'State reasons why overtime cannot be authorized (e.g. non-urgent work, budget limit)'
                    : 'Add notes for employee records'
                }
                className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setSelectedRequest(null)}>
                Cancel
              </Button>
              <Button
                variant={reviewAction === 'approved' ? 'primary' : 'danger'}
                type="submit"
                isLoading={isReviewing}
              >
                Confirm {reviewAction.toUpperCase()}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
