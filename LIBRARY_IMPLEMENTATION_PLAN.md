# Library Management System - Implementation Plan
## Pakistani School Management System (500,000+ Students)

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Database Schema Design](#database-schema-design)
4. [API Specifications](#api-specifications)
5. [UI Components Structure](#ui-components-structure)
6. [Fine Calculation Logic](#fine-calculation-logic)
7. [Report Specifications](#report-specifications)
8. [Implementation Phases](#implementation-phases)
9. [Performance Considerations](#performance-considerations)
10. [Security Considerations](#security-considerations)

---

## Executive Summary

### Project Overview
The Library Management System (LMS) is designed for a large-scale Pakistani school system managing 500,000+ students across multiple schools/campuses with thousands of books. The system will handle book cataloging, member management, circulation workflows, fine calculations, reservations, and comprehensive reporting.

### Core Objectives
- Streamline book lending and tracking processes
- Automate fine calculation and overdue notifications
- Provide real-time library statistics
- Enable efficient book catalog management
- Support multi-member type access (students, staff)
- Scale to handle 500,000+ users and thousands of books

### Technology Stack
- **Frontend**: Next.js 16 App Router + TypeScript 5 + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **State Management**: Zustand (client) + TanStack Query (server)
- **Real-time**: Socket.io for notifications
- **AI**: z-ai-web-dev-sdk for intelligent book recommendations and search

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Student    │  │    Staff     │  │  Librarian   │       │
│  │   Portal     │  │   Portal     │  │    Portal    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Presentation Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Book       │  │   Member     │  │   Circulation│       │
│  │   Catalog    │  │  Management  │  │    Module    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Book API   │  │  Member API  │  │  Circulation │       │
│  └──────────────┘  └──────────────┘  │     API      │       │
│  ┌──────────────┐  ┌──────────────┐  └──────────────┘       │
│  │  Report API  │  │  Search API  │  ┌──────────────┐       │
│  └──────────────┘  └──────────────┘  │  Fine API    │       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Fine Calc   │  │  Validation  │  │  Notification│       │
│  │   Engine     │  │   Service    │  │   Service    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Access Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Prisma     │  │   Caching    │  │   Indexing   │       │
│  │   Client     │  │   Layer      │  │   Service    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SQLite Database                         │
│  Books | Members | Transactions | Reservations | Fines      │
└─────────────────────────────────────────────────────────────┘
```

### Module Breakdown

1. **Book Catalog Module**
   - Book CRUD operations
   - Category management
   - ISBN validation
   - Accession number generation
   - Book status tracking

2. **Member Management Module**
   - Student and staff registration
   - Member type configuration
   - Issue limit enforcement
   - Membership status tracking

3. **Circulation Module**
   - Book issue/return workflow
   - Reservation management
   - Transaction tracking
   - Due date calculation

4. **Fine Management Module**
   - Late return calculation
   - Fine generation and payment
   - Fine notification
   - Waiver management

5. **Search and Discovery Module**
   - Full-text search
   - Advanced filtering
   - AI-powered recommendations
   - Popular books tracking

6. **Reporting Module**
   - Circulation statistics
   - Member activity reports
   - Fine collection reports
   - Book utilization reports

7. **Notification Module**
   - Overdue alerts
   - Reservation availability
   - Due date reminders
   - System announcements

---

## Database Schema Design

### Core Tables

#### 1. Book Catalog Tables

```prisma
// Book categories
model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  code        String   @unique  // Category code (e.g., FIC, NON, REF)
  parentCategoryId String?  // For subcategories
  parentCategory Category?  @relation("CategoryHierarchy", fields: [parentCategoryId], references: [id])
  subCategories Category[]  @relation("CategoryHierarchy")
  books       Book[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([code])
  @@index([name])
}

// Main book catalog
model Book {
  id                String   @id @default(cuid())
  isbn              String?
  title             String
  subtitle          String?
  authors           String   // Comma-separated or JSON
  publisher         String?
  publishYear       Int?
  edition           String?
  language          String   @default("English")
  pages             Int?
  description       String?
  coverImage        String?  // URL to cover image
  categoryId        String
  category          Category @relation(fields: [categoryId], references: [id])
  totalCopies       Int      @default(0)
  availableCopies   Int      @default(0)
  lostCopies        Int      @default(0)
  damagedCopies     Int      @default(0)
  shelfLocation     String?  // Physical location in library
  callNumber        String?  // Library call number
  isReferenceOnly   Boolean  @default(false)  // Reference books cannot be issued
  popularScore      Float    @default(0)  // For tracking popularity
  totalIssues       Int      @default(0)
  totalReservations Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  copies            BookCopy[]
  transactions      Transaction[]
  reservations      Reservation[]
  
  @@unique([isbn])  // ISBN should be unique per book title
  @@index([title])
  @@index([authors])
  @@index([categoryId])
  @@index([popularScore])
  @@index([totalIssues])
}

// Individual book copies with accession numbers
model BookCopy {
  id              String   @id @default(cuid())
  accessionNumber String   @unique  // Unique identifier for each physical copy
  barcode         String?  @unique  // Barcode for scanning
  bookId          String
  book            Book     @relation(fields: [bookId], references: [id])
  status          BookStatus @default(AVAILABLE)
  condition       String   @default("Good")  // Good, Fair, Poor, Damaged
  purchaseDate    DateTime?
  purchasePrice   Float?
  supplier        String?
  notes           String?
  lastIssuedDate  DateTime?
  lastReturnedDate DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  transactions    Transaction[]
  reservations    Reservation[]
  
  @@index([accessionNumber])
  @@index([status])
  @@index([bookId])
}

enum BookStatus {
  AVAILABLE
  ISSUED
  RESERVED
  LOST
  DAMAGED
  UNDER_REPAIR
  WEEDING
}
```

#### 2. Member Management Tables

```prisma
// Member types with different privileges
model MemberType {
  id                    String   @id @default(cuid())
  name                  String   @unique  // Student, Teacher, Admin Staff, Librarian
  code                  String   @unique  // STU, TCH, ADM, LIB
  maxBooksAllowed       Int      @default(2)
  loanPeriodDays        Int      @default(14)
  canReserve            Boolean  @default(true)
  maxReservations       Int      @default(3)
  fineRatePerDay        Float    @default(5.0)  // In PKR
  maxFinePerBook        Float?   // Maximum fine cap per book
  canBorrowReference    Boolean  @default(false)
  renewalAllowed        Boolean  @default(true)
  maxRenewals           Int      @default(2)
  description           String?
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  members               Member[]
  
  @@index([code])
  @@index([isActive])
}

// Members (students and staff)
model Member {
  id                    String     @id @default(cuid())
  memberIdNumber        String     @unique  // School ID/Staff ID
  firstName             String
  lastName              String
  email                 String?    @unique
  phone                 String?
  dateOfBirth           DateTime?
  gender                String?    // Male, Female, Other
  address               String?
  city                  String?
  province              String?    // Punjab, Sindh, KPK, Balochistan
  memberTypeId          String
  memberType            MemberType @relation(fields: [memberTypeId], references: [id])
  grade                 String?    // For students: 1-12
  section               String?    // For students: A, B, C, etc.
  schoolCampusId        String?    // For multi-campus support
  department            String?    // For staff: Science, Arts, Admin, etc.
  designation           String?    // For staff
  joinDate              DateTime   @default(now())
  expiryDate            DateTime?  // Membership expiry
  status                MemberStatus @default(ACTIVE)
  libraryCardNumber     String?    @unique
  photoUrl              String?    // Member photo
  currentIssuedBooks    Int        @default(0)
  totalIssuedBooks      Int        @default(0)
  totalReturnedBooks    Int        @default(0)
  totalFinePaid         Float      @default(0)
  totalFinePending      Float      @default(0)
  totalReservations     Int        @default(0)
  notes                 String?
  lastActivityAt        DateTime?
  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt
  
  transactions          Transaction[]
  reservations          Reservation[]
  fines                 Fine[]
  
  @@unique([memberIdNumber, schoolCampusId])  // Unique within campus
  @@index([memberIdNumber])
  @@index([email])
  @@index([memberTypeId])
  @@index([status])
  @@index([libraryCardNumber])
  @@index([schoolCampusId])
}

enum MemberStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  GRADUATED
  TRANSFERRED
  DECEASED
}
```

#### 3. Circulation Tables

```prisma
// Book issue/return transactions
model Transaction {
  id                  String         @id @default(cuid())
  transactionNumber   String         @unique  // Auto-generated
  bookId              String
  book                Book           @relation(fields: [bookId], references: [id])
  bookCopyId          String
  bookCopy            BookCopy       @relation(fields: [bookCopyId], references: [id])
  memberId            String
  member              Member         @relation(fields: [memberId], references: [id])
  issueDate           DateTime       @default(now())
  dueDate             DateTime
  returnDate          DateTime?
  actualReturnDate    DateTime?
  issueType           IssueType     @default(NORMAL)
  issuedBy            String?        // Librarian ID
  receivedBy          String?        // Librarian ID who received return
  renewalCount        Int            @default(0)
  maxRenewals         Int            @default(2)
  isRenewable         Boolean        @default(true)
  conditionOnIssue    String         @default("Good")
  conditionOnReturn   String?
  notes               String?
  status              TransactionStatus @default(ISSUED)
  schoolCampusId      String?
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
  
  fine                Fine?
  
  @@index([transactionNumber])
  @@index([bookId])
  @@index([bookCopyId])
  @@index([memberId])
  @@index([dueDate])
  @@index([status])
  @@index([schoolCampusId])
  @@index([issueDate])
}

enum IssueType {
  NORMAL
  RESERVED
  RENEWED
  SPECIAL
  INTER_LIBRARY
}

enum TransactionStatus {
  ISSUED
  RETURNED
  OVERDUE
  LOST
  DAMAGED
  CANCELLED
}
```

#### 4. Reservation Tables

```prisma
// Book reservations
model Reservation {
  id                  String         @id @default(cuid())
  reservationNumber   String         @unique
  bookId              String
  book                Book           @relation(fields: [bookId], references: [id])
  bookCopyId          String?        // Assigned when book becomes available
  bookCopy            BookCopy?      @relation(fields: [bookCopyId], references: [id])
  memberId            String
  member              Member         @relation(fields: [memberId], references: [id])
  requestDate         DateTime       @default(now())
  notificationDate    DateTime?
  expiryDate          DateTime?      // Reservation expires after X days
  fulfilledDate       DateTime?
  cancelledDate       DateTime?
  status              ReservationStatus @default(PENDING)
  priority            Int            @default(1)  // For queue management
  notes               String?
  notified            Boolean        @default(false)
  schoolCampusId      String?
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
  
  @@index([reservationNumber])
  @@index([bookId])
  @@index([memberId])
  @@index([status])
  @@index([requestDate])
}

enum ReservationStatus {
  PENDING
  READY_FOR_PICKUP
  FULFILLED
  CANCELLED
  EXPIRED
}
```

#### 5. Fine Management Tables

```prisma
// Fine records
model Fine {
  id                  String         @id @default(cuid())
  fineNumber          String         @unique
  transactionId       String         @unique
  transaction         Transaction    @relation(fields: [transactionId], references: [id])
  memberId            String
  member              Member         @relation(fields: [memberId], references: [id])
  daysOverdue         Int            @default(0)
  fineRatePerDay      Float
  totalFine           Float
  fineWaived          Float          @default(0)
  finePaid            Float          @default(0)
  balanceDue          Float
  issueDate           DateTime       @default(now())
  dueDate             DateTime
  paidDate            DateTime?
  waivedDate          DateTime?
  waivedBy            String?        // Admin who waived
  paymentMethod       String?        // Cash, Card, Online
  paymentReference    String?
  status              FineStatus     @default(PENDING)
  notes               String?
  schoolCampusId      String?
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
  
  @@index([fineNumber])
  @@index([transactionId])
  @@index([memberId])
  @@index([status])
  @@index([dueDate])
}

enum FineStatus {
  PENDING
  PAID
  WAIVED
  PARTIALLY_PAID
  CANCELLED
}
```

#### 6. System Configuration Tables

```prisma
// Library settings
model LibrarySettings {
  id                          String   @id @default(cuid())
  schoolCampusId              String?  @unique  // For multi-campus
  libraryName                 String   @default("School Library")
  libraryCode                 String   @default("LIB")
  address                     String?
  phone                       String?
  email                       String?
  operatingHours              String?  // JSON: {"weekdays": "8:00-16:00", "saturday": "8:00-13:00"}
  fineCalculationMethod       FineMethod @default(DAILY)
  defaultFineRate             Float    @default(5.0)  // PKR per day
  maxFinePerBook              Float?   // Maximum fine cap
  gracePeriodDays             Int      @default(0)
  reservationExpiryDays       Int      @default(3)
  maxReservationsPerMember    Int      @default(3)
  allowRenewalIfReserved      Boolean  @default(false)
  autoCalculateFines          Boolean  @default(true)
  sendOverdueNotifications    Boolean  @default(true)
  notificationEmail           String?
  nextAccessionNumber         Int      @default(1)
  nextTransactionNumber       Int      @default(1)
  nextReservationNumber       Int      @default(1)
  nextFineNumber              Int      @default(1)
  createdAt                   DateTime @default(now())
  updatedAt                   DateTime @updatedAt
  
  @@index([schoolCampusId])
}

enum FineMethod {
  DAILY        // Fine per day
  FLAT_RATE    // One-time flat fee
  HOURLY       // Fine per hour (for special cases)
}
```

#### 7. Audit and Logging Tables

```prisma
// Activity log for auditing
model ActivityLog {
  id              String   @id @default(cuid())
  userId          String?  // Who performed the action
  action          String   // CREATE, UPDATE, DELETE, ISSUE, RETURN
  entityType      String   // Book, Member, Transaction, etc.
  entityId        String
  details         String?  // JSON with additional details
  ipAddress       String?
  userAgent       String?
  schoolCampusId  String?
  timestamp       DateTime @default(now())
  
  @@index([userId])
  @@index([entityType, entityId])
  @@index([timestamp])
  @@index([action])
}
```

### Database Indexing Strategy

**Critical Indexes:**
1. `Book` - title, authors, categoryId, isbn
2. `BookCopy` - accessionNumber, status, bookId
3. `Member` - memberIdNumber, email, libraryCardNumber, status
4. `Transaction` - transactionNumber, memberId, dueDate, status
5. `Reservation` - bookId, memberId, status
6. `Fine` - memberId, status, dueDate

**Composite Indexes:**
1. `Transaction(memberId, status, dueDate)` - For member's issued books
2. `BookCopy(bookId, status)` - For availability check
3. `Reservation(bookId, status, requestDate)` - For reservation queue

### Database Constraints

**Unique Constraints:**
- Book ISBN per title
- Member ID numbers within campus
- Accession numbers (one per physical copy)
- Transaction numbers, reservation numbers, fine numbers
- Member emails (if provided)

**Foreign Key Constraints:**
- All relationships with proper cascade rules
- Prevent deletion of books with active transactions
- Prevent deletion of members with pending fines

**Check Constraints:**
- Available copies ≤ Total copies
- Due date > Issue date
- Fine amounts cannot be negative
- Issue count cannot exceed max allowed

### Data Integrity Considerations

1. **Transaction Atomicity**: Book issue must:
   - Update BookCopy status
   - Create Transaction record
   - Decrement Book.availableCopies
   - Increment Member.currentIssuedBooks

2. **Reservation Queue Management**:
   - FIFO queue for reservations
   - Auto-expire unclaimed reservations
   - Cancel reservations if book becomes unavailable

3. **Fine Calculation Accuracy**:
   - Calculate based on actual return date
   - Account for holidays and weekends (configurable)
   - Apply grace period if configured

---

## API Specifications

### REST API Endpoints Structure

**Base URL**: `/api/library`

### 1. Book Catalog APIs

#### 1.1 Get All Books (Paginated)
```
GET /api/library/books
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 20, max: 100)
  - search: string (search in title, author, ISBN)
  - category: string (category ID)
  - status: BookStatus (filter by availability)
  - sortBy: string (title, author, publishYear, popularScore)
  - sortOrder: 'asc' | 'desc' (default: 'asc')

Response (200):
{
  "success": true,
  "data": {
    "books": [
      {
        "id": "string",
        "isbn": "string",
        "title": "string",
        "authors": "string",
        "category": {
          "id": "string",
          "name": "string",
          "code": "string"
        },
        "totalCopies": number,
        "availableCopies": number,
        "status": "AVAILABLE" | "ISSUED" | "RESERVED",
        "coverImage": "string?",
        "popularScore": number
      }
    ],
    "pagination": {
      "total": number,
      "page": number,
      "limit": number,
      "totalPages": number
    }
  }
}
```

#### 1.2 Get Book by ID
```
GET /api/library/books/:id

Response (200):
{
  "success": true,
  "data": {
    "id": "string",
    "isbn": "string",
    "title": "string",
    "subtitle": "string?",
    "authors": "string",
    "publisher": "string?",
    "publishYear": number?,
    "edition": "string?",
    "language": "string",
    "pages": number?,
    "description": "string?",
    "coverImage": "string?",
    "category": {
      "id": "string",
      "name": "string",
      "code": "string"
    },
    "totalCopies": number,
    "availableCopies": number,
    "lostCopies": number,
    "damagedCopies": number,
    "shelfLocation": "string?",
    "callNumber": "string?",
    "isReferenceOnly": boolean,
    "popularScore": number,
    "totalIssues": number,
    "totalReservations": number,
    "copies": [
      {
        "id": "string",
        "accessionNumber": "string",
        "barcode": "string?",
        "status": "BookStatus",
        "condition": "string"
      }
    ]
  }
}
```

#### 1.3 Create New Book
```
POST /api/library/books
Authorization: Bearer {token}

Request Body:
{
  "isbn": "string?",  // Optional but recommended
  "title": "string",
  "subtitle": "string?",
  "authors": "string",
  "publisher": "string?",
  "publishYear": number?,
  "edition": "string?",
  "language": "string",
  "pages": number?,
  "description": "string?",
  "coverImage": "string?",
  "categoryId": "string",
  "totalCopies": number,
  "shelfLocation": "string?",
  "callNumber": "string?",
  "isReferenceOnly": boolean
}

Response (201):
{
  "success": true,
  "data": {
    "id": "string",
    "isbn": "string",
    "title": "string",
    "totalCopies": number,
    "availableCopies": number,
    "createdAt": "datetime"
  }
}
```

#### 1.4 Update Book
```
PUT /api/library/books/:id
Authorization: Bearer {token}

Request Body: Same as Create Book (all fields optional)

Response (200):
{
  "success": true,
  "data": { ...updated book... }
}
```

#### 1.5 Delete Book
```
DELETE /api/library/books/:id
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Book deleted successfully"
}
```

#### 1.6 Book Search (Advanced)
```
GET /api/library/books/search

Query Parameters:
  - q: string (search query)
  - fields: string[] (title, author, isbn, description)
  - category: string
  - author: string
  - publisher: string
  - yearFrom: number
  - yearTo: number
  - language: string
  - availableOnly: boolean
  - page: number
  - limit: number

Response (200): Same as Get All Books
```

#### 1.7 Get Book by ISBN
```
GET /api/library/books/isbn/:isbn

Response (200): Same as Get Book by ID
```

#### 1.8 Add Book Copy
```
POST /api/library/books/:id/copies
Authorization: Bearer {token}

Request Body:
{
  "quantity": number,
  "condition": "string",
  "purchaseDate": "datetime?",
  "purchasePrice": "number?",
  "supplier": "string?"
}

Response (201):
{
  "success": true,
  "data": {
    "addedCopies": number,
    "copies": [
      {
        "accessionNumber": "string",
        "barcode": "string?",
        "status": "AVAILABLE"
      }
    ]
  }
}
```

#### 1.9 Update Book Copy Status
```
PATCH /api/library/books/copies/:copyId
Authorization: Bearer {token}

Request Body:
{
  "status": "BookStatus",
  "condition": "string?",
  "notes": "string?"
}

Response (200):
{
  "success": true,
  "data": { ...updated copy... }
}
```

### 2. Category Management APIs

#### 2.1 Get All Categories
```
GET /api/library/categories

Query Parameters:
  - includeSubcategories: boolean (default: true)

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "code": "string",
      "description": "string?",
      "bookCount": number,
      "subcategories": [
        {
          "id": "string",
          "name": "string",
          "code": "string",
          "bookCount": number
        }
      ]
    }
  ]
}
```

#### 2.2 Create Category
```
POST /api/library/categories
Authorization: Bearer {token}

Request Body:
{
  "name": "string",
  "code": "string",
  "description": "string?",
  "parentCategoryId": "string?"
}

Response (201):
{
  "success": true,
  "data": { ...created category... }
}
```

#### 2.3 Update Category
```
PUT /api/library/categories/:id
Authorization: Bearer {token}

Request Body: Same as Create Category

Response (200):
{
  "success": true,
  "data": { ...updated category... }
}
```

#### 2.4 Delete Category
```
DELETE /api/library/categories/:id
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Category deleted successfully"
}
```

### 3. Member Management APIs

#### 3.1 Get All Members (Paginated)
```
GET /api/library/members

Query Parameters:
  - page: number
  - limit: number
  - search: string (name, memberIdNumber, email)
  - memberType: string
  - status: MemberStatus
  - grade: string (for students)
  - schoolCampusId: string
  - sortBy: string
  - sortOrder: 'asc' | 'desc'

Response (200):
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "string",
        "memberIdNumber": "string",
        "firstName": "string",
        "lastName": "string",
        "email": "string?",
        "phone": "string?",
        "memberType": {
          "id": "string",
          "name": "string",
          "code": "string",
          "maxBooksAllowed": number
        },
        "grade": "string?",
        "section": "string?",
        "department": "string?",
        "status": "MemberStatus",
        "libraryCardNumber": "string?",
        "currentIssuedBooks": number,
        "totalIssuedBooks": number,
        "totalFinePending": number,
        "joinDate": "datetime"
      }
    ],
    "pagination": { ... }
  }
}
```

#### 3.2 Get Member by ID
```
GET /api/library/members/:id

