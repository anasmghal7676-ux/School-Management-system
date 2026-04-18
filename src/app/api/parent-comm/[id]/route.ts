export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy [id] route — delegates to parent-communication/[id]
export { GET, PUT, PATCH, DELETE } from '../../parent-communication/[id]/route';
