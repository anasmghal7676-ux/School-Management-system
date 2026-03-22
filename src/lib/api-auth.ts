import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.https://gufbklktcqjufwzylkav.supabase.co!
const VALIDATE_URL = `${https://gufbklktcqjufwzylkav.supabase.co}/functions/v1/validate-session`

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('school_session')?.value
  if (!token) return null

  try {
    const res = await fetch(VALIDATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-token': token },
      next: { revalidate: 0 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.valid ? data : null
  } catch {
    return null
  }
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null }
  }
  return { error: null, session }
}

export function requireAccess(session: any, permission: string) {
  if (!session) return false
  const perms: string[] = session.permissions || []
  if (perms.includes('*')) return true
  if (perms.includes(permission)) return true
  const module = permission.split(':')[0]
  if (perms.includes(`${module}:*`)) return true
  return false
}

export function requireLevel(session: any, level: number) {
  if (!session) return false
  return (session.roleLevel || 0) >= level
}

export const ROLE_LEVELS = { super_admin: 10, principal: 9, vice_principal: 8, hod: 7, accountant: 6, teacher: 5, receptionist: 4, parent: 2 }