Response (200):
{
  "success": true,
  "data": {
    "id": "string",
    "memberIdNumber": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string?",
    "phone": "string?",
    "dateOfBirth": "datetime?",
    "gender": "string?",
    "address": "string?",
    "city": "string?",
    "province": "string?",
    "memberType": {
      "id": "string",
      "name": "string",
      "code": "string",
      "maxBooksAllowed": number,
      "loanPeriodDays": number,
      "fineRatePerDay": number,
      "canReserve": boolean,
      "renewalAllowed": boolean,
      "maxRenewals": number
    },
    "grade": "string?",
    "section": "string?",
    "schoolCampusId": "string?",
    "department": "string?",
    "designation": "string?",
    "joinDate": "datetime",
    "expiryDate": "datetime?",
    "status": "MemberStatus",
    "libraryCardNumber": "string?",
    "photoUrl": "string?",
    "currentIssuedBooks": number,
    "totalIssuedBooks": number,
    "totalReturnedBooks": number,
    "totalFinePaid": number,
    "totalFinePending": number,
    "totalReservations": number,
    "notes": "string?",
    "lastActivityAt": "datetime?",
    "activeTransactions": [
      {
        "id": "string",
        "transactionNumber": "string",
        "book": {
          "id": "string",
          "title": "string",
          "authors": "string",
          "isbn": "string?"
        },
        "issueDate": "datetime",
        "dueDate": "datetime",
        "daysOverdue": number,
        "isOverdue": boolean
      }
    ],
    "activeReservations": [
      {
        "id": "string",
        "reservationNumber": "string",
        "book": { ... },
        "requestDate": "datetime",
        "status": "ReservationStatus",
        "positionInQueue": number
      }
    ]
  }
}
```

#### 3.3 Create Member
```
POST /api/library/members
Authorization: Bearer {token}

Request Body:
{
  "memberIdNumber": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string?",
  "phone": "string?",
  "dateOfBirth": "datetime?",
  "gender": "string?",
  "address": "string?",
  "city": "string?",
  "province": "string?",
  "memberTypeId": "string",
  "grade": "string?",
  "section": "string?",
  "schoolCampusId": "string?",
  "department": "string?",
  "designation": "string?",
  "expiryDate": "datetime?",
  "photoUrl": "string?"
}

Response (201):
{
  "success": true,
  "data": { ...created member... }
}
```

#### 3.4 Update Member
```
PUT /api/library/members/:id
Authorization: Bearer {token}

Request Body: Same as Create Member (all fields optional)

Response (200):
{
  "success": true,
  "data": { ...updated member... }
}
```

#### 3.5 Get Member by ID Number
```
GET /api/library/members/id/:memberIdNumber

Query Parameters:
  - schoolCampusId: string? (required for multi-campus)

Response (200): Same as Get Member by ID
```

#### 3.6 Get Member by Library Card
```
GET /api/library/members/card/:cardNumber

Response (200): Same as Get Member by ID
```

#### 3.7 Check Member Eligibility
```
GET /api/library/members/:id/eligibility

Response (200):
{
  "success": true,
  "data": {
    "canBorrow": boolean,
    "canReserve": boolean,
    "reason": "string?",
    "limits": {
      "maxBooksAllowed": number,
      "currentIssued": number,
      "remainingQuota": number,
      "maxReservations": number,
      "currentReservations": number,
      "remainingReservations": number
    },
    "blockedReasons": [
      {
        "type": "MAX_BOOKS_EXCEEDED" | "PENDING_FINE" | "MEMBERSHIP_EXPIRED" | "MEMBER_SUSPENDED",
        "message": "string",
        "details": "string?"
      }
    ]
  }
}
```

#### 3.8 Get Member Transaction History
```
GET /api/library/members/:id/transactions

Query Parameters:
  - status: TransactionStatus?
  - page: number
  - limit: number
  - fromDate: datetime?
  - toDate: datetime?

Response (200):
{
  "success": true,
  "data": {
    "transactions": [ ... ],
    "summary": {
      "totalIssued": number,
      "totalReturned": number,
      "totalOverdue": number,
      "totalFines": number
    }
  }
}
```

### 4. Circulation APIs

#### 4.1 Issue Book
```
POST /api/library/circulation/issue
Authorization: Bearer {token}

Request Body:
{
  "memberId": "string",
  "bookId": "string",
  "bookCopyId": "string?",  // Optional - system will assign if not provided
  "issueType": "NORMAL" | "RESERVED" | "SPECIAL",
  "issuedBy": "string",  // Librarian ID
  "notes": "string?"
}

Response (201):
{
  "success": true,
  "data": {
    "transaction": {
      "id": "string",
      "transactionNumber": "string",
      "book": { ... },
      "member": { ... },
      "issueDate": "datetime",
      "dueDate": "datetime",
      "status": "ISSUED"
    },
    "dueDate": "datetime",
    "renewalAllowed": boolean,
    "maxRenewals": number
  }
}

Error Responses:
400 - {
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Book is not available",
  "details": { ... }
}

403 - {
  "success": false,
  "error": "ELIGIBILITY_ERROR",
  "message": "Member has exceeded borrowing limit",
  "details": {
    "maxAllowed": 3,
    "currentIssued": 3
  }
}

409 - {
  "success": false",
  "error": "CONFLICT",
  "message": "Member has pending fines"
}
```

#### 4.2 Return Book
```
POST /api/library/circulation/return
Authorization: Bearer {token}

Request Body:
{
  "transactionId": "string",
  "conditionOnReturn": "string",
  "receivedBy": "string",  // Librarian ID
  "notes": "string?"
}

Response (200):
{
  "success": true,
  "data": {
    "transaction": {
      "id": "string",
      "transactionNumber": "string",
      "returnDate": "datetime",
      "actualReturnDate": "datetime",
      "status": "RETURNED"
    },
    "fine": {
      "id": "string",
      "fineNumber": "string",
      "daysOverdue": number,
      "totalFine": number,
      "balanceDue": number,
      "status": "PENDING"
    }?,
    "hasFine": boolean,
    "message": "Book returned successfully"
  }
}
```

#### 4.3 Renew Book
```
POST /api/library/circulation/renew/:transactionId
Authorization: Bearer {token}

