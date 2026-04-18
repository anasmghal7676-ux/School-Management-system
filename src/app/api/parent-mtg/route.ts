export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy route — delegates to parent-meeting-scheduler
export { GET, POST, PATCH, DELETE } from '../parent-meeting-scheduler/route';
