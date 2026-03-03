/**
 * PDF Generator Utility
 * School Management System — Session 29
 * Uses jsPDF + jsPDF-AutoTable for all document generation
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── SCHOOL BRANDING ─────────────────────────────────────────────────────────
const SCHOOL = {
  name:    'Al-Noor Academy',
  address: '123 Education Street, Lahore, Punjab, Pakistan',
  phone:   '042-1234567',
  email:   'info@alnooracademy.edu.pk',
  website: 'www.alnooracademy.edu.pk',
  tagline: 'Excellence in Education Since 1995',
};

const COLORS = {
  primary:   [26, 86, 219]   as [number,number,number], // #1A56DB
  dark:      [15, 23, 42]    as [number,number,number], // #0F172A
  gray:      [100,116,139]   as [number,number,number], // #64748B
  lightGray: [241,245,249]   as [number,number,number], // #F1F5F9
  white:     [255,255,255]   as [number,number,number],
  red:       [220, 38, 38]   as [number,number,number],
  green:     [22, 163, 74]   as [number,number,number],
  amber:     [217,119, 6]    as [number,number,number],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function schoolHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pw = doc.internal.pageSize.getWidth();

  // Blue header bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pw, 32, 'F');

  // School name
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(SCHOOL.name, 14, 12);

  // Tagline
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(SCHOOL.tagline, 14, 19);

  // Contact info right-aligned
  doc.setFontSize(7.5);
  doc.text([SCHOOL.phone, SCHOOL.email, SCHOOL.website], pw - 14, 10, { align: 'right', lineHeightFactor: 1.5 });

  // Document title bar
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 32, pw, 12, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), pw / 2, 40, { align: 'center' });

  if (subtitle) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, pw / 2, 40, { align: 'center' });
  }

  doc.setTextColor(...COLORS.dark);
  return 50; // return Y position after header
}

function addFooter(doc: jsPDF) {
  const pw   = doc.internal.pageSize.getWidth();
  const ph   = doc.internal.pageSize.getHeight();
  const pages = (doc as any).internal.getNumberOfPages();

  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.lightGray);
    doc.line(14, ph - 12, pw - 14, ph - 12);
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.gray);
    doc.text(SCHOOL.name + ' · ' + SCHOOL.address, 14, ph - 7);
    doc.text(`Page ${i} of ${pages}`, pw - 14, ph - 7, { align: 'right' });
    doc.text(`Generated: ${new Date().toLocaleString('en-PK')}`, pw / 2, ph - 7, { align: 'center' });
  }
}

function labelValue(doc: jsPDF, label: string, value: string, x: number, y: number, labelW = 35) {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.gray);
  doc.text(label + ':', x, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  doc.text(value || '—', x + labelW, y);
}

// ─── 1. FEE CHALLAN ──────────────────────────────────────────────────────────
export function generateFeeChallan(data: {
  student: any; fees: any[]; dueDate: string; challanNo: string; month?: string;
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw  = doc.internal.pageSize.getWidth();

  // Generate 3 copies on one page (school, bank, student)
  const copies = ['School Copy', 'Bank Copy', 'Student Copy'];
  const copyH  = 90; // height per copy

  copies.forEach((copyTitle, ci) => {
    const base = ci * (copyH + 5);

    if (ci > 0) {
      doc.setDrawColor(...COLORS.lightGray);
      (doc as any).setLineDash([3, 2]);
      doc.line(0, base - 3, pw, base - 3);
      (doc as any).setLineDash([]);
    }

    // Header
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, base, pw, 18, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(SCHOOL.name, 14, base + 8);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('FEE CHALLAN · ' + copyTitle, pw - 14, base + 8, { align: 'right' });
    doc.setFontSize(7.5);
    doc.text(SCHOOL.address + ' · ' + SCHOOL.phone, 14, base + 14);

    // Challan info box
    doc.setFillColor(...COLORS.lightGray);
    doc.rect(0, base + 18, pw, 0.5, 'F');

    const startY = base + 22;
    doc.setTextColor(...COLORS.dark);

    // Left column - student info
    labelValue(doc, 'Challan No', data.challanNo, 14, startY);
    labelValue(doc, 'Student Name', data.student?.fullName || '—', 14, startY + 6);
    labelValue(doc, 'Father Name', data.student?.fatherName || '—', 14, startY + 12);
    labelValue(doc, 'Class', `${data.student?.class?.name || '—'} ${data.student?.section?.name || ''}`, 14, startY + 18);

    // Right column
    labelValue(doc, 'Admission #', data.student?.admissionNumber || '—', pw / 2, startY);
    labelValue(doc, 'Month', data.month || '—', pw / 2, startY + 6);
    labelValue(doc, 'Due Date', data.dueDate, pw / 2, startY + 12);
    labelValue(doc, 'Phone', data.student?.fatherPhone || data.student?.guardianPhone || '—', pw / 2, startY + 18);

    // Fee table
    const tableY = startY + 26;
    const fees   = data.fees || [];
    const total  = fees.reduce((s: number, f: any) => s + parseFloat(f.amount || 0), 0);
    const paid   = fees.reduce((s: number, f: any) => s + parseFloat(f.paidAmount || 0), 0);
    const due    = total - paid;

    autoTable(doc, {
      startY: tableY,
      margin: { left: 14, right: 14 },
      head:   [['Fee Description', 'Amount (PKR)', 'Paid (PKR)', 'Balance (PKR)']],
      body:   [
        ...fees.map((f: any) => [
          f.feeType?.name || f.description || 'Fee',
          parseFloat(f.amount || 0).toLocaleString(),
          parseFloat(f.paidAmount || 0).toLocaleString(),
          (parseFloat(f.amount || 0) - parseFloat(f.paidAmount || 0)).toLocaleString(),
        ]),
        [{ content: 'TOTAL', styles: { fontStyle: 'bold' } },
         { content: `PKR ${total.toLocaleString()}`, styles: { fontStyle: 'bold' } },
         { content: `PKR ${paid.toLocaleString()}`, styles: { fontStyle: 'bold' } },
         { content: `PKR ${due.toLocaleString()}`, styles: { fontStyle: 'bold', textColor: due > 0 ? COLORS.red : COLORS.green } }],
      ],
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, cellPadding: 2 },
      alternateRowStyles: { fillColor: COLORS.lightGray },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    });

    // Total due box
    const afterTableY = (doc as any).lastAutoTable.finalY + 3;
    if (due > 0) {
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(14, afterTableY, pw - 28, 8, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.red);
      doc.text(`AMOUNT DUE: PKR ${due.toLocaleString()}  ·  Please pay before ${data.dueDate}`, pw / 2, afterTableY + 5, { align: 'center' });
    } else {
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(14, afterTableY, pw - 28, 8, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.green);
      doc.text('PAID IN FULL — Thank you!', pw / 2, afterTableY + 5, { align: 'center' });
    }
  });

  addFooter(doc);
  doc.save(`fee-challan-${data.challanNo || 'draft'}.pdf`);
}

// ─── 2. REPORT CARD ───────────────────────────────────────────────────────────
export function generateReportCard(data: {
  student: any; marks: any[]; term: string; academicYear: string;
  attendance?: { present: number; total: number };
  remarks?: string; classTeacher?: string; principal?: string;
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw  = doc.internal.pageSize.getWidth();
  let y     = schoolHeader(doc, 'STUDENT REPORT CARD', data.term + ' · ' + data.academicYear);

  // Student info box
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(14, y, pw - 28, 28, 2, 2, 'F');

  const s = data.student || {};
  labelValue(doc, 'Student Name', s.fullName, 18, y + 7);
  labelValue(doc, 'Admission #',  s.admissionNumber, 18, y + 13);
  labelValue(doc, 'Class',        `${s.class?.name || '—'} ${s.section?.name || ''}`, 18, y + 19);
  labelValue(doc, "Father's Name", s.fatherName, pw/2 + 5, y + 7);
  labelValue(doc, 'Roll No',      s.rollNumber || '—', pw/2 + 5, y + 13);
  labelValue(doc, 'Academic Year', data.academicYear, pw/2 + 5, y + 19);

  y += 34;

  // Marks table
  const marks   = data.marks || [];
  const totalObt = marks.reduce((sum: number, m: any) => sum + parseFloat(m.obtainedMarks || m.marksObtained || 0), 0);
  const totalMax  = marks.reduce((sum: number, m: any) => sum + parseFloat(m.totalMarks || m.maxMarks || 100), 0);
  const pct       = totalMax > 0 ? ((totalObt / totalMax) * 100).toFixed(1) : '0';

  const getGrade = (p: number) => {
    if (p >= 90) return ['A+', [0, 128, 0]];
    if (p >= 80) return ['A',  [22, 163, 74]];
    if (p >= 70) return ['B',  [59, 130, 246]];
    if (p >= 60) return ['C',  [217, 119, 6]];
    if (p >= 50) return ['D',  [249, 115, 22]];
    return ['F', [220, 38, 38]];
  };

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head:   [['Subject', 'Max Marks', 'Obtained', 'Percentage', 'Grade']],
    body: [
      ...marks.map((m: any) => {
        const obt = parseFloat(m.obtainedMarks || m.marksObtained || 0);
        const max = parseFloat(m.totalMarks || m.maxMarks || 100);
        const p   = max > 0 ? (obt / max) * 100 : 0;
        const [grade] = getGrade(p);
        return [
          m.subject?.name || m.subjectName || '—',
          max.toFixed(0),
          obt.toFixed(0),
          p.toFixed(1) + '%',
          grade,
        ];
      }),
      [{ content: 'GRAND TOTAL', styles: { fontStyle: 'bold' } },
       { content: totalMax.toFixed(0), styles: { fontStyle: 'bold' } },
       { content: totalObt.toFixed(0), styles: { fontStyle: 'bold' } },
       { content: pct + '%', styles: { fontStyle: 'bold', textColor: parseFloat(pct) >= 50 ? COLORS.green : COLORS.red } },
       { content: getGrade(parseFloat(pct))[0] as string, styles: { fontStyle: 'bold' } }],
    ],
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: COLORS.lightGray },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Attendance + result box
  if (data.attendance) {
    const attPct = data.attendance.total > 0
      ? ((data.attendance.present / data.attendance.total) * 100).toFixed(1)
      : '0';
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(14, y, 85, 18, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('ATTENDANCE RECORD', 18, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Present: ${data.attendance.present} / ${data.attendance.total} days`, 18, y + 10);
    doc.text(`Attendance: ${attPct}%`, 18, y + 15);
  }

  // Final result box
  const finalGrade = getGrade(parseFloat(pct));
  doc.setFillColor(...(parseFloat(pct) >= 50 ? [240, 253, 244] : [254, 242, 242]) as [number,number,number]);
  doc.roundedRect(pw - 90, y, 76, 18, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(finalGrade[1] as [number,number,number]));
  doc.text(`Grade: ${finalGrade[0]}`, pw - 55, y + 7, { align: 'center' });
  doc.setFontSize(8);
  doc.text(`Total: ${totalObt} / ${totalMax} (${pct}%)`, pw - 55, y + 14, { align: 'center' });

  y += 24;

  // Remarks
  if (data.remarks) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text("Teacher's Remarks:", 14, y);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.gray);
    doc.text(data.remarks, 14, y + 5);
    y += 14;
  }

  // Signatures
  y = Math.max(y, doc.internal.pageSize.getHeight() - 38);
  doc.setDrawColor(...COLORS.gray);
  doc.line(14, y, 60, y);
  doc.line(pw/2 - 23, y, pw/2 + 23, y);
  doc.line(pw - 60, y, pw - 14, y);
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.gray);
  doc.setFont('helvetica', 'normal');
  doc.text('Class Teacher', 37, y + 4, { align: 'center' });
  doc.text('Coordinator', pw/2, y + 4, { align: 'center' });
  doc.text('Principal', pw - 37, y + 4, { align: 'center' });
  if (data.classTeacher) doc.text(data.classTeacher, 37, y - 3, { align: 'center' });
  if (data.principal)    doc.text(data.principal, pw - 37, y - 3, { align: 'center' });

  addFooter(doc);
  doc.save(`report-card-${s.admissionNumber || 'draft'}-${data.term}.pdf`);
}

// ─── 3. SALARY SLIP ──────────────────────────────────────────────────────────
export function generateSalarySlip(data: {
  staff: any; month: string; year: string;
  earnings: { label: string; amount: number }[];
  deductions: { label: string; amount: number }[];
  bankName?: string; accountNo?: string;
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw  = doc.internal.pageSize.getWidth();
  let y     = schoolHeader(doc, 'SALARY SLIP', `Month of ${data.month} ${data.year}`);

  // Employee info
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(14, y, pw - 28, 28, 2, 2, 'F');

  const s = data.staff || {};
  labelValue(doc, 'Employee Name',  s.fullName, 18, y + 7);
  labelValue(doc, 'Designation',    s.designation || s.staffType, 18, y + 13);
  labelValue(doc, 'Department',     s.department?.name || '—', 18, y + 19);
  labelValue(doc, 'Employee ID',    s.employeeId || s.id?.slice(0, 8), pw/2 + 5, y + 7);
  labelValue(doc, 'Pay Month',      `${data.month} ${data.year}`, pw/2 + 5, y + 13);
  labelValue(doc, 'Join Date',      s.joiningDate ? new Date(s.joiningDate).toLocaleDateString('en-PK') : '—', pw/2 + 5, y + 19);

  y += 34;

  const totalEarnings   = data.earnings.reduce((s, e) => s + e.amount, 0);
  const totalDeductions = data.deductions.reduce((s, d) => s + d.amount, 0);
  const netPay          = totalEarnings - totalDeductions;

  // Two-column earnings/deductions table
  const colW = (pw - 28 - 6) / 2;

  // Earnings table
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: pw / 2 + 3 },
    head:   [['Earnings', 'Amount (PKR)']],
    body:   [
      ...data.earnings.map(e => [e.label, e.amount.toLocaleString()]),
      [{ content: 'Total Earnings', styles: { fontStyle: 'bold' } },
       { content: `PKR ${totalEarnings.toLocaleString()}`, styles: { fontStyle: 'bold', textColor: COLORS.green } }],
    ],
    headStyles: { fillColor: COLORS.green, textColor: COLORS.white, fontSize: 8 },
    bodyStyles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 1: { halign: 'right' } },
  });

  // Deductions table
  autoTable(doc, {
    startY: y,
    margin: { left: pw / 2 + 3, right: 14 },
    head:   [['Deductions', 'Amount (PKR)']],
    body:   [
      ...data.deductions.map(d => [d.label, d.amount.toLocaleString()]),
      [{ content: 'Total Deductions', styles: { fontStyle: 'bold' } },
       { content: `PKR ${totalDeductions.toLocaleString()}`, styles: { fontStyle: 'bold', textColor: COLORS.red } }],
    ],
    headStyles: { fillColor: COLORS.red, textColor: COLORS.white, fontSize: 8 },
    bodyStyles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 1: { halign: 'right' } },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Net Pay box
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(14, y, pw - 28, 14, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`NET PAY: PKR ${netPay.toLocaleString()}`, pw / 2, y + 9, { align: 'center' });

  y += 20;

  // Bank details
  if (data.bankName || data.accountNo) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Bank Transfer Details:', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    if (data.bankName)  doc.text(`Bank: ${data.bankName}`, 14, y + 6);
    if (data.accountNo) doc.text(`Account: ${data.accountNo}`, 14, y + 11);
    y += 16;
  }

  // Signatures
  y = Math.max(y + 10, doc.internal.pageSize.getHeight() - 38);
  doc.setDrawColor(...COLORS.gray);
  doc.line(14, y, 70, y);
  doc.line(pw - 70, y, pw - 14, y);
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.gray);
  doc.setFont('helvetica', 'normal');
  doc.text("Employee's Signature", 42, y + 4, { align: 'center' });
  doc.text("Authorized Signatory", pw - 42, y + 4, { align: 'center' });
  doc.text(s.fullName || '', 42, y - 3, { align: 'center' });

  addFooter(doc);
  doc.save(`salary-slip-${s.employeeId || s.id?.slice(0,6) || 'draft'}-${data.month}-${data.year}.pdf`);
}

// ─── 4. STUDENT ID CARD (PDF) ─────────────────────────────────────────────────
export function generateIdCardsPDF(students: any[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw  = doc.internal.pageSize.getWidth(); // 210mm
  const ph  = doc.internal.pageSize.getHeight(); // 297mm

  const cardW = 85; const cardH = 54; // Standard credit card size in mm
  const margin = 10;
  const cols   = 2;
  const rows   = 5;
  const gapX   = (pw - 2 * margin - cols * cardW) / (cols - 1);
  const gapY   = (ph - 2 * margin - rows * cardH) / (rows - 1);

  let idx = 0;

  while (idx < students.length) {
    if (idx > 0) doc.addPage();

    for (let row = 0; row < rows && idx < students.length; row++) {
      for (let col = 0; col < cols && idx < students.length; col++) {
        const s  = students[idx++];
        const x  = margin + col * (cardW + gapX);
        const y  = margin + row * (cardH + gapY);

        // Card background
        doc.setFillColor(...COLORS.white);
        doc.setDrawColor(...COLORS.primary);
        doc.roundedRect(x, y, cardW, cardH, 3, 3, 'FD');

        // Header stripe
        doc.setFillColor(...COLORS.primary);
        doc.roundedRect(x, y, cardW, 12, 3, 3, 'F');
        doc.setFillColor(...COLORS.primary);
        doc.rect(x, y + 8, cardW, 4, 'F');

        doc.setTextColor(...COLORS.white);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(SCHOOL.name.toUpperCase(), x + cardW / 2, y + 6, { align: 'center' });
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'normal');
        doc.text('STUDENT IDENTITY CARD', x + cardW / 2, y + 10, { align: 'center' });

        // Avatar circle
        const avatarX = x + 11; const avatarY = y + 24;
        doc.setFillColor(...COLORS.lightGray);
        doc.circle(avatarX, avatarY, 9, 'F');
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.primary);
        doc.text((s.fullName?.[0] || '?').toUpperCase(), avatarX, avatarY + 4, { align: 'center' });

        // Student details
        const tx = x + 22; const ty = y + 16;
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.dark);
        doc.text(s.fullName || '—', tx, ty);

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.gray);
        doc.text(`ID: ${s.admissionNumber || '—'}`, tx, ty + 5);
        doc.text(`Class: ${s.class?.name || '—'} ${s.section?.name || ''}`, tx, ty + 9);
        doc.text(`Father: ${s.fatherName || '—'}`, tx, ty + 13);
        if (s.fatherPhone || s.guardianPhone) {
          doc.text(`Phone: ${s.fatherPhone || s.guardianPhone}`, tx, ty + 17);
        }
        if (s.bloodGroup) {
          doc.setFontSize(6);
          doc.setTextColor(...COLORS.red);
          doc.text(`Blood: ${s.bloodGroup}`, tx, ty + 21);
        }

        // Bottom bar
        doc.setFillColor(...COLORS.lightGray);
        doc.rect(x, y + cardH - 8, cardW, 8, 'F');
        doc.setFontSize(6);
        doc.setTextColor(...COLORS.gray);
        doc.setFont('helvetica', 'normal');
        doc.text(`Valid: ${new Date().getFullYear()}-${new Date().getFullYear() + 1} · ${SCHOOL.phone}`, x + cardW / 2, y + cardH - 3, { align: 'center' });

        // Dashed cut guide
        (doc as any).setLineDash([1, 1]);
        doc.setDrawColor(200, 200, 200);
        doc.roundedRect(x - 1, y - 1, cardW + 2, cardH + 2, 3, 3, 'S');
        (doc as any).setLineDash([]);
      }
    }
  }

  addFooter(doc);
  doc.save(`student-id-cards-${new Date().toISOString().slice(0,10)}.pdf`);
}

// ─── 5. TRANSFER CERTIFICATE ──────────────────────────────────────────────────
export function generateTC(data: {
  student: any; issueDate: string; reason?: string;
  lastAttendance?: string; behaviorRemark?: string; principal?: string;
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw  = doc.internal.pageSize.getWidth();
  let y     = schoolHeader(doc, 'TRANSFER CERTIFICATE');

  // TC Number
  const tcNo = `TC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Certificate No: ${tcNo}`, pw - 14, y - 5, { align: 'right' });

  y += 6;

  // Opening text
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  const s = data.student || {};
  const openingText = `This is to certify that ${s.fullName || '________'}, son/daughter of ${s.fatherName || '________'}, was a regular student of ${SCHOOL.name}.`;
  const textLines = doc.splitTextToSize(openingText, pw - 28);
  doc.text(textLines, 14, y);
  y += textLines.length * 5.5 + 4;

  // Details table
  const details = [
    ['Full Name', s.fullName || '—'],
    ['Admission Number', s.admissionNumber || '—'],
    ["Father's Name", s.fatherName || '—'],
    ["Mother's Name", s.motherName || '—'],
    ['Date of Birth', s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('en-PK') : '—'],
    ['Class Last Attended', `${s.class?.name || '—'} ${s.section?.name || ''}`],
    ['Roll Number', s.rollNumber || '—'],
    ['Date of Admission', s.admissionDate ? new Date(s.admissionDate).toLocaleDateString('en-PK') : '—'],
    ['Date of Leaving', data.lastAttendance || data.issueDate || '—'],
    ['Reason for Leaving', data.reason || '—'],
    ['Behavior & Conduct', data.behaviorRemark || 'Satisfactory'],
    ['Date of Issue', data.issueDate || new Date().toLocaleDateString('en-PK')],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    body:   details,
    bodyStyles: { fontSize: 9.5, cellPadding: 3.5 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: COLORS.gray as [number,number,number], cellWidth: 60, fillColor: COLORS.lightGray as [number,number,number] },
      1: { textColor: COLORS.dark as [number,number,number] },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Closing text
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  doc.text(`We wish ${s.fullName || 'the student'} all the best in future endeavours.`, 14, y);

  // Official seal placeholder
  y += 12;
  doc.setDrawColor(...COLORS.lightGray);
  doc.circle(pw / 2, y + 12, 14, 'S');
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.gray);
  doc.text('OFFICIAL', pw / 2, y + 11, { align: 'center' });
  doc.text('SEAL', pw / 2, y + 15, { align: 'center' });

  // Signatures
  const sigY = Math.max(y + 30, doc.internal.pageSize.getHeight() - 38);
  doc.setDrawColor(...COLORS.gray);
  doc.line(14, sigY, 70, sigY);
  doc.line(pw - 70, sigY, pw - 14, sigY);
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.setFont('helvetica', 'normal');
  doc.text('Class Teacher / Coordinator', 42, sigY + 5, { align: 'center' });
  doc.text('Principal / Head of Institution', pw - 42, sigY + 5, { align: 'center' });
  if (data.principal) doc.text(data.principal, pw - 42, sigY - 3, { align: 'center' });

  addFooter(doc);
  doc.save(`TC-${s.admissionNumber || 'draft'}-${tcNo}.pdf`);
}

// ─── 6. ATTENDANCE REPORT ─────────────────────────────────────────────────────
export function generateAttendanceReport(data: {
  title: string; period: string; rows: any[];
  columns: { header: string; key: string }[];
}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pw  = doc.internal.pageSize.getWidth();
  let y     = schoolHeader(doc, data.title, data.period);

  const headers = data.columns.map(c => c.header);
  const body    = data.rows.map(row => data.columns.map(c => String(row[c.key] ?? '—')));

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head:   [headers],
    body,
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 8.5 },
    bodyStyles: { fontSize: 8, cellPadding: 2 },
    alternateRowStyles: { fillColor: COLORS.lightGray },
  });

  addFooter(doc);
  doc.save(`${data.title.replace(/\s+/g, '-').toLowerCase()}-${data.period}.pdf`);
}

// ─── 7. FEE COLLECTION REPORT ─────────────────────────────────────────────────
export function generateFeeReport(data: {
  title: string; period: string; rows: any[];
  totalCollected: number; totalPending: number; totalAmount: number;
}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pw  = doc.internal.pageSize.getWidth();
  let y     = schoolHeader(doc, data.title, data.period);

  // Summary bar
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(14, y, pw - 28, 12, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text(`Total: PKR ${data.totalAmount.toLocaleString()}`, 20, y + 7);
  doc.setTextColor(...COLORS.green);
  doc.text(`Collected: PKR ${data.totalCollected.toLocaleString()}`, pw / 3, y + 7);
  doc.setTextColor(...COLORS.red);
  doc.text(`Pending: PKR ${data.totalPending.toLocaleString()}`, (pw * 2) / 3, y + 7);
  doc.setTextColor(...COLORS.primary);
  const pct = data.totalAmount > 0 ? ((data.totalCollected / data.totalAmount) * 100).toFixed(1) : '0';
  doc.text(`Recovery: ${pct}%`, pw - 20, y + 7, { align: 'right' });

  y += 17;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head:   [['Student', 'Admission #', 'Class', 'Fee Type', 'Amount', 'Paid', 'Balance', 'Status', 'Date']],
    body:   data.rows.map((r: any) => [
      r.student?.fullName || '—',
      r.student?.admissionNumber || '—',
      r.student?.class?.name || '—',
      r.feeType?.name || '—',
      `PKR ${parseFloat(r.amount || 0).toLocaleString()}`,
      `PKR ${parseFloat(r.paidAmount || 0).toLocaleString()}`,
      `PKR ${(parseFloat(r.amount || 0) - parseFloat(r.paidAmount || 0)).toLocaleString()}`,
      r.status || '—',
      r.paymentDate ? new Date(r.paymentDate).toLocaleDateString('en-PK') : '—',
    ]),
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 7.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, cellPadding: 2 },
    alternateRowStyles: { fillColor: COLORS.lightGray },
  });

  addFooter(doc);
  doc.save(`${data.title.replace(/\s+/g, '-').toLowerCase()}-${data.period}.pdf`);
}

// ─── 8. GENERIC TABLE REPORT ──────────────────────────────────────────────────
export function generateTableReport(data: {
  title: string; subtitle?: string; headers: string[];
  rows: string[][]; orientation?: 'portrait' | 'landscape';
}) {
  const doc = new jsPDF({ orientation: data.orientation || 'portrait', unit: 'mm', format: 'a4' });
  let y     = schoolHeader(doc, data.title, data.subtitle);

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head:   [data.headers],
    body:   data.rows,
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 8.5 },
    bodyStyles: { fontSize: 8, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: COLORS.lightGray },
  });

  addFooter(doc);
  doc.save(`${data.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0,10)}.pdf`);
}
