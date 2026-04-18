export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy route — delegates to homework-tracker
export { GET, POST, PATCH, DELETE } from '../homework-tracker/route';
