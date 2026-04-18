export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy route — delegates to exit-management
export { GET, POST, PATCH, DELETE } from '../exit-management/route';
