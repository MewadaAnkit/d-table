import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service.js';

export const getMyNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    // Also trigger missed punch scan for this active user
    await notificationService.checkMissedPunches(user).catch(() => {});

    const result = await notificationService.getUserNotifications(user._id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await notificationService.markAsRead(id, user._id);
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const count = await notificationService.markAllAsRead(user._id);
    res.status(200).json({
      success: true,
      message: `Marked ${count} notifications as read`,
    });
  } catch (error) {
    next(error);
  }
};
