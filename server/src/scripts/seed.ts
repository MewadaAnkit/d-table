import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/database.js';
import { User } from '../models/user.model.js';
import { Attendance } from '../models/attendance.model.js';
import { OvertimeRequest } from '../models/overtime.model.js';
import { storageService } from '../storage/localStorage.service.js';
import { logger } from '../config/logger.js';
import { getAttendanceDateString } from '../utils/date.utils.js';

// Valid 100x100 PNG sample image base64 (>512 bytes)
const SAMPLE_IMAGE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAK8AAACvABQqw0mAAAAB50RVh0U29mdHdhcmUAZ25vbWUtc2NyZWVuc2hvdO8Dvz4AAAA1SURBVHic7cExAQAAAMKg9U9tCy+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAODVABXAAAFp1T2bAAAAAElFTkSuQmCC';

async function seed() {
  logger.info('🌱 Starting Attendly Database Seed...');
  await connectDB();

  // Clear existing records
  await Promise.all([
    User.deleteMany({}),
    Attendance.deleteMany({}),
    OvertimeRequest.deleteMany({}),
  ]);
  logger.info('Cleared existing database records.');

  const defaultPassword = 'Password123!';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  // 1. Create Admin
  const admin = await User.create({
    name: 'Eleanor Vance (Admin)',
    email: 'admin@attendly.local',
    passwordHash,
    role: 'admin',
    employeeCode: 'EMP-001',
    department: 'Executive',
    isActive: true,
  });

  // 2. Create Manager
  const manager = await User.create({
    name: 'Sarah Jenkins (Manager)',
    email: 'manager@attendly.local',
    passwordHash,
    role: 'manager',
    employeeCode: 'EMP-002',
    department: 'Engineering',
    isActive: true,
  });

  // 3. Create Employees assigned to Sarah
  const employeeAlex = await User.create({
    name: 'Alex Rivera',
    email: 'alex@attendly.local',
    passwordHash,
    role: 'employee',
    employeeCode: 'EMP-003',
    department: 'Engineering',
    managerId: manager._id,
    isActive: true,
  });

  const employeeMaria = await User.create({
    name: 'Maria Santos',
    email: 'maria@attendly.local',
    passwordHash,
    role: 'employee',
    employeeCode: 'EMP-004',
    department: 'Engineering',
    managerId: manager._id,
    isActive: true,
  });

  const employeeDavid = await User.create({
    name: 'David Kim',
    email: 'david@attendly.local',
    passwordHash,
    role: 'employee',
    employeeCode: 'EMP-005',
    department: 'Engineering',
    managerId: manager._id,
    isActive: true,
  });

  logger.info('Created seed users: Admin, Manager, and 3 Employees.');

  // Create sample selfie files via storageService
  const sampleSelfie1 = await storageService.saveImage(SAMPLE_IMAGE_BASE64, 'seed_punch_in');
  const sampleSelfie2 = await storageService.saveImage(SAMPLE_IMAGE_BASE64, 'seed_punch_out');

  // Office Location coordinates (e.g. San Francisco downtown)
  const officeLocation = {
    latitude: 37.774929,
    longitude: -122.419416,
    accuracy: 12,
  };

  const todayStr = getAttendanceDateString();

  // Date helpers for past records
  const now = new Date();
  const getPastDateStr = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return getAttendanceDateString(d);
  };

  // Record 1: Alex - Yesterday - Completed (8h 30m = 510m), Validated Valid by Sarah
  const alexYesterdayIn = new Date(now);
  alexYesterdayIn.setDate(alexYesterdayIn.getDate() - 1);
  alexYesterdayIn.setHours(9, 0, 0, 0);

  const alexYesterdayOut = new Date(alexYesterdayIn);
  alexYesterdayOut.setHours(17, 30, 0, 0);

  const recordAlexYesterday = await Attendance.create({
    employeeId: employeeAlex._id,
    attendanceDate: getPastDateStr(1),
    punchInAt: alexYesterdayIn,
    punchOutAt: alexYesterdayOut,
    punchInSelfie: sampleSelfie1,
    punchOutSelfie: sampleSelfie2,
    punchInLocation: officeLocation,
    punchOutLocation: officeLocation,
    totalWorkingMinutes: 510,
    workingStatus: 'completed',
    verificationStatus: 'valid',
    verificationRemarks: 'Verified in-person presence',
    verifiedBy: manager._id,
    verifiedAt: alexYesterdayOut,
    overtimeStatus: 'approved',
  });

  // Overtime request for Alex yesterday (Approved)
  await OvertimeRequest.create({
    employeeId: employeeAlex._id,
    attendanceId: recordAlexYesterday._id,
    requestedMinutes: 30,
    reason: 'Critical production deployment monitoring and post-release verification.',
    status: 'approved',
    reviewedBy: manager._id,
    reviewedAt: alexYesterdayOut,
    reviewRemarks: 'Deployment approved and verified on call.',
  });

  // Record 2: Maria - Yesterday - Incomplete (6 hours = 360m), Marked Invalid with reason
  const mariaYesterdayIn = new Date(now);
  mariaYesterdayIn.setDate(mariaYesterdayIn.getDate() - 1);
  mariaYesterdayIn.setHours(10, 0, 0, 0);

  const mariaYesterdayOut = new Date(mariaYesterdayIn);
  mariaYesterdayOut.setHours(16, 0, 0, 0);

  await Attendance.create({
    employeeId: employeeMaria._id,
    attendanceDate: getPastDateStr(1),
    punchInAt: mariaYesterdayIn,
    punchOutAt: mariaYesterdayOut,
    punchInSelfie: sampleSelfie1,
    punchOutSelfie: sampleSelfie2,
    punchInLocation: officeLocation,
    punchOutLocation: officeLocation,
    totalWorkingMinutes: 360,
    workingStatus: 'incomplete',
    verificationStatus: 'invalid',
    verificationRemarks: 'Early departure without prior notification to team lead.',
    verifiedBy: manager._id,
    verifiedAt: mariaYesterdayOut,
    overtimeStatus: 'none',
  });

  // Record 3: David - Yesterday - Completed (8h 15m), Pending Verification with Pending Overtime
  const davidYesterdayIn = new Date(now);
  davidYesterdayIn.setDate(davidYesterdayIn.getDate() - 1);
  davidYesterdayIn.setHours(8, 45, 0, 0);

  const davidYesterdayOut = new Date(davidYesterdayIn);
  davidYesterdayOut.setHours(17, 0, 0, 0);

  const recordDavidYesterday = await Attendance.create({
    employeeId: employeeDavid._id,
    attendanceDate: getPastDateStr(1),
    punchInAt: davidYesterdayIn,
    punchOutAt: davidYesterdayOut,
    punchInSelfie: sampleSelfie1,
    punchOutSelfie: sampleSelfie2,
    punchInLocation: officeLocation,
    punchOutLocation: officeLocation,
    totalWorkingMinutes: 495,
    workingStatus: 'completed',
    verificationStatus: 'pending',
    overtimeStatus: 'pending',
  });

  await OvertimeRequest.create({
    employeeId: employeeDavid._id,
    attendanceId: recordDavidYesterday._id,
    requestedMinutes: 45,
    reason: 'Sprint backlog refinement and urgent customer ticket triage.',
    status: 'pending',
  });

  // Record 4: Maria - 2 Days Ago - Completed with Rejected Overtime
  const maria2DaysIn = new Date(now);
  maria2DaysIn.setDate(maria2DaysIn.getDate() - 2);
  maria2DaysIn.setHours(9, 0, 0, 0);

  const maria2DaysOut = new Date(maria2DaysIn);
  maria2DaysOut.setHours(18, 0, 0, 0);

  const recordMaria2Days = await Attendance.create({
    employeeId: employeeMaria._id,
    attendanceDate: getPastDateStr(2),
    punchInAt: maria2DaysIn,
    punchOutAt: maria2DaysOut,
    punchInSelfie: sampleSelfie1,
    punchOutSelfie: sampleSelfie2,
    punchInLocation: officeLocation,
    punchOutLocation: officeLocation,
    totalWorkingMinutes: 540,
    workingStatus: 'completed',
    verificationStatus: 'valid',
    verifiedBy: manager._id,
    verifiedAt: maria2DaysOut,
    overtimeStatus: 'rejected',
  });

  await OvertimeRequest.create({
    employeeId: employeeMaria._id,
    attendanceId: recordMaria2Days._id,
    requestedMinutes: 60,
    reason: 'Stayed late to organize documentation.',
    status: 'rejected',
    reviewedBy: manager._id,
    reviewedAt: maria2DaysOut,
    reviewRemarks: 'Overtime must be pre-authorized before working late on non-critical tasks.',
  });

  // Record 5: David - Today - In Progress (currently punched in)
  const davidTodayIn = new Date(now);
  davidTodayIn.setHours(9, 15, 0, 0);

  await Attendance.create({
    employeeId: employeeDavid._id,
    attendanceDate: todayStr,
    punchInAt: davidTodayIn,
    punchInSelfie: sampleSelfie1,
    punchInLocation: officeLocation,
    totalWorkingMinutes: 0,
    workingStatus: 'in_progress',
    verificationStatus: 'pending',
    overtimeStatus: 'none',
  });

  logger.info('Created sample attendance records & overtime requests.');
  logger.info('---------------------------------------------------------');
  logger.info('✅ SEED COMPLETED SUCCESSFULLY!');
  logger.info('Demo Credentials (all passwords: Password123!):');
  logger.info('1. Admin:    admin@attendly.local');
  logger.info('2. Manager:  manager@attendly.local');
  logger.info('3. Employee: alex@attendly.local (Ready to punch in today)');
  logger.info('4. Employee: david@attendly.local (Currently checked in today)');
  logger.info('5. Employee: maria@attendly.local (Has past records)');
  logger.info('---------------------------------------------------------');

  await disconnectDB();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
