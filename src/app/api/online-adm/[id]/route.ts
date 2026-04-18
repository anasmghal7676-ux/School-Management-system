export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy [id] route — delegates to online-admission/[id]
export { GET, PUT, PATCH, DELETE } from '../../online-admission/[id]/route';
