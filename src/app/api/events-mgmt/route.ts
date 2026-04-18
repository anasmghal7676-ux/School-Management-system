export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy route — delegates to event-management
export { GET, POST, PATCH, DELETE } from '../event-management/route';
