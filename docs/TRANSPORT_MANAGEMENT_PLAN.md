# Transport Management System - Implementation Plan

## 📋 Module Overview
Comprehensive transport system for school transportation including route management, vehicle tracking, and student transportation assignments for Pakistani schools.

## 🚌 Features to Implement

### 1. Route Management
- Create, update, delete routes
- Route numbering system (R-001, R-002, etc.)
- Starting and ending points
- Pickup and drop times
- Total distance tracking
- Monthly fee structure per route
- Active/inactive route status
- Route map visualization
- Vehicle assignment to routes

### 2. Vehicle Management
- Vehicle registration (Bus, Van, Coaster, Rickshaw)
- Vehicle capacity management
- Driver and conductor details
- Driver CNIC and license tracking
- Insurance and fitness expiry tracking
- Maintenance scheduling
- Vehicle status (Active, Maintenance, Retired)
- Route assignment capability

### 3. Stop Management
- Add/update/delete stops on routes
- Stop numbering
- Stop names and locations
- Pickup and drop times
- Distance from school
- Stop ordering
- Student assignments per stop

### 4. Student Transport Assignment
- Student-Route-Stop-Vehicle assignment
- Academic year-based assignments
- Start and end dates
- Monthly transport fee
- Transport status tracking
- Bulk assignments
- Historical records

### 5. Transportation Requests
- New transport requests
- Request approval workflow
- Route change requests
- Stop change requests
- Temporary arrangements

### 6. Transport Attendance
- Daily boarding records
- On/off bus tracking
- No-show alerts
- Monthly attendance summary
- SMS to parents

### 7. Fee Management
- Monthly transport fees
- Fee collection tracking
- Defaulters list (unpaid transport)
- Fee receipt generation
- Payment modes (Cash, JazzCash, EasyPaisa)
- Fine management for late payment

### 8. Reports & Analytics
- Route utilization report
- Vehicle capacity report
- Student allocation by route
- Fee collection report
- Driver performance
- Maintenance schedule
- Monthly transport summary
- Parent SMS notifications

## 🔌 API Endpoints

### Route Management
```
GET    /api/transport/routes
POST   /api/transport/routes
GET    /api/transport/routes/{id}
PUT    /api/transport/routes/{id}
DELETE  /api/transport/routes/{id}
POST    /api/transport/routes/{id}/stops
GET    /api/transport/routes/{routeId}/stops
POST    /api/transport/stops
GET    /api/transport/stops/{id}
PUT    /api/transport/stops/{id}
DELETE  /api/transport/stops/{id}
```

### Vehicle Management
```
GET    /api/transport/vehicles
POST   /api/transport/vehicles
GET    /api/transport/vehicles/{id}
PUT    /api/transport/vehicles/{id}
DELETE  /api/transport/vehicles/{id}
POST    /api/transport/vehicles/{id}/maintenance
GET    /api/transport/vehicles/{id}/maintenances
```

### Student Assignment
```
GET    /api/transport/assignments
POST   /api/transport/assignments
GET    /api/transport/assignments/{id}
PUT    /api/transport/assignments/{id}
DELETE  /api/transport/assignments/{id}
GET    /api/transport/assignments/student/{studentId}
POST   /api/transport/assignments/bulk
GET    /api/transport/assignments/student/{studentId}/history
```

### Transport Attendance
```
GET    /api/transport/attendance
POST   /api/transport/attendance/mark
GET    /api/transport/attendance/{date}
GET    /api/transport/attendance/monthly/{month}
POST   /api/transport/attendance/send-sms
```

### Fee Management
```
GET    /api/transport/fees/structure
POST   /api/transport/fees/structure
PUT    /api/transport/fees/structure/{id}
DELETE  /api/transport/fees/structure/{id}
GET    /api/transport/fees/assignments
GET    /api/transport/fees/assignments/student/{studentId}
POST   /api/transport/fees/collect
GET    /api/transport/fees/collect/history/{studentId}
POST   /api/transport/fees/collect/bulk
GET    /api/transport/fees/defaulters
GET    /api/transport/fees/reports/{reportType}
```

