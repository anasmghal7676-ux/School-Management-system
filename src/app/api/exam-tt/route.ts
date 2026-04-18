export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy route — delegates to exam-timetable
export { GET, POST, PATCH, DELETE } from '../exam-timetable/route';
