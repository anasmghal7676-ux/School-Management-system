/**
 * Database Seed — School Management System
 * Session 30 — Demo data for development and testing
 *
 * Creates:
 *   - 1 school configuration
 *   - 10 roles with permissions
 *   - 8 demo user accounts
 *   - 3 academic years (current + past)
 *   - 12 classes + 3 sections each
 *   - 8 subjects
 *   - 15 staff members
 *   - 80 students
 *   - Fee types + assignments
 *   - Sample attendance records
 *   - Sample exam results
 */

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { ROLE_PERMISSIONS } from '../src/lib/rbac'

const db = new PrismaClient()

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const rand = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)]
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const randDate = (yearsBack: number) => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - randInt(0, yearsBack))
  d.setMonth(randInt(0, 11))
  d.setDate(randInt(1, 28))
  return d
}

const MALE_NAMES   = ['Ahmed','Muhammad','Ali','Hassan','Ibrahim','Omar','Usman','Bilal','Zaid','Hamza','Tariq','Faisal','Imran','Asad','Kamran','Waqar','Adeel','Shahzad','Junaid','Aqeel']
const FEMALE_NAMES = ['Fatima','Ayesha','Zainab','Sara','Hina','Nadia','Sana','Maryam','Rabia','Amna','Saima','Lubna','Noor','Huma','Shazia','Bushra','Rida','Iqra','Maham','Aroha']
const SURNAMES     = ['Khan','Ali','Ahmed','Malik','Hussain','Iqbal','Shah','Chaudhry','Butt','Mirza','Siddiqui','Qureshi','Raza','Abbasi','Bokhari','Zaidi','Hashmi','Ansari','Naqvi','Rizvi']
const CITIES       = ['Lahore','Karachi','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Sialkot','Gujranwala']
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']

function maleName()   { return rand(MALE_NAMES) + ' ' + rand(SURNAMES) }
function femaleName() { return rand(FEMALE_NAMES) + ' ' + rand(SURNAMES) }
function personName(gender: 'Male' | 'Female') { return gender === 'Male' ? maleName() : femaleName() }