Request Body:
{
  "renewedBy": "string"  // Librarian ID
}

Response (200):
{
  "success": true,
  "data": {
    "transaction": {
      "id": "string",
      "transactionNumber": "string",
      "dueDate": "datetime",  // New due date
      "renewalCount": number,
      "maxRenewals": number,
      "isRenewable": boolean
    },
    "previousDueDate": "datetime",
    "newDueDate": "datetime",
    "message": "Book renewed successfully"
  }
}

Error Responses:
400 - {
  "success": false,
  "error": "MAX_RENEWALS_EXCEEDED",
  "message": "Book has been renewed maximum times"
}

409 - {
  "success": false,
  "error": "RESERVED_BY_OTHER",
  "message": "Book is reserved by another member"
}
```

#### 4.4 Get Transaction by ID
```
GET /api/library/circulation/transactions/:id

Response (200):
{
  "success": true,
  "data": {
    "id": "string",
    "transactionNumber": "string",
    "book": {
      "id": "string",
      "title": "string",
      "authors": "string",
      "isbn": "string?",
      "category": { ... }
    },
    "bookCopy": {
      "id": "string",
      "accessionNumber": "string",
      "barcode": "string?"
    },
    "member": {
      "id": "string",
      "memberIdNumber": "string",
      "firstName": "string",
      "lastName": "string"
    },
    "issueDate": "datetime",
    "dueDate": "datetime",
    "returnDate": "datetime?",
    "actualReturnDate": "datetime?",
    "renewalCount": number,
    "maxRenewals": number,
    "isRenewable": boolean,
    "conditionOnIssue": "string",
    "conditionOnReturn": "string?",
    "status": "TransactionStatus",
    "daysOverdue": number,
    "fine": {
      "id": "string",
      "fineNumber": "string",
      "totalFine": number,
      "balanceDue": number,
      "status": "FineStatus"
    }?
  }
}
```

#### 4.5 Get Active Transactions
```
GET /api/library/circulation/transactions/active

Query Parameters:
  - memberId: string?
  - overdueOnly: boolean
  - page: number
  - limit: number

Response (200):
{
  "success": true,
  "data": {
    "transactions": [ ... ],
    "summary": {
      "totalActive": number,
      "totalOverdue": number,
      "totalDueToday": number
    }
  }
}
```

#### 4.6 Get Overdue Books
```
GET /api/library/circulation/overdue

Query Parameters:
  - memberId: string?
  - daysOverdue: number?  (filter by minimum days overdue)
  - schoolCampusId: string?
  - page: number
  - limit: number

Response (200):
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "string",
        "transactionNumber": "string",
        "book": { ... },
        "member": { ... },
        "dueDate": "datetime",
        "daysOverdue": number,
        "estimatedFine": number
      }
    ],
    "summary": {
      "totalOverdue": number,
      "totalEstimatedFines": number
    }
  }
}
```

### 5. Reservation APIs

#### 5.1 Create Reservation
```
POST /api/library/reservations
Authorization: Bearer {token}

Request Body:
{
  "memberId": "string",
  "bookId": "string",
  "notes": "string?"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "string",
    "reservationNumber": "string",
    "book": { ... },
    "member": { ... },
    "requestDate": "datetime",
    "expiryDate": "datetime",
    "status": "PENDING",
    "positionInQueue": number,
    "estimatedWaitTime": "string?"
  }
}

Error Responses:
409 - {
  "success": false,
  "error": "ALREADY_RESERVED",
  "message": "Member already has a reservation for this book"
}
```

#### 5.2 Get Reservations
```
GET /api/library/reservations

Query Parameters:
  - memberId: string?
  - bookId: string?
  - status: ReservationStatus?
  - page: number
  - limit: number

Response (200):
{
  "success": true,
  "data": {
    "reservations": [ ... ],
    "pagination": { ... }
  }
}
```

#### 5.3 Cancel Reservation
```
DELETE /api/library/reservations/:id
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "id": "string",
    "status": "CANCELLED",
    "cancelledDate": "datetime"
  }
}
```

#### 5.4 Fulfill Reservation (Assign Book)
```
POST /api/library/reservations/:id/fulfill
Authorization: Bearer {token}

Request Body:
{
  "bookCopyId": "string",
  "fulfilledBy": "string"
}

Response (200):
{
  "success": true,
  "data": {
    "id": "string",
    "status": "READY_FOR_PICKUP",
    "fulfilledDate": "datetime",
    "bookCopy": { ... },
    "message": "Reservation fulfilled. Member has 3 days to collect."
  }
}
```

#### 5.5 Get Reservation Queue for Book
```
GET /api/library/books/:bookId/reservations

Response (200):
{
  "success": true,
  "data": {
    "bookId": "string",
    "bookTitle": "string",
    "queue": [
      {
        "position": 1,
        "reservation": {
          "id": "string",
          "member": { ... },
          "requestDate": "datetime",
          "status": "PENDING"
        }
      }
    ],
    "totalInQueue": number,
    "estimatedWaitDays": number
  }
}
```

### 6. Fine Management APIs

#### 6.1 Get Fines
```
GET /api/library/fines

Query Parameters:
  - memberId: string?
  - status: FineStatus?
  - overdueFrom: datetime?
  - overdueTo: datetime?
  - page: number
  - limit: number

Response (200):
{
  "success": true,
  "data": {
    "fines": [
      {
        "id": "string",
        "fineNumber": "string",
        "transaction": {
          "id": "string",
          "transactionNumber": "string",
          "book": { ... }
        },
        "member": { ... },
        "daysOverdue": number,
        "fineRatePerDay": number,
        "totalFine": number,
        "fineWaived": number,
        "finePaid": number,
        "balanceDue": number,
        "issueDate": "datetime",
        "dueDate": "datetime",
        "status": "FineStatus"
      }
    ],
    "summary": {
      "totalFines": number,
      "totalPaid": number,
      "totalPending": number,
      "totalWaived": number
    },
    "pagination": { ... }
  }
}
```

#### 6.2 Get Fine by ID
```
GET /api/library/fines/:id

Response (200):
{
  "success": true,
  "data": { ...fine details... }
}
```

#### 6.3 Calculate Fine Preview
```
POST /api/library/fines/calculate

Request Body:
{
  "transactionId": "string",
  "returnDate": "datetime?"
}

Response (200):
{
  "success": true,
  "data": {
    "daysOverdue": number,
    "fineRatePerDay": number,
    "gracePeriodDays": number,
    "calculatedFine": number,
    "maxFineCap": number?,
    "applicableFine": number,
    "breakdown": [
      {
        "day": 1,
        "date": "datetime",
        "fine": 5.0
      }
    ]
  }
}
```

#### 6.4 Pay Fine
```
POST /api/library/fines/:id/pay
Authorization: Bearer {token}

Request Body:
{
  "amount": number,
  "paymentMethod": "CASH" | "CARD" | "ONLINE",
  "paymentReference": "string?",
  "receivedBy": "string"
}

Response (200):
{
  "success": true,
  "data": {
    "id": "string",
    "fineNumber": "string",
    "finePaid": number,
    "balanceDue": number,
    "status": "PAID",
    "paidDate": "datetime",
    "paymentMethod": "string",
    "changeDue": number?  // If payment > balance
    "receipt": {
      "receiptNumber": "string",
      "amountPaid": number,
      "paymentMethod": "string",
      "paidDate": "datetime"
    }
  }
}
```

#### 6.5 Waive Fine
```
POST /api/library/fines/:id/waive
Authorization: Bearer {token} (Admin only)

Request Body:
{
  "amount": number,
  "reason": "string",
  "waivedBy": "string"
}

Response (200):
{
  "success": true,
  "data": {
    "id": "string",
    "fineNumber": "string",
    "fineWaived": number,
    "balanceDue": number,
    "status": "WAIVED",
    "waivedDate": "datetime",
    "waivedBy": "string"
  }
}
```

#### 6.6 Get Member Fine Summary
```
GET /api/library/members/:memberId/fines

Response (200):
{
  "success": true,
  "data": {
    "memberId": "string",
    "memberName": "string",
    "totalFines": number,
    "totalPaid": number,
    "totalWaived": number,
    "totalPending": number,
    "overdueFineCount": number,
    "pendingFines": [
      {
        "id": "string",
        "fineNumber": "string",
        "transactionNumber": "string",
        "bookTitle": "string",
        "daysOverdue": number,
        "balanceDue": number,
        "dueDate": "datetime",
        "isOverdue": boolean
      }
    ]
  }
}
```

### 7. Reports and Statistics APIs

#### 7.1 Library Dashboard Statistics
```
GET /api/library/reports/dashboard

Query Parameters:
  - schoolCampusId: string?
  - date: datetime?  (default: today)
  - period: 'today' | 'week' | 'month' | 'year' | 'custom'
  - startDate: datetime? (for custom period)
  - endDate: datetime? (for custom period)

Response (200):
{
  "success": true,
  "data": {
    "period": {
      "start": "datetime",
      "end": "datetime"
    },
    "books": {
      "totalBooks": number,
      "totalCopies": number,
      "availableCopies": number,
      "issuedCopies": number,
      "reservedCopies": number,
      "lostCopies": number,
      "damagedCopies": number,
      "newBooksAdded": number
    },
    "members": {
      "totalMembers": number,
      "activeMembers": number,
      "newMembers": number,
      "byMemberType": [
        { "type": "Student", "count": number },
        { "type": "Teacher", "count": number },
        { "type": "Staff", "count": number }
      ]
    },
    "circulation": {
      "totalIssues": number,
      "totalReturns": number,
      "totalRenewals": number,
      "currentIssues": number,
      "overdueBooks": number,
      "averageLoanPeriod": number  // in days
    },
    "fines": {
      "totalFinesGenerated": number,
      "totalFinesCollected": number,
      "totalFinesPending": number,
      "totalFinesWaived": number,
      "collectionRate": number  // percentage
    },
    "reservations": {
      "totalReservations": number,
      "fulfilledReservations": number,
      "pendingReservations": number,
      "cancelledReservations": number,
      "fulfillmentRate": number
    },
    "popularBooks": [
      {
        "bookId": "string",
        "title": "string",
        "authors": "string",
        "issuesThisPeriod": number,
        "totalIssues": number
      }
    ],
    "activeMembers": [
      {
        "memberId": "string",
        "name": "string",
        "memberType": "string",
        "booksBorrowed": number
      }
    ]
  }
}
```

#### 7.2 Circulation Report
```
GET /api/library/reports/circulation

Query Parameters:
  - startDate: datetime
  - endDate: datetime
  - schoolCampusId: string?
  - memberType: string?
  - category: string?
  - groupBy: 'day' | 'week' | 'month' | 'memberType' | 'category'

Response (200):
{
  "success": true,
  "data": {
    "period": { ... },
    "summary": {
      "totalIssues": number,
      "totalReturns": number,
      "totalRenewals": number,
      "averageLoanPeriod": number
    },
    "byDate": [
      {
        "date": "datetime",
        "issues": number,
        "returns": number,
        "renewals": number
      }
    ],
    "byMemberType": [
      {
        "memberType": "string",
        "issues": number,
        "returns": number,
        "averageBooksPerMember": number
      }
    ],
    "byCategory": [
      {
        "category": "string",
        "issues": number,
        "percentage": number
      }
    ],
    "topBorrowers": [
      {
        "memberId": "string",
        "name": "string",
        "memberType": "string",
        "booksBorrowed": number
      }
    ],
    "topBooks": [
      {
        "bookId": "string",
        "title": "string",
        "issues": number
      }
    ]
  }
}
```

#### 7.3 Fine Collection Report
```
GET /api/library/reports/fines

Query Parameters:
  - startDate: datetime
  - endDate: datetime
  - schoolCampusId: string?
  - status: FineStatus?

Response (200):
{
  "success": true,
  "data": {
    "period": { ... },
    "summary": {
      "totalFinesGenerated": number,
      "totalCollected": number,
      "totalPending": number,
      "totalWaived": number,
      "collectionRate": number,
      "averageFinePerTransaction": number
    },
    "byStatus": [
      {
        "status": "FineStatus",
        "count": number,
        "totalAmount": number
      }
    ],
    "byMemberType": [
      {
        "memberType": "string",
        "totalFines": number,
        "averageFine": number
      }
    ],
    "byPaymentMethod": [
      {
        "method": "CASH" | "CARD" | "ONLINE",
        "amount": number,
        "percentage": number
      }
    ],
    "overdueFines": [
      {
        "fineId": "string",
        "fineNumber": "string",
        "memberName": "string",
        "amount": number,
        "overdueDays": number
      }
    ]
  }
}
```

#### 7.4 Book Utilization Report
```
GET /api/library/reports/books/utilization

Query Parameters:
  - startDate: datetime
  - endDate: datetime
  - category: string?
  - sortBy: 'issues' | 'availability' | 'overdueRate'

Response (200):
{
  "success": true,
  "data": {
    "period": { ... },
    "summary": {
      "totalBooks": number,
      "booksNeverIssued": number,
      "highlyUtilized": number,  // issued > 50 times
      "moderatelyUtilized": number,  // issued 10-50 times
      "lowUtilization": number,  // issued < 10 times
      "utilizationRate": number  // percentage
    },
    "books": [
      {
        "bookId": "string",
        "title": "string",
        "authors": "string",
        "category": "string",
        "totalCopies": number,
        "totalIssues": number,
        "averageIssuesPerCopy": number,
        "utilizationLevel": "HIGH" | "MEDIUM" | "LOW" | "NONE",
        "daysSinceLastIssue": number,
        "overdueRate": number,  // percentage of times returned late
        "reservationDemand": number  // number of reservations
      }
    ]
  }
}
```

#### 7.5 Member Activity Report
```
GET /api/library/reports/members/activity

