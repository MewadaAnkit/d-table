import { Request, Response, NextFunction } from 'express';
import { OvertimeRequest } from '../../models/overtime.model.js';
import { Attendance } from '../../models/attendance.model.js';
import { User } from '../../models/user.model.js';
import { AppError } from '../../middleware/error.middleware.js';
import { notificationService } from '../notifications/notification.service.js';
import { broadcastEvent, emitToUser } from '../../services/socket.service.js';

export const createOvertimeRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { attendanceId, requestedMinutes, reason } = req.body;

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      throw new AppError('Attendance record not found', 404);
    }

    // Verify ownership
    if (attendance.employeeId.toString() !== user._id.toString()) {
      throw new AppError('Forbidden: You can only request overtime for your own attendance records.', 403);
    }

    // Must be punched out
    if (attendance.workingStatus === 'in_progress' || !attendance.punchOutAt) {
      throw new AppError('Cannot request overtime for an in-progress attendance session. Please punch out first.', 400);
    }

    // Prevent duplicate pending requests
    const existingPending = await OvertimeRequest.findOne({
      attendanceId: attendance._id,
      status: 'pending',
    });
    if (existingPending) {
      throw new AppError('A pending overtime request already exists for this attendance date.', 409);
    }

    const overtime = await OvertimeRequest.create({
      employeeId: user._id,
      attendanceId: attendance._id,
      requestedMinutes,
      reason,
      status: 'pending',
    });

    // Update attendance record overtimeStatus
    attendance.overtimeStatus = 'pending';
    await attendance.save();

    // Trigger notification to manager if assigned
    if (user.managerId) {
      const hoursStr = (requestedMinutes / 60).toFixed(1);
      notificationService
        .createNotification(
          user.managerId,
          '📋 New Overtime Request',
          `${user.name} requested ${hoursStr}h overtime for attendance on ${attendance.attendanceDate}.`,
          'overtime_requested',
          '/manager/overtime'
        )
        .catch(() => {});
    }

    broadcastEvent('overtime:new', {
      overtimeId: overtime._id,
      employeeName: user.name,
      requestedMinutes,
    });

    res.status(201).json({
      success: true,
      message: 'Overtime request submitted successfully.',
      data: overtime,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOvertimeRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const query: any = { employeeId: user._id };
    if (req.query.status) {
      query.status = req.query.status;
    }

    const [requests, total] = await Promise.all([
      OvertimeRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('attendanceId')
        .populate('reviewedBy', 'name employeeCode'),
      OvertimeRequest.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOvertimeRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    let query: any = {};

    if (user.role === 'manager') {
      const team = await User.find({ managerId: user._id }, '_id');
      const teamIds = team.map((t) => t._id);
      query.employeeId = { $in: teamIds };
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const [requests, total] = await Promise.all([
      OvertimeRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('employeeId', 'name email employeeCode department')
        .populate('attendanceId')
        .populate('reviewedBy', 'name employeeCode'),
      OvertimeRequest.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const reviewOvertimeRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reviewer = req.user!;
    const { id } = req.params;
    const { status, reviewRemarks } = req.body;

    const overtime = await OvertimeRequest.findById(id).populate<{ employeeId: any }>('employeeId');
    if (!overtime) {
      throw new AppError('Overtime request not found', 404);
    }

    if (overtime.status !== 'pending') {
      throw new AppError(`This overtime request has already been ${overtime.status}.`, 400);
    }

    // Scoping check for manager
    if (reviewer.role === 'manager') {
      const employee = overtime.employeeId;
      if (!employee.managerId || employee.managerId.toString() !== reviewer._id.toString()) {
        throw new AppError('Forbidden: You can only review overtime requests for your direct team members.', 403);
      }
    }

    overtime.status = status;
    overtime.reviewedBy = reviewer._id;
    overtime.reviewedAt = new Date();
    overtime.reviewRemarks = reviewRemarks || null;
    await overtime.save();

    // Update attendance record status
    await Attendance.findByIdAndUpdate(overtime.attendanceId, {
      overtimeStatus: status,
    });

    // Notify employee of approval/rejection
    const employeeId = (overtime.employeeId as any)?._id || overtime.employeeId;
    const hoursText = (overtime.requestedMinutes / 60).toFixed(1);
    notificationService
      .createNotification(
        employeeId,
        status === 'approved' ? '🎉 Overtime Approved' : '❌ Overtime Rejected',
        `Your overtime request for ${hoursText}h was ${status} by ${reviewer.name}.${
          reviewRemarks ? ` Remarks: "${reviewRemarks}"` : ''
        }`,
        status === 'approved' ? 'overtime_approved' : 'overtime_rejected',
        '/overtime'
      )
      .catch(() => {});

    emitToUser(employeeId.toString(), 'overtime:status_changed', {
      overtimeId: overtime._id,
      status,
      reviewerName: reviewer.name,
      reviewRemarks,
    });

    broadcastEvent('overtime:updated', {
      overtimeId: overtime._id,
      status,
    });

    res.status(200).json({
      success: true,
      message: `Overtime request has been ${status}.`,
      data: overtime,
    });
  } catch (error) {
    next(error);
  }
};
