export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy [id] route — delegates to homework-tracker/[id]
export { GET, PUT, PATCH, DELETE } from '../../homework-tracker/[id]/route';
