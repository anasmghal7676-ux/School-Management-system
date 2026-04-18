export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy route — delegates to online-admission
export { GET, POST, PATCH, DELETE } from '../online-admission/route';
