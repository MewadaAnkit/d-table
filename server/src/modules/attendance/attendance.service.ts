import { Types } from 'mongoose';
import { Attendance, IAttendance } from '../../models/attendance.model.js';
import { User, IUser } from '../../models/user.model.js';
import { storageService } from '../../storage/localStorage.service.js';
import { getAttendanceDateString, calculateMinutes, calculateDistanceMeters } from '../../utils/date.utils.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error.middleware.js';
import { notificationService } from '../notifications/notification.service.js';
import { broadcastEvent } from '../../services/socket.service.js';

export interface PunchPayload {
  selfie: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export class AttendanceService {
  async punchIn(user: IUser, payload: PunchPayload): Promise<IAttendance> {
    if (!user.isActive) {
      throw new AppError('Deactivated users cannot punch in.', 403);
    }

    // 1. Check if user already has an active session
    const existingActive = await Attendance.findOne({
      employeeId: user._id,
      workingStatus: 'in_progress',
    });
    if (existingActive) {
      throw new AppError('You already have an active attendance session in progress. Please punch out first.', 400);
    }

    // 2. Check if user has already punched in for today
    const todayDateStr = getAttendanceDateString();
    const existingToday = await Attendance.findOne({
      employeeId: user._id,
      attendanceDate: todayDateStr,
    });
    if (existingToday) {
      throw new AppError(`Attendance for today (${todayDateStr}) has already been recorded.`, 409);
    }

    // 3. Save selfie image securely
    const savedSelfie = await storageService.saveImage(payload.selfie, 'punch_in');

    // 4. Calculate geofence distance from configured office location
    const distanceMeters = calculateDistanceMeters(
      payload.location.latitude,
      payload.location.longitude,
      env.OFFICE_LAT,
      env.OFFICE_LNG
    );
    const isWithinGeofence = distanceMeters <= env.GEOFENCE_RADIUS_METERS;

    if (env.ENFORCE_GEOFENCE && !isWithinGeofence) {
      throw new AppError(
        `Geofence restriction: You are ${Math.round(distanceMeters)}m from the office perimeter. Attendance is restricted to within ${env.GEOFENCE_RADIUS_METERS}m.`,
        403
      );
    }

    // 5. Server-generated timestamp and creation
    const punchInAt = new Date();
    const attendance = await Attendance.create({
      employeeId: user._id,
      attendanceDate: todayDateStr,
      punchInAt,
      punchInSelfie: savedSelfie,
      punchInLocation: {
        ...payload.location,
        isWithinGeofence,
        distanceFromOfficeMeters: distanceMeters,
      },
      totalWorkingMinutes: 0,
      workingStatus: 'in_progress',
      verificationStatus: 'pending',
      overtimeStatus: 'none',
    });

    broadcastEvent('attendance:new', {
      attendanceId: attendance._id,
      employeeId: user._id,
      employeeName: user.name,
      employeeCode: user.employeeCode,
      department: user.department,
      type: 'punch_in',
      timestamp: punchInAt,
      isWithinGeofence,
      distanceMeters,
    });

    return attendance;
  }

  async punchOut(user: IUser, payload: PunchPayload): Promise<IAttendance> {
    // 1. Check if user has an active in-progress session
    const activeAttendance = await Attendance.findOne({
      employeeId: user._id,
      workingStatus: 'in_progress',
    });

    if (!activeAttendance) {
      throw new AppError('No active attendance session found. You must punch in before punching out.', 400);
    }

    // 2. Save punch-out selfie
    const savedSelfie = await storageService.saveImage(payload.selfie, 'punch_out');

    // 3. Calculate working duration on server
    const punchOutAt = new Date();
    const totalWorkingMinutes = calculateMinutes(activeAttendance.punchInAt, punchOutAt);

    // Standard shift is 8 hours = 480 minutes
    const workingStatus = totalWorkingMinutes >= 480 ? 'completed' : 'incomplete';

    const distanceMeters = calculateDistanceMeters(
      payload.location.latitude,
      payload.location.longitude,
      env.OFFICE_LAT,
      env.OFFICE_LNG
    );
    const isWithinGeofence = distanceMeters <= env.GEOFENCE_RADIUS_METERS;

    if (env.ENFORCE_GEOFENCE && !isWithinGeofence) {
      throw new AppError(
        `Geofence restriction: You are ${Math.round(distanceMeters)}m from the office perimeter. Attendance is restricted to within ${env.GEOFENCE_RADIUS_METERS}m.`,
        403
      );
    }

    activeAttendance.punchOutAt = punchOutAt;
    activeAttendance.punchOutSelfie = savedSelfie;
    activeAttendance.punchOutLocation = {
      ...payload.location,
      isWithinGeofence,
      distanceFromOfficeMeters: distanceMeters,
    };
    activeAttendance.totalWorkingMinutes = totalWorkingMinutes;
    activeAttendance.workingStatus = workingStatus;

    await activeAttendance.save();

    broadcastEvent('attendance:update', {
      attendanceId: activeAttendance._id,
      employeeId: user._id,
      employeeName: user.name,
      employeeCode: user.employeeCode,
      type: 'punch_out',
      timestamp: punchOutAt,
      totalWorkingMinutes,
      workingStatus,
    });

    return activeAttendance;
  }

  async getActiveSession(userId: string | Types.ObjectId): Promise<IAttendance | null> {
    return Attendance.findOne({
      employeeId: userId,
      workingStatus: 'in_progress',
    }).populate('employeeId', 'name email employeeCode department');
  }

  async verifyAttendance(
    reviewer: IUser,
    attendanceId: string,
    verificationStatus: 'valid' | 'invalid',
    remarks?: string
  ): Promise<IAttendance> {
    const attendance = await Attendance.findById(attendanceId).populate<{ employeeId: IUser }>('employeeId');
    if (!attendance) {
      throw new AppError('Attendance record not found', 404);
    }

    // Check manager authorization
    if (reviewer.role === 'manager') {
      const employee = attendance.employeeId;
      if (!employee || !employee.managerId || employee.managerId.toString() !== reviewer._id.toString()) {
        throw new AppError('Forbidden: You can only verify attendance for employees assigned to your team.', 403);
      }
    }

    attendance.verificationStatus = verificationStatus;
    attendance.verificationRemarks = remarks || null;
    attendance.verifiedBy = reviewer._id;
    attendance.verifiedAt = new Date();

    await attendance.save();

    // Notify employee of verification
    const employeeId = (attendance.employeeId as any)?._id || attendance.employeeId;
    if (employeeId) {
      notificationService
        .createNotification(
          employeeId,
          verificationStatus === 'valid' ? '✅ Attendance Verified' : '⚠️ Attendance Flagged as Invalid',
          `Your attendance for ${attendance.attendanceDate} was reviewed by ${reviewer.name} and marked as ${verificationStatus.toUpperCase()}.${
            remarks ? ` Remarks: "${remarks}"` : ''
          }`,
          'attendance_verified',
          '/attendance'
        )
        .catch(() => {});
    }

    broadcastEvent('attendance:verified', {
      attendanceId: attendance._id,
      verificationStatus,
      reviewerName: reviewer.name,
      remarks,
    });

    return attendance as unknown as IAttendance;
  }

  getGeofenceConfig() {
    return {
      officeLat: env.OFFICE_LAT,
      officeLng: env.OFFICE_LNG,
      radiusMeters: env.GEOFENCE_RADIUS_METERS,
      enforceGeofence: env.ENFORCE_GEOFENCE,
    };
  }
}

export const attendanceService = new AttendanceService();
