export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy [id] route — delegates to expense-requests/[id]
export { GET, PUT, PATCH, DELETE } from '../../expense-requests/[id]/route';
