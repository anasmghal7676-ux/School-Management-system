import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/bulk-import/preview
// Body: { type: 'students'|'staff', rows: [{...}] }
// Returns: validation results per row before commit

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, rows } = body;

    if (!type || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, message: 'type and rows are required' }, { status: 400 });
    }
    if (rows.length > 500) {
      return NextResponse.json({ success: false, message: 'Maximum 500 rows per import' }, { status: 400 });
    }

    const results: any[] = [];
    let validCount   = 0;
    let invalidCount = 0;

    if (type === 'students') {
      // Pre-load class/section maps
      const classes  = await db.class.findMany({ select: { id: true, name: true } });
      const sections = await db.section.findMany({ select: { id: true, name: true, classId: true } });
      const classMap = Object.fromEntries(classes.map(c => [c.name.trim().toLowerCase(), c]));
      const sectionMap: Record<string, any> = {};
      sections.forEach(s => { sectionMap[`${s.classId}:${s.name.trim().toLowerCase()}`] = s; });

      // Existing admission numbers for duplicate check
      const existingAdm = new Set<string>(
        (await db.student.findMany({ select: { admissionNumber: true } })).map(s => s.admissionNumber)
      );

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const errors: string[] = [];
        const warnings: string[] = [];

        // Required fields
        if (!row.firstName?.trim())   errors.push('firstName is required');
        if (!row.lastName?.trim())    errors.push('lastName is required');
        if (!row.gender?.trim())      errors.push('gender is required (Male/Female)');
        if (!row.dateOfBirth?.trim()) errors.push('dateOfBirth is required (YYYY-MM-DD)');
        if (!row.fatherName?.trim())  errors.push('fatherName is required');
        if (!row.fatherPhone?.trim()) errors.push('fatherPhone is required');
        if (!row.address?.trim())     errors.push('address is required');
        if (!row.city?.trim())        errors.push('city is required');
        if (!row.className?.trim())   errors.push('className is required');

        // Class resolution
        let resolvedClassId    = '';
        let resolvedSectionId  = '';
        if (row.className) {
          const cls = classMap[row.className.trim().toLowerCase()];
          if (!cls) errors.push(`Class "${row.className}" not found`);
          else {
            resolvedClassId = cls.id;
            if (row.sectionName) {
              const sec = sectionMap[`${cls.id}:${row.sectionName.trim().toLowerCase()}`];
              if (!sec) warnings.push(`Section "${row.sectionName}" not found — will leave unassigned`);
              else resolvedSectionId = sec.id;
            }
          }
        }

        // Duplicate check
        if (row.admissionNumber && existingAdm.has(row.admissionNumber.trim())) {
          errors.push(`Admission number "${row.admissionNumber}" already exists`);
        }

        // Date format
        if (row.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(row.dateOfBirth.trim())) {
          errors.push('dateOfBirth must be YYYY-MM-DD');
        }

        // Gender check
        if (row.gender && !['Male', 'Female', 'Other'].includes(row.gender.trim())) {
          warnings.push('gender should be Male/Female/Other');
        }

        const valid = errors.length === 0;
        if (valid) validCount++;
        else invalidCount++;

        results.push({
          rowIndex: i + 1,
          valid,
          errors,
          warnings,
          data: {
            ...row,
            resolvedClassId,
            resolvedSectionId,
            fullName: `${row.firstName || ''} ${row.middleName || ''} ${row.lastName || ''}`.replace(/\s+/g, ' ').trim(),
          },
        });
      }
    } else if (type === 'staff') {
      const depts = await db.department.findMany({ select: { id: true, name: true } });
      const deptMap = Object.fromEntries(depts.map(d => [d.name.trim().toLowerCase(), d]));
      const existingCodes = new Set<string>(
        (await db.staff.findMany({ select: { employeeCode: true } })).map(s => s.employeeCode)
      );

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!row.firstName?.trim())    errors.push('firstName is required');
        if (!row.lastName?.trim())     errors.push('lastName is required');
        if (!row.gender?.trim())       errors.push('gender is required');
        if (!row.dateOfBirth?.trim())  errors.push('dateOfBirth is required (YYYY-MM-DD)');
        if (!row.phone?.trim())        errors.push('phone is required');
        if (!row.email?.trim())        errors.push('email is required');
        if (!row.designation?.trim())  errors.push('designation is required');
        if (!row.joiningDate?.trim())  errors.push('joiningDate is required (YYYY-MM-DD)');

        if (row.employeeCode && existingCodes.has(row.employeeCode.trim())) {
          errors.push(`Employee code "${row.employeeCode}" already exists`);
        }
        if (row.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(row.dateOfBirth.trim())) {
          errors.push('dateOfBirth must be YYYY-MM-DD');
        }
        if (row.joiningDate && !/^\d{4}-\d{2}-\d{2}$/.test(row.joiningDate.trim())) {
          errors.push('joiningDate must be YYYY-MM-DD');
        }

        let resolvedDeptId = '';
        if (row.department) {
          const dept = deptMap[row.department.trim().toLowerCase()];
          if (!dept) warnings.push(`Department "${row.department}" not found — will leave unassigned`);
          else resolvedDeptId = dept.id;
        }

        const valid = errors.length === 0;
        if (valid) validCount++;
        else invalidCount++;

        results.push({
          rowIndex: i + 1,
          valid,
          errors,
          warnings,
          data: { ...row, resolvedDeptId },
        });
      }
    } else {
      return NextResponse.json({ success: false, message: `Unknown type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        type,
        total:   rows.length,
        valid:   validCount,
        invalid: invalidCount,
        results,
      },
    });
  } catch (error) {
    console.error('Bulk import preview error:', error);
    return NextResponse.json({ success: false, message: 'Preview failed' }, { status: 500 });
  }
}
