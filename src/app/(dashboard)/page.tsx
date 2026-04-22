// Server component — wraps the client dashboard to fix Next.js 15
// page_client-reference-manifest.js generation issue
import DashboardClient from './dashboard-client';

export default function DashboardPage() {
  return <DashboardClient />;
}
