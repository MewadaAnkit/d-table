import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { useGetDailyReportsQuery, useLazyGetDailyReportsQuery } from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PaginationControl } from '../../components/common/PaginationControl';
import { EmptyState } from '../../components/common/EmptyState';
import { Download, FileText, FileSpreadsheet, Loader2, Printer } from 'lucide-react';
import { exportToExcel, exportToPdf } from '../../utils/exportReports';

export const AdminReportsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [department, setDepartment] = useState('');
  const [workingStatus, setWorkingStatus] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printRecords, setPrintRecords] = useState<any[] | null>(null);

  const [triggerGetReports] = useLazyGetDailyReportsQuery();

  const queryParams: any = { page, limit };
  if (startDate && endDate) {
    queryParams.startDate = startDate;
    queryParams.endDate = endDate;
  }
  if (department) queryParams.department = department;
  if (workingStatus) queryParams.workingStatus = workingStatus;
  if (verificationStatus) queryParams.verificationStatus = verificationStatus;

  const { data, isLoading } = useGetDailyReportsQuery(queryParams);

  const records = data?.data?.records || [];
  const pagination = data?.data?.pagination || { page: 1, limit, total: 0, totalPages: 1 };

  const activeRecords = printRecords || records;

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const totalWorkingMins = activeRecords.reduce((acc, r) => acc + (r.totalWorkingMinutes || 0), 0);
  const completedShifts = activeRecords.filter((r) => r.workingStatus === 'completed').length;
  const validShifts = activeRecords.filter((r) => r.verificationStatus === 'valid').length;

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      const allParams: any = { page: 1, limit: 1000 };
      if (startDate && endDate) {
        allParams.startDate = startDate;
        allParams.endDate = endDate;
      }
      if (department) allParams.department = department;
      if (workingStatus) allParams.workingStatus = workingStatus;
      if (verificationStatus) allParams.verificationStatus = verificationStatus;

      const res = await triggerGetReports(allParams).unwrap();
      setPrintRecords(res.data.records);

      setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 350);
    } catch {
      setIsPrinting(false);
      window.print();
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      const token = localStorage.getItem('attendly_token');

      const urlParams = new URLSearchParams();
      if (startDate && endDate) {
        urlParams.append('startDate', startDate);
        urlParams.append('endDate', endDate);
      }
      if (department) urlParams.append('department', department);
      if (workingStatus) urlParams.append('workingStatus', workingStatus);
      if (verificationStatus) urlParams.append('verificationStatus', verificationStatus);

      const response = await fetch(`${baseUrl}/reports/export?${urlParams.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to export CSV report');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `enterprise-attendance-report-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      alert('Error downloading CSV export.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(activeRecords, 'enterprise_attendance_report');
  };

  const handleExportPdf = () => {
    exportToPdf(activeRecords, 'Enterprise Workforce Attendance & Shift Audit Report', 'enterprise_attendance_report');
  };

  return (
    <div className="space-y-5">
      {/* Screen Header (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Enterprise Attendance Reports</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            System-wide compliance audits, shift durations, and workforce records across all departments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExportExcel} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={handleExportPdf} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
            <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleExportCsv} isLoading={isExporting} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
            <Download className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            CSV
          </Button>
          <Button variant="outline" onClick={handlePrint} isLoading={isPrinting} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            Print
          </Button>
        </div>
      </div>

      {/* Print-Only Official Report Letterhead & Meta Header */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-900">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-slate-900 uppercase">Attendly</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest pl-2 border-l border-slate-300">Enterprise Portal</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-2">Enterprise Attendance & Compliance Audit Report</h2>
            <p className="text-xs text-slate-600">Master audit log of company-wide employee shift durations and verification audits.</p>
          </div>
          <div className="text-right text-xs text-slate-600 space-y-1">
            <div><span className="font-semibold text-slate-800">Generated:</span> {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
            <div><span className="font-semibold text-slate-800">Auditor:</span> {user?.name || 'Administrator'}</div>
          </div>
        </div>

        {/* Filters Info Grid */}
        <div className="grid grid-cols-4 gap-4 mt-5 p-3.5 bg-slate-50 rounded border border-slate-200 text-xs">
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-500">Department Scope</span>
            <span className="font-semibold text-slate-900">{department || 'All Departments'}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-500">Working Filter</span>
            <span className="text-slate-800 capitalize">{workingStatus || 'All Statuses'}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-500">Verification Filter</span>
            <span className="text-slate-800 capitalize">{verificationStatus || 'All Verifications'}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-500">Report Period</span>
            <span className="text-slate-800">
              {startDate && endDate ? `${startDate} to ${endDate}` : startDate ? `From ${startDate}` : endDate ? `Up to ${endDate}` : 'All Recorded Dates'}
            </span>
          </div>
        </div>

        {/* Summary Metrics Row */}
        <div className="grid grid-cols-4 gap-4 mt-3 p-3 bg-white border border-slate-200 rounded text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Total Logged Records</span>
            <span className="text-base font-bold text-slate-900">{activeRecords.length}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Total Logged Hours</span>
            <span className="text-base font-bold text-slate-900">{formatMins(totalWorkingMins)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Compliant Shifts (8h+)</span>
            <span className="text-base font-bold text-emerald-700">{completedShifts}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Verified Shifts</span>
            <span className="text-base font-bold text-blue-700">{validShifts}</span>
          </div>
        </div>
      </div>

      {/* Filter toolbar (Hidden on Print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 no-print">
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
          <label className="block text-[11px] font-medium text-slate-600 mb-1">Department</label>
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
            className="block w-full rounded-md border border-slate-300 py-1.5 px-2.5 text-xs focus:border-brand-500 focus:outline-none"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product">Product</option>
            <option value="Operations">Operations</option>
            <option value="Customer Support">Customer Support</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Executive">Executive</option>
          </select>
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
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm print-clean-container">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          </div>
        ) : activeRecords.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Attendance Reports Found"
            description="No records match your selected system filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Punch In</th>
                    <th className="px-5 py-3">Punch Out</th>
                    <th className="px-5 py-3">Duration</th>
                    <th className="px-5 py-3">Working Status</th>
                    <th className="px-5 py-3">Verification</th>
                    <th className="px-5 py-3">Verified By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeRecords.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/70 border-b border-slate-100 print:border-slate-300">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{r.employeeId?.name || 'N/A'}</div>
                        <div className="text-[11px] font-mono text-slate-500">{r.employeeId?.employeeCode || '-'}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{r.employeeId?.department || 'General'}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">{r.attendanceDate}</td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {new Date(r.punchInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {r.punchOutAt
                          ? new Date(r.punchOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '-'}
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
                      <td className="px-5 py-3.5 text-slate-600">
                        {r.verifiedBy?.name ? `${r.verifiedBy.name}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="no-print">
              <PaginationControl
                pagination={pagination}
                onPageChange={(p) => setPage(p)}
                onLimitChange={(l) => {
                  setLimit(l);
                  setPage(1);
                }}
              />
            </div>

            {/* Print-Only Sign-off & Audit Stamp Footer */}
            <div className="hidden print:block mt-12 pt-6 border-t border-slate-300 text-xs">
              <div className="flex justify-between items-end pt-10 px-4">
                <div className="text-center w-52">
                  <div className="border-b border-slate-400 mb-1.5"></div>
                  <p className="text-[11px] font-semibold text-slate-800">System Admin Signature</p>
                  <p className="text-[10px] text-slate-500">Security & Compliance</p>
                </div>
                <div className="text-center w-52">
                  <div className="border-b border-slate-400 mb-1.5"></div>
                  <p className="text-[11px] font-semibold text-slate-800">HR Director Approval</p>
                  <p className="text-[10px] text-slate-500">Corporate Headquarters</p>
                </div>
              </div>
              <p className="text-center text-[10px] text-slate-500 mt-8 pt-2 border-t border-slate-200">
                This document is generated by Attendly Enterprise Workforce System. Certified Official Record for Compliance & Payroll Audit.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
