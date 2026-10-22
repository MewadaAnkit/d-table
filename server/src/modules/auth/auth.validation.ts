import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100),
    employeeCode: z
      .string()
      .min(3, 'Employee code must be at least 3 characters')
      .max(30)
      .transform((val) => val.toUpperCase()),
    department: z.string().min(2, 'Department must be at least 2 characters').max(50).optional().default('General'),
    role: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});
