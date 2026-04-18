export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy route — delegates to parent-communication
export { GET, POST, DELETE } from '../parent-communication/route';
