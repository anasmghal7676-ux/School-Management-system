export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy [id] route — delegates to question-bank/[id]
export { GET, PUT, PATCH, DELETE } from '../../question-bank/[id]/route';
