# Certificate Generation Module - Implementation Plan

## 📋 Module Overview
Certificate generation for Pakistani schools with official formats for various educational boards (BISE, Federal Board, Cambridge, etc.)

## 🎓 Certificate Types

### 1. Bonafide Certificate
**Purpose**: Confirm student enrollment and good standing

**Content Fields**:
- Student information (name, admission number, class, roll number)
- Father/Guardian name
- Date of birth
- Academic year and class
- Date of issue
- School stamp and signatures (Principal, Class Teacher)
- QR code for verification
- School contact information
- Valid for: 1 year from issue date

**Use Cases**:
- College/university applications
- Bank account opening
- Passport applications
- Scholarship applications
- Employment verification

### 2. Transfer Certificate (TC)
**Purpose**: Student leaving the school

**Content Fields**:
- Student information
- Admission and discharge dates
- Classes attended (from-to)
- Subjects passed
- Character and conduct summary
- Fee clearance status
- No dues certificate
- School stamp and signatures
- Board registration number
- Transfer destination (next school)
- Reason for transfer

**Use Cases**:
- Changing schools
- Board exam migration
- Mid-year transfers
- Relocation

### 3. Character Certificate
**Purpose**: Student character verification

**Content Fields**:
- Student details
- Behavioral record
- Academic performance
- Discipline record
- Attendance percentage
- Extra-curricular activities
- Character remarks
- Class teacher comments
- Principal remarks
- School stamp and signatures

**Use Cases**:
- Job applications
- Higher education
- Character references
- Good character proof

### 4. Migration Certificate
**Purpose**: Student moving between schools

**Content Fields**:
- Previous school details
- Classes completed
- Subjects passed
- No dues certificate
- Board examination results
- Character and conduct
- Reason for migration
- Previous school stamp
- Current school stamp and signatures
- Board verification (if applicable)

**Use Cases**:
- Board exam preparation
- College admission
- School transfer

### 5. Course Completion Certificate
**Purpose: Certificate of course completion

**Content Fields**:
- Course name and code
- Student details
- Start and end date
- Instructor information
- Duration and hours
- Grade/Score achieved
- Certificate number
- School stamp and signatures

**Use Cases**:
- Skill course completion
- Training programs
- Workshop completion

### 6. Participation Certificate
**Purpose: Event participation recognition

**Content Fields**:
- Event name and type
- Student details
- Event date and venue
- Achievement/Position
- Organizer information
- Certificate number
- Event signature
- School stamp
- Date of issue

**Use Cases**:
- Sports competitions
- Cultural events
- Science exhibitions
- Debates

## 🔌 API Endpoints

### Certificate APIs
```
GET  /api/certificates
POST  /api/certificates/generate
GET  /api/certificates/{id}
GET  /api/certificates/preview
GET  /api/certificates/types
GET  /api/certificates/student/{studentId}
POST  /api/certificates/{id}/send-email
GET  /api/certificates/{id}/download
GET  /api/certificates/verify/{certificateNumber}
```

### Certificate Preview APIs
```
GET  /api/certificates/preview?type=bonafide&studentId={id}
GET  /api/certificates/preview?type=tc&studentId={id}
POST /api/certificates/preview/batch
```

## 📄 PDF Template Specifications

### Certificate Template Structure

#### Bonafide Certificate Template
```
╔═════════════════════════════════════════════════════════════════╗
║                                                                    ║
║              [SCHOOL LOGO]                                      ║
║                                                                    ║
║              SCHOOL NAME                                       ║
║              Address Line 1                                  ║
║              Address Line 2                                  ║
║              Phone: 0300-1234567                           ║
║              Email: school@domain.com                            ║
║              Website: www.school.edu.pk                       ║
║                                                                    ║
║              BONAFIDE CERTIFICATE                         ║
║                                                                    ║
║  This is to certify that:                                  ║
║                                                                    ║
║  Student Name: ___________                             ║
║  Admission No.: ___________                             ║
║  Father/Guardian: ________________                     ║
║  Date of Birth: _______________                          ║
║  Class: _________ Section: _______                       ║
║  Academic Year: _____________                            ║
║  Date of Issue: _____________                            ║
║                                                                    ║
║  The above named student was a bona fide student of this school        ║
║  during the academic year 2024-25. He/She has paid            ║
║  all school dues and is eligible to take the next class.             ║
║  This certificate is issued on request of the parent/guardian.              ║
║                                                                    ║
║  Principal                                  ║
║  [SIGNATURE]                               ║
║                                                                    ║
║  Class Teacher                              ║
║  [SIGNATURE]                               ║
║                                                                    ║
║  [SCHOOL STAMP]                              ║
║                                                                    ║
║  Date: 15 January 2025                                           ║
║                                                                    ║
║  Verification Code: [QR CODE]                               ║
║                                                                    ║
║  Certificate No.: CERT-2024-0001                         ║
║                                                                    ║
╚═══════════════════════════════════════════════════════════════╝
```

