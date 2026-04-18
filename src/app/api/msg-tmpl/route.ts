export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy route — delegates to message-templates
export { GET, POST, PATCH, DELETE } from '../message-templates/route';
