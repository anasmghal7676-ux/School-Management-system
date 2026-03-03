/**
 * Prisma compatibility shim.
 * New modules use prisma.systemSetting with {key, value} fields.
 * We proxy those calls to a NoticeBoard-based KV store.
 */
import { db } from './db'
import type { PrismaClient } from '@prisma/client'

// Get or create a default school ID
let _schoolId: string | null = null
async function getSchoolId(): Promise<string> {
  if (_schoolId) return _schoolId
  const school = await db.school.findFirst()
  _schoolId = school?.id || 'school_default'
  return _schoolId
}

// Encode key to safe base for use as record ID
function encodeKey(key: string): string {
  return 'kv_' + Buffer.from(key).toString('base64url').slice(0, 60)
}

// SystemSetting proxy that uses NoticeBoard table as KV store
const systemSettingProxy = {
  async findMany({ where, orderBy }: any = {}): Promise<any[]> {
    try {
      const startsWith = where?.key?.startsWith
      const equals = where?.key
      let records = await db.noticeBoard.findMany({
        where: {
          category: 'KV_STORE',
          ...(startsWith ? { title: { startsWith: `__KV__${startsWith}` } } : {}),
          ...(equals && typeof equals === 'string' ? { title: `__KV__${equals}` } : {}),
        },
        orderBy: orderBy?.updatedAt ? { updatedAt: orderBy.updatedAt } : { updatedAt: 'desc' }
      })
      return records.map(r => ({
        id: r.id,
        key: r.title.replace('__KV__', ''),
        value: r.content,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }))
    } catch (e) {
      console.error('systemSetting.findMany error:', e)
      return []
    }
  },

  async findUnique({ where }: any): Promise<any | null> {
    try {
      const key = where?.key
      if (!key) return null
      const rec = await db.noticeBoard.findFirst({
        where: { category: 'KV_STORE', title: `__KV__${key}` }
      })
      if (!rec) return null
      return { id: rec.id, key, value: rec.content, createdAt: rec.createdAt, updatedAt: rec.updatedAt }
    } catch { return null }
  },

  async findFirst({ where }: any): Promise<any | null> {
    return systemSettingProxy.findUnique({ where })
  },

  async create({ data }: any): Promise<any> {
    const schoolId = await getSchoolId()
    const key = data.key
    const id = encodeKey(key)
    try {
      const rec = await db.noticeBoard.create({
        data: {
          id,
          schoolId,
          title: `__KV__${key}`,
          content: data.value,
          category: 'KV_STORE',
          audience: 'None',
          priority: 'Normal',
          publishDate: new Date(),
          isPublished: false,
        }
      })
      return { id: rec.id, key, value: rec.content, createdAt: rec.createdAt, updatedAt: rec.updatedAt }
    } catch (e: any) {
      // If duplicate, update instead
      if (e.code === 'P2002') {
        return systemSettingProxy.update({ where: { key }, data })
      }
      throw e
    }
  },

  async update({ where, data }: any): Promise<any> {
    const key = where?.key
    const rec = await db.noticeBoard.updateMany({
      where: { category: 'KV_STORE', title: `__KV__${key}` },
      data: { content: data.value }
    })
    return { key, value: data.value, updatedAt: new Date() }
  },

  async upsert({ where, create, update }: any): Promise<any> {
    const existing = await systemSettingProxy.findUnique({ where })
    if (existing) {
      return systemSettingProxy.update({ where, data: update })
    }
    return systemSettingProxy.create({ data: create })
  },

  async delete({ where }: any): Promise<any> {
    const key = where?.key
    await db.noticeBoard.deleteMany({
      where: { category: 'KV_STORE', title: `__KV__${key}` }
    })
    return { key }
  },

  async deleteMany({ where }: any): Promise<any> {
    const startsWith = where?.key?.startsWith
    await db.noticeBoard.deleteMany({
      where: {
        category: 'KV_STORE',
        ...(startsWith ? { title: { startsWith: `__KV__${startsWith}` } } : {})
      }
    })
    return {}
  },

  async count({ where }: any = {}): Promise<number> {
    const records = await systemSettingProxy.findMany({ where })
    return records.length
  }
}

// Export proxied prisma client
export const prisma = {
  ...db,
  systemSetting: systemSettingProxy,
} as unknown as PrismaClient & { systemSetting: typeof systemSettingProxy }
