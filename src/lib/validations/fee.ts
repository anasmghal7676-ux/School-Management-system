import { z } from 'zod'

export const FeePaymentSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  feeTypeId: z.string().min(1, 'Fee type is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  paidAmount: z.number().min(0).optional(),
  dueDate: z.string().min(1, 'Due date required'),
  paymentDate: z.string().optional(),
  status: z.enum(['Pending', 'Paid', 'Partial', 'Overdue', 'Waived']).default('Pending'),
  paymentMethod: z.enum(['Cash', 'Cheque', 'Online', 'JazzCash', 'EasyPaisa', 'Bank Transfer']).optional(),
  receiptNumber: z.string().optional(),
  remarks: z.string().optional(),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2000).max(2100).optional(),
  discount: z.number().min(0).max(100).optional(),
  penalty: z.number().min(0).optional(),
})

export const FeeTypeSchema = z.object({
  name: z.string().min(1, 'Name required'),
  amount: z.number().min(0, 'Amount must be positive'),
  frequency: z.enum(['Monthly', 'Termly', 'Annual', 'One-time', 'Per Term']),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isOptional: z.boolean().default(false),
  applicableClasses: z.array(z.string()).optional(),
})

export type FeePaymentFormData = z.infer<typeof FeePaymentSchema>
export type FeeTypeFormData    = z.infer<typeof FeeTypeSchema>
