export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy [id] route — delegates to parent-meeting-scheduler/[id]
export { GET, PUT, PATCH, DELETE } from '../../parent-meeting-scheduler/[id]/route';
