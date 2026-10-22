import { Request, Response, NextFunction } from 'express';
import { Attendance } from '../../models/attendance.model.js';
import { OvertimeRequest } from '../../models/overtime.model.js';
import { User } from '../../models/user.model.js';
import { getAttendanceDateString } from '../../utils/date.utils.js';

export const getEmployeeDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const today = getAttendanceDateString();

    const [todayAttendance, recentRecords, completedCount, incompleteCount, overtimeStats] = await Promise.all([
      Attendance.findOne({ employeeId: user._id, attendanceDate: today }),
      Attendance.find({ employeeId: user._id })
        .sort({ attendanceDate: -1, punchInAt: -1 })
        .limit(5)
        .populate('verifiedBy', 'name employeeCode'),
      Attendance.countDocuments({ employeeId: user._id, workingStatus: 'completed' }),
      Attendance.countDocuments({ employeeId: user._id, workingStatus: 'incomplete' }),
      OvertimeRequest.aggregate([
        { $match: { employeeId: user._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const overtimeCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    overtimeStats.forEach((stat) => {
      if (stat._id in overtimeCounts) {
        overtimeCounts[stat._id as keyof typeof overtimeCounts] = stat.count;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        todayAttendance,
        recentRecords,
        stats: {
          completedDays: completedCount,
          incompleteDays: incompleteCount,
          totalPunchedDays: completedCount + incompleteCount,
          overtime: overtimeCounts,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getManagerDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const manager = req.user!;
    const date = (req.query.date as string) || getAttendanceDateString();

    const team = await User.find({ managerId: manager._id }, '_id name employeeCode department');
    const teamIds = team.map((t) => t._id);

    const [
      teamAttendanceToday,
      currentlyCheckedIn,
      pendingOvertimeCount,
      pendingVerificationCount,
    ] = await Promise.all([
      Attendance.find({ employeeId: { $in: teamIds }, attendanceDate: date }).populate(
        'employeeId',
        'name employeeCode department'
      ),
      Attendance.find({
        employeeId: { $in: teamIds },
        workingStatus: 'in_progress',
      }).populate('employeeId', 'name employeeCode department'),
      OvertimeRequest.countDocuments({
        employeeId: { $in: teamIds },
        status: 'pending',
      }),
      Attendance.countDocuments({
        employeeId: { $in: teamIds },
        verificationStatus: 'pending',
        workingStatus: { $ne: 'in_progress' },
      }),
    ]);

    let completed = 0;
    let incomplete = 0;
    let inProgress = 0;

    teamAttendanceToday.forEach((att) => {
      if (att.workingStatus === 'completed') completed++;
      else if (att.workingStatus === 'incomplete') incomplete++;
      else if (att.workingStatus === 'in_progress') inProgress++;
    });

    res.status(200).json({
      success: true,
      data: {
        selectedDate: date,
        totalTeamMembers: team.length,
        summary: {
          totalAttendanceRecords: teamAttendanceToday.length,
          completed,
          incomplete,
          inProgress,
          notReported: Math.max(0, team.length - teamAttendanceToday.length),
        },
        currentlyCheckedIn,
        pendingActions: {
          pendingOvertime: pendingOvertimeCount,
          pendingVerification: pendingVerificationCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const date = (req.query.date as string) || getAttendanceDateString();

    const [
      totalActiveEmployees,
      totalUsers,
      attendanceToday,
      currentlyCheckedIn,
      pendingOvertimeCount,
      pendingVerificationCount,
    ] = await Promise.all([
      User.countDocuments({ role: 'employee', isActive: true }),
      User.countDocuments(),
      Attendance.find({ attendanceDate: date }).populate('employeeId', 'name employeeCode department'),
      Attendance.find({ workingStatus: 'in_progress' }).populate('employeeId', 'name employeeCode department'),
      OvertimeRequest.countDocuments({ status: 'pending' }),
      Attendance.countDocuments({
        verificationStatus: 'pending',
        workingStatus: { $ne: 'in_progress' },
      }),
    ]);

    let completed = 0;
    let incomplete = 0;
    let inProgress = 0;

    attendanceToday.forEach((att) => {
      if (att.workingStatus === 'completed') completed++;
      else if (att.workingStatus === 'incomplete') incomplete++;
      else if (att.workingStatus === 'in_progress') inProgress++;
    });

    res.status(200).json({
      success: true,
      data: {
        selectedDate: date,
        totalActiveEmployees,
        totalUsers,
        summary: {
          totalAttendanceRecords: attendanceToday.length,
          completed,
          incomplete,
          inProgress,
          notReported: Math.max(0, totalActiveEmployees - attendanceToday.length),
        },
        currentlyCheckedIn,
        pendingActions: {
          pendingOvertime: pendingOvertimeCount,
          pendingVerification: pendingVerificationCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
