'use client';

export const dynamic = "force-dynamic"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, CreditCard, Receipt, Award, DollarSign, Users, Download } from 'lucide-react';
import PageHeader from '@/components/page-header';
import {
  generateFeeChallan, generateReportCard, generateSalarySlip,
  generateIdCardsPDF, generateTC, generateAttendanceReport,
  generateTableReport
} from '@/lib/pdf-generator';

const DEMO_STUDENT = {
  id: 'demo-1', fullName: 'Ahmed Ali Khan', admissionNumber: 'ANA-2024-001',
  fatherName: 'Muhammad Ali Khan', motherName: 'Fatima Ali', fatherPhone: '0300-1234567',
  bloodGroup: 'B+', rollNumber: '12', dateOfBirth: '2010-03-15', admissionDate: '2020-04-01',
  class: { name: 'Class 8' }, section: { name: 'A' },
};

const DEMO_STAFF = {
  id: 'staff-1', fullName: 'Mr. Khalid Mahmood', designation: 'Senior Teacher',
  employeeId: 'EMP-001', staffType: 'Teacher', joiningDate: '2018-08-01',
  department: { name: 'Science Department' }, salary: 45000,
};

const DEMO_MARKS = [
  { subject: { name: 'Mathematics' },    obtainedMarks: 87, totalMarks: 100 },
  { subject: { name: 'English' },        obtainedMarks: 79, totalMarks: 100 },
  { subject: { name: 'Urdu' },           obtainedMarks: 82, totalMarks: 100 },
  { subject: { name: 'Science' },        obtainedMarks: 91, totalMarks: 100 },
  { subject: { name: 'Social Studies' }, obtainedMarks: 75, totalMarks: 100 },
  { subject: { name: 'Islamiyat' },      obtainedMarks: 88, totalMarks: 100 },
  { subject: { name: 'Computer' },       obtainedMarks: 94, totalMarks: 100 },
];

const DEMO_FEES = [
  { feeType: { name: 'Tuition Fee' },  amount: 5000, paidAmount: 0 },
  { feeType: { name: 'Exam Fee' },     amount: 500,  paidAmount: 0 },
  { feeType: { name: 'Library Fee' },  amount: 200,  paidAmount: 200 },
  { feeType: { name: 'Computer Fee' }, amount: 800,  paidAmount: 0 },
];

const DEMO_STUDENTS_CARDS = [
  { ...DEMO_STUDENT },
  { ...DEMO_STUDENT, fullName: 'Sara Ahmed', admissionNumber: 'ANA-2024-002', fatherName: 'Ahmed Raza', bloodGroup: 'A+', gender: 'Female' },
  { ...DEMO_STUDENT, fullName: 'Bilal Hassan', admissionNumber: 'ANA-2024-003', fatherName: 'Hassan Ali', bloodGroup: 'O+', class: { name: 'Class 9' } },
  { ...DEMO_STUDENT, fullName: 'Zainab Khan', admissionNumber: 'ANA-2024-004', fatherName: 'Khan Sahib', bloodGroup: 'AB+', gender: 'Female', class: { name: 'Class 7' } },
  { ...DEMO_STUDENT, fullName: 'Usman Tariq', admissionNumber: 'ANA-2024-005', fatherName: 'Tariq Mehmood', bloodGroup: 'B-', class: { name: 'Class 10' } },
  { ...DEMO_STUDENT, fullName: 'Ayesha Malik', admissionNumber: 'ANA-2024-006', fatherName: 'Malik Saeed', bloodGroup: 'O+', gender: 'Female', class: { name: 'Class 8' } },
];

