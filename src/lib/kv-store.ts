import { db } from './db';

export const kvStore = {
  async get(key: string): Promise<any | null> {
    try {
      const r = await db.simpleStore.findUnique({ where: { key } });
      return r ? JSON.parse(r.value) : null;
    } catch { return null; }
  },
  async set(key: string, value: any): Promise<void> {
    try {
      await db.simpleStore.upsert({
        where: { key },
        update: { value: JSON.stringify(value) },
        create: { key, value: JSON.stringify(value) },
      });
    } catch (err) {
      console.error('[KV-STORE SET]', key, err);
    }
  },
  async delete(key: string): Promise<void> {
    try {
      await db.simpleStore.deleteMany({ where: { key } });
    } catch {}
  },
  async list(prefix: string): Promise<Array<{ key: string; value: any }>> {
    try {
      const recs = await db.simpleStore.findMany({
        where: { key: { startsWith: prefix } },
        orderBy: { updatedAt: 'desc' },
      });
      return recs.map(r => ({
        key: r.key,
        value: (() => { try { return JSON.parse(r.value); } catch { return null; } })(),
      })).filter(r => r.value !== null);
    } catch { return []; }
  },
};
