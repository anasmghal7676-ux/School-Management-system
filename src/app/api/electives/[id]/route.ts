export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy [id] route — delegates to subject-electives/[id]
export { GET, PUT, PATCH, DELETE } from '../../subject-electives/[id]/route';
