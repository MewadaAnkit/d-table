import React, { useState } from 'react';
import {
  useGetTeamAttendanceQuery,
  useGetAllAttendanceQuery,
  useVerifyAttendanceMutation,
} from '../../services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { PaginationControl } from '../../components/common/PaginationControl';
import { SelfiePreviewModal } from '../../components/common/SelfiePreviewModal';
import { EmptyState } from '../../components/common/EmptyState';
import {
  ShieldCheck,
  Check,
  X,
  Eye,
  MapPin,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export const AttendanceVerificationQueue: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'admin';

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [verificationFilter, setVerificationFilter] = useState('pending');
  const [dateFilter, setDateFilter] = useState('');

  // Selected record for verification modal
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'valid' | 'invalid'>('valid');
  const [remarks, setRemarks] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);

  // Selfie preview modal
  const [selfieModal, setSelfieModal] = useState<{ id: string; type: 'in' | 'out' } | null>(null);

  const queryParams = {
    page,
    limit,
    verificationStatus: verificationFilter || undefined,
    date: dateFilter || undefined,
  };

  const { data: teamData, isLoading: isTeamLoading } = useGetTeamAttendanceQuery(queryParams, {
    skip: isAdmin,
  });
  const { data: adminData, isLoading: isAdminLoading } = useGetAllAttendanceQuery(queryParams, {
    skip: !isAdmin,
  });

  const [verifyAttendanceApi, { isLoading: isVerifying }] = useVerifyAttendanceMutation();

  const activeData = isAdmin ? adminData : teamData;
  const isLoading = isAdmin ? isAdminLoading : isTeamLoading;

  const records = activeData?.data?.records || [];
  const pagination = activeData?.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const handleOpenVerifyModal = (record: any, type: 'valid' | 'invalid') => {
    setSelectedRecord(record);
    setActionType(type);
    setRemarks(type === 'valid' ? 'Attendance selfie and GPS verified' : '');
    setVerifyError(null);
    setVerifySuccess(null);
  };

  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setVerifyError(null);
    setVerifySuccess(null);

    if (actionType === 'invalid' && (!remarks || remarks.trim().length < 3)) {
      setVerifyError('A specific reason of at least 3 characters is mandatory when rejecting verification.');
      return;
    }

    try {
      await verifyAttendanceApi({
        id: selectedRecord._id,
        verificationStatus: actionType,
        remarks: remarks.trim(),
      }).unwrap();

      setVerifySuccess(`Shift marked as ${actionType.toUpperCase()}`);
      setTimeout(() => {
        setSelectedRecord(null);
      }, 1000);
    } catch (err: any) {
      setVerifyError(err.data?.message || 'Failed to update verification status.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance Verification Queue</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review punch selfies, GPS locations, and shift durations. Mark records as Valid or Invalid.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Verification:</span>
            <select
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs focus:border-brand-500 focus:outline-none"
            >
              <option value="pending">Pending Review</option>
              <option value="valid">Verified Valid</option>
              <option value="invalid">Marked Invalid</option>
              <option value="">All Records</option>
            </select>
          </div>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Verification Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No Attendance Records for Verification"
            description="All attendance records for the selected filters have been processed or none exist."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Punch-In & GPS</th>
                    <th className="px-5 py-3">Punch-Out & GPS</th>
                    <th className="px-5 py-3">Working Duration</th>
                    <th className="px-5 py-3">Working Status</th>
                    <th className="px-5 py-3">Verification</th>
                    <th className="px-5 py-3">Selfie Evidence</th>
                    <th className="px-5 py-3 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{r.employeeId?.name || 'N/A'}</div>
                        <div className="text-[11px] font-mono text-slate-500">{r.employeeId?.employeeCode || '-'}</div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{r.attendanceDate}</td>
                      <td className="px-5 py-3.5">
                        <div className="text-slate-800">
                          {new Date(r.punchInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {r.punchInLocation && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{r.punchInLocation.latitude.toFixed(2)}, {r.punchInLocation.longitude.toFixed(2)}</span>
                            {r.punchInLocation.isWithinGeofence === false && (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                                Off-site
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {r.punchOutAt ? (
                          <>
                            <div className="text-slate-800">
                              {new Date(r.punchOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {r.punchOutLocation && (
                              <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{r.punchOutLocation.latitude.toFixed(2)}, {r.punchOutLocation.longitude.toFixed(2)}</span>
                                {r.punchOutLocation.isWithinGeofence === false && (
                                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                                    Off-site
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400">In Progress</span>
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
                        {r.verificationRemarks && (
                          <div className="text-[10px] text-slate-500 mt-1 max-w-[140px] truncate" title={r.verificationRemarks}>
                            "{r.verificationRemarks}"
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setSelfieModal({ id: r._id, type: 'in' })}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium"
                          >
                            <Eye className="w-3 h-3 text-slate-500" /> In
                          </button>
                          {r.punchOutSelfie && (
                            <button
                              onClick={() => setSelfieModal({ id: r._id, type: 'out' })}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-brand-700 bg-brand-50 hover:bg-brand-100 rounded font-medium"
                            >
                              <Eye className="w-3 h-3 text-brand-600" /> Out
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenVerifyModal(r, 'valid')}
                            className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 px-2.5 py-1 text-xs"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            Valid
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenVerifyModal(r, 'invalid')}
                            className="text-rose-700 border-rose-300 hover:bg-rose-50 px-2.5 py-1 text-xs"
                          >
                            <X className="w-3 h-3 text-rose-600" />
                            Invalid
                          </Button>
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

      {/* Verification Confirmation Dialog Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Confirm Attendance as ${actionType.toUpperCase()}`}
        >
          <form onSubmit={handleConfirmVerification} className="space-y-4">
            {verifyError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            {verifySuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{verifySuccess}</span>
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee:</span>
                <span className="font-semibold text-slate-900">{selectedRecord.employeeId?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shift Date:</span>
                <span className="font-medium text-slate-800">{selectedRecord.attendanceDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Working Status:</span>
                <Badge status={selectedRecord.workingStatus} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Duration:</span>
                <span className="font-bold text-slate-900">
                  {formatMins(selectedRecord.totalWorkingMinutes || 0)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {actionType === 'invalid'
                  ? 'Reason for Invalidation (Mandatory)'
                  : 'Reviewer Remarks (Optional)'}
              </label>
              <textarea
                required={actionType === 'invalid'}
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  actionType === 'invalid'
                    ? 'State specific discrepancy (e.g., photo mismatch, off-site punch, etc.)'
                    : 'Notes or verification confirmation'
                }
                className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setSelectedRecord(null)}>
                Cancel
              </Button>
              <Button
                variant={actionType === 'valid' ? 'primary' : 'danger'}
                type="submit"
                isLoading={isVerifying}
              >
                Confirm {actionType.toUpperCase()}
              </Button>
            </div>
          </form>
        </Modal>
      )}

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