#### Transfer Certificate Template
```
╔═════════════════════════════════════════════════════════════╗
║                                                                    ║
║              [SCHOOL LOGO]                                      ║
║              SCHOOL NAME                                       ║
║              Address Line 1                                  ║
║              Phone: 0300-1234567                           ║
║              Email: school@domain.com                            ║
║                                                                    ║
║              TRANSFER CERTIFICATE                            ║
║                                                                    ║
║  Certificate No.: TC-2024-0001                              ║
║  Date of Issue: 15 January 2025                         ║
║                                                                    ║
║   This is to certify that:                                  ║
║                                                                    ║
║  Student Name: ___________                             ║
║  Admission Number: _______________                       ║
║  Roll Number: ________________                            ║
  Date of Birth: _______________                          ║
  Gender: ____________                                     ║
  Nationality: _______________                              ║
  Religion: ____________                                    ║
  CNIC: ________________                                    ║
  Father's Name: ________________                        ║
  Father's CNIC: _______________                        ║
  Mother's Name: _______________                        ║
  Mother's CNIC: _______________                        ║
  Address: ________________                                 ║
  City: ________________                                   ║
  Province: ________________                               ║
  Phone: ________________                                 ║
  Emergency Contact: _______________                       ║
                                                                    ║
║  This student was admitted on: ___________                  ║
║                                                                    ║
║  Academic Information:                                          ║
║                                                                    ║
║  Class Roll No.    Subjects Studied/Status        Grade      ║
║  └─────────────────────────────────────────────────┐         ║
║  1                      English/Passed             A+              ║
║  2                      Urdu/Passed              B+              ║
║   3                      Math/Passed              A+              ║
║   4                      Physics/Passed          A+              ║
║   5                      Chemistry/Passed        A+              ║
║  └─────────────────────────────────────────────────┘         ║
║                                                                    ║
║  Overall Percentage: _____________%                           ║
║  Overall Grade: _____________                                  ║
║                                                                    ║
║  Conduct & Character:                                        ║
║                                                                    ║
║  This student has paid all school dues and no disciplinary            ║
║  action was taken against him/her during his/her stay.           ║
║  He/She is issued this Transfer Certificate on his/her own request.     ║
║                                                                    ║
║  Previous School Details:                                     ║
║  School Name: _______________                              ║
║  Board: _______________ (BISE/ Federal Board/Cambridge)         ║
║  Board Registration No.: _______________                      ║
║  Classes Attended: ________________                            ║
║  Board Results: _______________                                ║
                                                                    ║
║  Character Certificate: [Attached/Not Attached]              ║
║                                                                    ║
║  Reason for Transfer: ________________                     ║
║                                                                    ║
║  Current School Details:                                     ║
║  School Name: _______________                              ║
║  Board: _______________ (BISE/ Federal Board/Cambridge)         ║
║  Board Registration No.: _______________                      ║
║  Admission Class: ________________                             ║
║  Admission Date: ________________                             ║
                                                                    ║
║  Principal                                                          ║
║  [SIGNATURE]                               ║
║                                                                    ║
║  Date: ________________                                     ║
║                                                                    ║
║  [CURRENT SCHOOL STAMP]                                              ║
║                                                                    ║
╚═════════════════════════════════════════════════════════════════╝
```

