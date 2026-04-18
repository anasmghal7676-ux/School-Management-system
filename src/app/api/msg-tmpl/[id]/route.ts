export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy [id] route — delegates to message-templates/[id]
export { GET, PUT, PATCH, DELETE } from '../../message-templates/[id]/route';
