// src/lib/email.ts — Email integration via Nodemailer (Module 11.3)
// Env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via SMTP. Gracefully no-ops if SMTP not configured.
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'noreply@school.edu.pk';

  if (!host || !user || !pass) {
    console.warn('[Email] SMTP not configured — skipping email to', options.to);
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    // Dynamic import to avoid breaking builds when nodemailer not installed
    // @ts-ignore — nodemailer is optional, installed separately
    const nodemailer: any = await import('nodemailer').catch(() => null);
    if (!nodemailer) {
      return { success: false, error: 'nodemailer not installed' };
    }

    const transporter = nodemailer.default.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to:      Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html:    options.html,
      text:    options.text,
    });

    console.log('[Email] Sent to', options.to);
    return { success: true };
  } catch (e: any) {
    console.error('[Email] Error:', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Pre-built HTML email templates
 */
export const EMAIL_TEMPLATES = {
  feeReceipt: (receiptNo: string, studentName: string, amount: number, date: string) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:8px">
      <h2 style="color:#1e40af;border-bottom:2px solid #3b82f6;padding-bottom:10px">Fee Receipt — Al-Noor School</h2>
      <p><strong>Receipt No:</strong> ${receiptNo}</p>
      <p><strong>Student:</strong> ${studentName}</p>
      <p><strong>Amount Paid:</strong> Rs. ${amount.toLocaleString()}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p style="color:#16a34a;font-weight:bold">✓ Payment Received Successfully</p>
      <hr style="border-color:#e2e8f0"/>
      <p style="font-size:12px;color:#6b7280">This is an auto-generated receipt. Contact accounts@school.edu.pk for queries.</p>
    </div>`,

  passwordReset: (name: string, link: string) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2>Password Reset — Al-Noor School</h2>
      <p>Hi ${name},</p>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${link}" style="background:#3b82f6;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;margin:10px 0">Reset Password</a>
      <p style="font-size:12px;color:#6b7280">If you didn't request this, ignore this email.</p>
    </div>`,
};
