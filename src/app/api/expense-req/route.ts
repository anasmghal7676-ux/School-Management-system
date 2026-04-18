export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy route — delegates to expense-requests
export { GET, POST, PATCH, DELETE } from '../expense-requests/route';
