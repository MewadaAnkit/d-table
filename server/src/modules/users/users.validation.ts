import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['employee', 'manager', 'admin']).default('employee'),
    employeeCode: z.string().min(2, 'Employee code must be at least 2 characters').max(20),
    department: z.string().min(1, 'Department is required').max(50).default('General'),
    managerId: z.string().nullable().optional(),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    role: z.enum(['employee', 'manager', 'admin']).optional(),
    department: z.string().min(2).max(50).optional(),
    managerId: z.string().nullable().optional(),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    isActive: z.boolean(),
  }),
});

export const deleteUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});

