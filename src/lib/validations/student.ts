import { z } from 'zod'

export const StudentSchema = z.object({
  admissionNumber: z.string().min(1, 'Admission number is required'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  gender: z.enum(['Male', 'Female', 'Other']),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().optional(),
  rollNumber: z.string().optional(),
  fatherName: z.string().min(2, "Father's name is required"),
  motherName: z.string().optional(),
  fatherPhone: z.string().regex(/^[0-9+\-\s]{10,15}$/, 'Enter a valid phone number').optional().or(z.literal('')),
  motherPhone: z.string().optional(),
  guardianPhone: z.string().optional(),
  fatherCNIC: z.string().optional(),
  bloodGroup: z.string().optional(),
  religion: z.string().optional(),
  nationality: z.string().default('Pakistani'),
  address: z.string().optional(),
  city: z.string().optional(),
  admissionDate: z.string().optional(),
  status: z.enum(['active', 'inactive', 'transferred', 'graduated']).default('active'),
  academicYearId: z.string().optional(),
  medicalConditions: z.string().optional(),
  previousSchool: z.string().optional(),
})

export const StudentUpdateSchema = StudentSchema.partial().extend({
  id: z.string().min(1),
})

export type StudentFormData = z.infer<typeof StudentSchema>