Query Parameters:
  - startDate: datetime
  - endDate: datetime
  - schoolCampusId: string?
  - memberType: string?
  - activityLevel: 'active' | 'inactive' | 'all'

Response (200):
{
  "success": true,
  "data": {
    "period": { ... },
    "summary": {
      "totalActiveMembers": number,
      "totalInactiveMembers": number,
      "averageBooksPerMember": number,
      "averageFinesPerMember": number
    },
    "members": [
      {
        "memberId": "string",
        "name": "string",
        "memberType": "string",
        "grade": "string?",
        "booksBorrowed": number,
        "booksReturned": number,
        "currentIssues": number,
        "totalFines": number,
        "lastActivity": "datetime",
        "activityLevel": "HIGH" | "MEDIUM" | "LOW" | "NONE"
      }
    ],
    "byGrade": [
      {
        "grade": "string",
        "totalMembers": number,
        "activeMembers": number,
        "averageBooksPerMember": number
      }
    ]
  }
}
```

#### 7.6 Overdue Analysis Report
```
GET /api/library/reports/overdue

Query Parameters:
  - startDate: datetime
  - endDate: datetime
  - schoolCampusId: string?
  - memberType: string?

Response (200):
{
  "success": true,
  "data": {
    "period": { ... },
    "summary": {
      "totalOverdue": number,
      "averageDaysOverdue": number,
      "totalEstimatedFines": number,
      "recoveryRate": number  // percentage returned
    },
    "byMemberType": [
      {
        "memberType": "string",
        "overdueCount": number,
        "averageDaysOverdue": number,
        "totalFines": number
      }
    ],
    "byCategory": [
      {
        "category": "string",
        "overdueCount": number,
        "averageDaysOverdue": number
      }
    ],
    "chronicOverdueMembers": [
      {
        "memberId": "string",
        "name": "string",
        "overdueCount": number,
        "totalFines": number,
        "averageDaysOverdue": number
      }
    ],
    "mostOverdueBooks": [
      {
        "bookId": "string",
        "title": "string",
        "overdueCount": number,
        "averageDaysOverdue": number
      }
    ]
  }
}
```

#### 7.7 Popular Books Report
```
GET /api/library/reports/books/popular

Query Parameters:
  - period: 'week' | 'month' | 'quarter' | 'year' | 'allTime'
  - category: string?
  - limit: number (default: 20)

Response (200):
{
  "success": true,
  "data": {
    "period": { ... },
    "popularBooks": [
      {
        "rank": 1,
        "bookId": "string",
        "title": "string",
        "authors": "string",
        "category": {
          "id": "string",
          "name": "string"
        },
        "coverImage": "string?",
        "totalIssues": number,
        "currentIssues": number,
        "reservations": number,
        "averageRating": number?,
        "popularScore": number
      }
    ],
    "trendingBooks": [
      // Books with highest growth in popularity
      {
        "bookId": "string",
        "title": "string",
        "currentPeriodIssues": number,
        "previousPeriodIssues": number,
        "growthRate": number
      }
    ]
  }
}
```

### 8. Search APIs

#### 8.1 Global Search
```
GET /api/library/search

Query Parameters:
  - q: string (search query)
  - type: 'all' | 'books' | 'members' | 'transactions'
  - page: number
  - limit: number

Response (200):
{
  "success": true,
  "data": {
    "query": "string",
    "results": {
      "books": [
        {
          "id": "string",
          "title": "string",
          "authors": "string",
          "category": "string",
          "availableCopies": number,
          "relevanceScore": number
        }
      ],
      "members": [
        {
          "id": "string",
          "name": "string",
          "memberIdNumber": "string",
          "memberType": "string",
          "relevanceScore": number
        }
      ],
      "transactions": [
        {
          "id": "string",
          "transactionNumber": "string",
          "bookTitle": "string",
          "memberName": "string",
          "status": "string",
          "relevanceScore": number
        }
      ]
    },
    "totalResults": number
  }
}
```

#### 8.2 AI-Powered Book Recommendations
```
POST /api/library/recommendations
Authorization: Bearer {token}

Request Body:
{
  "memberId": string,
  "basedOn": 'history' | 'category' | 'popular' | 'similar',
  "limit": number (default: 10)
}

Response (200):
{
  "success": true,
  "data": {
    "memberId": "string",
    "recommendationType": "string",
    "recommendations": [
      {
        "bookId": "string",
        "title": "string",
        "authors": "string",
        "category": "string",
        "coverImage": "string?",
        "reason": "string",  // AI-generated reason
        "confidence": number,  // 0-1
        "available": boolean
      }
    ]
  }
}
```

### 9. Settings APIs

#### 9.1 Get Library Settings
```
GET /api/library/settings

Query Parameters:
  - schoolCampusId: string?

Response (200):
{
  "success": true,
  "data": {
    "libraryName": "string",
    "libraryCode": "string",
    "address": "string?",
    "phone": "string?",
    "email": "string?",
    "operatingHours": { ... },
    "fineCalculationMethod": "DAILY",
    "defaultFineRate": number,
    "maxFinePerBook": number?,
    "gracePeriodDays": number,
    "reservationExpiryDays": number,
    "maxReservationsPerMember": number,
    "allowRenewalIfReserved": boolean,
    "autoCalculateFines": boolean,
    "sendOverdueNotifications": boolean
  }
}
```

#### 9.2 Update Library Settings
```
PUT /api/library/settings
Authorization: Bearer {token} (Admin only)

Request Body: Same as Get Library Settings response

Response (200):
{
  "success": true,
  "data": { ...updated settings... }
}
```

### 10. Member Type APIs

#### 10.1 Get All Member Types
```
GET /api/library/member-types

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "code": "string",
      "maxBooksAllowed": number,
      "loanPeriodDays": number,
      "canReserve": boolean,
      "maxReservations": number,
      "fineRatePerDay": number,
      "maxFinePerBook": number?,
      "canBorrowReference": boolean,
      "renewalAllowed": boolean,
      "maxRenewals": number,
      "description": "string?",
      "isActive": boolean
    }
  ]
}
```

#### 10.2 Create Member Type
```
POST /api/library/member-types
Authorization: Bearer {token} (Admin only)

Request Body: Same as Get Member Types response item

Response (201):
{
  "success": true,
  "data": { ...created member type... }
}
```

#### 10.3 Update Member Type
```
PUT /api/library/member-types/:id
Authorization: Bearer {token} (Admin only)

Request Body: Same as Create Member Type