export default function PDFDemoPage() {
  const [generating, setGenerating] = useState<string | null>(null);

  const gen = async (type: string, fn: () => void) => {
    setGenerating(type);
    try { await new Promise(r => setTimeout(r, 100)); fn(); await new Promise(r => setTimeout(r, 500)); }
    finally { setGenerating(null); }
  };

  const pdfs = [
    {
      title: 'Fee Challan',
      description: '3-copy challan (School, Bank, Student) with itemized fee breakdown and due date',
      icon: Receipt, colorBorder: 'border-l-blue-500', colorBg: 'bg-blue-50', iconColor: 'text-blue-600',
      badge: 'Finance',
      fn: () => generateFeeChallan({ student: DEMO_STUDENT, fees: DEMO_FEES, dueDate: new Date(Date.now() + 10*86400000).toLocaleDateString('en-PK'), challanNo: 'CH-2024-0001-5678', month: 'January 2025' }),
    },
    {
      title: 'Report Card',
      description: 'Full academic report with subject grades, attendance record & teacher remarks',
      icon: Award, colorBorder: 'border-l-green-500', colorBg: 'bg-green-50', iconColor: 'text-green-600',
      badge: 'Academic',
      fn: () => generateReportCard({ student: DEMO_STUDENT, marks: DEMO_MARKS, term: 'Annual Examination 2024-25', academicYear: '2024-2025', attendance: { present: 180, total: 200 }, remarks: 'Excellent performance! Keep up the great work.', classTeacher: 'Mr. Abdullah Shah', principal: 'Dr. Rizwan Ahmed' }),
    },
    {
      title: 'Salary Slip',
      description: 'Employee salary slip with earnings, deductions and net pay calculation',
      icon: DollarSign, colorBorder: 'border-l-amber-500', colorBg: 'bg-amber-50', iconColor: 'text-amber-600',
      badge: 'HR / Payroll',
      fn: () => generateSalarySlip({ staff: DEMO_STAFF, month: 'January', year: '2025', earnings: [{ label: 'Basic Salary', amount: 45000 }, { label: 'House Rent Allowance', amount: 15000 }, { label: 'Medical Allowance', amount: 3000 }, { label: 'Conveyance', amount: 2000 }], deductions: [{ label: 'Income Tax', amount: 4500 }, { label: 'Provident Fund', amount: 2250 }, { label: 'EOBI', amount: 370 }], bankName: 'Habib Bank Limited', accountNo: '1234-5678-9012' }),
    },
    {
      title: 'Student ID Cards',
      description: '10 credit card-sized ID cards per A4 page — ready to print and cut',
      icon: CreditCard, colorBorder: 'border-l-purple-500', colorBg: 'bg-purple-50', iconColor: 'text-purple-600',
      badge: 'Administration',
      fn: () => generateIdCardsPDF(DEMO_STUDENTS_CARDS),
    },
    {
      title: 'Transfer Certificate',
      description: 'Official TC with student details, conduct remark, seal area & signatures',
      icon: FileText, colorBorder: 'border-l-red-500', colorBg: 'bg-red-50', iconColor: 'text-red-600',
      badge: 'Administration',
      fn: () => generateTC({ student: DEMO_STUDENT, issueDate: new Date().toLocaleDateString('en-PK'), reason: 'Family Relocation', lastAttendance: new Date(Date.now() - 2*86400000).toLocaleDateString('en-PK'), behaviorRemark: 'Excellent — respectful and hardworking', principal: 'Dr. Rizwan Ahmed' }),
    },
    {
      title: 'Attendance Report',
      description: 'Landscape tabular attendance report with per-student statistics',
      icon: Users, colorBorder: 'border-l-teal-500', colorBg: 'bg-teal-50', iconColor: 'text-teal-600',
      badge: 'Reports',
      fn: () => generateAttendanceReport({ title: 'Attendance Report', period: 'January 2025', columns: [{ header: 'Student Name', key: 'name' }, { header: 'Class', key: 'class' }, { header: 'Present', key: 'present' }, { header: 'Absent', key: 'absent' }, { header: 'Percentage', key: 'pct' }], rows: DEMO_STUDENTS_CARDS.map(s => ({ name: s.fullName, class: s.class?.name, present: '18', absent: '2', pct: '90%' })) }),
    },
    {
      title: 'Generic Table Report',
      description: 'Any structured data as a formatted table — reusable for any list report',
      icon: FileText, colorBorder: 'border-l-gray-400', colorBg: 'bg-gray-50', iconColor: 'text-gray-600',
      badge: 'Reports',
      fn: () => generateTableReport({ title: 'Student List Report', subtitle: 'Class 8 — January 2025', headers: ['#', 'Name', 'Admission #', 'Class', 'Father Name', 'Phone'], rows: DEMO_STUDENTS_CARDS.map((s, i) => [String(i+1), s.fullName, s.admissionNumber, s.class?.name, s.fatherName, s.fatherPhone || '—']) }),
    },
  ];

  const integrations = [
    { page: 'Fee Challan', path: '/fee-challan', done: true },
    { page: 'Report Cards', path: '/rpt-cards', done: true },
    { page: 'Salary Slips', path: '/salary-slips', done: true },
    { page: 'TC Issuance', path: '/tc-issuance', done: true },
    { page: 'Student ID Portal', path: '/student-ids', done: true },
    { page: 'Attendance Reports', path: '/att-reports', done: true },
    { page: 'Financial Reports', path: '/fin-reports', done: true },
    { page: 'Exam Results', path: '/exam-results', done: true },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="PDF Generator"
        description="All document types powered by jsPDF — browser-based, no server required"
        actions={<Badge className="bg-green-100 text-green-700 text-sm px-3 py-1">✅ jsPDF Active</Badge>}
      />

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 flex gap-3">
        <span className="text-xl">📄</span>
        <div>
          <strong>100% client-side PDF generation</strong> — PDFs are generated instantly in your browser using jsPDF. No server load, no latency. All documents include school branding, headers, footers, and page numbers automatically.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
        {pdfs.map(({ title, description, icon: Icon, colorBorder, colorBg, iconColor, badge, fn }) => (
          <Card key={title} className={`border-l-4 ${colorBorder} card-hover`}>
            <CardContent className="p-5 flex flex-col h-full">
              <div className="flex items-start justify-between mb-3">
                <div className={`h-10 w-10 rounded-xl ${colorBg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <Badge variant="outline" className="text-xs">{badge}</Badge>
              </div>
              <h3 className="font-semibold text-sm mb-1.5">{title}</h3>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed flex-1">{description}</p>
              <Button
                className="w-full h-9 text-sm"
                onClick={() => gen(title, fn)}
                disabled={generating === title}
                variant="outline"
              >
                {generating === title ? (
                  <><div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-foreground animate-spin mr-2" />Generating...</>
                ) : (
                  <><Download className="h-4 w-4 mr-2" />Download PDF</>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Pages with PDF Integration</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {integrations.map(({ page, done }) => (
              <div key={page} className={`flex items-center gap-2 text-sm p-2.5 rounded-lg ${done ? 'bg-green-50 text-green-700' : 'bg-muted/40 text-muted-foreground'}`}>
                <span>{done ? '✅' : '⏳'}</span><span className="font-medium">{page}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