### Reports & Analytics
```
GET    /api/transport/reports/route-utilization
GET    /api/transport/reports/vehicle-capacity
GET    /api/transport/reports/student-allocation
GET    /api/transport/reports/collection
GET    /api/transport/reports/driver-performance
GET    /api/transport/reports/maintenance-schedule
GET    /api/transport/reports/monthly-summary
GET    /api/transport/reports/parent-sms
```

## 📊 Database Models

### Core Transport Models (Already Defined)
- `TransportRoute` - Routes with stops and assignments
- `TransportStop` - Stops on routes
- `TransportVehicle` - Vehicles with driver info
- `TransportAssignment` - Student-route-stop-vehicle assignments

### Index Strategy for 500K+ Students
```prisma
model TransportAssignment {
  // ... fields ...
  
  @@index([studentId])
  @@index([routeId])
  @@index([stopId])
  @@index([academicYearId])
  @@index([academicYearId, status])
  @@index([routeId, academicYearId])
}
```

### Additional Models Recommended
```prisma
model TransportRequest {
  id              String   @id @default(cuid())
  studentId       String
  requestType     String   // New, Change Route, Change Stop, Temporary
  currentRouteId  String?
  newRouteId      String?
  newStopId       String?
  effectiveDate    DateTime
  reason           String
  status           String   // Pending, Approved, Rejected
  approvedBy       String?
  approvalDate     DateTime?
  rejectionReason  String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  student         Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  currentRoute    TransportRoute?  @relation(fields: [newRouteId], references: [id])
  newRoute        TransportRoute?  @relation(fields: [newRouteId], references: [id])
  currentStop     TransportStop?  @relation(fields: [newStopId], references: [id])
  
  @@index([studentId])
  @@index([status])
  @@index([requestType])
}

model TransportDailyAttendance {
  id              String   @id @default(cuid())
  studentId       String
  routeId         String
  stopId          String?
  vehicleId        String?
  date             DateTime
  isPresent        Boolean
  isOnBus         Boolean
  checkedInTime    DateTime?
  checkedOutTime   DateTime?
  remarks         String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  student         Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  route           TransportRoute @relation(fields: [routeId], references: [id])
  stop            TransportStop? @relation(fields: [stopId], references: [id])
  vehicle         TransportVehicle? @relation(fields: [vehicleId], references: [id])
  
  @@index([studentId, date])
  @@index([routeId, date])
  @@index([date, status])
  @@index([vehicleId, date])
}

model TransportDailySummary {
  id              String   @id @default(cuid())
  routeId         String
  date             DateTime
  totalStudents    Int
  presentStudents  Int
  absentStudents  Int
  onBusStudents Int
  offBusStudents Int
  totalCollected Float
  totalPending     Float
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  route           TransportRoute @relation(fields: [routeId], references: [id])
  
  @@index([routeId, date])
  @@index([date])
}

model DriverPerformance {
  id              String   @id @default(cuid())
  vehicleId       String
  driverId        String
  monthYear       String   // YYYY-MM
  totalTrips      Int
  totalKm        Float
  totalStudents    Int
  onTimeTrips  Int
  lateTrips      Int
  cancelledTrips Int
  fuelConsumption Float
  maintenanceDays  Int
  accidents        Int
  violations       Int
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  vehicle         TransportVehicle @relation(fields: [vehicleId], references: [id])
  driver          Staff?     @relation(fields: [driverId], references: [id])

  @@index([vehicleId, monthYear])
  @@index([driverId, monthYear])
}
```

## 🎨 UI Components

### Transport Pages
```
/transport - Main dashboard
/transport/routes - Route management
/transport/vehicles - Vehicle management
/transport/assignments - Student assignments
/transport/attendance - Daily attendance
/transport/fees - Fee management
/transport/reports - Analytics and reports
```

### Key Components
```typescript
- RouteCard - Route information with stops
- VehicleCard - Vehicle details and driver
- RouteStopsList - Stops on a route
- StudentTransportCard - Student transport info
- AttendanceGrid - Daily attendance marking
- FeeCollectionModal - Transport fee collection
- TransportCalendar - Monthly calendar view
- DriverPerformanceCard - Driver metrics
- RouteMap - Visual route display
```

