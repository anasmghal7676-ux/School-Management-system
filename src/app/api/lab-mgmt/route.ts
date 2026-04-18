export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy route — delegates to lab-management
export { GET, POST, PATCH, DELETE } from '../lab-management/route';
