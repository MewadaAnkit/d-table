import { z } from 'zod';

export const punchInSchema = z.object({
  body: z.object({
    selfie: z.string().min(50, 'A live selfie capture is required'),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracy: z.number().optional(),
    }),
  }),
});

export const punchOutSchema = z.object({
  body: z.object({
    selfie: z.string().min(50, 'A live selfie capture is required'),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracy: z.number().optional(),
    }),
  }),
});

export const verificationSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Attendance ID is required'),
  }),
  body: z
    .object({
      verificationStatus: z.enum(['valid', 'invalid']),
      remarks: z.string().max(500).optional(),
    })
    .refine(
      (data) => {
        if (data.verificationStatus === 'invalid') {
          return !!data.remarks && data.remarks.trim().length >= 3;
        }
        return true;
      },
      {
        message: 'A remark of at least 3 characters is required when marking attendance as Invalid',
        path: ['remarks'],
      }
    ),
});
