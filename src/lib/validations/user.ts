import { z } from 'zod'

export const UserCreateSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Only letters, numbers, dots, underscores, hyphens'),
  email: z.string().email('Valid email required'),
  firstName: z.string().min(1, 'First name required').max(50),
  lastName: z.string().min(1, 'Last name required').max(50),
  roleId: z.string().min(1, 'Role is required'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  isActive: z.boolean().default(true),
  isStaff: z.boolean().default(false),
})

export const UserUpdateSchema = UserCreateSchema.partial().extend({
  id: z.string().min(1),
  password: z.string().min(6).optional(),
})

export const PasswordResetSchema = z.object({
  password: z.string().min(6, 'At least 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export type UserCreateFormData = z.infer<typeof UserCreateSchema>
