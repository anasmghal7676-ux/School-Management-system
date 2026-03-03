import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/bulk-import
// Body: { type: 'students'|'staff', rows: [validated rows from preview] }
// Commits rows that are valid

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, rows } = body;

    if (!type || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, message: 'type and rows required' }, { status: 400 });
    }

    const school = await db.school.findFirst({ select: { id: true } });
    if (!school) return NextResponse.json({ success: false, message: 'School not configured' }, { status: 400 });

    let created = 0;
    let failed  = 0;
    const errors: string[] = [];

    if (type === 'students') {
      // Generate starting admission number
      const lastStudent = await db.student.findFirst({
        orderBy: { admissionNumber: 'desc' },
        select: { admissionNumber: true },
      });
      let admSeq = 1;
      if (lastStudent?.admissionNumber) {
        const m = lastStudent.admissionNumber.match(/(\d+)$/);
        if (m) admSeq = parseInt(m[1]) + 1;
      }
      const year = new Date().getFullYear();

      for (const row of rows) {
        // Skip rows already marked invalid by caller
        if (row._skip) continue;
        try {
          const admissionNumber = row.admissionNumber?.trim()
            || `ADM-${year}-${String(admSeq).padStart(4, '0')}`;
          admSeq++;

          const fullName = `${row.firstName || ''} ${row.middleName || ''} ${row.lastName || ''}`.replace(/\s+/g, ' ').trim();

          await db.student.create({
            data: {
              schoolId:         school.id,
              admissionNumber,
              rollNumber:       row.rollNumber?.trim() || String(admSeq),
              firstName:        row.firstName.trim(),
              middleName:       row.middleName?.trim() || null,
              lastName:         row.lastName.trim(),
              fullName,
              gender:           row.gender?.trim() || 'Male',
              dateOfBirth:      new Date(row.dateOfBirth.trim()),
              bloodGroup:       row.bloodGroup?.trim() || null,
              religion:         row.religion?.trim() || 'Islam',
              nationality:      row.nationality?.trim() || 'Pakistani',
              category:         row.category?.trim() || 'General',
              currentClassId:   row.resolvedClassId,
              currentSectionId: row.resolvedSectionId || null,
              admissionDate:    new Date(),
              status:           'active',
              fatherName:       row.fatherName.trim(),
              fatherPhone:      row.fatherPhone.trim(),
              fatherCnic:       row.fatherCnic?.trim() || null,
              fatherOccupation: row.fatherOccupation?.trim() || null,
              motherName:       row.motherName?.trim() || null,
              motherPhone:      row.motherPhone?.trim() || null,
              address:          row.address?.trim() || '',
              city:             row.city?.trim() || '',
              province:         row.province?.trim() || '',
              phone:            row.phone?.trim() || row.fatherPhone?.trim() || '',
              emergencyContact: row.emergencyContact?.trim() || null,
              emergencyPhone:   row.emergencyPhone?.trim() || null,
              medicalConditions:row.medicalConditions?.trim() || null,
            },
          });
          created++;
        } catch (err: any) {
          failed++;
          errors.push(`Row ${row._rowIndex || '?'}: ${err.message}`);
        }
      }
    } else if (type === 'staff') {
      let empSeq = 1;
      const lastStaff = await db.staff.findFirst({ orderBy: { employeeCode: 'desc' }, select: { employeeCode: true } });
      if (lastStaff?.employeeCode) {
        const m = lastStaff.employeeCode.match(/(\d+)$/);
        if (m) empSeq = parseInt(m[1]) + 1;
      }

      for (const row of rows) {
        if (row._skip) continue;
        try {
          const employeeCode = row.employeeCode?.trim() || `EMP-${String(empSeq).padStart(4, '0')}`;
          empSeq++;

          await db.staff.create({
            data: {
              schoolId:       school.id,
              employeeCode,
              firstName:      row.firstName.trim(),
              lastName:       row.lastName.trim(),
              gender:         row.gender?.trim() || 'Male',
              dateOfBirth:    new Date(row.dateOfBirth.trim()),
              phone:          row.phone.trim(),
              alternatePhone: row.alternatePhone?.trim() || null,
              email:          row.email.trim(),
              designation:    row.designation.trim(),
              departmentId:   row.resolvedDeptId || null,
              qualification:  row.qualification?.trim() || null,
              experienceYears:row.experienceYears ? parseInt(row.experienceYears) : 0,
              joiningDate:    new Date(row.joiningDate.trim()),
              salary:         row.salary ? parseFloat(row.salary) : null,
              bankAccount:    row.bankAccount?.trim() || null,
              bankName:       row.bankName?.trim() || null,
            },
          });
          created++;
        } catch (err: any) {
          failed++;
          errors.push(`Row ${row._rowIndex || '?'}: ${err.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { created, failed, errors: errors.slice(0, 20) },
    });
  } catch (error) {
    console.error('Bulk import commit error:', error);
    return NextResponse.json({ success: false, message: 'Import failed' }, { status: 500 });
  }
}
