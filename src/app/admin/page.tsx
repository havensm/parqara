import { requireAdminUser } from "@/lib/auth/guards";
import { ADMIN_EMAIL } from "@/lib/admin";
import { getAdminDashboardMetrics } from "@/server/services/admin-service";
import { getAdminIntegrationsSnapshot } from "@/server/services/integration-service";

import { AppShell } from "@/components/app/app-shell";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  await requireAdminUser();
  const metrics = await getAdminDashboardMetrics();
  const integrations = getAdminIntegrationsSnapshot();

  return (
    <AppShell
      eyebrow="Admin"
      title="Parqara control room"
      description={`Internal metrics and integration readiness for ${ADMIN_EMAIL}. Use this view to monitor growth, revenue, and the production setup work still left to finish.`}
      actionHref="/dashboard"
      actionLabel="Back to dashboard"
    >
      <AdminDashboard integrations={integrations} metrics={metrics} />
    </AppShell>
  );
}
