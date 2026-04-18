export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/api-auth';
// Proxy [id] route — delegates to exam-timetable/[id]
export { GET, PUT, PATCH, DELETE } from '../../exam-timetable/[id]/route';