Response (200):
{
  "success": true,
  "data": { ...updated member type... }
}
```

---

## UI Components Structure

### Page-Level Components

#### 1. Dashboard (`/library/dashboard`)
**Purpose**: Main landing page showing library overview and key metrics

**Sub-components**:
- `LibraryStatsCards` - Display key statistics (total books, issued, overdue, etc.)
- `RecentActivityList` - Show recent transactions and activities
- `PopularBooksSection` - Display trending/popular books carousel
- `QuickActionsPanel` - Quick access buttons for common tasks
- `OverdueAlerts` - Alert banner for overdue books
- `UpcomingReturns` - List of books due soon

**Data Requirements**:
- Dashboard statistics from `/api/library/reports/dashboard`
- Recent transactions
- Popular books data
- Overdue books count

---

#### 2. Book Catalog (`/library/books`)
**Purpose**: Browse and search the book catalog

**Sub-components**:
- `BookSearchBar` - Advanced search with filters
- `BookFiltersSidebar` - Filter by category, author, year, availability
- `BookGrid` - Grid/list view of books with cards
- `BookCard` - Individual book card with cover, title, author, availability
- `BookPagination` - Pagination controls
- `BookSortOptions` - Sort dropdown (title, author, popularity, etc.)
- `CategoryFilter` - Category selection chips
- `AvailabilityToggle` - Filter by available books only

**Data Requirements**:
- Books list from `/api/library/books`
- Categories from `/api/library/categories`
- Search results
- Filter options

**Interactions**:
- Click book card → Book detail page
- Apply filters → Refresh book list
- Change sort → Reorder list
- Change view (grid/list)

---

#### 3. Book Detail (`/library/books/:id`)
**Purpose**: Detailed view of a single book

**Sub-components**:
- `BookCoverImage` - Large cover image with fallback
- `BookInfoPanel` - Title, authors, ISBN, publisher, year, pages, etc.
- `BookAvailabilityBadge` - Status badge (Available, Issued, Reserved)
- `CopyList` - List of all copies with status and accession numbers
- `BookActions` - Action buttons (Issue, Reserve, Request)
- `BookDescription` - Full description
- `CategoryBreadcrumb` - Navigation breadcrumb with category
- `RelatedBooks` - Similar books carousel
- `BookStatistics` - Issue count, reservation count, popular score
- `CopyStatusTable` - Table showing each copy's status

**Data Requirements**:
- Book details from `/api/library/books/:id`
- Book copies with status
- Category information
- Related books

**Interactions**:
- Click "Issue" → Open issue modal
- Click "Reserve" → Create reservation
- Click copy → View copy details

---

#### 4. Book Management (`/library/books/manage`)
**Purpose**: Admin view for managing books (CRUD operations)

**Sub-components**:
- `BookTable` - Table with all books and actions
- `BookFilters` - Advanced filters for admin
- `AddBookButton` - Floating action button to add book
- `BookBulkActions` - Bulk operations (delete, update status)
- `BookImportButton` - Import books from CSV/Excel
- `BookExportButton` - Export books to CSV/Excel
- `BookQuickActions` - Dropdown with edit, delete, view

**Interactions**:
- Click "Add Book" → Open add book form
- Select rows → Enable bulk actions
- Click "Edit" → Open edit form
- Click "Delete" → Confirm delete

---

#### 5. Add/Edit Book Form (`/library/books/new`, `/library/books/:id/edit`)
**Purpose**: Form to add or edit book information

**Sub-components**:
- `BookForm` - Main form component
- `ISBNLookup` - Auto-fetch book info from ISBN
- `AuthorInput` - Multi-select for authors
- `CategorySelect` - Category dropdown with subcategories
- `CoverImageUpload` - Image upload with preview
- `CopiesInput` - Input for number of copies to add
- `BookPreview` - Live preview of book card
- `FormValidationErrors` - Display validation errors

**Form Fields**:
- ISBN (with lookup button)
- Title (required)
- Subtitle
- Authors (required, multi)
- Publisher
- Publish Year
- Edition
- Language (dropdown)
- Pages
- Description (textarea)
- Cover Image (upload or URL)
- Category (required, dropdown)
- Number of Copies (for new books)
- Shelf Location
- Call Number
- Reference Only (checkbox)

**Data Requirements**:
- Categories list
- ISBN lookup API (external)
- Existing book data (for edit)

**Interactions**:
- Enter ISBN → Auto-fill form from external API
- Upload image → Preview image
- Submit → Validate and save

---

#### 6. Member Management (`/library/members`)
**Purpose**: Browse and manage library members

**Sub-components**:
- `MemberSearchBar` - Search by name, ID, email
- `MemberFilters` - Filter by type, status, grade, campus
- `MemberTable` - Table with member information
- `MemberCard` - Card view for members
- `MemberTypeFilter` - Filter chips for member types
- `AddMemberButton` - Floating action button
- `MemberBulkActions` - Bulk operations
- `MemberImportExport` - Import/export buttons

**Data Requirements**:
- Members list from `/api/library/members`
- Member types
- Filter options

**Interactions**:
- Click member → Member detail page
- Click "Add Member" → Open add member form
- Apply filters → Refresh list

---

#### 7. Member Detail (`/library/members/:id`)
**Purpose**: Detailed view of a member

**Sub-components**:
- `MemberProfileHeader` - Photo, name, ID, type, status
- `MemberInfoPanel` - Contact info, grade/department, join date
- `MemberStatsCards` - Stats (books issued, fines, reservations)
- `MemberEligibilityStatus` - Show if can borrow/reserve
- `ActiveTransactionsList` - Currently issued books
- `TransactionHistoryTable` - Full transaction history
- `ActiveReservationsList` - Pending reservations
- `FineSummaryCard` - Total fines, pending, paid
- `MemberActionsDropdown` - Edit, suspend, renew membership

**Data Requirements**:
- Member details from `/api/library/members/:id`
- Active transactions
- Transaction history
- Active reservations
- Fine summary

**Interactions**:
- Click transaction → Transaction detail
- Click "Issue Book" → Open issue modal
- Click "Pay Fine" → Open payment modal

---

#### 8. Circulation Desk (`/library/circulation`)
**Purpose**: Main circulation desk for issuing and returning books

**Sub-components**:
- `IssueBookPanel` - Panel for issuing books
- `ReturnBookPanel` - Panel for returning books
- `MemberLookupInput` - Quick member search by ID/card
- `BookLookupInput` - Quick book search by ISBN/barcode
- `IssueConfirmationModal` - Confirmation before issuing
- `ReturnConfirmationModal` - Confirmation with fine display
- `QuickIssueHistory` - Recent issues today
- `QuickReturnHistory` - Recent returns today
- `CirculationStats` - Today's statistics

**Workflows**:

**Issue Book Workflow**:
1. Enter member ID or scan library card
2. Validate member eligibility
3. Enter book ISBN or scan barcode
4. Select available copy
5. Confirm issue
6. Print receipt (optional)

**Return Book Workflow**:
1. Scan book barcode or enter accession number
2. Display transaction details
3. Check for overdue/fines
4. Enter return condition
5. Process return
6. Display fine (if any)
7. Print receipt (optional)

---

#### 9. Transaction History (`/library/transactions`)
**Purpose**: View and search all transactions

**Sub-components**:
- `TransactionFilters` - Filter by date, status, member, book
- `TransactionTable` - Table with all transactions
- `TransactionDetailModal` - Modal to view full details
- `TransactionStatusFilter` - Filter by status (Issued, Returned, Overdue)
- `DateRangePicker` - Date range selection
- `TransactionSearchBar` - Search by transaction number

**Data Requirements**:
- Transactions list from `/api/library/circulation/transactions`
- Filter options
- Pagination

---

#### 10. Reservations (`/library/reservations`)
**Purpose**: Manage book reservations

**Sub-components**:
- `ReservationList` - List of all reservations
- `ReservationFilters` - Filter by status, member, book
- `ReservationQueueView` - Queue view for specific book
- `CancelReservationButton` - Cancel reservation
- `FulfillReservationModal` - Modal to assign book
- `ReservationStats` - Summary statistics

**Interactions**:
- Click reservation → View details
- Click "Cancel" → Confirm cancellation
- Click "Fulfill" → Assign book copy

---

#### 11. Fines Management (`/library/fines`)
**Purpose**: View and manage fines

**Sub-components**:
- `FineList` - List of all fines
- `FineFilters` - Filter by status, member, date
- `FinePaymentModal` - Modal to pay fine
- `FineWaiverModal` - Modal to waive fine (admin)
- `FineSummaryCards` - Total, paid, pending, waived
- `OverdueFinesAlert` - Alert for overdue fines
- `FineReceipt` - Receipt display after payment

**Interactions**:
- Click fine → View details
- Click "Pay" → Open payment modal
- Click "Waive" → Open waiver modal (admin)

---

#### 12. Reports (`/library/reports`)
**Purpose**: Access various library reports

**Sub-components**:
- `ReportTypeSelector` - Cards to select report type
- `ReportFilters` - Date range, campus, type filters
- `CirculationReportChart` - Chart for circulation data
- `FineReportChart` - Chart for fine data
- `BookUtilizationChart` - Chart for book usage
- `MemberActivityChart` - Chart for member activity
- `PopularBooksList` - List of popular books
- `ReportExportButton` - Export to PDF/Excel
- `ReportPrintButton` - Print report

**Report Types**:
- Dashboard Overview
- Circulation Report
- Fine Collection Report
- Book Utilization Report
- Member Activity Report
- Overdue Analysis
- Popular Books Report

---

#### 13. Settings (`/library/settings`)
**Purpose**: Configure library settings

**Sub-components**:
- `SettingsTabs` - Navigation tabs (General, Fines, Notifications, Member Types)
- `GeneralSettingsForm` - Library name, address, hours
- `FineSettingsForm` - Fine rate, grace period, max fine
- `NotificationSettingsForm` - Email notifications, alerts
- `MemberTypeList` - List and manage member types
- `MemberTypeForm` - Add/edit member type
- `SettingsSaveButton` - Save settings button

---

### Reusable UI Components

#### 1. Search Components

**BookSearchBar**
- Search input with icon
- Filter toggle button
- Advanced search dropdown
- Search button
- Clear button

**MemberSearchBar**
- Search by name, ID, email, card number
- Type filter dropdown
- Status filter dropdown
- Search history dropdown

---

#### 2. Filter Components

**BookFiltersSidebar**
- Category tree view with checkboxes
- Author multi-select
- Publisher dropdown
- Year range slider
- Language dropdown
- Availability toggle
- Reference only toggle

**DateRangePicker**
- Start date picker
- End date picker
- Quick select buttons (Today, This Week, This Month, Custom)
- Apply button

---

#### 3. Card Components

**BookCard**
- Cover image with fallback
- Title (truncated if long)
- Authors (truncated)
- Category badge
- Availability indicator
- Action buttons (View, Issue, Reserve)
- Popular score (optional)

**MemberCard**
- Avatar with initials
- Name
- Member type badge
- ID number
- Status indicator
- Stats (books issued, fines)
- Action buttons

**StatCard**
- Icon
- Label
- Value (large)
- Trend indicator (up/down arrow with percentage)
- Subtext

**TransactionCard**
- Book info
- Member info
- Issue date
- Due date
- Status badge
- Days overdue (if applicable)
- Action buttons

---

#### 4. Table Components

**DataTable** (Generic)
- Sortable columns
- Selectable rows
- Pagination
- Column visibility toggle
- Export button
- Search within table
- Bulk actions toolbar

**BookTable**
- Checkbox column
- Cover thumbnail
- Title (linked to detail)
- Authors
- Category
- ISBN
- Total/Available copies
- Status
- Actions dropdown

**MemberTable**
- Checkbox column
- Photo
- Name (linked to detail)
- Member ID
- Type
- Grade/Department
- Status
- Books Issued
- Fines Pending
- Actions dropdown

**TransactionTable**
- Transaction number (linked to detail)
- Book title
- Member name
- Issue date
- Due date
- Return date
- Status badge
- Days overdue
- Renewals
- Actions dropdown

---

#### 5. Form Components

**BookForm**
- Form validation
- Auto-save draft (optional)
- ISBN lookup integration
- Multi-select for authors
- Category dropdown
- Image upload with preview
- Number inputs with validation
- Date pickers
- Submit and cancel buttons

**MemberForm**
- Personal info section
- Contact info section
- Member type selection
- School/grade info (conditional)
- Department/designation (conditional)
- Photo upload
- Membership dates
- Submit and cancel buttons

**IssueBookForm**
- Member lookup/selection
- Book lookup/selection
- Copy selection (if multiple available)
- Issue type selection
- Due date display
- Notes field
- Submit and cancel buttons

**ReturnBookForm**
- Book/transaction lookup
- Transaction details display
- Return date (auto-filled)
- Condition dropdown
- Notes field
- Fine preview (if overdue)
- Submit and cancel buttons

---

#### 6. Modal Components

**ConfirmationModal**
- Title
- Message
- Confirm button (danger color)
- Cancel button
- Optional: Checkbox for "Don't show again"

**IssueConfirmationModal**
- Member info
- Book info
- Due date
- Renewal info
- Confirm issue button
- Cancel button

**ReturnConfirmationModal**
- Transaction details
- Return date
- Condition selection
- Fine preview
- Pay fine now option
- Confirm return button
- Cancel button

**FinePaymentModal**
- Fine details
- Amount due
- Payment method selection
- Payment amount input
- Reference number input
- Pay button
- Cancel button

**FineWaiverModal**
- Fine details
- Waiver amount input
- Reason textarea
- Waive button (admin only)
- Cancel button

**ReservationModal**
- Book info
- Current queue position
- Estimated wait time
- Confirm reservation button
- Cancel button

---

#### 7. Badge and Status Components

**BookStatusBadge**
- Available (green)
- Issued (blue)
- Reserved (yellow)
- Lost (red)
- Damaged (orange)
- Under Repair (purple)

**MemberStatusBadge**
- Active (green)
- Inactive (gray)
- Suspended (red)
- Graduated (blue)
- Transferred (yellow)

**TransactionStatusBadge**
- Issued (blue)
- Returned (green)
- Overdue (red)
- Lost (red)
- Damaged (orange)
- Cancelled (gray)

**FineStatusBadge**
- Pending (orange)
- Paid (green)
- Waived (blue)
- Partially Paid (yellow)
- Cancelled (gray)

---

#### 8. List Components

**RecentActivityList**
- Activity item with icon
- Description text
- Timestamp
- Related entity link
- Scrollable with max height

**ActiveTransactionsList**
- Transaction item
- Book title
- Due date
- Days remaining
- Overdue indicator
- Action buttons (Return, Renew)

**UpcomingReturnsList**
- Transaction item
- Book title
- Due date
- Days until due
- Urgency indicator
- Action button

**PopularBooksCarousel**
- Horizontal scroll
- Book cards
- Navigation arrows
- Dots indicator

---

#### 9. Alert and Notification Components

**OverdueAlertBanner**
- Alert icon
- Message with count
- View details button
- Dismiss button

**SystemNotification**
- Icon based on type
- Title
- Message
- Timestamp
- Action button (optional)
- Dismiss button

**EligibilityAlert**
- Alert type (warning, error, info)
- Message explaining limitation
- Steps to resolve
- Action button (if applicable)

---

#### 10. Chart Components

**CirculationChart**
- Line chart showing issues/returns over time
- Toggle for different periods
- Tooltip with details
- Legend
- Export button

**FineCollectionChart**
- Bar chart for fines by status
- Donut chart for collection rate
- Tooltip with amounts
- Legend
- Export button

**CategoryDistributionChart**
- Pie or donut chart
- Show book count per category
- Tooltip with percentage
- Legend
- Click to filter

**MemberActivityChart**
- Bar chart for activity by member type
- Stacked bars for grade levels
- Tooltip with details
- Legend
- Export button

---

#### 11. Utility Components

**LoadingSpinner**
- Centered spinner
- Optional loading message
- Full screen or inline variants

**EmptyState**
- Illustration or icon
- Title
- Description
- Action button (optional)

**ErrorState**
- Error icon
- Error message
- Retry button
- Support contact info

**Pagination**
- Page numbers
- Previous/Next buttons
- Rows per page selector
- Jump to page input

**PrintButton**
- Print icon
- Click handler to print current page
- Optional: Print preview modal

**ExportButton**
- Export icon
- Dropdown with format options (PDF, Excel, CSV)
- Click handler for export

**Breadcrumb**
- Home link
- Current page
- Intermediate links (if applicable)
- Separator icons

**Tooltip**
- Hover trigger
- Content text
- Position (top, bottom, left, right)
- Delay options

---

### Component Hierarchy Summary

```
src/
├── app/
│   └── library/
│       ├── page.tsx (Dashboard)
│       ├── books/
│       │   ├── page.tsx (Book Catalog)
│       │   ├── [id]/
│       │   │   └── page.tsx (Book Detail)
│       │   ├── manage/
│       │   │   └── page.tsx (Book Management)
│       │   └── new/
│       │       └── page.tsx (Add Book)
│       ├── members/
│       │   ├── page.tsx (Member List)
│       │   └── [id]/
│       │       └── page.tsx (Member Detail)
│       ├── circulation/
│       │   └── page.tsx (Circulation Desk)
│       ├── transactions/
│       │   └── page.tsx (Transaction History)
│       ├── reservations/
│       │   └── page.tsx (Reservations)
│       ├── fines/
│       │   └── page.tsx (Fines Management)
│       ├── reports/
│       │   └── page.tsx (Reports)
│       └── settings/
│           └── page.tsx (Settings)
│
├── components/
│   └── library/
│       ├── books/
│       │   ├── BookCard.tsx
│       │   ├── BookTable.tsx
│       │   ├── BookGrid.tsx
│       │   ├── BookForm.tsx
│       │   ├── BookSearchBar.tsx
│       │   ├── BookFiltersSidebar.tsx
│       │   ├── BookCoverImage.tsx
│       │   ├── CopyList.tsx
│       │   ├── CopyStatusTable.tsx
│       │   └── RelatedBooks.tsx
│       ├── members/
│       │   ├── MemberCard.tsx
│       │   ├── MemberTable.tsx
│       │   ├── MemberForm.tsx
│       │   ├── MemberSearchBar.tsx
│       │   ├── MemberProfileHeader.tsx
│       │   ├── MemberInfoPanel.tsx
│       │   ├── MemberStatsCards.tsx
│       │   └── MemberEligibilityStatus.tsx
│       ├── circulation/
│       │   ├── IssueBookPanel.tsx
│       │   ├── ReturnBookPanel.tsx
│       │   ├── MemberLookupInput.tsx
│       │   ├── BookLookupInput.tsx
│       │   ├── IssueConfirmationModal.tsx
│       │   ├── ReturnConfirmationModal.tsx
│       │   └── QuickIssueHistory.tsx
│       ├── transactions/
│       │   ├── TransactionTable.tsx
│       │   ├── TransactionFilters.tsx
│       │   ├── TransactionDetailModal.tsx
│       │   ├── TransactionCard.tsx
│       │   └── ActiveTransactionsList.tsx
│       ├── reservations/
│       │   ├── ReservationList.tsx
│       │   ├── ReservationFilters.tsx
│       │   ├── ReservationQueueView.tsx
│       │   └── ReservationModal.tsx
│       ├── fines/
│       │   ├── FineList.tsx
│       │   ├── FineFilters.tsx
│       │   ├── FinePaymentModal.tsx
│       │   ├── FineWaiverModal.tsx
│       │   ├── FineSummaryCards.tsx
│       │   └── FineReceipt.tsx
│       ├── reports/
│       │   ├── ReportTypeSelector.tsx
│       │   ├── ReportFilters.tsx
│       │   ├── CirculationReportChart.tsx
│       │   ├── FineReportChart.tsx
│       │   ├── BookUtilizationChart.tsx
│       │   ├── MemberActivityChart.tsx
│       │   ├── PopularBooksList.tsx
│       │   └── ReportExportButton.tsx
│       ├── shared/
│       │   ├── StatCard.tsx
│       │   ├── DataTable.tsx
│       │   ├── SearchBar.tsx
│       │   ├── FiltersSidebar.tsx
│       │   ├── DateRangePicker.tsx
│       │   ├── Pagination.tsx
│       │   ├── ConfirmationModal.tsx
│       │   ├── EmptyState.tsx
│       │   ├── ErrorState.tsx
│       │   ├── LoadingSpinner.tsx
│       │   ├── Breadcrumb.tsx
│       │   ├── ExportButton.tsx
│       │   ├── PrintButton.tsx
│       │   └── Badge/
│       │       ├── BookStatusBadge.tsx
│       │       ├── MemberStatusBadge.tsx
│       │       ├── TransactionStatusBadge.tsx
│       │       └── FineStatusBadge.tsx
│       └── dashboard/
│           ├── LibraryStatsCards.tsx
│           ├── RecentActivityList.tsx
│           ├── PopularBooksSection.tsx
│           ├── QuickActionsPanel.tsx
│           ├── OverdueAlerts.tsx
│           └── UpcomingReturns.tsx
```

---

## Fine Calculation Logic

### Fine Calculation Rules

#### 1. Basic Fine Calculation

**Formula:**
```
Total Fine = Days Overdue × Fine Rate Per Day
```

**Steps:**
1. Calculate `Days Overdue`:
   ```
   Days Overdue = Max(0, Actual Return Date - Due Date)
   ```
   - Weekends (Saturday, Sunday) are counted unless excluded by settings
   - Holidays are excluded if configured
   - Grace period is subtracted if configured

2. Apply Fine Rate:
   - Use member type's `fineRatePerDay`
   - Different rates for students vs staff (if configured)

3. Apply Maximum Cap (if configured):
   ```
   Applicable Fine = Min(Total Fine, Max Fine Per Book)
   ```

#### 2. Grace Period Handling

**Scenario:** Grace period of 3 days

```
Due Date: Jan 15
Grace Period: 3 days
Effective Due Date: Jan 18

