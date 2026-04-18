export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy [id] route — delegates to exit-management/[id]
export { GET, PUT, PATCH, DELETE } from '../../exit-management/[id]/route';
