import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { attendanceService } from './attendance.service.js';
import { Attendance } from '../../models/attendance.model.js';
import { User } from '../../models/user.model.js';
import { storageService } from '../../storage/localStorage.service.js';
import { AppError } from '../../middleware/error.middleware.js';

export const punchIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { selfie, location } = req.body;

    const record = await attendanceService.punchIn(user, { selfie, location });

    res.status(201).json({
      success: true,
      message: 'Successfully punched in.',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const punchOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { selfie, location } = req.body;

    const record = await attendanceService.punchOut(user, { selfie, location });

    res.status(200).json({
      success: true,
      message: 'Successfully punched out.',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const getGeofenceConfig = async (_req: Request, res: Response): Promise<void> => {
  const config = attendanceService.getGeofenceConfig();
  res.status(200).json({
    success: true,
    data: config,
  });
};

export const getActiveSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const record = await attendanceService.getActiveSession(user._id);

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const query: any = { employeeId: user._id };

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

export const getTeamAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const manager = req.user!;

    // Find all employees assigned to this manager
    const teamMembers = await User.find({ managerId: manager._id }, '_id');
    const teamIds = teamMembers.map((m) => m._id);

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const query: any = { employeeId: { $in: teamIds } };

    if (req.query.employeeId) {
      // Ensure the requested employee is part of manager's team
      if (!teamIds.some((id) => id.toString() === req.query.employeeId)) {
        res.status(200).json({
          success: true,
          data: {
            records: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
          },
        });
        return;
      }
      query.employeeId = req.query.employeeId;
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

export const getAllAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (req.query.employeeId) {
      query.employeeId = req.query.employeeId;
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

export const getAttendanceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const record = await Attendance.findById(id)
      .populate('employeeId', 'name email employeeCode department managerId')
      .populate('verifiedBy', 'name employeeCode');

    if (!record) {
      throw new AppError('Attendance record not found', 404);
    }

    const employee = record.employeeId as any;

    // Authorization checks:
    // 1. Employee can only access their own
    if (user.role === 'employee' && employee._id.toString() !== user._id.toString()) {
      throw new AppError('Forbidden: You cannot access attendance records of other employees.', 403);
    }

    // 2. Manager can only access their team's records
    if (user.role === 'manager') {
      if (!employee.managerId || employee.managerId.toString() !== user._id.toString()) {
        throw new AppError('Forbidden: You can only access attendance records of your direct reports.', 403);
      }
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const updateVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const id = req.params.id as string;
    const { verificationStatus, remarks } = req.body;

    const record = await attendanceService.verifyAttendance(user, id, verificationStatus, remarks);

    res.status(200).json({
      success: true,
      message: `Attendance marked as ${verificationStatus}.`,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const streamSelfie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const id = req.params.id as string;
    const type = req.params.type as string;

    if (type !== 'in' && type !== 'out') {
      throw new AppError('Invalid selfie type specified. Must be "in" or "out".', 400);
    }

    const record = await Attendance.findById(id).populate<{ employeeId: any }>('employeeId');
    if (!record) {
      throw new AppError('Attendance record not found', 404);
    }

    const employee = record.employeeId;

    // Authorization scoping
    if (user.role === 'employee' && employee._id.toString() !== user._id.toString()) {
      throw new AppError('Forbidden: Access denied to other employee selfies.', 403);
    }
    if (user.role === 'manager') {
      if (!employee.managerId || employee.managerId.toString() !== user._id.toString()) {
        throw new AppError('Forbidden: Access denied to selfies outside your assigned team.', 403);
      }
    }

    const selfieData = type === 'in' ? record.punchInSelfie : record.punchOutSelfie;
    if (!selfieData || !selfieData.storageKey) {
      throw new AppError(`No punch-${type} selfie found on this record.`, 404);
    }

    const stream = storageService.getFileStream(selfieData.storageKey);
    if (!stream) {
      throw new AppError('Selfie image file not found in storage.', 404);
    }

    res.setHeader('Content-Type', selfieData.mimeType || 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=86400');
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};
