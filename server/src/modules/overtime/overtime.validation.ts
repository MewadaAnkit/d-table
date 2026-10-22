import { z } from 'zod';

export const createOvertimeSchema = z.object({
  body: z.object({
    attendanceId: z.string().min(1, 'Attendance ID is required'),
    requestedMinutes: z
      .number()
      .min(15, 'Overtime request must be at least 15 minutes')
      .max(720, 'Overtime request cannot exceed 720 minutes (12 hours)'),
    reason: z.string().min(5, 'Reason must be at least 5 characters').max(500),
  }),
});

export const reviewOvertimeSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Overtime Request ID is required'),
  }),
  body: z
    .object({
      status: z.enum(['approved', 'rejected']),
      reviewRemarks: z.string().max(500).optional(),
    })
    .refine(
      (data) => {
        if (data.status === 'rejected') {
          return !!data.reviewRemarks && data.reviewRemarks.trim().length >= 3;
        }
        return true;
      },
      {
        message: 'A rejection reason of at least 3 characters is required when rejecting overtime.',
        path: ['reviewRemarks'],
      }
    ),
});
