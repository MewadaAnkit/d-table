import { Request, Response, NextFunction } from 'express';
import { Attendance } from '../../models/attendance.model.js';
import { User } from '../../models/user.model.js';
import { generateCsv } from '../../utils/csv.utils.js';
import { formatMinutes } from '../../utils/date.utils.js';

export const getDailyReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const query: any = {};

    // Role-based scoping
    if (user.role === 'employee') {
      query.employeeId = user._id;
    } else if (user.role === 'manager') {
      const team = await User.find(
        {
          _id: { $ne: user._id },
          $or: [
            { managerId: user._id },
            { department: user.department, role: 'employee' },
          ],
        },
        '_id'
      );
      const teamIds = team.map((t) => t._id);
      if (req.query.employeeId) {
        if (!teamIds.some((id) => id.toString() === req.query.employeeId)) {
          res.status(200).json({
            success: true,
            data: { records: [], pagination: { page, limit, total: 0, totalPages: 0 } },
          });
          return;
        }
        query.employeeId = req.query.employeeId;
      } else {
        query.employeeId = { $in: teamIds };
      }
    } else {
      // Admin
      if (req.query.employeeId) {
        query.employeeId = req.query.employeeId;
      }
    }

    // Filter by department if provided
    if (req.query.department) {
      const deptUsers = await User.find({ department: req.query.department }, '_id');
      const deptUserIds = deptUsers.map((u) => u._id);
      if (query.employeeId && query.employeeId.$in) {
        query.employeeId = {
          $in: query.employeeId.$in.filter((id: any) => deptUserIds.some((dId) => dId.equals(id))),
        };
      } else if (!query.employeeId) {
        query.employeeId = { $in: deptUserIds };
      }
    }

    // Date filters
    if (req.query.date) {
      query.attendanceDate = req.query.date;
    } else if (req.query.startDate && req.query.endDate) {
      query.attendanceDate = {
        $gte: req.query.startDate,
        $lte: req.query.endDate,
      };
    }

    if (req.query.workingStatus) {
      query.workingStatus = req.query.workingStatus;
    }
    if (req.query.verificationStatus) {
      query.verificationStatus = req.query.verificationStatus;
    }

    const [records, total] = await Promise.all([
      Attendance.find(query)
        .sort({ attendanceDate: -1, punchInAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('employeeId', 'name email employeeCode department')
        .populate('verifiedBy', 'name employeeCode'),
      Attendance.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportReportCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const query: any = {};

    // Scoping
    if (user.role === 'employee') {
      query.employeeId = user._id;
    } else if (user.role === 'manager') {
      const team = await User.find(
        {
          _id: { $ne: user._id },
          $or: [
            { managerId: user._id },
            { department: user.department, role: 'employee' },
          ],
        },
        '_id'
      );
      const teamIds = team.map((t) => t._id);
      if (req.query.employeeId) {
        if (!teamIds.some((id) => id.toString() === req.query.employeeId)) {
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.csv"');
          res.send(generateCsv(['Date', 'Name', 'Status'], []));
          return;
        }
        query.employeeId = req.query.employeeId;
      } else {
        query.employeeId = { $in: teamIds };
      }
    } else {
      if (req.query.employeeId) {
        query.employeeId = req.query.employeeId;
      }
    }

    if (req.query.department) {
      const deptUsers = await User.find({ department: req.query.department }, '_id');
      const deptUserIds = deptUsers.map((u) => u._id);
      if (query.employeeId && query.employeeId.$in) {
        query.employeeId = {
          $in: query.employeeId.$in.filter((id: any) => deptUserIds.some((dId) => dId.equals(id))),
        };
      } else if (!query.employeeId) {
        query.employeeId = { $in: deptUserIds };
      }
    }

    if (req.query.date) {
      query.attendanceDate = req.query.date;
    } else if (req.query.startDate && req.query.endDate) {
      query.attendanceDate = {
        $gte: req.query.startDate,
        $lte: req.query.endDate,
      };
    }

    if (req.query.workingStatus) {
      query.workingStatus = req.query.workingStatus;
    }
    if (req.query.verificationStatus) {
      query.verificationStatus = req.query.verificationStatus;
    }

    const records = await Attendance.find(query)
      .sort({ attendanceDate: -1, punchInAt: -1 })
      .populate<{ employeeId: any }>('employeeId', 'name email employeeCode department')
      .populate<{ verifiedBy: any }>('verifiedBy', 'name employeeCode');

    const headers = [
      'Attendance Date',
      'Employee Code',
      'Employee Name',
      'Department',
      'Punch In Time',
      'Punch Out Time',
      'Total Duration',
      'Working Status',
      'Verification Status',
      'Verification Remarks',
      'Verified By',
      'Overtime Status',
      'Punch In Lat/Lng',
      'Punch Out Lat/Lng',
    ];

    const rows = records.map((r) => {
      const emp = r.employeeId || {};
      const verifier = r.verifiedBy || {};
      const punchInLoc = r.punchInLocation ? `${r.punchInLocation.latitude}, ${r.punchInLocation.longitude}` : 'N/A';
      const punchOutLoc = r.punchOutLocation
        ? `${r.punchOutLocation.latitude}, ${r.punchOutLocation.longitude}`
        : 'N/A';

      return [
        r.attendanceDate,
        emp.employeeCode || 'N/A',
        emp.name || 'N/A',
        emp.department || 'N/A',
        r.punchInAt ? new Date(r.punchInAt).toLocaleTimeString() : 'N/A',
        r.punchOutAt ? new Date(r.punchOutAt).toLocaleTimeString() : 'N/A',
        formatMinutes(r.totalWorkingMinutes || 0),
        r.workingStatus,
        r.verificationStatus,
        r.verificationRemarks || '',
        verifier.name ? `${verifier.name} (${verifier.employeeCode})` : 'N/A',
        r.overtimeStatus,
        punchInLoc,
        punchOutLoc,
      ];
    });

    const csvContent = generateCsv(headers, rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-report-${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
