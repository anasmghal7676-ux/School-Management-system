// src/lib/sms.ts — SMS integration via Twilio (Module 11.1)
// Env vars needed: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

/**
 * Send SMS via Twilio. Phone numbers auto-converted to Pakistan +92 format.
 * Gracefully no-ops if Twilio env vars not configured.
 */
export async function sendSMS(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.warn('[SMS] Twilio not configured — skipping SMS to', to);
    return { success: false, error: 'Twilio not configured' };
  }

  // Normalize to Pakistan +92 format
  const normalized = to.startsWith('+')
    ? to
    : `+92${to.replace(/^0/, '').replace(/[^0-9]/g, '')}`;

  try {
    const url  = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const body = new URLSearchParams({ Body: message, From: from, To: normalized });

    const res = await fetch(url, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      },
      body: body.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[SMS] Twilio error:', data);
      return { success: false, error: data.message };
    }

    console.log('[SMS] Sent to', normalized, '— SID:', data.sid);
    return { success: true };
  } catch (e: any) {
    console.error('[SMS] Error:', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Send bulk SMS to multiple numbers.
 * Returns summary of successes and failures.
 */
export async function sendBulkSMS(
  recipients: { phone: string; name?: string }[],
  message: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = await Promise.allSettled(
    recipients.map(r => sendSMS(r.phone, message))
  );

  const sent   = results.filter(r => r.status === 'fulfilled' && (r as any).value.success).length;
  const failed = results.length - sent;
  const errors = results
    .filter(r => r.status === 'rejected' || !(r as any).value?.success)
    .map(r => r.status === 'rejected' ? r.reason?.message : (r as any).value?.error)
    .filter(Boolean);

  return { sent, failed, errors };
}

/**
 * Pre-built SMS templates for common school events
 */
export const SMS_TEMPLATES = {
  feeReminder: (name: string, amount: number, dueDate: string) =>
    `Dear parent of ${name}, fee of Rs.${amount} is due by ${dueDate}. Please pay promptly. Al-Noor School`,

  attendanceAlert: (name: string, date: string) =>
    `Your child ${name} was marked Absent on ${date}. Contact school for details. Al-Noor School`,

  examSchedule: (name: string, subject: string, date: string, time: string) =>
    `Reminder: ${name} has ${subject} exam on ${date} at ${time}. Al-Noor School`,

  resultPublished: (name: string, percentage: number, grade: string) =>
    `${name}'s result: ${percentage}% (Grade ${grade}). Collect report card from school. Al-Noor School`,

  leaveApproved: (name: string, from: string, to: string) =>
    `Your leave from ${from} to ${to} has been approved. Al-Noor School`,
};
