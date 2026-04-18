export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy route — delegates to subject-electives
export { GET, POST, PATCH, DELETE } from '../subject-electives/route';