If returned on Jan 16 → No fine
If returned on Jan 19 → 1 day overdue (Jan 19 - Jan 18)
```

**Implementation:**
```typescript
function calculateDaysOverdue(
  dueDate: Date,
  returnDate: Date,
  gracePeriodDays: number = 0,
  excludeWeekends: boolean = false,
  holidays: Date[] = []
): number {
  let effectiveDueDate = new Date(dueDate);
  effectiveDueDate.setDate(effectiveDueDate.getDate() + gracePeriodDays);
  
  if (returnDate <= effectiveDueDate) {
    return 0;
  }
  
  let daysOverdue = 0;
  let currentDate = new Date(effectiveDueDate);
  currentDate.setDate(currentDate.getDate() + 1); // Start from day after due date
  
  while (currentDate <= returnDate) {
    if (!excludeWeekends || !isWeekend(currentDate)) {
      if (!holidays.some(h => isSameDay(h, currentDate))) {
        daysOverdue++;
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return daysOverdue;
}
```

#### 3. Weekend and Holiday Exclusion

**Configuration Option:** `excludeWeekendsAndHolidays: boolean`

**Weekend Definition:**
- Saturday and Sunday in Pakistan

**Holiday Handling:**
- Pre-defined list of public holidays (Pakistan national holidays)
- Configurable per school/campus

**Example:**
```
Due Date: Friday, Jan 10
Return Date: Monday, Jan 13

Without exclusion: 3 days overdue (Sat, Sun, Mon)
With exclusion: 1 day overdue (Mon only)
```

#### 4. Member Type-Based Fine Rates

**Default Fine Rates (PKR):**

| Member Type | Fine Rate Per Day | Max Fine Per Book | Loan Period |
|-------------|-------------------|-------------------|-------------|
| Student (Grade 1-5) | 2.00 | 50.00 | 7 days |
| Student (Grade 6-10) | 3.00 | 75.00 | 14 days |
| Student (Grade 11-12) | 5.00 | 100.00 | 14 days |
| Teacher | 10.00 | 200.00 | 21 days |
| Admin Staff | 5.00 | 100.00 | 14 days |
| Librarian | 0.00 | 0.00 | 30 days |

**Example Calculation:**

```
Member: Student (Grade 10)
Fine Rate: 3.00 PKR/day
Max Fine: 75.00 PKR
Due Date: Jan 1
Return Date: Jan 20
Grace Period: 0 days

Days Overdue: 19 days
Total Fine: 19 × 3.00 = 57.00 PKR
Since 57.00 < 75.00 (max), Applicable Fine = 57.00 PKR
```

#### 5. Fine Calculation Algorithms

**Algorithm 1: Daily Fine (Default)**

```typescript
interface FineCalculationResult {
  daysOverdue: number;
  fineRatePerDay: number;
  gracePeriodDays: number;
  calculatedFine: number;
  maxFineCap: number | null;
  applicableFine: number;
  breakdown: FineBreakdown[];
}

interface FineBreakdown {
  date: Date;
  isWeekend: boolean;
  isHoliday: boolean;
  chargeable: boolean;
  fine: number;
}

function calculateFine(
  transaction: Transaction,
  returnDate: Date,
  settings: LibrarySettings,
  memberType: MemberType
): FineCalculationResult {
  const { dueDate, issueDate } = transaction;
  const {
    fineCalculationMethod,
    defaultFineRate,
    maxFinePerBook,
    gracePeriodDays,
    excludeWeekendsAndHolidays = false
  } = settings;
  
  // Get member-specific settings
  const fineRate = memberType.fineRatePerDay || defaultFineRate;
  const maxFine = memberType.maxFinePerBook || maxFinePerBook;
  
  // Calculate days overdue
  const daysOverdue = calculateDaysOverdue(
    dueDate,
    returnDate,
    gracePeriodDays,
    excludeWeekendsAndHolidays,
    settings.holidays || []
  );
  
  // Calculate fine
  let calculatedFine = 0;
  const breakdown: FineBreakdown[] = [];
  
  if (daysOverdue > 0 && fineCalculationMethod === FineMethod.DAILY) {
    calculatedFine = daysOverdue * fineRate;
    
    // Generate breakdown
    let currentDate = new Date(dueDate);
    currentDate.setDate(currentDate.getDate() + gracePeriodDays + 1);
    
    for (let i = 0; i < daysOverdue; i++) {
      const isWeekend = isWeekend(currentDate);
      const isHoliday = isHoliday(currentDate, settings.holidays);
      const chargeable = !excludeWeekendsAndHolidays || (!isWeekend && !isHoliday);
      
      breakdown.push({
        date: new Date(currentDate),
        isWeekend,
        isHoliday,
        chargeable,
        fine: chargeable ? fineRate : 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  // Apply max cap
  const applicableFine = maxFine ? Math.min(calculatedFine, maxFine) : calculatedFine;
  
  return {
    daysOverdue,
    fineRatePerDay: fineRate,
    gracePeriodDays,
    calculatedFine,
    maxFineCap: maxFine,
    applicableFine,
    breakdown
  };
}
```

**Algorithm 2: Flat Rate Fine**

```typescript
function calculateFlatRateFine(
  transaction: Transaction,
  returnDate: Date,
  settings: LibrarySettings
): FineCalculationResult {
  const { dueDate } = transaction;
  const { flatRateAmount = 50.00 } = settings;
  
  const daysOverdue = calculateDaysOverdue(dueDate, returnDate, 0, false, []);
  const applicableFine = daysOverdue > 0 ? flatRateAmount : 0;
  
  return {
    daysOverdue,
    fineRatePerDay: flatRateAmount,
    gracePeriodDays: 0,
    calculatedFine: applicableFine,
    maxFineCap: flatRateAmount,
    applicableFine,
    breakdown: [{
      date: returnDate,
      isWeekend: false,
      isHoliday: false,
      chargeable: true,
      fine: applicableFine
    }]
  };
}
```

#### 6. Fine Payment Processing

**Payment Workflow:**

1. **Get Fine Details**
   - Retrieve fine record
   - Check balance due
   - Verify fine status

2. **Process Payment**
   - Validate payment amount
   - Record payment method
   - Generate receipt number
   - Update fine record

3. **Update Member Account**
   - Reduce pending fine total
   - Increase paid fine total
   - Update eligibility if needed

**Implementation:**

```typescript
interface PaymentResult {
  fineId: string;
  fineNumber: string;
  amountPaid: number;
  previousBalance: number;
  newBalance: number;
  status: FineStatus;
  receipt: Receipt;
  changeDue?: number;
}

async function processFinePayment(
  fineId: string,
  amount: number,
  paymentMethod: 'CASH' | 'CARD' | 'ONLINE',
  paymentReference?: string,
  receivedBy: string
): Promise<PaymentResult> {
  // Get fine
  const fine = await db.fine.findUnique({
    where: { id: fineId },
    include: { transaction: true, member: true }
  });
  
  if (!fine) {
    throw new Error('Fine not found');
  }
  
  if (fine.status === FineStatus.PAID) {
    throw new Error('Fine already paid');
  }
  
  // Validate amount
  if (amount <= 0) {
    throw new Error('Invalid payment amount');
  }
  
  if (amount > fine.balanceDue) {
    throw new Error('Payment amount exceeds balance due');
  }
  
  // Process payment
  const newFinePaid = fine.finePaid + amount;
  const newBalanceDue = fine.balanceDue - amount;
  const newStatus = newBalanceDue === 0 ? FineStatus.PAID : 
                   (fine.finePaid > 0 ? FineStatus.PARTIALLY_PAID : FineStatus.PENDING);
  
  // Generate receipt
  const receiptNumber = await generateReceiptNumber();
  const receipt: Receipt = {
    receiptNumber,
    fineNumber: fine.fineNumber,
    memberName: `${fine.member.firstName} ${fine.member.lastName}`,
    memberIdNumber: fine.member.memberIdNumber,
    bookTitle: fine.transaction.book?.title || 'N/A',
    transactionNumber: fine.transaction.transactionNumber,
    amountPaid: amount,
    paymentMethod,
    paidDate: new Date(),
    receivedBy
  };
  
  // Update fine
  const updatedFine = await db.fine.update({
    where: { id: fineId },
    data: {
      finePaid: newFinePaid,
      balanceDue: newBalanceDue,
      status: newStatus,
      paidDate: newStatus === FineStatus.PAID ? new Date() : fine.paidDate,
      paymentMethod,
      paymentReference
    }
  });
  
  // Update member
  await db.member.update({
    where: { id: fine.memberId },
    data: {
      totalFinePaid: { increment: amount },
      totalFinePending: { decrement: amount }
    }
  });
  
  // Log activity
  await logActivity({
    action: 'FINE_PAYMENT',
    entityType: 'Fine',
    entityId: fineId,
    userId: receivedBy,
    details: JSON.stringify({
      amount,
      paymentMethod,
      receiptNumber
    })
  });
  
  return {
    fineId: updatedFine.id,
    fineNumber: updatedFine.fineNumber,
    amountPaid: amount,
    previousBalance: fine.balanceDue,
    newBalance: updatedFine.balanceDue,
    status: updatedFine.status,
    receipt
  };
}
```

#### 7. Fine Waiver Process

**Waiver Rules:**

1. Only authorized staff (Admin, Head Librarian) can waive fines
2. Waiver reason must be provided
3. Waiver amount cannot exceed balance due
4. Waiver is logged for audit purposes

**Implementation:**

```typescript
interface WaiverResult {
  fineId: string;
  fineNumber: string;
  amountWaived: number;
  previousBalance: number;
  newBalance: number;
  status: FineStatus;
  waivedBy: string;
  waivedDate: Date;
}

async function waiveFine(
  fineId: string,
  amount: number,
  reason: string,
  waivedBy: string
): Promise<WaiverResult> {
  // Verify authorization
  const hasPermission = await checkWaiverPermission(waivedBy);
  if (!hasPermission) {
    throw new Error('Not authorized to waive fines');
  }
  
  // Get fine
  const fine = await db.fine.findUnique({
    where: { id: fineId }
  });
  
  if (!fine) {
    throw new Error('Fine not found');
  }
  
  if (fine.status === FineStatus.PAID || fine.status === FineStatus.WAIVED) {
    throw new Error('Fine cannot be waived');
  }
  
  // Validate amount
  if (amount <= 0 || amount > fine.balanceDue) {
    throw new Error('Invalid waiver amount');
  }
  
  // Process waiver
  const newFineWaived = fine.fineWaived + amount;
  const newBalanceDue = fine.balanceDue - amount;
  const newStatus = newBalanceDue === 0 ? FineStatus.WAIVED : FineStatus.PARTIALLY_PAID;
  
  // Update fine
  const updatedFine = await db.fine.update({
    where: { id: fineId },
    data: {
      fineWaived: newFineWaived,
      balanceDue: newBalanceDue,
      status: newStatus,
      waivedDate: newStatus === FineStatus.WAIVED ? new Date() : fine.waivedDate,
      waivedBy
    }
  });
  
  // Update member
  await db.member.update({
    where: { id: fine.memberId },
    data: {
      totalFinePending: { decrement: amount }
    }
  });
  
  // Log activity
  await logActivity({
    action: 'FINE_WAIVER',
    entityType: 'Fine',
    entityId: fineId,
    userId: waivedBy,
    details: JSON.stringify({
      amount,
      reason
    })
  });
  
  return {
    fineId: updatedFine.id,
    fineNumber: updatedFine.fineNumber,
    amountWaived: amount,
    previousBalance: fine.balanceDue,
    newBalance: updatedFine.balanceDue,
    status: updatedFine.status,
    waivedBy,
    waivedDate: updatedFine.waivedDate!
  };
}
```

#### 8. Automated Fine Calculation

**Scheduled Task: Calculate Daily Fines**

Run daily at midnight to:
1. Find all overdue transactions
2. Calculate fines for each
3. Create or update fine records
4. Send overdue notifications

```typescript
async function calculateDailyFines(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get settings
  const settings = await getLibrarySettings();
  if (!settings.autoCalculateFines) {
    return;
  }
  
  // Find overdue transactions without fines or with pending fines
  const overdueTransactions = await db.transaction.findMany({
    where: {
      status: { in: [TransactionStatus.ISSUED, TransactionStatus.OVERDUE] },
      dueDate: { lt: today },
      OR: [
        { fine: null },
        { fine: { status: FineStatus.PENDING } }
      ]
    },
    include: {
      book: true,
      bookCopy: true,
      member: {
        include: { memberType: true }
      },
      fine: true
    }
  });
  
  for (const transaction of overdueTransactions) {
    try {
      // Calculate fine
      const fineCalculation = calculateFine(
        transaction,
        today,
        settings,
        transaction.member.memberType
      );
      
      if (fineCalculation.applicableFine > 0) {
        if (transaction.fine) {
          // Update existing fine
          await db.fine.update({
            where: { id: transaction.fine.id },
            data: {
              daysOverdue: fineCalculation.daysOverdue,
              totalFine: fineCalculation.applicableFine,
              balanceDue: fineCalculation.applicableFine - transaction.fine.finePaid
            }
          });
        } else {
          // Create new fine
          await db.fine.create({
            data: {
              fineNumber: await generateFineNumber(),
              transactionId: transaction.id,
              memberId: transaction.memberId,
              daysOverdue: fineCalculation.daysOverdue,
              fineRatePerDay: fineCalculation.fineRatePerDay,
              totalFine: fineCalculation.applicableFine,
              balanceDue: fineCalculation.applicableFine,
              issueDate: today,
              dueDate: today,  // Fine due immediately
              status: FineStatus.PENDING,
              schoolCampusId: transaction.schoolCampusId
            }
          });
          
          // Update member pending fine
          await db.member.update({
            where: { id: transaction.memberId },
            data: {
              totalFinePending: { increment: fineCalculation.applicableFine }
            }
          });
        }
        
        // Update transaction status
        await db.transaction.update({
          where: { id: transaction.id },
          data: { status: TransactionStatus.OVERDUE }
        });
        
        // Send notification if enabled
        if (settings.sendOverdueNotifications) {
          await sendOverdueNotification(transaction, fineCalculation);
        }
      }
    } catch (error) {
      console.error(`Error calculating fine for transaction ${transaction.id}:`, error);
    }
  }
}
```

#### 9. Fine Summary and Reporting

**Member Fine Summary:**

```typescript
interface MemberFineSummary {
  memberId: string;
  memberName: string;
  totalFines: number;
  totalPaid: number;
  totalWaived: number;
  totalPending: number;
  overdueFineCount: number;
  pendingFines: PendingFine[];
}

interface PendingFine {
  fineId: string;
  fineNumber: string;
  transactionNumber: string;
  bookTitle: string;
  daysOverdue: number;
  balanceDue: number;
  dueDate: Date;
  isOverdue: boolean;
}

async function getMemberFineSummary(memberId: string): Promise<MemberFineSummary> {
  const fines = await db.fine.findMany({
    where: { memberId },
    include: {
      transaction: {
        include: { book: true }
      },
      member: true
    },
    orderBy: { issueDate: 'desc' }
  });
  
  const pendingFines: PendingFine[] = [];
  let totalFines = 0;
  let totalPaid = 0;
  let totalWaived = 0;
  let totalPending = 0;
  let overdueFineCount = 0;
  
  const today = new Date();
  
  for (const fine of fines) {
    totalFines += fine.totalFine;
    totalPaid += fine.finePaid;
    totalWaived += fine.fineWaived;
    totalPending += fine.balanceDue;
    
    if (fine.status === FineStatus.PENDING) {
      const isOverdue = fine.dueDate < today;
      if (isOverdue) overdueFineCount++;
      
      pendingFines.push({
        fineId: fine.id,
        fineNumber: fine.fineNumber,
        transactionNumber: fine.transaction.transactionNumber,
        bookTitle: fine.transaction.book.title,
        daysOverdue: fine.daysOverdue,
        balanceDue: fine.balanceDue,
        dueDate: fine.dueDate,
        isOverdue
      });
    }
  }
  
  return {
    memberId,
    memberName: `${fines[0]?.member.firstName} ${fines[0]?.member.lastName}`,
    totalFines,
    totalPaid,
    totalWaived,
    totalPending,
    overdueFineCount,
    pendingFines
  };
}
```

---

## Report Specifications

### 1. Dashboard Statistics Report

**Purpose**: Provide real-time overview of library operations

**Metrics**:

**Books Section:**
- Total Books (unique titles)
- Total Copies (physical copies)
- Available Copies
- Currently Issued
- Reserved
- Lost
- Damaged
- New Books Added (this period)

**Members Section:**
- Total Members
- Active Members
- New Members (this period)
- Members by Type (Student, Teacher, Staff)
- Members with Pending Fines

**Circulation Section:**
- Total Issues (this period)
- Total Returns (this period)
- Total Renewals
- Currently Issued Books
- Overdue Books
- Average Loan Period (days)
- Peak Circulation Day

**Fines Section:**
- Total Fines Generated
- Total Fines Collected
- Total Fines Pending
- Total Fines Waived
- Collection Rate (%)
- Average Fine per Transaction

**Reservations Section:**
- Total Reservations
- Fulfilled Reservations
- Pending Reservations
- Cancelled Reservations
- Fulfillment Rate (%)
- Average Wait Time (days)

**Top Lists:**
- Top 10 Popular Books (by issues this period)
- Top 10 Active Members (by books borrowed)
- Top 10 Overdue Members (by fine amount)

**Time Periods:**
- Today
- This Week
- This Month
- This Year
- Custom Range

**Visualizations:**
- Line chart: Circulation trends over time
- Bar chart: Issues by day of week
- Donut chart: Book status distribution
- Pie chart: Member type distribution

---

### 2. Circulation Report

**Purpose**: Track book lending and returning patterns

**Filters:**
- Date Range
- School/Campus
- Member Type
- Category
- Book Status

**Summary Metrics:**
- Total Issues
- Total Returns
- Total Renewals
- Net Change (Issues - Returns)
- Average Loan Period (days)
- Average Books per Member

**Breakdowns:**

**By Date:**
- Daily issues and returns
- Peak circulation days
- Trend analysis

**By Member Type:**
- Issues per member type
- Returns per member type
- Average books per member by type
- Renewal rate by type

**By Category:**
- Issues per category
- Percentage of total
- Popular vs. less popular categories

**Top Lists:**
- Top 20 Borrowers (by number of books)
- Top 20 Books (by number of issues)
- Most Renewed Books
- Fastest Returned Books
- Longest Held Books

**Visualizations:**
- Line chart: Issues and returns over time
- Bar chart: Issues by category
- Stacked bar: Issues by member type
- Heat map: Circulation by day and time

**Export Options:**
- PDF (with charts)
- Excel (with raw data)
- CSV (for data analysis)

---

### 3. Fine Collection Report

**Purpose**: Monitor fine generation and collection

**Filters:**
- Date Range
- School/Campus
- Member Type
- Fine Status

**Summary Metrics:**
- Total Fines Generated
- Total Collected
- Total Pending
- Total Waived
- Collection Rate (%)
- Average Fine per Transaction
- Average Fine per Member Type
- Overdue Fine Amount (fines not paid by due date)

**Breakdowns:**

**By Status:**
- Pending fines (count and amount)
- Paid fines (count and amount)
- Waived fines (count and amount)
- Partially paid fines (count and amount)

**By Member Type:**
- Total fines per type
- Average fine per type
- Collection rate per type
- Members with outstanding fines

**By Payment Method:**
- Cash payments
- Card payments
- Online payments
- Percentage breakdown

**By Time Period:**
- Daily fine generation
- Daily fine collection
- Monthly trends
- Seasonal patterns

**Critical Information:**
- Overdue Fines List (fines past their due date)
- Chronic Offenders (members with multiple overdue fines)
- Large Outstanding Fines (above threshold)
- Fine Waiver Analysis (reasons and amounts)

**Visualizations:**
- Bar chart: Fines by status
- Line chart: Fine generation and collection trends
- Pie chart: Payment method distribution
- Donut chart: Collection rate

**Export Options:**
- PDF (with charts and detailed tables)
- Excel (with all fine records)
- CSV (for accounting integration)

---

### 4. Book Utilization Report

**Purpose**: Analyze how effectively the book collection is being used

**Filters:**
- Date Range
- Category
- Publication Year Range

**Summary Metrics:**
- Total Books
- Books Never Issued
- Highly Utilized (>50 issues)
- Moderately Utilized (10-50 issues)
- Low Utilization (<10 issues)
- Overall Utilization Rate (%)

**Utilization Levels:**

**High Utilization:**
- Books with 50+ issues
- Consider adding more copies
- Monitor wear and tear
- Potential for weeding (replacement needed)

**Medium Utilization:**
- Books with 10-50 issues
- Good circulation
- Maintain current stock

**Low Utilization:**
- Books with <10 issues
- Consider for promotion
- Potential for weeding (if outdated)
- Relocate to more visible location

**No Utilization:**
- Books never issued
- Review relevance
- Consider for weeding
- Promote through displays

**Per-Book Metrics:**
- Total Issues
- Issues per Copy
- Days Since Last Issue
- Overdue Rate (% of times returned late)
- Reservation Demand (number of reservations)
- Average Loan Period
- Popular Score

**Category Analysis:**
- Utilization rate by category
- Most popular categories
- Least popular categories
- Category growth trends

**Weeding Recommendations:**
- Books not issued in 2+ years
- Outdated editions
- Damaged beyond repair
- Duplicate copies with low demand
- Superseded titles

**Visualizations:**
- Bar chart: Utilization distribution
- Pie chart: Utilization levels
- Heat map: Category utilization
- Scatter plot: Issues vs. publication year

**Export Options:**
- PDF (with weeding recommendations)
- Excel (with full book analysis)
- CSV (for data processing)

---

### 5. Member Activity Report

**Purpose**: Track member engagement with the library

**Filters:**
- Date Range
- School/Campus
- Member Type
- Grade (for students)
- Activity Level (Active, Inactive, All)

**Summary Metrics:**
- Total Active Members (issued book in period)
- Total Inactive Members (no activity)
- Average Books per Member
- Average Fines per Member
- Member Retention Rate

**Activity Levels:**

**High Activity:**
- 10+ books borrowed
- Regular visitors
- Potential library advocates

**Medium Activity:**
- 5-9 books borrowed
- Occasional visitors
- Target for engagement

**Low Activity:**
- 1-4 books borrowed
- Rare visitors
- Need outreach

**No Activity:**
- 0 books borrowed
- Never visited
- Consider membership review

**Per-Member Metrics:**
- Total Books Borrowed
- Total Books Returned
- Current Issues
- Total Fines
- Last Activity Date
- Activity Level
- Membership Duration
- Average Loan Period

**Breakdowns:**

**By Member Type:**
- Active members per type
- Average books per type
- Inactive members per type

**By Grade (Students):**
- Activity by grade level
- Average books by grade
- Reading trends by age

**By Department (Staff):**
- Activity by department
- Resource usage patterns

**Engagement Insights:**
- Most active members (top 20)
- Members at risk (inactive for X months)
- New member adoption rate
- Member lifecycle analysis

**Visualizations:**
- Bar chart: Active vs. inactive members
- Pie chart: Activity level distribution
- Line chart: New member acquisition
- Heat map: Activity by grade and month

**Export Options:**
- PDF (with member lists and insights)
- Excel (with detailed member data)
- CSV (for CRM integration)

---

### 6. Overdue Analysis Report

**Purpose**: Identify and address overdue book issues

**Filters:**
- Date Range
- School/Campus
- Member Type
- Days Overdue (minimum)
- Category

**Summary Metrics:**
- Total Overdue Books
- Average Days Overdue
- Total Estimated Fines
- Recovery Rate (% of overdue returned)
- Chronic Overdue Rate (members with 3+ overdues)

**Breakdowns:**

**By Member Type:**
- Overdue count per type
- Average days overdue per type
- Total fines per type

**By Category:**
- Overdue count per category
- Average days overdue per category
- Problem categories (high overdue rate)

**By Duration:**
- 1-7 days overdue
- 8-14 days overdue
- 15-30 days overdue
- 31-60 days overdue
- 60+ days overdue

**Critical Lists:**

**Chronic Overdue Members:**
- Members with 3+ overdue books
- Members with 500+ PKR in fines
- Repeat offenders

**Most Overdue Books:**
- Books most frequently returned late
- Books with longest overdue periods
- Books currently overdue longest

**High-Value Overdues:**
- Expensive books overdue
- Rare/Reference books overdue
- Multiple copies of same title overdue

**Risk Analysis:**
- Books at risk of being lost (60+ days overdue)
- Members with lost books
- Financial exposure (total value of overdue books)

**Visualizations:**
- Bar chart: Overdue by duration
- Line chart: Overdue trends
- Pie chart: Overdue by member type
- Scatter plot: Days overdue vs. fine amount

**Export Options:**
- PDF (with action items)
- Excel (with all overdue records)
- CSV (for follow-up systems)

---

### 7. Popular Books Report

**Purpose**: Identify trending and popular books for collection development

**Filters:**
- Period: Week, Month, Quarter, Year, All Time
- Category
- Publication Year Range

**Metrics:**
- Total Issues (in period)
- Current Issues
- Active Reservations
- Reservation Demand (queue length)
- Wait Time (average days for reservations)
- Popular Score (calculated metric)

**Popular Lists:**

**Most Popular Books:**
- Top 20 by total issues
- Top 20 by current issues
- Top 20 by reservation demand

**Trending Books:**
- Books with highest growth rate
- Rising stars (increasing popularity)
- Seasonal favorites

**Evergreen Titles:**
- Books consistently popular over time
- Classics with steady circulation
- Curriculum-aligned titles

**Hidden Gems:**
- High-rated but low circulation
- Recently added books gaining traction
- Undiscovered titles

**Category Insights:**
- Most popular categories
- Popular authors by category
- Genre trends

**Popular Score Calculation:**
```
Popular Score = (Total Issues × 0.4) + 
                (Recent Issues × 0.3) + 
                (Reservations × 0.2) + 
                (Rating × 0.1)
```

Where:
- Recent Issues = Issues in last 30 days
- Rating = Average user rating (1-5)

**Collection Development Insights:**
- Books needing more copies
- Gaps in popular categories
- Authors to collect more from
- Trends to watch

**Visualizations:**
- Bar chart: Top 20 popular books
- Line chart: Popularity trends
- Pie chart: Popular categories
- Word cloud: Popular authors

**Export Options:**
- PDF (with book covers and details)
- Excel (with metrics)
- CSV (for analysis)

---

### 8. Reservation Analysis Report

**Purpose**: Understand reservation patterns and optimize fulfillment

**Filters:**
- Date Range
- Book Category
- Member Type
- Status

**Summary Metrics:**
- Total Reservations
- Fulfilled Reservations
- Pending Reservations
- Cancelled Reservations
- Expired Reservations
- Fulfillment Rate (%)
- Average Wait Time (days)
- Average Queue Length

**Breakdowns:**

**By Status:**
- Pending (waiting)
- Ready for Pickup
- Fulfilled
- Cancelled (by member)
- Expired (not picked up)

**By Category:**
- Most reserved categories
- Reservation rate by category
- Fulfillment rate by category

**By Member Type:**
- Reservations by type
- Cancellation rate by type
- Pickup rate by type

**Queue Analysis:**
- Average queue length per book
- Longest current queues
- Books with highest demand

**Fulfillment Metrics:**
- Time from request to fulfillment
- Time from ready to pickup
- Pickup success rate
- Cancellation reasons

**Insights:**
- Books that should have more copies
- Categories with unmet demand
- Reservation system efficiency
- Member behavior patterns

**Visualizations:**
- Line chart: Reservation trends
- Bar chart: Reservations by status
- Pie chart: Fulfillment rate
- Heat map: Queue lengths

**Export Options:**
- PDF (with recommendations)
- Excel (with all reservations)
- CSV (for analysis)

---

### 9. Annual Library Report

**Purpose**: Comprehensive annual summary for stakeholders

**Sections:**

**1. Executive Summary**
- Key achievements
- Major statistics
- Challenges faced
- Future plans

**2. Collection Overview**
- Total collection size
- New additions
- Weeded items
- Collection value
- Collection by category

**3. Usage Statistics**
- Total visits
- Total circulations
- Digital resource usage
- Program attendance

**4. Member Engagement**
- Total members
- New members
- Active members
- Member demographics

**5. Financial Summary**
- Budget allocation
- Expenditures
- Fine collection
- Cost per circulation

**6. Programs and Events**
- Reading programs
- Book clubs
- Author visits
- Training sessions

**7. Achievements**
- Awards received
- Milestones reached
- Successful initiatives

**8. Challenges**
- Space constraints
- Budget limitations
- Staffing issues
- Technology needs

**9. Goals for Next Year**
- Collection development targets
- Service improvements
- Technology upgrades
- Program expansion

**10. Appendices**
- Detailed statistics
- Financial statements
- Event summaries
- Feedback highlights

**Format:**
- Professional PDF report
- Executive summary (2 pages)
- Full report (20-30 pages)
- Infographics and charts
- Photos of events

---

### 10. Custom Report Builder

**Purpose**: Allow users to create custom reports

**Features:**

**Data Selection:**
- Choose data sources (Books, Members, Transactions, Fines, Reservations)
- Select fields to include
- Apply filters
- Set date ranges

**Aggregation Options:**
- Sum, Count, Average, Min, Max
- Group by fields
- Calculate percentages
- Create custom formulas

**Visualization Options:**
- Charts (Bar, Line, Pie, Donut, Area)
- Tables
- Cards
- Gauges

**Output Options:**
- PDF
- Excel
- CSV
- HTML
- Email

**Scheduling:**
- Save report templates
- Schedule automatic generation
- Email delivery
- Dashboard widgets

**Sharing:**
- Share reports with users
- Set permissions
- Export sharing links
- Embed in other pages

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Objectives:**
- Set up project structure
- Initialize database
- Create core models
- Set up authentication

**Tasks:**
1. Initialize Next.js 16 project with TypeScript
2. Configure Prisma with SQLite
3. Define database schema
4. Run database migrations
5. Set up NextAuth.js
6. Create base API structure
7. Configure shadcn/ui components
8. Set up state management (Zustand)
9. Configure TanStack Query
10. Set up development environment

**Deliverables:**
- Working Next.js project
- Database with all tables
- Basic authentication
- API route structure
- Component library setup

---

### Phase 2: Book Catalog Management (Weeks 3-4)

**Objectives:**
- Implement book CRUD operations
- Create category management
- Build book search and filtering
- Develop book detail pages

**Tasks:**
1. Create Book API endpoints
2. Create Category API endpoints
3. Implement book CRUD operations
4. Build category management UI
5. Create book catalog page
6. Implement advanced search
7. Build book detail page
8. Create add/edit book forms
9. Implement book copy management
10. Add book status tracking

**Deliverables:**
- Book catalog management system
- Category management
- Search and filtering
- Book detail pages
- Admin book management

---

### Phase 3: Member Management (Weeks 5-6)

**Objectives:**
- Implement member CRUD operations
- Create member type management
- Build member search and filtering
- Develop member detail pages

**Tasks:**
1. Create Member API endpoints
2. Create MemberType API endpoints
3. Implement member CRUD operations
4. Build member type management UI
5. Create member list page
6. Implement member search
7. Build member detail page
8. Create add/edit member forms
9. Implement member eligibility checks
10. Add member activity tracking

**Deliverables:**
- Member management system
- Member type configuration
- Member search and filtering
- Member detail pages
- Eligibility checking

---

### Phase 4: Circulation System (Weeks 7-8)

**Objectives:**
- Implement book issue/return workflow
- Create transaction tracking
- Build renewal functionality
- Develop circulation desk interface

**Tasks:**
1. Create Circulation API endpoints
2. Implement book issue logic
3. Implement book return logic
4. Create transaction tracking
5. Build renewal functionality
6. Create circulation desk page
7. Implement barcode scanning
8. Build transaction history
9. Create issue/return confirmations
10. Add due date notifications

**Deliverables:**
- Book issue system
- Book return system
- Transaction tracking
- Renewal functionality
- Circulation desk interface

---

### Phase 5: Fine Management (Weeks 9-10)

**Objectives:**
- Implement fine calculation
- Create fine payment processing
- Build fine reporting
- Develop fine notifications

**Tasks:**
1. Create Fine API endpoints
2. Implement fine calculation logic
3. Create fine payment processing
4. Build fine waiver functionality
5. Create fine management page
6. Implement fine notifications
7. Build payment receipts
8. Create fine reports
9. Implement scheduled fine calculation
10. Add fine summary for members

**Deliverables:**
- Fine calculation system
- Fine payment processing
- Fine management interface
- Fine reporting
- Fine notifications

---

### Phase 6: Reservation System (Weeks 11-12)

**Objectives:**
- Implement book reservation
- Create reservation queue management
- Build reservation notifications
- Develop reservation fulfillment

**Tasks:**
1. Create Reservation API endpoints
2. Implement reservation creation
3. Build reservation queue
4. Create reservation management page
5. Implement reservation fulfillment
6. Build reservation notifications
7. Create reservation cancellation
8. Implement expiry handling
9. Add reservation to book detail
10. Build reservation reports

**Deliverables:**
- Reservation system
- Queue management
- Reservation notifications
- Reservation fulfillment
- Reservation reporting

---

### Phase 7: Search and Discovery (Weeks 13-14)

**Objectives:**
- Implement advanced search
- Create AI-powered recommendations
- Build popular books tracking
- Develop search analytics

**Tasks:**
1. Create Search API endpoints
2. Implement full-text search
3. Build advanced search UI
4. Integrate z-ai-web-dev-sdk for recommendations
5. Create recommendation engine
6. Build popular books tracking
7. Implement search analytics
8. Create search suggestions
9. Add recent searches
10. Build search results page

**Deliverables:**
- Advanced search system
- AI recommendations
- Popular books tracking
- Search analytics
- Search UI

---

### Phase 8: Reporting and Analytics (Weeks 15-16)

**Objectives:**
- Implement dashboard statistics
- Create circulation reports
- Build fine collection reports
- Develop custom report builder

**Tasks:**
1. Create Reports API endpoints
2. Implement dashboard statistics
3. Build dashboard page
4. Create circulation reports
5. Build fine collection reports
6. Implement book utilization reports
7. Create member activity reports
8. Build overdue analysis reports
9. Implement popular books reports
10. Create custom report builder

**Deliverables:**
- Dashboard with statistics
- Circulation reports
- Fine collection reports
- Utilization reports
- Custom report builder

---

### Phase 9: Notifications and Alerts (Weeks 17-18)

**Objectives:**
- Implement real-time notifications
- Create overdue alerts
- Build email notifications
- Develop notification preferences

**Tasks:**
1. Set up Socket.io
2. Create notification system
3. Implement real-time alerts
4. Build overdue notifications
5. Create due date reminders
6. Implement email notifications
7. Build notification center
8. Create notification preferences
9. Add system announcements
10. Implement notification history

**Deliverables:**
- Real-time notification system
- Overdue alerts
- Email notifications
- Notification center
- Notification preferences

---

### Phase 10: Settings and Configuration (Weeks 19-20)

**Objectives:**
- Implement library settings
- Create member type configuration
- Build fine rate configuration
- Develop system preferences

**Tasks:**
1. Create Settings API endpoints
2. Implement library settings
3. Build settings page
4. Create member type management
5. Implement fine rate configuration
6. Build notification settings
7. Create operating hours configuration
8. Implement holiday management
9. Build system preferences
10. Add settings validation

**Deliverables:**
- Library settings system
- Member type configuration
- Fine rate configuration
- Notification settings
- System preferences

---

### Phase 11: Testing and Quality Assurance (Weeks 21-22)

**Objectives:**
- Perform comprehensive testing
- Fix identified issues
- Optimize performance
- Ensure security

**Tasks:**
1. Create test cases
2. Perform unit testing
3. Conduct integration testing
4. Perform load testing (500,000+ users)
5. Test security vulnerabilities
6. Fix identified bugs
7. Optimize database queries
8. Improve performance
9. Conduct user acceptance testing
10. Document known issues

**Deliverables:**
- Test report
- Bug fixes
- Performance optimizations
- Security audit report
- UAT results

---

### Phase 12: Deployment and Launch (Weeks 23-24)

**Objectives:**
- Prepare for production
- Deploy application
- Train users
- Monitor performance

**Tasks:**
1. Set up production environment
2. Configure production database
3. Implement database backups
4. Set up monitoring
5. Deploy application
6. Perform smoke testing
7. Train librarians
8. Create user documentation
9. Provide support during launch
10. Monitor and fix issues

**Deliverables:**
- Production deployment
- Monitoring system
- User documentation
- Training materials
- Launch support

---

### Phase 13: Post-Launch Support (Weeks 25-26)

**Objectives:**
- Monitor system performance
- Address user feedback
- Implement improvements
- Plan future enhancements

**Tasks:**
1. Monitor system performance
2. Collect user feedback
3. Address critical issues
4. Implement quick fixes
5. Optimize based on usage
6. Plan Phase 2 features
7. Document lessons learned
8. Create improvement roadmap
9. Conduct retrospective
10. Prepare for maintenance

**Deliverables:**
- Performance report
- User feedback summary
- Improvement roadmap
- Maintenance plan
- Lessons learned document

---

## Performance Considerations

### Database Optimization

**Indexing Strategy:**
- Create indexes on frequently queried fields
- Use composite indexes for multi-column queries
- Monitor query performance with Prisma
- Regularly analyze and optimize indexes

**Query Optimization:**
- Use pagination for large datasets
- Implement caching for frequently accessed data
- Use select to limit returned fields
- Avoid N+1 queries with proper includes

**Connection Pooling:**
- Configure Prisma connection pool
- Monitor connection usage
- Adjust pool size based on load

### Caching Strategy

**Memory Caching:**
- Cache frequently accessed data (categories, member types)
- Cache book catalog with TTL
- Cache dashboard statistics
- Invalidate cache on data changes

**Query Caching:**
- Cache search results
- Cache report data
- Implement cache warming

### Frontend Performance

**Code Splitting:**
- Lazy load routes
- Split components by feature
- Dynamic imports for heavy components

**Image Optimization:**
- Use Next.js Image component
- Implement lazy loading
- Optimize image sizes
- Use WebP format

**State Management:**
- Use TanStack Query for server state
- Implement optimistic updates
- Cache API responses
- Prefetch likely requests

### Load Handling

**Pagination:**
- Implement cursor-based pagination
- Limit page sizes (max 100)
- Provide infinite scroll options

**Debouncing:**
- Debounce search inputs
- Debounce filter changes
- Implement request cancellation

**Rate Limiting:**
- Implement API rate limiting
- Protect against abuse
- Use throttling for expensive operations

### Monitoring

**Performance Metrics:**
- Track API response times
- Monitor database query performance
- Measure page load times
- Track error rates

**Alerting:**
- Set up performance alerts
- Monitor error rates
- Track resource usage
- Alert on critical issues

---

## Security Considerations

### Authentication and Authorization

**Authentication:**
- Implement NextAuth.js for authentication
- Support multiple auth providers (if needed)
- Secure session management
- Implement token refresh

**Authorization:**
- Role-based access control (RBAC)
- Permission checks on all API routes
- Member type-based permissions
- Admin-only operations protection

### Data Protection

**Input Validation:**
- Validate all user inputs
- Sanitize data before storage
- Use prepared statements (Prisma handles this)
- Implement length limits

**SQL Injection Prevention:**
- Use Prisma ORM (automatic protection)
- Never concatenate SQL strings
- Validate and sanitize inputs
- Use parameterized queries

**XSS Prevention:**
- Sanitize user-generated content
- Use React's built-in XSS protection
- Implement Content Security Policy
- Escape dynamic content

### API Security

**Rate Limiting:**
- Implement API rate limits
- Protect against brute force
- Use exponential backoff
- Implement CAPTCHA for sensitive operations

**CORS Configuration:**
- Configure CORS properly
- whitelist allowed origins
- Use secure headers
- Implement CSRF protection

**Secure Headers:**
- Implement security headers
- Use HTTPS only
- Set secure cookie flags
- Implement HSTS

### Data Privacy

**Member Data Protection:**
- Encrypt sensitive data
- Implement data anonymization
- Provide data export functionality
- Support right to deletion

**Audit Logging:**
- Log all sensitive operations
- Track data access
- Monitor for unauthorized access
- Regular security audits

### Backup and Recovery

**Database Backups:**
- Automated daily backups
- Offsite backup storage
- Regular backup testing
- Point-in-time recovery

**Disaster Recovery:**
- Document recovery procedures
- Test recovery scenarios
- Maintain backup integrity
- Plan for data restoration

---

## Conclusion

This implementation plan provides a comprehensive roadmap for developing a Library Management System capable of handling 500,000+ students across multiple Pakistani schools. The system includes all requested features:

✓ Book catalog with advanced search
✓ Member management for students and staff
✓ Complete book issue and return workflow
✓ Flexible fine calculation system
✓ Overdue book tracking and notifications
✓ Book reservation system with queue management
✓ Multiple book categories with hierarchy
✓ Issue limits per member type
✓ Comprehensive statistics and reports
✓ Popular books tracking and recommendations

The phased approach ensures systematic development, proper testing, and successful deployment. The architecture is designed for scalability, performance, and maintainability.

---

**Document Version:** 1.0  
**Last Updated:** 2025  
**Author:** Z.ai Code  
**Project:** Pakistani School Management System - Library Module
