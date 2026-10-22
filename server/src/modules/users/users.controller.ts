import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../../models/user.model.js';
import { Attendance } from '../../models/attendance.model.js';
import { OvertimeRequest } from '../../models/overtime.model.js';
import { Notification } from '../../models/notification.model.js';
import { AppError } from '../../middleware/error.middleware.js';

export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (req.query.search) {
      const searchRegex = new RegExp(String(req.query.search), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { employeeCode: searchRegex }];
    }

    if (req.query.role) {
      query.role = req.query.role;
    }

    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    if (req.query.department) {
      query.department = req.query.department;
    }

    const [users, total] = await Promise.all([
      User.find(query, '-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('managerId', 'name employeeCode email'),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
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

export const getManagersList = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const managers = await User.find(
      { role: { $in: ['manager', 'admin'] }, isActive: true },
      '_id name employeeCode email department role'
    ).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: managers,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, '-passwordHash').populate('managerId', 'name employeeCode email');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, role, department, managerId } = req.body;

    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prevent user assigning themselves as their own manager
    if (managerId && managerId === id) {
      throw new AppError('An employee cannot be assigned as their own manager.', 400);
    }

    // If managerId is provided, verify manager exists and is active manager/admin
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager || !manager.isActive) {
        throw new AppError('Assigned manager does not exist or is inactive.', 400);
      }
      if (manager.role !== 'manager' && manager.role !== 'admin') {
        throw new AppError('Assigned user does not hold a Manager or Admin role.', 400);
      }
      user.managerId = new Types.ObjectId(managerId);
    } else if (managerId === null) {
      user.managerId = null;
    }

    if (name) user.name = name;
    if (department) user.department = department;
    if (role) user.role = role;

    await user.save();

    const updated = await User.findById(id, '-passwordHash').populate('managerId', 'name employeeCode email');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const currentAdmin = req.user!;
    const { id } = req.params;
    const { isActive } = req.body;

    if (currentAdmin._id.toString() === id && isActive === false) {
      throw new AppError('You cannot deactivate your own administrative account.', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account has been ${isActive ? 'activated' : 'deactivated'}.`,
      data: {
        id: user._id,
        name: user.name,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role, employeeCode, department, managerId, isActive } = req.body;

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedCode = String(employeeCode).toUpperCase().trim();

    // Check if email already exists
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    // Check if employee code already exists
    const existingCode = await User.findOne({ employeeCode: normalizedCode });
    if (existingCode) {
      throw new AppError('An account with this employee code already exists.', 409);
    }

    // Validate manager if provided
    let validManagerId: Types.ObjectId | null = null;
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager || !manager.isActive) {
        throw new AppError('Assigned manager does not exist or is inactive.', 400);
      }
      if (manager.role !== 'manager' && manager.role !== 'admin') {
        throw new AppError('Assigned user does not hold a Manager or Admin role.', 400);
      }
      validManagerId = new Types.ObjectId(managerId);
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: role || 'employee',
      employeeCode: normalizedCode,
      department: department ? String(department).trim() : 'General',
      managerId: validManagerId,
      isActive: isActive !== undefined ? isActive : true,
    });

    const populatedUser = await User.findById(newUser._id, '-passwordHash').populate(
      'managerId',
      'name employeeCode email'
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: populatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const currentAdmin = req.user!;
    const { id } = req.params;

    if (currentAdmin._id.toString() === id) {
      throw new AppError('You cannot delete your own administrative account.', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Unlink any users that reported to this user
    await User.updateMany({ managerId: id }, { $set: { managerId: null } });

    // Clean up associated attendance, overtime requests, and notifications
    await Promise.all([
      Attendance.deleteMany({ employeeId: id }),
      OvertimeRequest.deleteMany({ employeeId: id }),
      Notification.deleteMany({ userId: id }),
    ]);

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `User ${user.name} (${user.employeeCode}) was permanently deleted.`,
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};