### Search & Filter Components
```typescript
- RouteSearch - Search routes by name, number, area
- VehicleSearch - Search vehicles by number, driver
- StudentTransportSearch - Search students by route/stop
- AdvancedFilter - Multi-criteria filters
- DateRangeFilter - Date range selection
```

### Interactive Components
```typescript
- StopSelector - Select stops from route
- VehicleSelector - Assign vehicles to routes
- RouteBuilder - Drag-and-drop route builder
- QuickAssign - One-click assignment
- AttendanceToggle - Present/Absent toggle
- BatchOperations - Bulk actions
```

## 🔄 Business Logic

### Route Creation Flow
1. Validate route number uniqueness
2. Define route start/end points
3. Add sequential stops
4. Set pickup/drop times
5. Calculate total distance
6. Set monthly fee
7. Assign default vehicle
8. Save route with status

### Vehicle Management Flow
1. Register vehicle with unique number
2. Assign driver and conductor details
3. Set vehicle capacity
4. Set insurance and fitness expiry
5. Assign to routes
6. Track maintenance schedule
7. Monitor vehicle status
8. Handle maintenance requests

### Student Assignment Flow
1. Select student from database
2. Choose route and stop
3. Select vehicle (optional)
4. Set academic year period
5. Calculate monthly fee
6. Save assignment
7. Send confirmation to parent

### Transport Attendance Flow
1. Load route students for date
2. Mark present/absent
3. Check-in/check-out times
4. Track bus boarding
5. Calculate attendance percentage
6. Generate SMS alerts to parents

### Fee Management Flow
1. Get class-wise transport students
2. Calculate monthly transport fee
3. Generate fee receipt
4. Collect payment with multiple modes
5. Update fee status
6. Send receipt to parent
7. Track defaulters
8. Send SMS reminders

### Fine Calculation Logic
```typescript
const calculateFine = (
  dueDate: Date,
  daysLate: number,
  dailyRate: number
) => {
  const today = new Date()
  const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 24))
  const totalFine = daysOverdue * dailyRate
  const maxFine = dailyRate * 30 // Cap at 30 days
  
  return Math.min(totalFine, maxFine)
}
```

### Route Optimization Algorithm
```typescript
// Find optimal routes for students
const findOptimalRoute = async (
  studentCity: string,
  schoolId: string
  studentId: string
) => {
  // Find routes covering the student's city
  const routes = await db.transportRoute.findMany({
    where: {
      schoolId,
      isActive: true,
      students: { some: { studentId } }
    },
    include: {
      stops: true,
      assignments: { include: { student: true } }
    }
  })
  
  // Find nearest stop
  let optimalRoute = null
  let minDistance = Infinity
  
  for (const route of routes) {
    for (const stop of route.stops) {
      const distance = calculateDistance(studentCity, stop.location)
      if (distance < minDistance) {
        minDistance = distance
        optimalRoute = route
        optimalStop = stop
      }
    }
  }
  
  return { route: optimalRoute, stop: optimalStop, distance: minDistance }
}
```

## 📈 Reports Specification

### 1. Route Utilization Report
```
Header: School logo, name, date range
Content:
  Route-wise student counts
  Vehicle capacity utilization
  Revenue collected per route
  Fuel consumption
  Driver efficiency metrics
  Overdue fee tracking
Charts: Route-wise charts, monthly trends
```

### 2. Vehicle Capacity Report
```
Header: School logo, name, date
Content:
  Vehicle details and assignments
  Capacity utilization percentage
  Maintenance schedule
  Fuel efficiency
  Driver performance
  Cost per km analysis
```

### 3. Student Allocation Report
```
Header: School logo, name, date range
Content:
  Routes and student allocations
  Monthly fee breakdown
  Pickup/drop times
  Vehicle load balancing
  Unassigned students
  Bus stop details
```

### 4. Monthly Transport Report
```
Header: Month, school name
Content:
  Total students using transport
  Total revenue collected
  Monthly expenses (fuel, maintenance)
  Driver payroll
  Route-wise breakdown
  Attendance statistics
  Parent SMS log
```

