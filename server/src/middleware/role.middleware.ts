import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/user.model.js';

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required before checking authorization.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: You do not have permission to perform this action. Required role: ${allowedRoles.join(' or ')}.`,
      });
      return;
    }

    next();
  };
};
