import { z } from 'zod'

export const AttendanceSchema = z.object({
  studentId: z.string().min(1, 'Student required'),
  classId: z.string().min(1, 'Class required'),
  date: z.string().min(1, 'Date required'),
  status: z.enum(['Present', 'Absent', 'Late', 'Excused', 'Half Day']),
  remarks: z.string().optional(),
  markedBy: z.string().optional(),
})

export const BulkAttendanceSchema = z.object({
  classId: z.string().min(1),
  date: z.string().min(1),
  records: z.array(z.object({
    studentId: z.string(),
    status: z.enum(['Present', 'Absent', 'Late', 'Excused', 'Half Day']),
    remarks: z.string().optional(),
  })).min(1, 'At least one attendance record required'),
})

export type AttendanceFormData = z.infer<typeof AttendanceSchema>
