export type UserRole = 'employee' | 'manager' | 'admin';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  employeeCode: string;
  department: string;
  managerId?: {
    _id: string;
    name: string;
    employeeCode: string;
    email: string;
  } | string | null;
  isActive: boolean;
  createdAt?: string;
}

export type WorkingStatus = 'in_progress' | 'completed' | 'incomplete';
export type VerificationStatus = 'pending' | 'valid' | 'invalid';
export type OvertimeStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  isWithinGeofence?: boolean;
  distanceFromOfficeMeters?: number;
}

export interface AttendanceRecord {
  _id: string;
  employeeId: User;
  attendanceDate: string;
  punchInAt: string;
  punchOutAt?: string | null;
  punchInLocation: LocationCoords;
  punchOutLocation?: LocationCoords | null;
  punchInSelfie: { storageKey: string; mimeType: string; sizeBytes: number };
  punchOutSelfie?: { storageKey: string; mimeType: string; sizeBytes: number } | null;
  totalWorkingMinutes: number;
  workingStatus: WorkingStatus;
  verificationStatus: VerificationStatus;
  verificationRemarks?: string | null;
  verifiedBy?: {
    _id: string;
    name: string;
    employeeCode: string;
  } | null;
  verifiedAt?: string | null;
  overtimeStatus: OvertimeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OvertimeRecord {
  _id: string;
  employeeId: User;
  attendanceId: AttendanceRecord;
  requestedMinutes: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: {
    _id: string;
    name: string;
    employeeCode: string;
  } | null;
  reviewedAt?: string | null;
  reviewRemarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
