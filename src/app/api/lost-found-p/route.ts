export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy route — delegates to lost-found-portal
export { GET, POST, PATCH, DELETE } from '../lost-found-portal/route';
