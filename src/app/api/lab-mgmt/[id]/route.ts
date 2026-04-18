export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy [id] route — delegates to lab-management/[id]
export { GET, PUT, PATCH, DELETE } from '../../lab-management/[id]/route';
