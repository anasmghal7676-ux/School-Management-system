# Staff Management Module - Implementation Plan

## Pakistani School Management System

**Version:** 1.0
**Date:** January 2025
**Target Scale:** 2,000+ Staff Members
**Tech Stack:** Next.js 16, TypeScript 5, Prisma ORM, SQLite

---

## Table of Contents

1. [Module Overview](#module-overview)
2. [Feature Breakdown](#feature-breakdown)
3. [Database Schema Analysis & Enhancements](#database-schema-analysis--enhancements)
4. [API Endpoint Specifications](#api-endpoint-specifications)
5. [UI/UX Component Requirements](#uiux-component-requirements)
6. [Implementation Steps](#implementation-steps)
7. [Pakistani-Specific Features](#pakistani-specific-features)
8. [Payroll Calculation Business Logic](#payroll-calculation-business-logic)
9. [Security & Permissions](#security--permissions)
10. [Performance Considerations](#performance-considerations)
11. [Testing Strategy](#testing-strategy)
12. [Deployment Considerations](#deployment-considerations)

---

## 1. Module Overview

### 1.1 Purpose
The Staff Management module provides comprehensive human resource management capabilities for a Pakistani school, handling all aspects of staff administration from recruitment to payroll processing.

### 1.2 Scope
- Manage 2,000+ staff members across multiple employment types
- Handle Pakistani employment compliance (CNIC, EOBI, tax)
- Track staff qualifications, experience, and performance
- Manage attendance, leaves, and payroll
- Support departmental hierarchy and subject assignments

### 1.3 Key Stakeholders
- School Administration (Principals, Administrators)
- HR Department
- Finance/Payroll Team
- Department Heads
- Staff Members (Self-service features)
- Parents (Teacher information access)

---

## 2. Feature Breakdown

### 2.1 Staff Directory with Search and Filters
**Description:** Centralized staff registry with advanced search and filtering capabilities

**Features:**
- Real-time search by name, employee code, CNIC, designation
- Multi-level filtering (department, employment type, status, qualification)
- Pagination for large datasets (2,000+ records)
- Export functionality (PDF, Excel, CSV)
- Quick view of staff profile summary
- Print staff ID cards

**Priority:** High

### 2.2 Staff Registration and Profile Management
**Description:** Complete staff onboarding and profile management system

**Features:**
- Multi-step registration form
- Document upload (CNIC, educational certificates, experience letters)
- Profile photo management
- Employment contract tracking
- Bank details for payroll
- Emergency contact information
- Profile history and audit trail

**Priority:** High

### 2.3 Department Management
**Description:** Organizational structure management

**Features:**
- Create, edit, and delete departments
- Department hierarchy (if needed for larger schools)
- Assign department head
- Department-wise staff count
- Department budget tracking (optional)

**Priority:** Medium

### 2.4 Staff Attendance Tracking
**Description:** Daily attendance management with check-in/check-out

**Features:**
- Manual attendance marking by admin
- Self check-in/check-out (with IP/location restrictions)
- Late arrival tracking
- Early departure tracking
- Attendance summary reports
- Monthly attendance calculations
- Integration with leave management

**Priority:** High

### 2.5 Leave Management
**Description:** Comprehensive leave tracking and approval system

**Leave Types (Pakistani Context):**
- Sick Leave (SL) - 10 days per year
- Casual Leave (CL) - 10 days per year
- Emergency Leave - Case-by-case
- Annual Leave (Earned Leave) - As per service length
- Maternity Leave - 90 days (as per Pakistani Labor Law)
- Paternity Leave - 7 days
- Unpaid Leave - With approval

**Features:**
- Leave application workflow
- Leave balance tracking
- Leave approval/rejection by authorized personnel
- Leave encashment calculation
- Leave calendar visualization
- Automatic leave carryover (annual leave)
- Leave history and reports

**Priority:** High

### 2.6 Payroll Management
**Description:** Complete salary processing and management

**Features:**
- Monthly payroll generation
- Multiple employment type support
- Allowance management (housing, medical, transport, etc.)
- Deduction processing (tax, EOBI, advance, loans)
- Payslip generation (PDF)
- Salary slip distribution (email/print)
- Tax calculation as per Pakistani tax slabs
- EOBI contribution tracking
- Bonus and increment management
- Salary history and reports
- Bank transfer integration (optional)

**Priority:** High

### 2.7 Staff Qualifications and Experience Tracking
**Description:** Academic and professional credentials management

**Features:**
- Educational qualifications (Matric, Inter, Bachelor's, Master's, PhD)
- Professional certifications
- Teaching certifications (B.Ed, M.Ed, CT, PTC)
- Experience history with detailed breakdown
- Specialized skills tracking
- Professional development records
- Training and workshop attendance

**Priority:** Medium

### 2.8 Employment Types Management
**Description:** Support for various employment categories

**Employment Types:**
- Permanent (Regular)
- Contract (Fixed-term)
- Part-time
- Visiting Faculty
- Probationary
- Intern/Trainee

**Features:**
- Employment type-specific policies
- Contract start/end date tracking
- Probation period monitoring
- Automatic status change notifications
- Contract renewal alerts

**Priority:** High

### 2.9 Subjects Taught by Teachers
**Description:** Subject assignment and tracking

**Features:**
- Assign multiple subjects to teachers
- Subject expertise level tracking
- Class-wise subject allocation
- Workload calculation
- Subject preference tracking
- Substitute teacher management

**Priority:** Medium

### 2.10 Staff Performance Evaluation
**Description:** Annual performance appraisal system

**Features:**
- Performance evaluation criteria
- Self-assessment module
- Peer review (optional)
- Supervisor evaluation
- Student feedback integration
- Performance scoring system
- Rating categories (Excellent, Good, Satisfactory, Needs Improvement)
- Improvement plan generation
- Performance history tracking
- Promotions and increment recommendations

**Priority:** Medium

---

## 3. Database Schema Analysis & Enhancements

### 3.1 Existing Schema Review

The current schema includes the following relevant models:
- `Staff` - Main staff table
- `Department` - Department management
- `StaffAttendance` - Attendance records
- `LeaveApplication` - Leave management
- `Payroll` - Salary records
- `User` - User accounts with `isStaff` flag
- `Role` - Role-based access control

### 3.2 Recommended Schema Enhancements

#### 3.2.1 Staff Qualification Model (New)
```prisma
model StaffQualification {
  id          String   @id @default(cuid())
  staffId     String
  degree      String   // Matric, Inter, Bachelor's, Master's, PhD
  institution String
  university  String?
  board       String?  // For Matric/Inter
  year        Int
  grade       String?  // Division/Grade/CGPA
  majorSubject String?
  isHighest   Boolean  @default(false)
  certificatePath String?
  verified    Boolean  @default(false)
  verifiedBy  String?
  verifiedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  staff       Staff    @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@index([staffId])
  @@index([year])
}
```

#### 3.2.2 Staff Experience Model (New)
```prisma
model StaffExperience {
  id              String   @id @default(cuid())
  staffId         String
  organization    String
  designation     String
  department      String?
  startDate       DateTime
  endDate         DateTime?
  isCurrent       Boolean  @default(false)
  salary          Float?
  reasonForLeaving String?
  documentPath    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  staff           Staff    @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@index([staffId])
  @@index([isCurrent])
}
```

#### 3.2.3 Staff Document Model (New)
```prisma
model StaffDocument {
  id          String   @id @default(cuid())
  staffId     String
  documentType String  // CNIC, Degree, Experience, Contract, PoliceVerification
  fileName    String
  filePath    String
  fileSize    Int?
  expiryDate  DateTime?
  issuedDate  DateTime?
  uploadedBy  String?
  uploadDate  DateTime @default(now())
  isVerified  Boolean  @default(false)
  remarks     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  staff       Staff    @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@index([staffId])
  @@index([documentType])
  @@index([expiryDate])
}
```

#### 3.2.4 Leave Balance Model (New)
```prisma
model LeaveBalance {
  id              String   @id @default(cuid())
  staffId         String
  leaveType       String   // Sick, Casual, Annual, Maternity, Paternity
  totalAllowed    Int
  used            Int      @default(0)
  balance         Int
  year            Int
  carryForward    Int      @default(0)
  lastUpdated     DateTime @updatedAt
  createdAt       DateTime @default(now())

  staff           Staff    @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@unique([staffId, leaveType, year])
  @@index([staffId])
  @@index([year])
}
```

#### 3.2.5 Staff Performance Model (New)
```prisma
model StaffPerformance {
  id                String   @id @default(cuid())
  staffId           String
  evaluationYear    Int
  evaluationPeriod  String   // Annual, Semi-Annual, Quarterly
  evaluatorId       String?  // Who evaluated
  selfScore         Float?
  supervisorScore   Float?
  peerScore         Float?
  studentScore      Float?
  finalScore        Float?
  rating            String   // Excellent, Good, Satisfactory, Needs Improvement
  strengths         String?  // JSON array
  weaknesses        String?  // JSON array
  goals             String?  // JSON array
  recommendations   String?
  promotionEligible Boolean?
  incrementPercent  Float?
  approvedBy        String?
  approvedAt        DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  staff             Staff    @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@unique([staffId, evaluationYear, evaluationPeriod])
  @@index([staffId])
  @@index([evaluationYear])
}
```

#### 3.2.6 Contract Management Model (New)
```prisma
model StaffContract {
  id              String   @id @default(cuid())
  staffId         String
  contractType    String   // Permanent, Contract, Part-time, Visiting
  startDate       DateTime
  endDate         DateTime?
  probationPeriod Int      @default(0) // in days
  salary          Float
  terms           String?  // JSON or text
  documentPath    String?
  status          String   @default("Active") // Active, Expired, Terminated, Renewed
  renewalDate     DateTime?
  remarks         String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  staff           Staff    @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@index([staffId])
  @@index([status])
  @@index([endDate])
}
```

#### 3.2.7 Payroll Details Enhancement
Add fields to existing `Payroll` model or create separate details table:

```prisma
model PayrollDetail {
  id              String   @id @default(cuid())
  payrollId       String
  detailType      String   // Allowance, Deduction, Bonus
  categoryName    String   // Housing, Medical, EOBI, Tax, etc.
  amount          Float
  description     String?
  isPercentage    Boolean  @default(false)
  percentageOf    Float?   // if percentage of basic
  createdAt       DateTime @default(now())

  payroll         Payroll  @relation(fields: [payrollId], references: [id], onDelete: Cascade)

  @@index([payrollId])
  @@index([detailType])
}
```

#### 3.2.8 Subject Assignment Model (Enhanced)
```prisma
model StaffSubject {
  id              String   @id @default(cuid())
  staffId         String
  subjectId       String
  classId         String?
  sectionId       String?
  academicYearId  String?
  isPrimary       Boolean  @default(false)
  workloadHours   Float?   // Weekly hours
  expertiseLevel  String?  // Expert, Proficient, Basic
  assignedDate    DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  staff           Staff    @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@index([staffId])
  @@index([subjectId])
  @@index([academicYearId])
}
```

### 3.3 Schema Migration Strategy
1. Create migration files for new models
2. Migrate existing data to new structure
3. Add indexes for performance
4. Update foreign key constraints
5. Create views for complex queries

---

## 4. API Endpoint Specifications

### 4.1 Staff Directory & Profile APIs

#### GET /api/staff
**Description:** List all staff with filters and pagination

**Query Parameters:**
- `search` (string) - Search term
- `departmentId` (string) - Filter by department
- `employmentType` (string) - Permanent, Contract, Part-time, Visiting
- `status` (string) - active, resigned, retired, terminated
- `designation` (string) - Filter by designation
- `page` (number) - Page number (default: 1)
- `limit` (number) - Records per page (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "staff": [
      {
        "id": "string",
        "employeeCode": "EMP-2024-001",
        "firstName": "string",
        "lastName": "string",
        "email": "string",
        "phone": "string",
        "cnicNumber": "xxxxx-xxxxxxx-x",
        "designation": "Senior Teacher",
        "department": {
          "id": "string",
          "name": "Science Department"
        },
        "employmentType": "Permanent",
        "status": "active",
        "joiningDate": "2020-01-15",
        "profilePhoto": "string"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 245,
      "totalPages": 5
    }
  }
}
```

#### GET /api/staff/:id
**Description:** Get detailed staff profile

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "employeeCode": "EMP-2024-001",
    "firstName": "string",
    "lastName": "string",
    "fullName": "string",
    "cnicNumber": "xxxxx-xxxxxxx-x",
    "dateOfBirth": "1985-05-15",
    "gender": "Male",
    "phone": "0300-1234567",
    "email": "staff@school.edu.pk",
    "address": "string",
    "city": "Lahore",
    "designation": "Senior Teacher",
    "department": {
      "id": "string",
      "name": "Science Department",
      "code": "SCI"
    },
    "employmentType": "Permanent",
    "joiningDate": "2020-01-15",
    "salary": 85000,
    "bankName": "HBL",
    "bankAccount": "1234-5678-9012",
    "qualifications": [...],
    "experience": [...],
    "documents": [...],
    "subjects": [...],
    "status": "active",
    "profilePhoto": "string",
    "createdAt": "2020-01-15T00:00:00Z",
    "updatedAt": "2024-01-15T00:00:00Z"
  }
}
```

#### POST /api/staff
**Description:** Create new staff member

**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "cnicNumber": "xxxxx-xxxxxxx-x",
  "dateOfBirth": "1985-05-15",
  "gender": "Male",
  "phone": "0300-1234567",
  "email": "staff@school.edu.pk",
  "designation": "Senior Teacher",
  "departmentId": "string",
  "qualification": "M.Sc. Physics",
  "experienceYears": 10,
  "joiningDate": "2024-01-15",
  "salary": 85000,
  "bankName": "HBL",
  "bankAccount": "1234-5678-9012",
  "address": "string",
  "city": "Lahore",
  "province": "Punjab",
  "employmentType": "Permanent",
  "subjectsTaught": ["Physics", "Mathematics"],
  "status": "active"
}
```

#### PUT /api/staff/:id
**Description:** Update staff member

**Request Body:** Same as POST (all fields optional)

#### DELETE /api/staff/:id
**Description:** Delete or deactivate staff member

**Response:**
```json
{
  "success": true,
  "message": "Staff member deactivated successfully"
}
```

### 4.2 Department Management APIs

#### GET /api/departments
**Description:** List all departments

#### POST /api/departments
**Description:** Create new department

#### PUT /api/departments/:id
**Description:** Update department

#### DELETE /api/departments/:id
**Description:** Delete department (if no staff assigned)

### 4.3 Staff Attendance APIs

#### GET /api/staff-attendance
**Description:** Get staff attendance records

**Query Parameters:**
- `staffId` (string) - Filter by staff
- `date` (string) - Specific date (YYYY-MM-DD)
- `fromDate` (string) - Range start
- `toDate` (string) - Range end
- `status` (string) - Present, Absent, Late, Half-day, Leave
- `page` (number)
- `limit` (number)

**Response:**
```json
{
  "success": true,
  "data": {
    "attendance": [
      {
        "id": "string",
        "staff": {
          "id": "string",
          "name": "string",
          "employeeCode": "EMP-2024-001"
        },
        "date": "2024-01-15",
        "checkInTime": "08:00:00",
        "checkOutTime": "14:00:00",
        "status": "Present",
        "markedBy": "admin@school.edu.pk",
        "remarks": null
      }
    ],
    "pagination": {...}
  }
}
```

#### POST /api/staff-attendance/mark
**Description:** Mark attendance for multiple staff

**Request Body:**
```json
{
  "date": "2024-01-15",
  "attendanceRecords": [
    {
      "staffId": "string",
      "status": "Present",
      "checkInTime": "08:00:00",
      "checkOutTime": "14:00:00",
      "remarks": null
    }
  ],
  "markedBy": "admin@school.edu.pk"
}
```

#### POST /api/staff-attendance/check-in
**Description:** Staff self check-in

**Request Body:**
```json
{
  "staffId": "string",
  "timestamp": "2024-01-15T08:00:00Z",
  "location": {
    "latitude": 31.5204,
    "longitude": 74.3587
  }
}
```

#### POST /api/staff-attendance/check-out
**Description:** Staff self check-out

**Request Body:** Same as check-in

### 4.4 Leave Management APIs

#### GET /api/leaves
**Description:** List leave applications

**Query Parameters:**
- `staffId` (string) - Filter by staff
- `status` (string) - Pending, Approved, Rejected
- `leaveType` (string) - Sick, Casual, Annual, etc.
- `fromDate` (string)
- `toDate` (string)
- `applicantType` (string) - Staff (for future student leaves)

#### POST /api/leaves
**Description:** Submit leave application

**Request Body:**
```json
{
  "applicantId": "string",
  "leaveType": "Sick",
  "fromDate": "2024-01-15",
  "toDate": "2024-01-16",
  "days": 2,
  "reason": "Fever and medical appointment",
  "attachments": ["path/to/medical.pdf"]
}
```

#### PUT /api/leaves/:id/approve
**Description:** Approve leave application

**Request Body:**
```json
{
  "approvedBy": "admin@school.edu.pk",
  "remarks": "Approved - Medical certificate verified"
}
```

#### PUT /api/leaves/:id/reject
**Description:** Reject leave application

**Request Body:**
```json
{
  "approvedBy": "admin@school.edu.pk",
  "remarks": "Insufficient leave balance"
}
```

#### GET /api/leaves/balance/:staffId
**Description:** Get leave balance for a staff member

**Query Parameters:**
- `year` (number) - Year (default: current year)

**Response:**
```json
{
  "success": true,
  "data": {
    "staffId": "string",
    "year": 2024,
    "balances": [
      {
        "leaveType": "Sick",
        "totalAllowed": 10,
        "used": 3,
        "balance": 7,
        "carryForward": 2
      },
      {
        "leaveType": "Casual",
        "totalAllowed": 10,
        "used": 5,
        "balance": 5,
        "carryForward": 0
      },
      {
        "leaveType": "Annual",
        "totalAllowed": 30,
        "used": 10,
        "balance": 20,
        "carryForward": 5
      }
    ]
  }
}
```

### 4.5 Payroll Management APIs

#### GET /api/payroll
**Description:** List payroll records

**Query Parameters:**
- `staffId` (string)
- `monthYear` (string) - YYYY-MM format
- `status` (string) - Pending, Processed, Paid
- `page` (number)
- `limit` (number)

#### POST /api/payroll/generate
**Description:** Generate monthly payroll for all or selected staff

**Request Body:**
```json
{
  "monthYear": "2024-01",
  "staffIds": ["string"], // Optional - null for all active staff
  "includeAllowances": true,
  "includeDeductions": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "monthYear": "2024-01",
    "generatedCount": 245,
    "totalAmount": 20825000,
    "payrollRecords": [...]
  }
}
```

#### GET /api/payroll/:id
**Description:** Get detailed payroll record

#### PUT /api/payroll/:id
**Description:** Update payroll record

**Request Body:**
```json
{
  "allowances": {
    "housing": 10000,
    "medical": 5000,
    "transport": 3000
  },
  "deductions": {
    "tax": 4500,
    "EOBI": 850,
    "advance": 0
  }
}
```

#### POST /api/payroll/:id/process
**Description:** Process and mark payroll as ready for payment

**Request Body:**
```json
{
  "processedBy": "finance@school.edu.pk"
}
```

#### POST /api/payroll/:id/pay
**Description:** Mark payroll as paid

**Request Body:**
```json
{
  "paymentDate": "2024-01-25",
  "paymentMode": "Bank Transfer",
  "transactionId": "TXN123456789",
  "paidBy": "finance@school.edu.pk"
}
```

#### GET /api/payroll/payslip/:id
**Description:** Generate and download payslip PDF

#### GET /api/payroll/summary/:monthYear
**Description:** Get payroll summary for a month

**Response:**
```json
{
  "success": true,
  "data": {
    "monthYear": "2024-01",
    "totalStaff": 245,
    "totalBasicSalary": 17850000,
    "totalAllowances": 2800000,
    "totalDeductions": 1825000,
    "grossSalary": 20650000,
    "netSalary": 18825000,
    "statusBreakdown": {
      "Pending": 0,
      "Processed": 50,
      "Paid": 195
    }
  }
}
```

### 4.6 Qualifications & Experience APIs

#### GET /api/staff/:id/qualifications
**Description:** Get staff qualifications

#### POST /api/staff/:id/qualifications
**Description:** Add qualification

#### PUT /api/staff/qualifications/:id
**Description:** Update qualification

#### DELETE /api/staff/qualifications/:id
**Description:** Delete qualification

#### GET /api/staff/:id/experience
**Description:** Get staff work experience

#### POST /api/staff/:id/experience
**Description:** Add work experience

#### PUT /api/staff/experience/:id
**Description:** Update work experience

#### DELETE /api/staff/experience/:id
**Description:** Delete work experience

### 4.7 Document Management APIs

#### GET /api/staff/:id/documents
**Description:** List staff documents

#### POST /api/staff/:id/documents
**Description:** Upload staff document

**Request:** multipart/form-data with file and metadata

#### DELETE /api/staff/documents/:id
**Description:** Delete document

#### GET /api/staff/documents/:id/download
**Description:** Download document

### 4.8 Performance Evaluation APIs

#### GET /api/staff/:id/performance
**Description:** Get performance history

#### POST /api/staff/:id/performance
**Description:** Create performance evaluation

**Request Body:**
```json
{
  "evaluationYear": 2024,
  "evaluationPeriod": "Annual",
  "selfScore": 85,
  "supervisorScore": 82,
  "studentScore": 88,
  "strengths": ["Strong subject knowledge", "Good classroom management"],
  "weaknesses": ["Needs improvement in documentation"],
  "goals": ["Complete B.Ed. course", "Attend ICT training"],
  "evaluatorId": "string"
}
```

#### PUT /api/staff/performance/:id/approve
**Description:** Approve performance evaluation

### 4.9 Subject Assignment APIs

#### GET /api/staff/:id/subjects
**Description:** Get assigned subjects

#### POST /api/staff/:id/subjects
**Description:** Assign subject to staff

**Request Body:**
```json
{
  "subjectId": "string",
  "classId": "string",
  "sectionId": "string",
  "academicYearId": "string",
  "isPrimary": false,
  "workloadHours": 6,
  "expertiseLevel": "Expert"
}
```

#### DELETE /api/staff/subjects/:id
**Description:** Remove subject assignment

### 4.10 Contract Management APIs

#### GET /api/staff/:id/contracts
**Description:** Get staff contracts

#### POST /api/staff/:id/contracts
**Description:** Create new contract

**Request Body:**
```json
{
  "contractType": "Contract",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "probationPeriod": 90,
  "salary": 75000,
  "terms": "Contract terms and conditions..."
}
```

#### PUT /api/staff/contracts/:id
**Description:** Update contract

#### POST /api/staff/contracts/:id/renew
**Description:** Renew contract

### 4.11 Statistics & Reports APIs

#### GET /api/staff/stats
**Description:** Get staff statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStaff": 245,
    "activeStaff": 230,
    "byEmploymentType": {
      "Permanent": 150,
      "Contract": 60,
      "Part-time": 25,
      "Visiting": 10
    },
    "byDepartment": {
      "Science": 45,
      "Arts": 38,
      "Commerce": 32,
      "Admin": 25,
      "Sports": 15
    },
    "byStatus": {
      "active": 230,
      "resigned": 8,
      "retired": 5,
      "terminated": 2
    },
    "newThisMonth": 5
  }
}
```

#### GET /api/staff/attendance/report
**Description:** Generate attendance report

**Query Parameters:**
- `staffId` (string) - Optional
- `fromDate` (string)
- `toDate` (string)
- `departmentId` (string) - Optional

#### GET /api/staff/leave/report
**Description:** Generate leave report

#### GET /api/staff/payroll/report
**Description:** Generate payroll report

---

## 5. UI/UX Component Requirements

### 5.1 Staff Directory Page

**Components Required:**
1. **PageHeader** - Title and breadcrumbs
2. **StatsCards** - 4-5 summary cards
   - Total Staff
   - Active Staff
   - New Hires (this month)
   - Staff on Leave
3. **FilterSection**
   - Search input (name, employee code, CNIC)
   - Department dropdown
   - Employment type dropdown
   - Status dropdown
   - Designation dropdown
4. **StaffTable**
   - Columns: Employee Code, Name, Department, Designation, Employment Type, Phone, Status, Actions
   - Row actions: View, Edit, Delete, More options
   - Pagination
5. **QuickActionButtons**
   - Add Staff
   - Export Data
   - Print Directory

### 5.2 Staff Registration/Form Page

**Components Required:**
1. **MultiStepForm**
   - Step 1: Personal Information
   - Step 2: Contact Information
   - Step 3: Employment Details
   - Step 4: Bank Details
   - Step 5: Documents Upload
   - Step 6: Review & Submit

2. **Form Fields**
   - Personal: First Name, Last Name, Father Name, CNIC (with validation), Date of Birth, Gender, Blood Group, Religion, Marital Status
   - Contact: Phone, Alternate Phone, Email, Address, City, Province, Postal Code
   - Employment: Department, Designation, Employment Type, Joining Date, Qualification, Experience Years, Subjects Taught, Contract Details
   - Bank: Bank Name, Account Number, Account Title
   - Emergency: Emergency Contact Name, Relationship, Phone

3. **DocumentUpload**
   - CNIC Front/Back
   - Educational Certificates
   - Experience Letters
   - Photograph
   - Police Verification (if required)

4. **FormValidation** - Real-time validation with error messages

### 5.3 Staff Profile Page

**Components Required:**
1. **ProfileHeader**
   - Profile photo
   - Name, Designation, Employee Code
   - Status badge
   - Edit button

2. **ProfileTabs**
   - Personal Info
   - Employment
   - Qualifications
   - Experience
   - Documents
   - Attendance
   - Leaves
   - Payroll
   - Performance
   - Subjects

3. **InfoCards** - Display sections as cards
   - Personal Information Card
   - Contact Information Card
   - Employment Details Card
   - Bank Details Card

4. **QualificationsList**
   - Table or cards showing degrees
   - Add/Edit/Delete buttons
   - Document preview

5. **ExperienceTimeline**
   - Timeline view of work history
   - Current employment highlighted

6. **DocumentsGrid**
   - Grid of uploaded documents
   - Document type, name, upload date, expiry date
   - Download, Delete buttons
   - Verification status

### 5.4 Attendance Management Page

**Components Required:**
1. **DateSelector** - Calendar date picker
2. **DepartmentFilter** - Select department
3. **AttendanceTable**
   - Staff list with checkboxes
   - Status buttons: Present, Absent, Late, Half-day, Leave
   - Check-in/Check-out time inputs
   - Remarks field

4. **QuickActions**
   - Mark All Present
   - Mark All Absent
   - Load Previous Day
   - Save Attendance

5. **StatsCards**
   - Total Staff
   - Present Count
   - Absent Count
   - Late Count
   - Half-day Count
   - Attendance Percentage

6. **SelfCheckInWidget** (for staff)
   - Check-in button with timestamp
   - Check-out button
   - Location display

### 5.5 Leave Management Page

**Components Required:**
1. **LeaveBalanceCards**
   - Card for each leave type
   - Shows: Total, Used, Balance
   - Visual progress bar

2. **LeaveApplicationForm**
   - Leave Type dropdown
   - Date range picker
   - Reason textarea
   - Document upload (for medical/emergency)
   - Submit button

3. **LeaveApplicationsTable**
   - Columns: Staff Name, Leave Type, From, To, Days, Reason, Status, Applied Date, Actions
   - Status badges: Pending (Yellow), Approved (Green), Rejected (Red)

4. **LeaveApprovalDialog**
   - Application details
   - Approve/Reject buttons
   - Remarks field

5. **LeaveCalendar**
   - Calendar view showing leaves
   - Color-coded by leave type
   - Filter by department/staff

### 5.6 Payroll Management Page

**Components Required:**
1. **MonthYearSelector** - Select month and year
2. **PayrollStats**
   - Total Staff
   - Total Payable Amount
   - Status Summary

3. **PayrollTable**
   - Columns: Staff Name, Employee Code, Basic Salary, Allowances, Deductions, Gross, Net, Status, Actions
   - Row actions: View, Edit, Process, Pay, Generate Payslip

4. **PayrollGenerationDialog**
   - Select month/year
   - Filter by department/employment type
   - Preview before generation
   - Generate button

5. **PayslipViewer**
   - Preview payslip in PDF
   - Download button
   - Email button
   - Print button

6. **PayrollEditor**
   - Edit allowances
   - Edit deductions
   - Add custom allowances/deductions
   - Auto-recalculate

7. **Allowance/DeductionManager**
   - Predefined allowance types
   - Predefined deduction types
   - Amount or percentage configuration
   - Applicability rules

### 5.7 Performance Evaluation Page

**Components Required:**
1. **EvaluationYearSelector**
2. **PerformanceForm**
   - Self-assessment section
   - Supervisor evaluation section
   - Scoring inputs (sliders or number inputs)
   - Strengths/Weaknesses tags
   - Goals text area
   - Comments section

3. **PerformanceHistoryTable**
   - Columns: Year, Period, Rating, Score, Evaluator, Actions

4. **PerformanceChart**
   - Line chart showing performance over time
   - Comparison with previous evaluations

5. **RatingSummary**
   - Distribution of ratings (Excellent, Good, etc.)
   - Department-wise comparison

### 5.8 Department Management Page

**Components Required:**
1. **DepartmentList** - Cards or table showing departments
2. **DepartmentForm** - Add/Edit department
3. **DepartmentStaffList** - Show staff in each department
4. **DepartmentStats** - Staff count, budget info

### 5.9 Reports & Analytics Page

**Components Required:**
1. **ReportTypeSelector**
   - Attendance Report
   - Leave Report
   - Payroll Report
   - Performance Report
   - Staff Directory

2. **FilterPanel**
   - Date range
   - Department
   - Employment type
   - Status

3. **ReportPreview**
   - Table or chart view
   - Summary statistics
   - Drill-down capability

4. **ExportOptions**
   - PDF
   - Excel
   - CSV
   - Print

5. **Charts**
   - Staff by department (pie chart)
   - Attendance trends (line chart)
   - Leave distribution (bar chart)
   - Payroll distribution (stacked bar chart)

### 5.10 Common UI Components

1. **SearchableDropdown** - For large dropdown lists
2. **DatePicker** - Custom date picker with Pakistani calendar support
3. **FileUpload** - Drag and drop file upload with preview
4. **DataTable** - Sortable, filterable, paginated table
5. **StatusBadge** - Color-coded status indicators
6. **ActionMenu** - Dropdown menu with actions
7. **ConfirmDialog** - Confirmation dialogs for critical actions
8. **ToastNotifications** - Success/error notifications
9. **LoadingStates** - Skeleton loaders, spinners
10. **EmptyStates** - Friendly empty state messages

---

## 6. Implementation Steps

### Phase 1: Foundation (Week 1-2)

#### Step 1.1: Database Schema Updates
- [ ] Create new Prisma models (StaffQualification, StaffExperience, StaffDocument, LeaveBalance, StaffPerformance, StaffContract, PayrollDetail, StaffSubject)
- [ ] Add required indexes for performance
- [ ] Create and run migrations
- [ ] Seed initial data (default leave types, departments)

#### Step 1.2: Core API Endpoints
- [ ] Implement Staff CRUD APIs
- [ ] Implement Department management APIs
- [ ] Implement Authentication middleware
- [ ] Implement role-based access control

#### Step 1.3: Base UI Components
- [ ] Set up staff module routes
- [ ] Create base layout
- [ ] Implement Staff Directory page with search/filter
- [ ] Implement Staff Registration form

**Deliverables:**
- Updated database schema
- Staff CRUD functionality
- Basic staff directory UI

### Phase 2: Attendance & Leave Management (Week 3-4)

#### Step 2.1: Attendance System
- [ ] Implement Staff Attendance APIs
- [ ] Create Attendance Management page
- [ ] Implement self check-in/check-out functionality
- [ ] Create attendance reports
- [ ] Add attendance calendar view

#### Step 2.2: Leave Management
- [ ] Implement Leave Application APIs
- [ ] Implement Leave Balance APIs
- [ ] Create Leave Application form
- [ ] Create Leave Approval workflow
- [ ] Implement leave calendar and reports
- [ ] Add leave balance tracking

**Deliverables:**
- Complete attendance system
- Leave management with approval workflow
- Attendance and leave reports

### Phase 3: Payroll System (Week 5-6)

#### Step 3.1: Payroll Configuration
- [ ] Implement Payroll Detail APIs
- [ ] Create Allowance/Deduction management
- [ ] Configure Pakistani tax slabs
- [ ] Configure EOBI rates

#### Step 3.2: Payroll Generation
- [ ] Implement Payroll Generation API
- [ ] Create Payroll Management page
- [ ] Implement bulk payroll generation
- [ ] Add individual payroll editing

#### Step 3.3: Payslip Generation
- [ ] Implement Payslip PDF generation
- [ ] Create Payslip viewer
- [ ] Add email payslip functionality
- [ ] Add print payslip option

**Deliverables:**
- Complete payroll system
- Payslip generation and distribution
- Payroll reports

### Phase 4: Qualifications, Documents & Performance (Week 7-8)

#### Step 4.1: Qualifications & Experience
- [ ] Implement Qualification APIs
- [ ] Implement Experience APIs
- [ ] Create Qualification management UI
- [ ] Create Experience timeline UI

#### Step 4.2: Document Management
- [ ] Implement Document APIs
- [ ] Create Document upload interface
- [ ] Add document verification workflow
- [ ] Implement document expiry alerts

#### Step 4.3: Performance Evaluation
- [ ] Implement Performance APIs
- [ ] Create Performance Evaluation form
- [ ] Create Performance history view
- [ ] Add performance charts

**Deliverables:**
- Complete staff profile with qualifications
- Document management system
- Performance evaluation system

### Phase 5: Advanced Features (Week 9-10)

#### Step 5.1: Contract Management
- [ ] Implement Contract APIs
- [ ] Create Contract management UI
- [ ] Add contract expiry alerts
- [ ] Implement contract renewal workflow

#### Step 5.2: Subject Assignment
- [ ] Implement Subject Assignment APIs
- [ ] Create Subject management UI
- [ ] Add workload calculation
- [ ] Create teacher-subject matrix

#### Step 5.3: Reports & Analytics
- [ ] Implement Statistics APIs
- [ ] Create comprehensive reports
- [ ] Add analytics dashboards
- [ ] Implement export functionality

**Deliverables:**
- Contract management
- Subject assignment system
- Reports and analytics

### Phase 6: Pakistani-Specific Features (Week 11)

#### Step 6.1: Pakistani Compliance
- [ ] Implement CNIC validation (13-digit format with dashes)
- [ ] Add Pakistani tax calculation
- [ ] Implement EOBI contribution tracking
- [ ] Add Pakistani leave policies

#### Step 6.2: Localization
- [ ] Add Urdu language support (optional)
- [ ] Format dates in Pakistani format (DD-MM-YYYY)
- [ ] Use Pakistani currency formatting (Rs.)
- [ ] Add Pakistani holidays calendar

**Deliverables:**
- Full Pakistani compliance
- Localized UI elements

### Phase 7: Testing & Optimization (Week 12)

#### Step 7.1: Testing
- [ ] Unit tests for all API endpoints
- [ ] Integration tests for workflows
- [ ] UI component testing
- [ ] Load testing for 2,000+ staff

#### Step 7.2: Performance Optimization
- [ ] Optimize database queries
- [ ] Add caching where appropriate
- [ ] Implement pagination for all large datasets
- [ ] Optimize file uploads

#### Step 7.3: Security Audit
- [ ] Review authentication and authorization
- [ ] Validate all inputs
- [ ] Implement rate limiting
- [ ] Add audit logging

**Deliverables:**
- Tested and optimized system
- Security hardening

### Phase 8: Documentation & Deployment (Week 13-14)

#### Step 8.1: Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] User guide for administrators
- [ ] User guide for staff
- [ ] Technical documentation

#### Step 8.2: Deployment
- [ ] Prepare production build
- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Deploy to production
- [ ] Monitor initial performance

**Deliverables:**
- Complete documentation
- Production-ready deployment

---

## 7. Pakistani-Specific Features

### 7.1 CNIC Management

**CNIC Format:** XXXXX-XXXXXXX-X (13 digits with dashes)

**Implementation:**
```typescript
// CNIC Validation
function validateCNIC(cnic: string): boolean {
  const cnicRegex = /^\d{5}-\d{7}-\d{1}$/
  return cnicRegex.test(cnic)
}

// CNIC Formatting
function formatCNIC(cnic: string): string {
  const cleaned = cnic.replace(/\D/g, '')
  if (cleaned.length !== 13) return cnic
  return `${cleaned.slice(0,5)}-${cleaned.slice(5,12)}-${cleaned.slice(12)}`
}
```

**Features:**
- CNIC validation on registration
- CNIC formatting for display
- CNIC uniqueness check
- CNIC expiry tracking (for staff ID cards)
- CNIC-based duplicate detection

### 7.2 Pakistani Tax Calculation

**Tax Slabs (FY 2024-25):**

| Monthly Salary Range | Tax Rate |
|---------------------|----------|
| Up to Rs. 50,000 | 0% |
| Rs. 50,001 - 100,000 | 5% of amount exceeding Rs. 50,000 |
| Rs. 100,001 - 200,000 | Rs. 2,500 + 15% of amount exceeding Rs. 100,000 |
| Rs. 200,001 - 400,000 | Rs. 17,500 + 25% of amount exceeding Rs. 200,000 |
| Rs. 400,001 - 800,000 | Rs. 67,500 + 30% of amount exceeding Rs. 400,000 |
| Above Rs. 800,000 | Rs. 187,500 + 35% of amount exceeding Rs. 800,000 |

**Implementation:**
```typescript
interface TaxSlab {
  minSalary: number
  maxSalary: number | null
  fixedTax: number
  rate: number
}

const taxSlabs: TaxSlab[] = [
  { minSalary: 0, maxSalary: 50000, fixedTax: 0, rate: 0 },
  { minSalary: 50001, maxSalary: 100000, fixedTax: 0, rate: 0.05 },
  { minSalary: 100001, maxSalary: 200000, fixedTax: 2500, rate: 0.15 },
  { minSalary: 200001, maxSalary: 400000, fixedTax: 17500, rate: 0.25 },
  { minSalary: 400001, maxSalary: 800000, fixedTax: 67500, rate: 0.30 },
  { minSalary: 800001, maxSalary: null, fixedTax: 187500, rate: 0.35 },
]

function calculateMonthlyTax(grossSalary: number): number {
  for (const slab of taxSlabs) {
    if (grossSalary >= slab.minSalary && (slab.maxSalary === null || grossSalary <= slab.maxSalary)) {
      const taxableAmount = grossSalary - slab.minSalary
      return slab.fixedTax + (taxableAmount * slab.rate)
    }
  }
  return 0
}
```

### 7.3 EOBI (Employees' Old-Age Benefits Institution)

**EOBI Contribution Rates:**
- Employee contribution: 1% of minimum wages
- Employer contribution: 5% of minimum wages
- Minimum wages (2024): Rs. 32,000/month

**Implementation:**
```typescript
const EOBI_EMPLOYEE_RATE = 0.01 // 1%
const EOBI_EMPLOYER_RATE = 0.05 // 5%
const MINIMUM_WAGES = 32000

function calculateEOBI(salary: number): {
  employeeContribution: number
  employerContribution: number
  total: number
} {
  const baseAmount = Math.min(salary, MINIMUM_WAGES)
  return {
    employeeContribution: baseAmount * EOBI_EMPLOYEE_RATE,
    employerContribution: baseAmount * EOBI_EMPLOYER_RATE,
    total: baseAmount * (EOBI_EMPLOYEE_RATE + EOBI_EMPLOYER_RATE),
  }
}
```

### 7.4 Pakistani Leave Policies

**Leave Entitlements:**

| Leave Type | Days Per Year | Notes |
|------------|---------------|-------|
| Casual Leave (CL) | 10 | Cannot be accumulated |
| Sick Leave (SL) | 10 | Medical certificate required after 3 days |
| Earned/Annual Leave | 30 days (after 1 year) | Can be accumulated up to 60 days |
| Maternity Leave | 90 days | As per labor law |
| Paternity Leave | 7 days | For male staff |
| Hajj Leave | 18 days | Once during service |
| Emergency Leave | As per approval | Without pay |

**Leave Encashment:**
- Unutilized annual leave can be encashed at the time of retirement/resignation
- Encashment calculation: (Basic Salary / 30) × Unutilized Days

### 7.5 Pakistani Allowances

**Common Allowances:**

1. **House Rent Allowance (HRA)**
   - Typically 40-50% of basic salary
   - May vary by city (higher in Karachi, Lahore, Islamabad)

2. **Medical Allowance**
   - Fixed amount or percentage
   - Typically Rs. 2,000-5,000/month

3. **Transport Allowance**
   - For commuting
   - Typically Rs. 1,000-3,000/month

4. **Utility Allowance**
   - Electricity, gas, water
   - Fixed amount based on grade

5. **Special Allowance**
   - For specialized roles
   - Subject/department specific

6. **Academic Allowance**
   - For teachers with higher qualifications (M.Phil, PhD)
   - Fixed amount per qualification

**Implementation:**
```typescript
interface AllowanceConfig {
  name: string
  type: 'fixed' | 'percentage'
  value: number
  percentageOf?: 'basic' | 'gross'
  applicableTo?: string[] // employment types, departments, etc.
}

const allowanceConfigs: AllowanceConfig[] = [
  {
    name: 'House Rent',
    type: 'percentage',
    value: 45,
    percentageOf: 'basic',
  },
  {
    name: 'Medical',
    type: 'fixed',
    value: 3000,
  },
  {
    name: 'Transport',
    type: 'fixed',
    value: 2000,
  },
  {
    name: 'Academic (PhD)',
    type: 'fixed',
    value: 10000,
    applicableTo: ['staff_with_phd'],
  },
]
```

### 7.6 Pakistani Deductions

**Common Deductions:**

1. **Income Tax**
   - As per FBR slabs
   - Calculated on gross salary

2. **EOBI**
   - 1% of minimum wages

3. **GP Fund (General Provident Fund)**
   - Optional savings scheme
   - Typically 10% of basic salary
   - Matching contribution from employer

4. **Welfare Fund**
   - Fixed amount (e.g., Rs. 100/month)

5. **Advance Recovery**
   - Loan/advance installments

6. **Absenteeism Deduction**
   - Per day deduction based on salary

### 7.7 Pakistani Academic Qualifications

**Qualification Levels:**
- Matriculation (SSC) - 10 years
- Intermediate (HSSC) - 12 years
- Bachelor's (BA/BSc/B.Com/B.Ed) - 14 years
- Master's (MA/MSc/M.Com/M.Ed) - 16 years
- M.Phil - 18 years
- PhD - 20+ years

**Teaching Certifications:**
- B.Ed (Bachelor of Education)
- M.Ed (Master of Education)
- CT (Certificate in Teaching)
- PTC (Primary Teaching Certificate)
- Montessori Training

### 7.8 Pakistani Board Systems

**Education Boards:**
- Punjab Board (BISE Lahore, Rawalpindi, etc.)
- Sindh Board (BISE Karachi, Hyderabad, etc.)
- KPK Board (BISE Peshawar, etc.)
- Balochistan Board (BISE Quetta, etc.)
- Federal Board (FBISE)

**Implementation:**
```typescript
const boards = {
  punjab: ['BISE Lahore', 'BISE Rawalpindi', 'BISE Faisalabad', 'BISE Multan', 'BISE Gujranwala', 'BISE Sargodha', 'BISE Sahiwal', 'BISE DG Khan'],
  sindh: ['BISE Karachi', 'BISE Hyderabad', 'BISE Sukkur', 'BISE Mirpurkhas', 'BISE Larkana'],
  kpk: ['BISE Peshawar', 'BISE Mardan', 'BISE Swat', 'BISE Abbottabad', 'BISE Malakand', 'BISE Kohat', 'BISE Bannu', 'BISE D.I.Khan'],
  balochistan: ['BISE Quetta', 'BISE Turbat'],
  federal: ['FBISE Islamabad'],
  cambridge: ['Cambridge International'],
}
```

### 7.9 Pakistani Holidays Calendar

**Public Holidays:**
- Pakistan Day (March 23)
- Labor Day (May 1)
- Independence Day (August 14)
- Iqbal Day (November 9)
- Quaid-e-Azam Day (December 25)
- Eid-ul-Fitr (2-3 days)
- Eid-ul-Adha (3-4 days)
- Eid Milad-un-Nabi (12 Rabi-ul-Awwal)
- Ashura (9-10 Muharram)
- Ramadan (variable)

**Implementation:**
```typescript
interface Holiday {
  name: string
  date: Date
  type: 'public' | 'religious' | 'school-specific'
  isOptional: boolean
}

// Load holidays from database or external API
async function getHolidays(year: number): Promise<Holiday[]> {
  // Fetch from database
  // Or integrate with Pakistani government holidays API
}
```

### 7.10 Pakistani Bank Integration

**Major Banks:**
- Habib Bank Limited (HBL)
- United Bank Limited (UBL)
- Muslim Commercial Bank (MCB)
- National Bank of Pakistan (NBP)
- Allied Bank Limited (ABL)
- Askari Bank
- Bank Alfalah
- Meezan Bank
- Faysal Bank

**Account Validation:**
```typescript
function validateBankAccount(accountNumber: string): boolean {
  // Remove spaces and dashes
  const cleaned = accountNumber.replace(/[\s-]/g, '')
  // Pakistani bank accounts are typically 13-16 digits
  return /^\d{13,16}$/.test(cleaned)
}

function formatBankAccount(accountNumber: string): string {
  const cleaned = accountNumber.replace(/\D/g, '')
  // Format as XXXX-XXXXXXX-X or similar
  if (cleaned.length === 16) {
    return `${cleaned.slice(0,4)}-${cleaned.slice(4,11)}-${cleaned.slice(11)}`
  }
  return cleaned
}
```

### 7.11 Pakistani Currency Formatting

```typescript
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
  // Output: Rs. 1,234,567
}

function formatCurrencyInWords(amount: number): string {
  // Convert number to words in English/Urdu
  // e.g., "One Lakh Twenty-Four Thousand Five Hundred Sixty-Seven Rupees"
}
```

### 7.12 Pakistani Date Format

```typescript
function formatDatePakistani(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}` // DD-MM-YYYY
}

function parsePakistaniDate(dateString: string): Date {
  const [day, month, year] = dateString.split('-')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}
```

---

## 8. Payroll Calculation Business Logic

### 8.1 Payroll Calculation Flow

```
Start
  ↓
Get Staff Basic Salary
  ↓
Calculate Allowances
  ↓
Calculate Gross Salary (Basic + Allowances)
  ↓
Calculate Deductions (Tax, EOBI, etc.)
  ↓
Calculate Net Salary (Gross - Deductions)
  ↓
Generate Payroll Record
  ↓
Create Payroll Details
  ↓
Generate Payslip
  ↓
End
```

### 8.2 Payroll Calculation Algorithm

```typescript
interface PayrollInput {
  staffId: string
  monthYear: string // YYYY-MM
  basicSalary: number
  employmentType: string
  qualifications: string[]
  attendance: {
    presentDays: number
    absentDays: number
    lateDays: number
    halfDays: number
  }
  leaves: {
    paid: number
    unpaid: number
  }
  customAllowances?: { [key: string]: number }
  customDeductions?: { [key: string]: number }
}

interface PayrollOutput {
  staffId: string
  monthYear: string
  basicSalary: number
  allowances: AllowanceBreakdown
  deductions: DeductionBreakdown
  grossSalary: number
  netSalary: number
  workingDays: number
  payableDays: number
}

interface AllowanceBreakdown {
  houseRent: number
  medical: number
  transport: number
  utility: number
  academic: number
  special: number
  total: number
}

interface DeductionBreakdown {
  incomeTax: number
  eoibi: number
  gpFund: number
  welfareFund: number
  advance: number
  absenteeism: number
  other: number
  total: number
}

async function calculatePayroll(input: PayrollInput): Promise<PayrollOutput> {
  // 1. Calculate payable days
  const workingDays = getWorkingDays(input.monthYear)
  const payableDays = calculatePayableDays(
    input.attendance,
    input.leaves,
    workingDays
  )

  // 2. Pro-rate basic salary if needed
  const proRatedBasic = proRateSalary(
    input.basicSalary,
    payableDays,
    workingDays
  )

  // 3. Calculate allowances
  const allowances = calculateAllowances(
    proRatedBasic,
    input.employmentType,
    input.qualifications,
    input.customAllowances
  )

  // 4. Calculate gross salary
  const grossSalary = proRatedBasic + allowances.total

  // 5. Calculate deductions
  const deductions = calculateDeductions(
    proRatedBasic,
    grossSalary,
    input.employmentType,
    input.attendance.absentDays,
    input.customDeductions
  )

  // 6. Calculate net salary
  const netSalary = grossSalary - deductions.total

  return {
    staffId: input.staffId,
    monthYear: input.monthYear,
    basicSalary: proRatedBasic,
    allowances,
    deductions,
    grossSalary,
    netSalary,
    workingDays,
    payableDays,
  }
}
```

### 8.3 Allowance Calculation

```typescript
function calculateAllowances(
  basicSalary: number,
  employmentType: string,
  qualifications: string[],
  custom?: { [key: string]: number }
): AllowanceBreakdown {
  const allowances: AllowanceBreakdown = {
    houseRent: 0,
    medical: 0,
    transport: 0,
    utility: 0,
    academic: 0,
    special: 0,
    total: 0,
  }

  // House Rent Allowance
  if (['Permanent', 'Contract'].includes(employmentType)) {
    allowances.houseRent = Math.round(basicSalary * 0.45) // 45% of basic
  }

  // Medical Allowance
  allowances.medical = 3000 // Fixed amount

  // Transport Allowance
  if (['Permanent', 'Contract'].includes(employmentType)) {
    allowances.transport = 2000 // Fixed amount
  }

  // Utility Allowance (for permanent staff)
  if (employmentType === 'Permanent') {
    allowances.utility = 1500 // Fixed amount
  }

  // Academic Allowance (based on qualifications)
  if (qualifications.includes('PhD')) {
    allowances.academic += 10000
  } else if (qualifications.includes('M.Phil')) {
    allowances.academic += 5000
  } else if (qualifications.includes('M.Ed') || qualifications.includes('Masters')) {
    allowances.academic += 2000
  }

  // Add custom allowances
  if (custom) {
    for (const [key, value] of Object.entries(custom)) {
      if (key === 'special') {
        allowances.special += value
      }
    }
  }

  // Calculate total
  allowances.total = allowances.houseRent +
                    allowances.medical +
                    allowances.transport +
                    allowances.utility +
                    allowances.academic +
                    allowances.special

  return allowances
}
```

### 8.4 Deduction Calculation

```typescript
function calculateDeductions(
  basicSalary: number,
  grossSalary: number,
  employmentType: string,
  absentDays: number,
  custom?: { [key: string]: number }
): DeductionBreakdown {
  const deductions: DeductionBreakdown = {
    incomeTax: 0,
    eoibi: 0,
    gpFund: 0,
    welfareFund: 0,
    advance: 0,
    absenteeism: 0,
    other: 0,
    total: 0,
  }

  // Income Tax (on gross salary)
  deductions.incomeTax = calculateMonthlyTax(grossSalary)

  // EOBI (1% of minimum wages)
  const eoibi = calculateEOBI(basicSalary)
  deductions.eoibi = eoibi.employeeContribution

  // GP Fund (optional, 10% of basic for permanent staff)
  if (employmentType === 'Permanent') {
    // Check if staff has opted for GP Fund
    // For now, assume all permanent staff participate
    deductions.gpFund = Math.round(basicSalary * 0.10)
  }

  // Welfare Fund
  deductions.welfareFund = 100 // Fixed amount

  // Absenteeism Deduction
  if (absentDays > 0) {
    const perDayDeduction = basicSalary / 30
    deductions.absenteeism = Math.round(perDayDeduction * absentDays)
  }

  // Add custom deductions
  if (custom) {
    for (const [key, value] of Object.entries(custom)) {
      if (key === 'advance') {
        deductions.advance += value
      } else {
        deductions.other += value
      }
    }
  }

  // Calculate total
  deductions.total = deductions.incomeTax +
                    deductions.eoibi +
                    deductions.gpFund +
                    deductions.welfareFund +
                    deductions.advance +
                    deductions.absenteeism +
                    deductions.other

  return deductions
}
```

### 8.5 Payable Days Calculation

```typescript
function calculatePayableDays(
  attendance: {
    presentDays: number
    absentDays: number
    lateDays: number
    halfDays: number
  },
  leaves: {
    paid: number
    unpaid: number
  },
  workingDays: number
): number {
  // Present days count fully
  let payableDays = attendance.presentDays

  // Late days (if less than threshold, count as full day)
  // Assuming late arrival up to 30 minutes is acceptable
  payableDays += attendance.lateDays

  // Half days count as 0.5
  payableDays += attendance.halfDays * 0.5

  // Paid leaves count fully
  payableDays += leaves.paid

  // Unpaid leaves don't count
  // (they result in salary deduction)

  return Math.min(payableDays, workingDays)
}

function getWorkingDays(monthYear: string): number {
  const [year, month] = monthYear.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()

  let workingDays = 0
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month - 1, day)
    const dayOfWeek = currentDate.getDay()
    // Sunday = 0, Saturday = 6 (assuming 6-day work week in Pakistan)
    if (dayOfWeek !== 0) { // Not Sunday
      workingDays++
    }
  }

  return workingDays
}
```

### 8.6 Pro-Rating Salary

```typescript
function proRateSalary(
  fullSalary: number,
  payableDays: number,
  workingDays: number
): number {
  if (payableDays >= workingDays) {
    return fullSalary
  }
  return Math.round((fullSalary / workingDays) * payableDays)
}
```

### 8.7 Bulk Payroll Generation

```typescript
async function generateBulkPayroll(
  monthYear: string,
  staffIds?: string[]
): Promise<PayrollOutput[]> {
  // Get all active staff or selected staff
  const staff = await db.staff.findMany({
    where: {
      id: staffIds ? { in: staffIds } : undefined,
      status: 'active',
    },
    include: {
      qualifications: true,
      documents: true,
      staffAttendance: {
        where: {
          date: {
            gte: new Date(`${monthYear}-01`),
            lt: new Date(`${monthYear}-01`).addMonths(1),
          },
        },
      },
      leaveApplications: {
        where: {
          fromDate: {
            gte: new Date(`${monthYear}-01`),
            lt: new Date(`${monthYear}-01`).addMonths(1),
          },
          status: 'Approved',
        },
      },
    },
  })

  const payrollRecords: PayrollOutput[] = []

  for (const member of staff) {
    // Calculate attendance summary
    const attendanceSummary = calculateAttendanceSummary(member.staffAttendance)

    // Calculate leave summary
    const leaveSummary = calculateLeaveSummary(member.leaveApplications)

    // Get qualifications list
    const qualifications = member.qualifications.map(q => q.degree)

    // Calculate payroll
    const payroll = await calculatePayroll({
      staffId: member.id,
      monthYear,
      basicSalary: member.salary || 0,
      employmentType: member.employmentType,
      qualifications,
      attendance: attendanceSummary,
      leaves: leaveSummary,
    })

    payrollRecords.push(payroll)

    // Save to database
    await db.payroll.create({
      data: {
        staffId: member.id,
        monthYear,
        basicSalary: payroll.basicSalary,
        allowances: JSON.stringify(payroll.allowances),
        deductions: JSON.stringify(payroll.deductions),
        grossSalary: payroll.grossSalary,
        netSalary: payroll.netSalary,
        status: 'Pending',
      },
    })
  }

  return payrollRecords
}

function calculateAttendanceSummary(attendance: any[]): {
  presentDays: number
  absentDays: number
  lateDays: number
  halfDays: number
} {
  const summary = {
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    halfDays: 0,
  }

  for (const record of attendance) {
    switch (record.status) {
      case 'Present':
        summary.presentDays++
        break
      case 'Absent':
        summary.absentDays++
        break
      case 'Late':
        summary.lateDays++
        break
      case 'Half-day':
        summary.halfDays++
        break
    }
  }

  return summary
}

function calculateLeaveSummary(leaves: any[]): {
  paid: number
  unpaid: number
} {
  const summary = {
    paid: 0,
    unpaid: 0,
  }

  for (const leave of leaves) {
    // Assuming paid leaves are Sick, Casual, Annual, Maternity, Paternity
    // Unpaid leaves are Emergency (if not covered)
    const paidLeaveTypes = ['Sick', 'Casual', 'Annual', 'Maternity', 'Paternity']
    if (paidLeaveTypes.includes(leave.leaveType)) {
      summary.paid += leave.days
    } else {
      summary.unpaid += leave.days
    }
  }

  return summary
}
```

### 8.8 Payslip Generation

```typescript
interface PayslipData {
  school: {
    name: string
    address: string
    phone: string
    logo: string
  }
  staff: {
    name: string
    employeeCode: string
    cnic: string
    designation: string
    department: string
    bankName: string
    bankAccount: string
  }
  payroll: PayrollOutput
  monthYear: string
  paymentDate: Date
}

async function generatePayslipPDF(data: PayslipData): Promise<Buffer> {
  // Use PDF generation library (e.g., pdfkit, puppeteer, react-pdf)
  // Create professional payslip layout

  const payslipContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .logo { width: 80px; height: 80px; }
          .school-name { font-size: 24px; font-weight: bold; }
          .section { margin: 20px 0; }
          .section-title { font-weight: bold; background: #f0f0f0; padding: 5px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #4CAF50; color: white; }
          .total { font-weight: bold; background: #e0e0e0; }
          .footer { margin-top: 20px; font-size: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${data.school.logo}" class="logo">
          <div class="school-name">${data.school.name}</div>
          <div>${data.school.address}</div>
          <div>Phone: ${data.school.phone}</div>
          <h2>Payslip for ${formatMonthYear(data.monthYear)}</h2>
        </div>

        <div class="section">
          <div class="section-title">Employee Details</div>
          <table>
            <tr><th>Name</th><td>${data.staff.name}</td></tr>
            <tr><th>Employee Code</th><td>${data.staff.employeeCode}</td></tr>
            <tr><th>CNIC</th><td>${data.staff.cnic}</td></tr>
            <tr><th>Designation</th><td>${data.staff.designation}</td></tr>
            <tr><th>Department</th><td>${data.staff.department}</td></tr>
            <tr><th>Bank</th><td>${data.staff.bankName} - ${data.staff.bankAccount}</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Earnings</div>
          <table>
            <tr><th>Description</th><th>Amount (Rs.)</th></tr>
            <tr><td>Basic Salary</td><td>${formatCurrency(data.payroll.basicSalary)}</td></tr>
            <tr><td>House Rent Allowance</td><td>${formatCurrency(data.payroll.allowances.houseRent)}</td></tr>
            <tr><td>Medical Allowance</td><td>${formatCurrency(data.payroll.allowances.medical)}</td></tr>
            <tr><td>Transport Allowance</td><td>${formatCurrency(data.payroll.allowances.transport)}</td></tr>
            <tr><td>Utility Allowance</td><td>${formatCurrency(data.payroll.allowances.utility)}</td></tr>
            <tr><td>Academic Allowance</td><td>${formatCurrency(data.payroll.allowances.academic)}</td></tr>
            <tr><td>Special Allowance</td><td>${formatCurrency(data.payroll.allowances.special)}</td></tr>
            <tr class="total"><td>Gross Salary</td><td>${formatCurrency(data.payroll.grossSalary)}</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Deductions</div>
          <table>
            <tr><th>Description</th><th>Amount (Rs.)</th></tr>
            <tr><td>Income Tax</td><td>${formatCurrency(data.payroll.deductions.incomeTax)}</td></tr>
            <tr><td>EOBI</td><td>${formatCurrency(data.payroll.deductions.eoibi)}</td></tr>
            <tr><td>GP Fund</td><td>${formatCurrency(data.payroll.deductions.gpFund)}</td></tr>
            <tr><td>Welfare Fund</td><td>${formatCurrency(data.payroll.deductions.welfareFund)}</td></tr>
            <tr><td>Advance Recovery</td><td>${formatCurrency(data.payroll.deductions.advance)}</td></tr>
            <tr><td>Absenteeism Deduction</td><td>${formatCurrency(data.payroll.deductions.absenteeism)}</td></tr>
            <tr><td>Other Deductions</td><td>${formatCurrency(data.payroll.deductions.other)}</td></tr>
            <tr class="total"><td>Total Deductions</td><td>${formatCurrency(data.payroll.deductions.total)}</td></tr>
          </table>
        </div>

        <div class="section">
          <table>
            <tr class="total" style="font-size: 18px;">
              <td>Net Salary Payable</td>
              <td style="font-size: 18px;">${formatCurrency(data.payroll.netSalary)}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <table>
            <tr><th>Working Days</th><td>${data.payroll.workingDays}</td></tr>
            <tr><th>Payable Days</th><td>${data.payroll.payableDays}</td></tr>
            <tr><th>Payment Date</th><td>${formatDatePakistani(data.paymentDate)}</td></tr>
          </table>
        </div>

        <div class="footer">
          <p>This is a computer-generated payslip. No signature required.</p>
          <p>Generated on ${formatDatePakistani(new Date())}</p>
        </div>
      </body>
    </html>
  `

  // Convert HTML to PDF using puppeteer or similar
  return await generatePDF(payslipContent)
}
```

---

## 9. Security & Permissions

### 9.1 Role-Based Access Control (RBAC)

**Roles:**
1. **Super Admin** - Full access to all features
2. **Principal** - View all, approve leaves, view payroll
3. **HR Manager** - Full HR access, payroll processing
4. **HR Staff** - Staff management, attendance, leaves
5. **Finance Manager** - Payroll processing and approval
6. **Finance Staff** - Payroll generation
7. **Department Head** - View department staff, approve leaves
8. **Staff Member** - View own profile, mark attendance, apply for leave, view payslip

**Permissions Matrix:**

| Feature | Super Admin | Principal | HR Manager | HR Staff | Finance | Dept Head | Staff |
|---------|-------------|-----------|------------|----------|---------|-----------|-------|
| View Staff Directory | ✅ | ✅ | ✅ | ✅ | ✅ | Dept Only | Own |
| Add/Edit Staff | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Staff | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Departments | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Mark Attendance | ✅ | ✅ | ✅ | ✅ | ❌ | Dept Only | Own |
| View All Attendance | ✅ | ✅ | ✅ | ✅ | ❌ | Dept Only | Own |
| Apply for Leave | N/A | N/A | N/A | N/A | N/A | N/A | ✅ |
| Approve Leaves | ✅ | ✅ | ✅ | ✅ | ❌ | Dept Only | ❌ |
| View All Leaves | ✅ | ✅ | ✅ | ✅ | ❌ | Dept Only | Own |
| Generate Payroll | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Process Payroll | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| View All Payroll | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | Own |
| Manage Allowances/Deductions | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| View Performance | ✅ | ✅ | ✅ | ✅ | ❌ | Dept Only | Own |
| Evaluate Performance | ✅ | ✅ | ✅ | ✅ | ❌ | Dept Only | Self |
| Manage Documents | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | Own |
| View Reports | ✅ | ✅ | ✅ | ✅ | ✅ | Dept Only | ❌ |

### 9.2 API Security

**Authentication:**
- JWT tokens for API authentication
- Token refresh mechanism
- Secure token storage (httpOnly cookies)

**Authorization:**
- Role-based middleware for protected routes
- Resource-level authorization (e.g., department head can only access their department)

**Input Validation:**
- Zod schemas for request validation
- SQL injection prevention (Prisma handles this)
- XSS prevention
- CSRF protection

**Rate Limiting:**
- Implement rate limiting for sensitive endpoints
- Prevent brute force attacks

**Audit Logging:**
```typescript
model AuditLog {
  id          String   @id @default(cuid())
  userId      String
  action      String   // CREATE, UPDATE, DELETE, VIEW
  entity      String   // Staff, Leave, Payroll, etc.
  entityId    String?
  details     String?  // JSON string
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([entity])
  @@index([createdAt])
}
```

### 9.3 Data Privacy

**Sensitive Data Protection:**
- Encrypt CNIC numbers in database
- Encrypt bank account details
- Secure file storage for documents
- Mask sensitive data in logs

**GDPR/Privacy Compliance:**
- Staff data export on request
- Staff data deletion on request
- Consent management
- Data retention policies

### 9.4 File Upload Security

**Document Validation:**
- File type validation (PDF, JPG, PNG only)
- File size limits (max 5MB)
- Virus scanning
- Secure file storage (not in public directory)

**Access Control:**
- Signed URLs for document access
- Time-limited access tokens
- Download logging

---

## 10. Performance Considerations

### 10.1 Database Optimization

**Indexing Strategy:**
```prisma
// Already optimized in schema
@@index([staffId, date])          // For attendance queries
@@index([monthYear, status])       // For payroll queries
@@index([staffId, leaveType, year]) // For leave balance queries
@@index([status])                  // For filtering active staff
```

**Query Optimization:**
- Use `select` instead of `include` when possible
- Implement pagination for all list endpoints
- Use `findMany` with `take` and `skip` for large datasets
- Consider using `cursor` based pagination for better performance

**Caching Strategy:**
- Cache frequently accessed data (departments, leave types)
- Cache staff directory with TTL
- Use Redis for session storage and caching

### 10.2 API Performance

**Response Time Targets:**
- Staff list (50 records): < 200ms
- Staff profile: < 100ms
- Attendance marking (bulk): < 500ms
- Payroll generation (per staff): < 100ms
- Bulk payroll (200 staff): < 30 seconds

**Optimizations:**
- Implement lazy loading for related data
- Use batch operations for bulk updates
- Implement connection pooling for database
- Use compression for large responses

### 10.3 Frontend Performance

**Optimization Strategies:**
- Code splitting for staff module routes
- Lazy load components
- Virtual scrolling for large lists (2,000+ staff)
- Debounce search inputs
- Implement optimistic UI updates
- Use memoization for expensive calculations

**Load Times:**
- Staff directory: < 2 seconds
- Staff profile: < 1 second
- Payroll generation: Show progress indicator

### 10.4 Scalability for 2,000+ Staff

**Database Considerations:**
- Partition large tables by year (attendance, payroll)
- Archive old data (resigned/retired staff)
- Implement soft deletes instead of hard deletes
- Regular database maintenance (vacuum, analyze)

**Application Considerations:**
- Implement background jobs for payroll generation
- Use message queues for email notifications
- Implement rate limiting for API endpoints
- Use CDN for static assets

---

## 11. Testing Strategy

### 11.1 Unit Testing

**API Endpoints:**
- Test all CRUD operations
- Test validation logic
- Test error handling
- Test authentication/authorization

**Business Logic:**
- Test payroll calculations
- Test tax calculations
- Test leave balance calculations
- Test attendance calculations
- Test CNIC validation
- Test date formatting

**Example Test:**
```typescript
describe('Payroll Calculation', () => {
  it('should calculate correct tax for salary Rs. 150,000', () => {
    const tax = calculateMonthlyTax(150000)
    expect(tax).toBe(10000) // 2500 + 15% of 50000
  })

  it('should calculate EOBI contribution', () => {
    const eoibi = calculateEOBI(50000)
    expect(eoibi.employeeContribution).toBe(320) // 1% of 32000
    expect(eoibi.employerContribution).toBe(1600) // 5% of 32000
  })
})
```

### 11.2 Integration Testing

**Workflows:**
- Staff registration → Profile creation → Document upload
- Leave application → Approval → Balance update
- Attendance marking → Monthly summary → Payroll calculation
- Payroll generation → Processing → Payment

**Database Integration:**
- Test database transactions
- Test rollback on errors
- Test concurrent requests

### 11.3 End-to-End Testing

**User Flows:**
- HR manager registering a new staff member
- Staff member applying for leave
- Department head approving leave
- Finance manager generating payroll
- Staff member viewing payslip

**Tools:** Playwright, Cypress

### 11.4 Performance Testing

**Load Testing:**
- Test with 2,000+ staff records
- Test bulk payroll generation (200+ staff)
- Test concurrent attendance marking
- Test concurrent leave applications

**Tools:** k6, JMeter, Artillery

**Performance Benchmarks:**
- API response times under load
- Database query performance
- Frontend rendering performance
- Memory usage under load

### 11.5 Security Testing

**Vulnerability Scanning:**
- SQL injection attempts
- XSS attempts
- CSRF protection
- Authentication bypass
- Authorization bypass

**Tools:** OWASP ZAP, Burp Suite

---

## 12. Deployment Considerations

### 12.1 Environment Setup

**Development Environment:**
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="dev-secret-key"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

**Production Environment:**
```env
DATABASE_URL="file:./prod.db"
NEXTAUTH_SECRET="strong-random-secret-key"
NEXTAUTH_URL="https://school-management.example.com"
NODE_ENV="production"
```

### 12.2 Database Migration

**Migration Steps:**
1. Backup existing database
2. Run Prisma migrations
3. Seed initial data (if needed)
4. Verify data integrity
5. Update application

### 12.3 File Storage

**Development:**
- Local file system storage
- Documents in `public/uploads` directory

**Production:**
- Cloud storage (AWS S3, DigitalOcean Spaces)
- CDN for static assets
- Backup strategy for uploaded files

### 12.4 Backup Strategy

**Database Backups:**
- Daily automated backups
- Retain last 30 days of backups
- Weekly full backups
- Offsite backup storage

**File Backups:**
- Sync uploaded documents to backup location
- Versioning for important documents

### 12.5 Monitoring

**Application Monitoring:**
- Error tracking (Sentry, LogRocket)
- Performance monitoring
- Uptime monitoring
- API response time monitoring

**Business Metrics:**
- Staff registration rate
- Leave approval time
- Payroll processing time
- System adoption rate

### 12.6 Rollback Plan

**Rollback Triggers:**
- Critical bugs discovered
- Performance degradation
- Data corruption
- Security issues

**Rollback Steps:**
1. Stop traffic to new version
2. Restore previous application version
2. Restore database from backup (if needed)
3. Verify system functionality
4. Monitor for issues

---

## 13. Maintenance & Support

### 13.1 Regular Maintenance Tasks

**Daily:**
- Monitor system performance
- Check error logs
- Verify automated backups

**Weekly:**
- Review staff data quality
- Check for pending approvals
- Generate weekly reports

**Monthly:**
- Database maintenance
- Review and optimize slow queries
- Security audit
- Generate monthly reports

**Annually:**
- Update tax slabs
- Update EOBI rates
- Archive old data
- Full system audit

### 13.2 Update Management

**Software Updates:**
- Dependency updates (monthly)
- Security patches (immediate)
- Feature updates (quarterly)
- Major version upgrades (annually)

**Data Updates:**
- Tax slab updates (July)
- Holiday calendar updates (annually)
- Department structure updates (as needed)

### 13.3 Support Channels

**For Administrators:**
- Email support
- Phone support for critical issues
- Knowledge base
- Video tutorials

**For Staff:**
- Self-service portal
- FAQ section
- Email support
- HR helpdesk

---

## 14. Success Metrics

### 14.1 Key Performance Indicators (KPIs)

**Operational Metrics:**
- Average time to register new staff: < 10 minutes
- Leave approval time: < 24 hours
- Payroll processing time: < 2 hours for 200+ staff
- System uptime: > 99.5%

**User Satisfaction:**
- Staff satisfaction score: > 4/5
- Administrator satisfaction score: > 4/5
- Reduction in paperwork: > 80%
- Reduction in manual errors: > 90%

**Business Impact:**
- Time saved on HR tasks: > 50%
- Accuracy of payroll: > 99%
- Attendance tracking accuracy: > 99%
- Cost reduction in administrative work: > 30%

### 14.2 Success Criteria

**Phase 1 (Foundation):**
- ✅ All staff registered in system
- ✅ Basic CRUD operations working
- ✅ Staff directory accessible

**Phase 2 (Attendance & Leave):**
- ✅ Attendance marking automated
- ✅ Leave approval workflow implemented
- ✅ Leave balance tracking accurate

**Phase 3 (Payroll):**
- ✅ Payroll generation automated
- ✅ Tax calculations accurate
- ✅ Payslips generated and distributed

**Phase 4 (Qualifications & Performance):**
- ✅ Staff profiles complete
- ✅ Documents digitized
- ✅ Performance evaluations conducted

**Phase 5 (Advanced Features):**
- ✅ Contracts managed
- ✅ Subjects assigned
- ✅ Reports generated

---

## 15. Risk Mitigation

### 15.1 Technical Risks

**Risk:** Database performance degradation with 2,000+ staff
**Mitigation:**
- Proper indexing
- Query optimization
- Data archiving
- Caching strategy

**Risk:** File upload failures
**Mitigation:**
- Chunked uploads
- Retry mechanism
- Progress indicators
- Alternative storage options

**Risk:** Payroll calculation errors
**Mitigation:**
- Comprehensive testing
- Manual verification before processing
- Audit trail
- Rollback capability

### 15.2 Business Risks

**Risk:** Low user adoption
**Mitigation:**
- User training
- Intuitive UI/UX
- Gradual rollout
- Feedback collection

**Risk:** Data entry errors
**Mitigation:**
- Validation rules
- Mandatory fields
- Confirmation dialogs
- Data review process

**Risk:** Non-compliance with regulations
**Mitigation:**
- Legal review
- Regular updates
- Audit logs
- Compliance checks

### 15.3 Security Risks

**Risk:** Unauthorized access to sensitive data
**Mitigation:**
- Strong authentication
- Role-based access
- Encryption
- Regular security audits

**Risk:** Data breach
**Mitigation:**
- Secure storage
- Access logging
- Incident response plan
- Regular backups

---

## 16. Future Enhancements

### 16.1 Potential Features

**Short-term (6-12 months):**
- Mobile app for staff
- Biometric attendance integration
- WhatsApp/SMS notifications
- Advanced analytics dashboard
- Staff portal for self-service

**Long-term (1-2 years):**
- AI-powered performance predictions
- Automated recruitment system
- Learning management system integration
- Advanced reporting with BI tools
- Multi-campus support

### 16.2 Technology Upgrades

- Migrate to PostgreSQL for better performance
- Implement microservices architecture
- Add real-time features (WebSockets)
- Blockchain for document verification (optional)
- Machine learning for insights

---

## 17. Conclusion

This comprehensive implementation plan provides a roadmap for developing a robust Staff Management module for the Pakistani School Management System. The plan covers all aspects from database design to UI/UX, with specific attention to Pakistani employment practices, tax regulations, and cultural considerations.

### Key Highlights:

1. **Scalability:** Designed for 2,000+ staff members with performance optimizations
2. **Pakistani Compliance:** CNIC validation, tax slabs, EOBI, leave policies
3. **Comprehensive Features:** Complete HR management from recruitment to payroll
4. **Security:** Role-based access, audit logging, data encryption
5. **User Experience:** Intuitive UI with progressive enhancement
6. **Maintainability:** Clean code architecture, comprehensive testing

### Next Steps:

1. Review and approve this implementation plan
2. Set up development environment
3. Begin Phase 1: Foundation
4. Conduct weekly progress reviews
5. Adjust timeline as needed based on feedback

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Prepared By:** Planning Team
**Approved By:** [To be filled]
**Project Start Date:** [To be determined]
**Estimated Completion:** 14 weeks

