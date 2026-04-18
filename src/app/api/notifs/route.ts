export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy route — delegates to notifications
export { GET, POST } from '../notifications/route';