### 5. Parent SMS Notifications
```
Alert Types:
- Daily boarding confirmation
- Absentee alerts
- Fee payment confirmations
- Route change notifications
- Vehicle breakdown alerts
- Emergency alerts
- Monthly fee reminders
```

## 🚀 Performance Requirements

### Database Optimizations
```prisma
model TransportAssignment {
  @@index([studentId])
  @@index([routeId])
  @@index([academicYearId, status])
  @@index([routeId, academicYearId])
  @@index([studentId, academicYearId, status])
}

model TransportDailyAttendance {
  @@index([studentId, date])
  @@index([routeId, date])
  @@index([date, status])
  @@index([vehicleId, date])
}
```

### API Optimizations
- Result caching for frequently accessed data
- Cursor-based pagination for large lists
- Selective field retrieval
- Batch operations for bulk data

### Frontend Optimizations
- Virtual scrolling for long lists
- Debounced search inputs
- Optimistic UI updates
- Lazy loading for heavy components

## 🎨 UI/UX Requirements

### Layout Structure
```
Sidebar Navigation
├── Dashboard
├── Routes Management
│   ├── All Routes
│   ├── Add Route
│   └── Route Details
├── Vehicles
│   ├── All Vehicles
│   ├── Add Vehicle
│   └── Vehicle Details
├── Assignments
│   ├── Student Assignments
│   ├── Bulk Assign
│   └── Assignment History
├── Attendance
│   ├── Daily Attendance
│   ├── Attendance Calendar
│   └── SMS Settings
├── Fees
│   ├── Fee Structure
│   ├── Fee Collection
│   └── Defaulters List
└── Reports
    ├── Route Utilization
    ├── Vehicle Capacity
    ├── Student Allocation
    ├── Monthly Summary
    └── Driver Performance
```

### Key Features
1. **Interactive Route Map**
   - Visual route display
   - Click to see stop details
   - Student markers on routes
   - Color-coded status indicators

2. **Quick Operations**
   - One-click assignments
   - Bulk status updates
   - Batch fee collection
   - SMS to all route students

3. **Smart Search**
   - Search by route, student name, phone, CNIC
   - Filter by status, class, section
   - Advanced multi-criteria search

4. **Real-time Updates**
   - Live attendance marking
   - Live route status
   - Real-time fee tracking

5. **Mobile Support**
   - Responsive design
   - Touch-friendly interfaces
   - Mobile-first navigation

## 🚨 Implementation Phases

### Phase 1: Foundation (Week 1)
- Database schema setup
- Basic route CRUD operations
- Vehicle management
- Authentication

### Phase 2: Core Features (Weeks 2-3)
- Stop management
- Route-Stop linking
- Basic student assignments
- Vehicle assignment

### Phase 3: Advanced Features (Weeks 4-5)
- Transport attendance
- Fee management
- Reports and analytics
- SMS notifications

### Phase 4: Advanced Features (Week 6)
- Route optimization
- Bulk operations
- Advanced reporting
- Parent portal integration

### Phase 5: Optimization (Week 7)
- Performance tuning
- Load testing
- Caching strategies
- Query optimization

## 📊 Success Metrics

### Performance Metrics
- Route load: < 2 seconds
- Student search: < 500ms
- Bulk assignments: < 3 seconds
- Daily attendance: < 1 second
- Report generation: < 5 seconds
- SMS dispatch: < 1 second

### Quality Metrics
- 99% route assignment accuracy
- 99.5% attendance accuracy
- 100% receipt generation
- 99.9% SMS delivery rate
- 0 data loss

### Scale Requirements
- Support 50+ concurrent routes
- 100+ vehicles
- 50,000+ transport students
- 2,000+ daily attendance records
- 10,000+ fee transactions/month
- 1,000,000+ SMS/year

## 🎯 Next Steps

1. Review and approve plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Create database models
5. Implement core API endpoints
6. Build UI components
7. Integrate with existing modules
8. Test and optimize
9. Document and deploy

## 📁 Document Location

Save this plan to: `/home/z/my-project/docs/TRANSPORT_MANAGEMENT_PLAN.md`