#### Character Certificate Template
```
╔═════════════════════════════════════════════════════════════╗
║              [SCHOOL LOGO]                                      ║
║              SCHOOL NAME                                       ║
║              Address Line 1                                  ║
║              Phone: 0300-1234567                           ║
║              Email: school@domain.com                            ║
║                                                                    ║
║              CHARACTER CERTIFICATE                           ║
║                                                                    ║
║  Certificate No.: CHAR-2024-0001                           ║
║  Date of Issue: 15 January 2025                         ║
║                                                                    ║
║  This is to certify that:                                  ║
║                                                                    ║
║  Student Name: ___________                             ║
║  Admission Number: _______________                       ║
  Roll Number: ________________                            ║
  Date of Birth: ________________                          ║
  Gender: ____________                                     ║
  Religion: ____________                                    ║
  Nationality: ________________                              ║
  CNIC: ________________                                    ║
  Father's Name: ________________                        ║
  Father's CNIC: ________________                        ║
  Mother's Name: ________________                        ║
  Address: ________________                                 ║
  City: ________________                                   ║
  Province: ________________                               ║
  Phone: ________________                                 ║
  Emergency Contact: _______________                       ║
                                                                    ║
  Academic Details:                                             ║
                                                                    ║
  Class: _______________ Section: ________________             ║
  Roll No: ________________                                 ║
  Academic Year: ________________                            ║
  Enrollment Date: ________________                          ║
  Total Attendance: _________________%                         ║
  Overall Percentage: _____________%                           ║
  Overall Grade: _____________                                  ║
                                                                    ║
  Conduct and Character:                                        ║
                                                                    ║
  Academic Performance:                                        ║
║                                                                    ║
  General Conduct: ________________                         ║
  Obedience: ________________                               ║
  Discipline: ________________                                 ║
  Co-curricular: ________________                               ║
  Leadership: ________________                                 ║
  Extra-curricular: ________________                          ║
  Awards: ________________                                  ║
  Achievements: ________________                             ║
                                                                    ║
  Remarks: ________________                                     ║
                                                                    ║
  Overall Assessment: ________________                       ║
                                                                    ║
  Class Teacher Remarks: ________________                     ║
                                                                    ║
  Principal Remarks: ________________                             ║
                                                                    ║
                                                                    ║
  Principal                                          ║
  [SIGNATURE]                               ║
║                                                                    ║
  Date: ________________                                     ║
                                                                    ║
  [SCHOOL STAMP]                                              ║
                                                                    ║
╚═════════════════════════════════════════════════════════════╝
```

## 🔧 Database Schema

### Existing Models
- `Student` - Already exists, needs certificate relation
- `Certificate` - Already defined

### Additional Relations to Student
```prisma
model Student {
  // ... existing fields ...
  certificates Certificate[]
}
```

### Certificate Model (Already defined)
```prisma
model Certificate {
  id                String   @id @default(cuid())
  studentId         String
  certificateType   String   // Bonafide, TC, Character, Migration, Course Completion, Participation
  issueDate         DateTime
  certificateNumber String
  purpose           String?
  issuedBy          String?
  verifiedBy        String?
  filePath          String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  student           Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([studentId])
  @@index([certificateType])
  @@index([certificateNumber])
  @@index([issueDate])
  @@index([studentId, certificateType])
}
```

## 🎨 UI Components Needed

