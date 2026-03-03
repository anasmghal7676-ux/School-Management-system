import { z } from 'zod'

export const StaffSchema = z.object({
  fullName: z.string().min(2, 'Full name required').max(100),
  employeeId: z.string().min(1, 'Employee ID required'),
  designation: z.string().min(1, 'Designation required'),
  staffType: z.enum(['Teacher', 'Admin', 'Support', 'Librarian', 'Other']),
  gender: z.enum(['Male', 'Female', 'Other']),
  departmentId: z.string().optional(),
  salary: z.number().min(0, 'Salary must be positive').optional(),
  joiningDate: z.string().min(1, 'Joining date required'),
  status: z.enum(['active', 'inactive', 'on_leave', 'terminated']).default('active'),
  phone: z.string().regex(/^[0-9+\-\s]{10,15}$/, 'Valid phone required').optional().or(z.literal('')),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  cnic: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.number().min(0).optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
})

export type StaffFormData = z.infer<typeof StaffSchema>
