import { db } from "@/lib/db";

export async function logAudit(params: {
  userId: string;
  action: string;
  tableName: string;
  recordId?: string;
  oldValues?: object;
  newValues?: object;
  ipAddress?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        tableName: params.tableName,
        recordId: params.recordId,
        oldValues: params.oldValues ? JSON.stringify(params.oldValues) : undefined,
        newValues: params.newValues ? JSON.stringify(params.newValues) : undefined,
        ipAddress: params.ipAddress,
        timestamp: new Date(),
      },
    });
  } catch (err) {
    // Non-fatal — don't break the main operation
    console.error("[Audit] Failed to log:", err);
  }
}
