import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceRecord } from '../types';

interface FlattenedRecord {
  Date: string;
  'Employee Name': string;
  'Employee Code': string;
  Department: string;
  'Punch In': string;
  'Punch Out': string;
  'Working Hours': string;
  'Shift Status': string;
  'Verification Status': string;
  'Geofence (Punch In)': string;
  Remarks: string;
}

const flattenAttendanceRecords = (records: AttendanceRecord[]): FlattenedRecord[] => {
  return records.map((r) => {
    const punchIn = r.punchInAt
      ? new Date(r.punchInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '--:--';
    const punchOut = r.punchOutAt
      ? new Date(r.punchOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '--:--';
    const hours = (r.totalWorkingMinutes / 60).toFixed(1) + ' hrs';
    const shift = r.workingStatus === 'completed' ? 'Completed (≥8h)' : r.workingStatus === 'in_progress' ? 'In Progress' : 'Incomplete (<8h)';
    const geofence = r.punchInLocation?.isWithinGeofence ? 'Within Perimeter' : 'Outside Perimeter';

    return {
      Date: r.attendanceDate,
      'Employee Name': r.employeeId?.name || 'N/A',
      'Employee Code': r.employeeId?.employeeCode || 'N/A',
      Department: r.employeeId?.department || 'General',
      'Punch In': punchIn,
      'Punch Out': punchOut,
      'Working Hours': hours,
      'Shift Status': shift,
      'Verification Status': r.verificationStatus?.toUpperCase() || 'PENDING',
      'Geofence (Punch In)': geofence,
      Remarks: r.verificationRemarks || '',
    };
  });
};

/**
 * Export attendance records directly to Microsoft Excel (.xlsx) format
 */
export const exportToExcel = (records: AttendanceRecord[], filenamePrefix = 'attendly_report') => {
  const data = flattenAttendanceRecords(records);
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-fit column widths
  const columnWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length + 3, 14),
  }));
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Records');

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${filenamePrefix}_${dateStr}.xlsx`);
};

/**
 * Export attendance records to a styled PDF document
 */
export const exportToPdf = (
  records: AttendanceRecord[],
  title = 'Attendance Management Report',
  filenamePrefix = 'attendly_report'
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  // Header Title & Branding
  doc.setFillColor(79, 70, 229); // Brand Indigo
  doc.rect(0, 0, 842, 50, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Attendly - Attendance Management System', 40, 32);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 640, 32);

  // Subheader
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 40, 80);

  // Summary Metrics Banner
  const total = records.length;
  const completed = records.filter((r) => r.workingStatus === 'completed').length;
  const incomplete = records.filter((r) => r.workingStatus === 'incomplete').length;
  const valid = records.filter((r) => r.verificationStatus === 'valid').length;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Total Logs: ${total}   |   Completed Shifts (≥8h): ${completed}   |   Incomplete Shifts: ${incomplete}   |   Verified: ${valid}`,
    40,
    98
  );

  // Table Data
  const tableData = records.map((r) => [
    r.attendanceDate,
    r.employeeId?.name || 'N/A',
    r.employeeId?.employeeCode || 'N/A',
    r.employeeId?.department || 'General',
    r.punchInAt ? new Date(r.punchInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
    r.punchOutAt ? new Date(r.punchOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
    `${(r.totalWorkingMinutes / 60).toFixed(1)}h`,
    r.workingStatus === 'completed' ? 'Completed' : r.workingStatus === 'in_progress' ? 'In Progress' : 'Incomplete',
    r.verificationStatus?.toUpperCase() || 'PENDING',
  ]);

  autoTable(doc, {
    startY: 112,
    head: [
      [
        'Date',
        'Employee',
        'Code',
        'Department',
        'Punch In',
        'Punch Out',
        'Duration',
        'Shift',
        'Verification',
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [67, 56, 202],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 40, right: 40 },
  });

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`${filenamePrefix}_${dateStr}.pdf`);
};
