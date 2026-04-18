export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy route — delegates to question-bank
export { GET, POST, PATCH, DELETE } from '../question-bank/route';