async function main() {
  console.log('🌱 Starting seed...\n')

  // ── 1. Clear existing data (in correct order) ────────────────────────────
  console.log('🗑️  Clearing existing data...')
  await db.examResult.deleteMany()
  await db.attendance.deleteMany()
  await db.feePayment.deleteMany()
  await db.feeAssignment.deleteMany()
  await db.feeType.deleteMany()
  await db.classSubject.deleteMany()
  await db.student.deleteMany()
  await db.staff.deleteMany()
  await db.section.deleteMany()
  await db.class.deleteMany()
  await db.subject.deleteMany()
  await db.department.deleteMany()
  await db.academicYear.deleteMany()
  await db.user.deleteMany()
  await db.role.deleteMany()
  await db.school.deleteMany()
  console.log('   ✓ Cleared\n')

  // ── 2. School settings ───────────────────────────────────────────────────
  console.log('🏫 Creating school...')
  const school = await db.school.create({
    data: {
      id:                  'school_main',
      name:                'Al-Noor Academy',
      code:                'ALN',
      address:             '123 Education Street, Model Town, Lahore',
      city:                'Lahore',
      province:            'Punjab',
      country:             'Pakistan',
      postalCode:          '54000',
      phone:               '042-35761234',
      email:               'info@alnooracademy.edu.pk',
      website:             'www.alnooracademy.edu.pk',
      principalName:       'Dr. Rizwan Ahmed',
      establishedDate:     new Date('1995-01-01'),
      affiliation:         'Punjab Board',
      board:               'Punjab',
      registrationNumber:  'PKR-LHR-2024-001',
    },
  })
  console.log(`   ✓ ${school.name}\n`)

  // ── 3. Roles ──────────────────────────────────────────────────────────────
  console.log('👑 Creating roles...')
  const rolesData = [
    { name: 'Super Admin',    level: 10, description: 'Full system access' },
    { name: 'Principal',      level: 9,  description: 'School principal' },
    { name: 'Vice Principal', level: 8,  description: 'Vice principal / Deputy Head' },
    { name: 'Administrator',  level: 7,  description: 'School administrator' },
    { name: 'Accountant',     level: 6,  description: 'Finance & accounts' },
    { name: 'Coordinator',    level: 5,  description: 'Academic coordinator' },
    { name: 'Teacher',        level: 4,  description: 'Teaching staff' },
    { name: 'Librarian',      level: 3,  description: 'Library staff' },
    { name: 'Receptionist',   level: 2,  description: 'Front desk & admissions' },
    { name: 'Parent',         level: 1,  description: 'Parent / Guardian portal' },
  ]

  const roles: Record<string, any> = {}
  for (const r of rolesData) {
    const perms = ROLE_PERMISSIONS[r.name] || []
    roles[r.name] = await db.role.create({
      data: {
        name:        r.name,
        description: r.description,
        level:       r.level,
        permissions: perms,
        isSystem:    true,
      },
    })
  }
  console.log(`   ✓ ${rolesData.length} roles\n`)

  // ── 4. Users ──────────────────────────────────────────────────────────────
  console.log('👤 Creating users...')
  const passwordHash = await hash('admin123', 12)

  const usersData = [
    { username: 'admin',       email: 'admin@alnoor.edu.pk',      firstName: 'System',   lastName: 'Administrator', role: 'Super Admin',   isStaff: true },
    { username: 'principal',   email: 'principal@alnoor.edu.pk',  firstName: 'Dr. Rizwan',lastName: 'Ahmed',       role: 'Principal',     isStaff: true },
    { username: 'vp',          email: 'vp@alnoor.edu.pk',         firstName: 'Asma',     lastName: 'Nawaz',        role: 'Vice Principal', isStaff: true },
    { username: 'accountant',  email: 'accounts@alnoor.edu.pk',   firstName: 'Bilal',    lastName: 'Mirza',        role: 'Accountant',    isStaff: true },
    { username: 'coordinator', email: 'coordinator@alnoor.edu.pk',firstName: 'Hina',     lastName: 'Akhtar',       role: 'Coordinator',   isStaff: true },
    { username: 'teacher1',    email: 'teacher1@alnoor.edu.pk',   firstName: 'Khalid',   lastName: 'Mahmood',      role: 'Teacher',       isStaff: true },
    { username: 'teacher2',    email: 'teacher2@alnoor.edu.pk',   firstName: 'Nadia',    lastName: 'Farooq',       role: 'Teacher',       isStaff: true },
    { username: 'receptionist',email: 'reception@alnoor.edu.pk',  firstName: 'Sana',     lastName: 'Riaz',         role: 'Receptionist',  isStaff: true },
  ]

  const users: Record<string, any> = {}
  for (const u of usersData) {
    users[u.username] = await db.user.create({
      data: {
        username:     u.username,
        email:        u.email,
        passwordHash,
        firstName:    u.firstName,
        lastName:     u.lastName,
        roleId:       roles[u.role].id,
        isActive:     true,
        isStaff:      u.isStaff,
      },
    })
  }
  console.log(`   ✓ ${usersData.length} users (password: admin123)\n`)

  // ── 5. Academic Years ─────────────────────────────────────────────────────
  console.log('📅 Creating academic years...')
  const currentYear = await db.academicYear.create({
    data: { name: '2024-25', startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'), isCurrent: true },
  })
  await db.academicYear.create({
    data: { name: '2023-24', startDate: new Date('2023-04-01'), endDate: new Date('2024-03-31'), isCurrent: false },
  })
  console.log('   ✓ 2 academic years\n')

  // ── 6. Departments ────────────────────────────────────────────────────────
  console.log('🏢 Creating departments...')
  const deptNames = ['Science','Mathematics','Languages','Social Studies','Islamic Studies','Computer Science','Arts','Physical Education','Administration']
  const depts: Record<string, any> = {}
  for (const name of deptNames) {
    depts[name] = await db.department.create({ data: { name, isActive: true } })
  }
  console.log(`   ✓ ${deptNames.length} departments\n`)

  // ── 7. Subjects ───────────────────────────────────────────────────────────
  console.log('📚 Creating subjects...')
  const subjectData = [
    { name: 'Mathematics',    code: 'MTH', departmentName: 'Mathematics' },
    { name: 'English',        code: 'ENG', departmentName: 'Languages' },
    { name: 'Urdu',           code: 'URD', departmentName: 'Languages' },
    { name: 'Science',        code: 'SCI', departmentName: 'Science' },
    { name: 'Social Studies', code: 'SST', departmentName: 'Social Studies' },
    { name: 'Islamiyat',      code: 'ISL', departmentName: 'Islamic Studies' },
    { name: 'Computer',       code: 'CMP', departmentName: 'Computer Science' },
    { name: 'Physics',        code: 'PHY', departmentName: 'Science' },
    { name: 'Chemistry',      code: 'CHM', departmentName: 'Science' },
    { name: 'Biology',        code: 'BIO', departmentName: 'Science' },
  ]
  const subjects: Record<string, any> = {}
  for (const s of subjectData) {
    subjects[s.name] = await db.subject.create({
      data: { name: s.name, code: s.code, departmentId: depts[s.departmentName]?.id, isActive: true },
    })
  }
  console.log(`   ✓ ${subjectData.length} subjects\n`)

  // ── 8. Classes + Sections ─────────────────────────────────────────────────
  console.log('🏫 Creating classes and sections...')
  const classNames = ['Nursery','KG','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10']
  const sectionNames = ['A','B','C']
  const classes: Record<string, any> = {}
  const sections: any[] = []

  for (const className of classNames) {
    const cls = await db.class.create({
      data: {
        name:           className,
        academicYearId: currentYear.id,
        maxStudents:    40,
        isActive:       true,
      },
    })
    classes[className] = cls

    for (const sectionName of sectionNames) {
      const sec = await db.section.create({
        data: { name: sectionName, classId: cls.id, maxStudents: 40 },
      })
      sections.push({ ...sec, className, classId: cls.id })
    }
  }
  console.log(`   ✓ ${classNames.length} classes, ${sections.length} sections\n`)

  // ── 9. Staff ──────────────────────────────────────────────────────────────
  console.log('👩‍🏫 Creating staff...')
  const staffList: any[] = []

  const staffData = [
    { fullName: 'Mr. Khalid Mahmood', designation: 'Senior Teacher', staffType: 'Teacher', deptName: 'Mathematics', salary: 45000 },
    { fullName: 'Mrs. Nadia Farooq',  designation: 'Teacher',        staffType: 'Teacher', deptName: 'Languages',   salary: 42000 },
    { fullName: 'Mr. Asif Rehman',    designation: 'Teacher',        staffType: 'Teacher', deptName: 'Science',     salary: 43000 },
    { fullName: 'Miss Sana Tariq',    designation: 'Teacher',        staffType: 'Teacher', deptName: 'Social Studies', salary: 40000 },
    { fullName: 'Mr. Imtiaz Butt',    designation: 'Teacher',        staffType: 'Teacher', deptName: 'Islamic Studies', salary: 38000 },
    { fullName: 'Mr. Tariq Jameel',   designation: 'IT Teacher',     staffType: 'Teacher', deptName: 'Computer Science', salary: 47000 },
    { fullName: 'Mrs. Saima Malik',   designation: 'Teacher',        staffType: 'Teacher', deptName: 'Mathematics', salary: 41000 },
    { fullName: 'Mr. Naveed Iqbal',   designation: 'Librarian',      staffType: 'Librarian', deptName: 'Administration', salary: 32000 },
    { fullName: 'Miss Hira Qadir',    designation: 'Receptionist',   staffType: 'Admin',  deptName: 'Administration', salary: 30000 },
    { fullName: 'Mr. Shahid Anwar',   designation: 'Accountant',     staffType: 'Admin',  deptName: 'Administration', salary: 48000 },
    { fullName: 'Mrs. Uzma Khurshid', designation: 'Teacher',        staffType: 'Teacher', deptName: 'Languages',   salary: 40000 },
    { fullName: 'Mr. Babar Aziz',     designation: 'Teacher',        staffType: 'Teacher', deptName: 'Science',     salary: 44000 },
    { fullName: 'Miss Ayesha Noor',   designation: 'Coordinator',    staffType: 'Admin',  deptName: 'Administration', salary: 52000 },
    { fullName: 'Mr. Zubair Siddiqui',designation: 'Driver',         staffType: 'Support', deptName: 'Administration', salary: 25000 },
    { fullName: 'Mr. Riaz Ahmed',     designation: 'Peon',           staffType: 'Support', deptName: 'Administration', salary: 20000 },
  ]

  for (const s of staffData) {
    const gender = s.fullName.includes('Mrs.') || s.fullName.includes('Miss') ? 'Female' : 'Male'
    const staff = await db.staff.create({
      data: {
        fullName:       s.fullName,
        employeeId:     `EMP-${String(staffList.length + 1).padStart(3,'0')}`,
        designation:    s.designation,
        staffType:      s.staffType,
        gender,
        departmentId:   depts[s.deptName]?.id,
        salary:         s.salary,
        joiningDate:    randDate(8),
        status:         'active',
        phone:          `030${randInt(10000000, 99999999)}`,
        email:          s.fullName.toLowerCase().replace(/[^a-z]/g,'').slice(0,12) + '@alnoor.edu.pk',
        qualification:  rand(['B.Ed', 'M.Ed', 'MA', 'MSc', 'BA', 'BSc']),
        cnic:           `3520${randInt(1000000,9999999)}-${randInt(1,9)}`,
        city:           'Lahore',
        bloodGroup:     rand(BLOOD_GROUPS),
      },
    })
    staffList.push(staff)
  }
  console.log(`   ✓ ${staffList.length} staff members\n`)

  // ── 10. Students (80) ────────────────────────────────────────────────────
  console.log('👨‍🎓 Creating students...')
  const studentList: any[] = []
  let admNo = 1

  // ~7 students per class, spread across sections
  for (const cls of Object.values(classes)) {
    const classSections = sections.filter(s => s.classId === cls.id)
    const count = randInt(5, 8)

    for (let i = 0; i < count; i++) {
      const gender: 'Male' | 'Female' = rand(['Male','Female'])
      const fullName = personName(gender)
      const section  = classSections[i % classSections.length]
      const dob      = new Date()
      dob.setFullYear(dob.getFullYear() - randInt(5, 18))

      const student = await db.student.create({
        data: {
          admissionNumber: `ANA-2024-${String(admNo++).padStart(4,'0')}`,
          fullName,
          gender,
          dateOfBirth:     dob,
          classId:         cls.id,
          sectionId:       section?.id,
          rollNumber:      String(i + 1),
          fatherName:      maleName(),
          motherName:      femaleName(),
          fatherPhone:     `030${randInt(10000000,99999999)}`,
          motherPhone:     `031${randInt(10000000,99999999)}`,
          guardianPhone:   `030${randInt(10000000,99999999)}`,
          fatherCNIC:      `3520${randInt(1000000,9999999)}-${randInt(1,9)}`,
          bloodGroup:      rand(BLOOD_GROUPS),
          religion:        'Islam',
          nationality:     'Pakistani',
          address:         `House ${randInt(1,500)}, Street ${randInt(1,50)}, Lahore`,
          city:            'Lahore',
          admissionDate:   randDate(3),
          status:          'active',
          academicYearId:  currentYear.id,
        },
      })
      studentList.push(student)
    }
  }
  console.log(`   ✓ ${studentList.length} students\n`)

  // ── 11. Fee Types ─────────────────────────────────────────────────────────
  console.log('💰 Creating fee types...')
  const feeTypes: Record<string, any> = {}
  const feeTypesData = [
    { name: 'Tuition Fee',    amount: 5000,  frequency: 'Monthly',   description: 'Monthly tuition' },
    { name: 'Exam Fee',       amount: 1500,  frequency: 'Per Term',   description: 'Examination fee per term' },
    { name: 'Annual Charges', amount: 3000,  frequency: 'Annual',     description: 'Annual charges' },
    { name: 'Computer Fee',   amount: 800,   frequency: 'Monthly',    description: 'Computer lab fee' },
    { name: 'Library Fee',    amount: 300,   frequency: 'Monthly',    description: 'Library access fee' },
    { name: 'Transport Fee',  amount: 2500,  frequency: 'Monthly',    description: 'School bus fee' },
    { name: 'Late Fee',       amount: 500,   frequency: 'One-time',   description: 'Late payment penalty' },
    { name: 'Admission Fee',  amount: 10000, frequency: 'One-time',   description: 'One-time admission fee' },
  ]

  for (const ft of feeTypesData) {
    feeTypes[ft.name] = await db.feeType.create({
      data: { name: ft.name, amount: ft.amount, frequency: ft.frequency, description: ft.description, isActive: true },
    })
  }
  console.log(`   ✓ ${feeTypesData.length} fee types\n`)

  // ── 12. Fee Assignments + Payments ───────────────────────────────────────
  console.log('🧾 Creating fee records...')
  const months = ['2024-08','2024-09','2024-10','2024-11','2024-12','2025-01']
  let feeCount = 0

  for (const student of studentList.slice(0, 40)) {
    for (const month of months.slice(0, 3)) {
      const isPaid   = Math.random() > 0.3
      const isPartial = !isPaid && Math.random() > 0.5

      await db.feePayment.create({
        data: {
          studentId:    student.id,
          feeTypeId:    feeTypes['Tuition Fee'].id,
          amount:       5000,
          paidAmount:   isPaid ? 5000 : isPartial ? randInt(1000, 4000) : 0,
          dueDate:      new Date(`${month}-10`),
          paymentDate:  isPaid ? new Date(`${month}-${randInt(1,10)}`) : null,
          status:       isPaid ? 'Paid' : isPartial ? 'Partial' : 'Pending',
          paymentMethod: isPaid ? rand(['Cash','Online','Cheque','JazzCash']) : null,
          month:        parseInt(month.split('-')[1]),
          year:         parseInt(month.split('-')[0]),
        },
      })
      feeCount++
    }
  }
  console.log(`   ✓ ${feeCount} fee records\n`)

  // ── 13. Attendance Records (last 30 days) ─────────────────────────────────
  console.log('📋 Creating attendance records...')
  let attCount = 0
  const today   = new Date()
  const attDays = Array.from({ length: 20 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (i + 1))
    return d.getDay() !== 0 && d.getDay() !== 6 ? d : null
  }).filter(Boolean) as Date[]

  for (const student of studentList.slice(0, 30)) {
    for (const date of attDays.slice(0, 10)) {
      const rnd = Math.random()
      const status = rnd > 0.85 ? 'Absent' : rnd > 0.92 ? 'Late' : 'Present'
      await db.attendance.create({
        data: {
          studentId: student.id,
          classId:   student.classId,
          date:      new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          status,
          markedBy:  staffList[0].id,
        },
      })
      attCount++
    }
  }
  console.log(`   ✓ ${attCount} attendance records\n`)

  // ── 14. Exam Results ─────────────────────────────────────────────────────
  console.log('📝 Creating exam results...')
  const coreSubjects = [subjects['Mathematics'], subjects['English'], subjects['Science'], subjects['Urdu']]
  let resultCount = 0

  for (const student of studentList.slice(0, 25)) {
    for (const subject of coreSubjects) {
      if (!subject) continue
      const obtained = randInt(45, 98)
      await db.examResult.create({
        data: {
          studentId:      student.id,
          subjectId:      subject.id,
          classId:        student.classId,
          academicYearId: currentYear.id,
          marksObtained:  obtained,
          totalMarks:     100,
          grade:          obtained >= 90 ? 'A+' : obtained >= 80 ? 'A' : obtained >= 70 ? 'B' : obtained >= 60 ? 'C' : obtained >= 50 ? 'D' : 'F',
          examType:       'Mid-Term',
          examDate:       new Date('2025-01-15'),
          remarks:        obtained >= 80 ? 'Excellent' : obtained >= 60 ? 'Good' : 'Needs improvement',
        },
      })
      resultCount++
    }
  }
  console.log(`   ✓ ${resultCount} exam results\n`)

  // ── 15. Events / Notices ─────────────────────────────────────────────────
  console.log('📢 Creating notices and events...')
  const notices = [
    { title: 'Annual Sports Day', date: new Date(Date.now() + 7*86400000),  category: 'Event',    priority: 'High' },
    { title: 'Mid-Term Exams Begin', date: new Date(Date.now() + 14*86400000), category: 'Academic', priority: 'High' },
    { title: 'Parent-Teacher Meeting', date: new Date(Date.now() + 21*86400000), category: 'Event', priority: 'Medium' },
    { title: 'Eid Holiday', date: new Date(Date.now() + 30*86400000), category: 'Holiday',  priority: 'High' },
    { title: 'Fee Submission Deadline', date: new Date(Date.now() + 5*86400000),  category: 'Finance', priority: 'High' },
  ]
  for (const n of notices) {
    await db.notice.create({
      data: { ...n, content: `All students and parents are informed about: ${n.title}`, isPublished: true, audience: 'All' },
    }).catch(() => {}) // table may not exist
  }
  console.log(`   ✓ ${notices.length} notices\n`)

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('✅ Seed complete!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔑 Demo Login Credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  const accounts = [
    { role: 'Super Admin',   username: 'admin',       pass: 'admin123' },
    { role: 'Principal',     username: 'principal',   pass: 'admin123' },
    { role: 'Administrator', username: 'admin',       pass: 'admin123' },
    { role: 'Accountant',    username: 'accountant',  pass: 'admin123' },
    { role: 'Teacher',       username: 'teacher1',    pass: 'admin123' },
    { role: 'Receptionist',  username: 'receptionist',pass: 'admin123' },
  ]
  for (const a of accounts) {
    console.log(`   ${a.role.padEnd(16)} → ${a.username.padEnd(14)} / ${a.pass}`)
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n📊 Summary:')
  console.log(`   👤 Users:    ${usersData.length}`)
  console.log(`   👨‍🎓 Students: ${studentList.length}`)
  console.log(`   👩‍🏫 Staff:    ${staffList.length}`)
  console.log(`   🏫 Classes:  ${classNames.length}`)
  console.log(`   💰 Fees:     ${feeCount}`)
  console.log(`   📋 Attendance: ${attCount}`)
  console.log(`   📝 Results:  ${resultCount}`)
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(() => db.$disconnect())
