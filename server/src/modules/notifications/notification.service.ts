import { Notification, INotification, NotificationType } from '../../models/notification.model.js';
import { Attendance } from '../../models/attendance.model.js';
import { IUser } from '../../models/user.model.js';
import { emitToUser } from '../../services/socket.service.js';
import { logger } from '../../config/logger.js';
import { Types } from 'mongoose';

export class NotificationService {
  async createNotification(
    userId: string | Types.ObjectId,
    title: string,
    message: string,
    type: NotificationType = 'system',
    link?: string
  ): Promise<INotification> {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      link,
      isRead: false,
    });

    // Real-time socket delivery
    try {
      emitToUser(userId.toString(), 'notification:new', {
        id: notification._id,
        title,
        message,
        type,
        link,
        createdAt: notification.createdAt,
      });
    } catch (err) {
      logger.warn('Failed to emit socket notification', err);
    }

    return notification;
  }

  async getUserNotifications(userId: string | Types.ObjectId, limit = 20) {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return {
      notifications,
      unreadCount,
    };
  }

  async markAsRead(notificationId: string, userId: string | Types.ObjectId): Promise<boolean> {
    const res = await Notification.updateOne(
      { _id: notificationId, userId },
      { $set: { isRead: true } }
    );
    return res.modifiedCount > 0;
  }

  async markAllAsRead(userId: string | Types.ObjectId): Promise<number> {
    const res = await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );
    return res.modifiedCount;
  }

  /**
   * Checks for missed punches:
   * 1. Active punch-in exceeding 9 hours without punch-out
   */
  async checkMissedPunches(user: IUser): Promise<void> {
    const active = await Attendance.findOne({
      employeeId: user._id,
      workingStatus: 'in_progress',
    });

    if (active && active.punchInAt) {
      const elapsedHours = (Date.now() - new Date(active.punchInAt).getTime()) / (1000 * 60 * 60);
      if (elapsedHours >= 9) {
        // Check if alert already sent today
        const existing = await Notification.findOne({
          userId: user._id,
          type: 'missed_punch',
          createdAt: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) },
        });

        if (!existing) {
          await this.createNotification(
            user._id,
            '⚠️ Missed Punch-Out Alert',
            `You have an active shift started at ${new Date(active.punchInAt).toLocaleTimeString()} (${Math.floor(elapsedHours)} hrs ago) that has not been punched out.`,
            'missed_punch',
            '/punch'
          );
        }
      }
    }
  }
}

export const notificationService = new NotificationService();