### Certificate Form Components
```typescript
- CertificateForm (multi-step form)
- CertificatePreview (live preview)
- CertificateTemplateSelector (choose template)
- CertificateFields (dynamic based on type)
- CertificateActions (download, email, print)

### Certificate Display Components
```typescript
- CertificateCard (displays certificate info)
- CertificatePreviewModal (preview before generating)
- CertificateTemplateCard (template selection)
- CertificateVerification (verify by certificate number)
```

### Certificate Management Components
```typescript
- CertificateList (all certificates with filters)
- CertificateSearch (search by number, student name)
- CertificateActions (download, email, print, verify)
- CertificateStatus (pending, generated, sent, verified)
```

### Certificate Templates
```typescript
- BonafideTemplate
- TransferCertificateTemplate
- CharacterCertificateTemplate
- MigrationCertificateTemplate
- CourseCompletionTemplate
- ParticipationCertificateTemplate
```

## 🔄 Certificate Generation Workflow

### 1. Certificate Selection
```
User selects certificate type → System loads template
↓
Display preview with sample data
↓
Fill in student details (auto-populated from database)
↓
Customize fields (purpose, remarks, etc.)
↓
Preview certificate before generation
```

### 2. Data Collection
```
System fetches student data from database:
- Personal info (name, admission number, DOB, class, roll)
- Academic info (class, section, academic year)
- Parent/guardian details
- Attendance summary
- Fee clearance status (for TC)
- Character/conduct data (for Character Certificate)
```

### 3. Template Processing
```
Load template based on type
Replace placeholders with real data
Apply school branding
Insert QR code
Insert date and signature placeholders
Insert principal and class teacher signatures
Apply school stamp
```

### 4. PDF Generation
```
Generate PDF with layout
Insert header (logo, school info)
Insert body (student data, table rows)
Insert footer (signatures, stamps, date, verification code)
Download or email PDF
Save PDF to database (file path)
```

### 5. Verification
```
QR code on certificate
Unique certificate number
Online verification endpoint
Verification by certificate number
Track verification attempts
```

## 🔐 Certificate Numbering System

### Format
```
CERT-YYYY-MM-XXXXXX

Examples:
CERT-2025-0001
CERT-2025-0002
CERT-2025-0003
```

### Rules:
- One number per certificate
- Sequential by date and type
- Different prefixes for different certificate types
- No gaps in numbering
- Yearly reset for some types

## 🎨 PDF Generation Options

### Generation Methods
1. **Client-side PDF generation** - For simple certificates (Bonafide, Character)
2. **Server-side PDF generation** - For official certificates (TC, Migration)
3. **Batch generation** - For certificates (Participation, Course Completion)

### PDF Libraries
- Client: `@react-pdf/renderer`, `@react-pdf/pdf`
- Server: PDFKit, PDF-lib, or ReportLab/WeasyPrint
- Alternative: html-pdf, jspdf

### PDF Features
- Watermark support
- Custom fonts (Nastaliq, etc.)
- Header with school branding
- Table formatting with borders
- Image embedding (logos, photos, stamps)
- QR code generation
- Multi-page certificates
- Print-optimized
- Password protection (for sensitive certificates)

## 📊 Certificate Templates

### 1. Bonafide Certificate
- **Orientation**: Portrait
- **Size**: A4 standard
- **Header**: School logo, name, contact info
- **Body**: Student details, academic info, verification code
- **Footer**: Signatures, stamps, date, QR code
- **Security**: Watermark, anti-copy text

### 2. Transfer Certificate
- **Orientation**: Portrait
- **Size**: A4 standard
- **Header**: School logos (previous and current)
- **Body**: Student info, academic record, conduct, clearance status
- **Footer**: Both school stamps, signatures, date, TC number
- **Security**: Voided TC in database

### 3. Character Certificate
- **Orientation**: Portrait
- **Size**: A4 standard
- **Header**: School logo and name
- **Body**: Student details, academic and behavioral info
- **Footer**: Signatures, date, school stamp
- **Security**: Watermark, unique IDs

### 4. Migration Certificate
- **Orientation**: Portrait or Landscape
- **Size**: A4 standard
- **Header**: Both school logos
- **Body: Student info, academic history, board results
- **Footer**: Both school stamps, board verification
- **Security**: Voided TC in database

### 5. Course Completion Certificate
- **Orientation**: Landscape
- **Size**: A4 landscape or A4 portrait
- **Header**: Course details, institution logo
- **Body: Student info, course details, instructor, grade/score
- **Footer: Signatures, date, institution stamps
- **Security**: Unique certificate numbers, verification codes

### 6. Participation Certificate
- **Orientation**: Portrait
- **Size**: A4 standard or A5 landscape
- **Header**: Event logo and name
- **Body: Student info, event details, achievement/position
- **Footer: Signatures, date, organizer signature
- **Security**: Event verification

## 🔐 Security Features

### Certificate Security
- Unique certificate numbers
- QR code verification
- Timestamp verification
- Anti-copy watermarks
- Password protection option
- Digital signature support
- Void certificate tracking in database
- Authentication required for generation

### Data Protection
- Encrypted certificate files
- Secure API endpoints
- Role-based access control
- Audit trail for all certificates
- IP address logging
- Failed verification attempts tracking

## 📝 API Specifications

### Get Certificate List
```typescript
GET /api/certificates?filters={
  type?: string,
  studentId?: string,
  studentName?: string,
  admissionNumber?: string,
  dateFrom?: string,
  dateTo?: string,
  status?: string
}

