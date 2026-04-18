export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy [id] route — delegates to lost-found-portal/[id]
export { GET, PUT, PATCH, DELETE } from '../../lost-found-portal/[id]/route';
