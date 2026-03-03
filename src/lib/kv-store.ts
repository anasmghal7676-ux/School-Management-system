/**
 * Key-Value store using existing NoticeBoard model with a KV_STORE category.
 * This is a compatibility shim for new modules.
 */
import { db } from './db'

async function getSchoolId(): Promise<string> {
  const school = await db.school.findFirst()
  return school?.id || 'default'
}

function makeId(key: string): string {
  return `kv_${Buffer.from(key).toString('base64').replace(/[=+/]/g, '_').slice(0, 20)}_${key.length}`
}

export const kvStore = {
  async get(key: string): Promise<any | null> {
    try {
      const rec = await db.noticeBoard.findFirst({
        where: { category: 'KV_STORE', title: `__KV__${key}` }
      })
      if (!rec) return null
      return JSON.parse(rec.content || 'null')
    } catch { return null }
  },

  async set(key: string, value: any): Promise<void> {
    const schoolId = await getSchoolId()
    const id = makeId(key)
    const serialized = JSON.stringify(value)
    try {
      await db.noticeBoard.upsert({
        where: { id },
        create: {
          id, schoolId, title: `__KV__${key}`, content: serialized,
          category: 'KV_STORE', audience: 'None', priority: 'Normal',
          publishDate: new Date(), isPublished: false,
        },
        update: { content: serialized }
      })
    } catch {
      // Fallback: delete and recreate
      await db.noticeBoard.deleteMany({ where: { title: `__KV__${key}` } })
      await db.noticeBoard.create({
        data: {
          id, schoolId, title: `__KV__${key}`, content: serialized,
          category: 'KV_STORE', audience: 'None', priority: 'Normal',
          publishDate: new Date(), isPublished: false,
        }
      })
    }
  },

  async delete(key: string): Promise<void> {
    await db.noticeBoard.deleteMany({
      where: { category: 'KV_STORE', title: `__KV__${key}` }
    })
  },

  async list(prefix: string): Promise<Array<{ key: string; value: any }>> {
    try {
      const recs = await db.noticeBoard.findMany({
        where: { category: 'KV_STORE', title: { startsWith: `__KV__${prefix}` } },
        orderBy: { updatedAt: 'desc' }
      })
      return recs.map(r => ({
        key: r.title.replace('__KV__', ''),
        value: (() => { try { return JSON.parse(r.content) } catch { return null } })()
      })).filter(r => r.value !== null)
    } catch { return [] }
  }
}