Response: {
  success: true,
  data: Certificate[],
  summary: {
    total: 1500,
    byType: { Bonafide: 600, TC: 300, Character: 400, Migration: 200 }
  }
}
```

### Generate Certificate
```typescript
POST /api/certificates/generate
Body: {
  certificateType: "bonafide",
  studentId: "student_id",
  purpose: "College admission",
  customFields: {}
}

Response: {
  success: CertificateGenerateResponse,
  data: {
    certificateId: "cert_id",
    certificateNumber: "CERT-2025-0001",
    downloadUrl: "/api/certificates/cert_id/download",
    previewUrl: "/api/certificates/cert_id/preview",
    qrCode: "data:image/png;base64,..."
  }
}
```

### Preview Certificate
```typescript
GET /api/certificates/preview?type=bonafide&studentId=xxx

Response: CertificatePreviewResponse {
  previewHtml: "<html>...</html>",
  sampleData: {...}
}
```

### Download Certificate
```typescript
GET /api/certificates/{id}/download
Response: PDF Blob
```

### Verify Certificate
```typescript
GET /api/certificates/verify/{certificateNumber}

Response: {
  isValid: true,
  student: Student,
  certificate: Certificate,
  verifiedAt: "2025-01-15T10:30:00Z"
}
```

## 🎨 Frontend Pages

### Main Pages
1. **Certificates Dashboard** (`/certificates`)
2. **Generate Certificate** (`/certificates/generate`)
3. **Certificate List** (`/certificates/list`)
4. **Certificate Verification** (`/certificates/verify`)
5. **Certificate Templates** (`/certificates/templates`)

### Key Components
- CertificateCard
- CertificateGenerator
- CertificatePreview
- CertificateVerification
- CertificateList
- CertificateFilter
- CertificateActions
- CertificateTemplates

## 📊 Database Operations

### Create Certificate
```typescript
// Auto-generate certificate number
const getCertificateNumber = async (type: string) => {
  const year = new Date().getFullYear()
  const prefix = type === 'TC' ? 'TC' : 'CERT'
  
  const lastCertificate = await db.certificate.findFirst({
    where: {
      certificateNumber: { startsWith: `${prefix}-${year}-` }
    },
    orderBy: { certificateNumber: 'desc' }
  })
  
  const lastNumber = lastCertificate 
    ? parseInt(lastCertificate.certificateNumber.split('-')[2]) 
    : 0
  
  const certificateNumber = `${prefix}-${year}-${String(lastNumber + 1).padStart(6, '0')}`
  
  return certificateNumber
}
```

### Get Certificates with Pagination
```typescript
// Optimized for large datasets
const getCertificates = async (filters: CertificateFilters) => {
  const where = buildWhereClause(filters)
  
  const [certificates, total] = await Promise.all([
    db.certificate.findMany({
      where,
      include: {
        student: {
          include: {
            class: true,
            section: true
          }
        }
      },
      take: 50,
      skip: ((filters.page || 1) - 1) * 50,
      orderBy: { createdAt: 'desc' }
    }),
    db.certificate.count({ where })
  ])
  
  return {
    certificates,
    pagination: {
      page: filters.page || 1,
      limit: 50,
      total,
      totalPages: Math.ceil(total / 50)
    }
  }
}
```

## 🚀 Performance Requirements

### Certificate Generation Speed
- Single certificate: < 3 seconds
- Batch certificates: < 10 seconds (up to 100 certificates)
- Certificate preview: < 1 second
- PDF download: < 2 seconds
- Database save: < 100ms

### Database Performance
- Certificate number generation: < 50ms
- Certificate retrieval: < 100ms
- Certificate verification: < 150ms
- Bulk certificate queries: < 200ms

### Scalability
- Support 100,000+ certificates per academic year
- Handle concurrent certificate generation
- Support high-volume PDF generation
- Efficient PDF storage and retrieval
- Optimized for 500K+ student records

## 🎨 UI/UX Requirements

### Design Principles
- Clean, professional certificate layouts
- School branding consistency
- Print-ready PDFs
- Mobile-responsive previews
- Clear information hierarchy
- Professional typography
- Proper spacing and alignment

### User Experience
- Live certificate preview
- One-click download, email, print
- Bulk operations support
- Clear status indicators
- Easy certificate verification

### Accessibility
- Screen reader compatible
- Keyboard navigation support
- High contrast ratios
- ARIA labels
- Focus management

## 🔐 Security Requirements

### Access Control
- Role-based permissions
- Certificate generation permissions
- Certificate download permissions
- Verification access control

### Data Security
- Encrypted certificate storage
- Secure API endpoints
- Audit logging for all certificate operations
- Failed verification tracking
- IP-based access logs

### Certificate Security
- Unique certificate numbers
- QR code verification
- Timestamp verification
- Anti-copy watermarks
- Digital signature support
- Void certificate tracking
- Reprint restrictions

## 📝 Success Criteria

### Functional Requirements
- ✅ All certificate types working
- ✅ Accurate data population
- ✅ Correct template selection
- ✅ PDF generation works flawlessly
- ✅ Certificates print correctly
- ✅ Email attachments work
- ✅ Verification system functional
- ✅ Bulk operations supported
- ✅ Numbering works correctly

### Performance Requirements
- ✅ < 3 sec single certificate generation
- ✅ < 10 sec batch generation
- ✅ < 1 sec preview
- ✅ < 2 sec PDF download
- ✅ < 100ms database operations
- ✅ 100K+ certificates/year support

### Quality Requirements
- ✅ Professional certificate layouts
- ✅ Pakistani board formats supported
- ✅ All school details included
- ✅ Proper signatures and stamps
- ✅ QR code generation
- ✅ Watermark protection
- ✅ Print-ready PDFs

## 🎯 Implementation Phases

### Phase 1: Foundation (Week 1)
- Certificate number system
- Template system
- Basic PDF generation
- Database operations
- Security layer

### Phase 2: Certificate Templates (Weeks 2-3)
- 6 certificate templates
- Template management
- Preview functionality
- Template editing

### Phase 3: Certificate Generation (Weeks 3-4)
- Certificate generation workflow
- Data collection
- Template processing
- PDF generation
- Download/email/print

### Phase 4: Certificate Management (Weeks 5-6)
- Certificate list and search
- Certificate verification
- Bulk operations
- Archive management

### Phase 5: Integration (Weeks 7-8)
- Student data integration
- Fee clearance check
- Attendance integration
- Character data integration

### Phase 6: Advanced Features (Weeks 9)
- QR code verification system
- Digital signatures
- Anti-fake measures
- Email integration
- SMS notifications for parents

### Phase 7: Testing & Optimization (Week 10)
- All certificate types tested
- Performance testing
- Security testing
- User acceptance testing
- Bug fixes and optimization

### Phase 8: Documentation (Weeks 11)
- API documentation
- User guide
- Admin manual
- Troubleshooting guide

## 📊 Metrics

### Volume Requirements
- 100,000+ certificates/year (5K students × 20 types)
- 1,000+ TCs/year
- 2,000+ Character certificates/year
- 3,000+ Bonafide certificates/month
- 1,000+ other certificates/month

### Concurrency Support
- 50+ concurrent generations
- 100+ certificate downloads simultaneously
- 500+ certificate verifications/day

### Reliability Metrics
- 99.9% certificate generation success rate
- 99.5% PDF generation success rate
- 99.9% email delivery rate
- 100% verification success rate

## 🚨 Next Steps

1. Review and approve plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Create certificate template system
5. Implement PDF generation
6. Build certificate management UI
7. Integrate with existing modules
8. Add verification system
9. Performance testing
10. User acceptance testing

## 📁 Document Location

Save this plan to: `/home/z/my-project/docs/CERTIFICATE_GENERATION_PLAN.md`
