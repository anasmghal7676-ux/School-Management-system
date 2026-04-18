export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy [id] route — delegates to event-management/[id]
export { GET, PUT, PATCH, DELETE } from '../../event-management/[id]/route';
