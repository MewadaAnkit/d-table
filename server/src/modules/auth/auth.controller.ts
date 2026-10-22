import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../../models/user.model.js';
import { signToken } from '../../utils/jwt.utils.js';
import { AppError } from '../../middleware/error.middleware.js';
import { env } from '../../config/env.js';

const COOKIE_NAME = 'token';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, employeeCode, department } = req.body;

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    // Check if employeeCode already exists
    const existingCode = await User.findOne({ employeeCode });
    if (existingCode) {
      throw new AppError('An account with this employee code already exists.', 409);
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Enforce role = 'employee' (Public signup can never register as manager or admin)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'employee',
      employeeCode,
      department: department || 'General',
      isActive: true,
    });

    const token = signToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      employeeCode: user.employeeCode,
    });

    res.cookie(COOKIE_NAME, token, getCookieOptions());

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          employeeCode: user.employeeCode,
          department: user.department,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact an administrator.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = signToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      employeeCode: user.employeeCode,
    });

    res.cookie(COOKIE_NAME, token, getCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          employeeCode: user.employeeCode,
          department: user.department,
          managerId: user.managerId,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError('Not authenticated', 401);
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeCode: user.employeeCode,
        department: user.department,
        managerId: user.managerId,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};
