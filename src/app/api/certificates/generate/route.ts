export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { templateId, recipientId, recipientType, customFields } = body;

    const template = await db.certificate.findUnique({ where: { id: templateId } });
    if (!template) return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });

    // Get recipient details
    let recipient: any = null;
    if (recipientType === 'student') {
      recipient = await db.student.findUnique({ where: { id: recipientId } });
    } else if (recipientType === 'staff') {
      recipient = await db.staff.findUnique({ where: { id: recipientId } });
    }

    // Generate certificate number
    const certNumber = `CERT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    // Build merged content with field replacements
    const mergedContent = template.htmlContent
      .replace(/\{\{name\}\}/gi, recipient?.fullName || customFields?.name || '')
      .replace(/\{\{date\}\}/gi, new Date().toLocaleDateString('en-PK'))
      .replace(/\{\{certNumber\}\}/gi, certNumber)
      .replace(/\{\{class\}\}/gi, recipient?.class?.name || customFields?.class || '')
      .replace(/\{\{year\}\}/gi, String(new Date().getFullYear()));

    return NextResponse.json({
      success: true,
      data: {
        certNumber,
        htmlContent: mergedContent,
        recipientName: recipient?.fullName || customFields?.name,
        issuedAt: new Date().toISOString(),
      }
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
