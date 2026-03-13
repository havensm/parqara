import { Activity, KeyRound, ShieldCheck, Sparkles } from "lucide-react";

import { requireAdminUser } from "@/lib/auth/guards";
import { getAdminDashboardMetrics } from "@/server/services/admin-service";
import { getAdminFeedbackSnapshot } from "@/server/services/feedback-service";
import { getAdminIntegrationsSnapshot } from "@/server/services/integration-service";

import { AppShell } from "@/components/app/app-shell";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  const user = await requireAdminUser();
  const metrics = await getAdminDashboardMetrics();
  const feedback = await getAdminFeedbackSnapshot();
  const integrations = getAdminIntegrationsSnapshot();

  return (
    <AppShell
      eyebrow="Admin"
      title="Parqara control room"
      description="Internal metrics and integration readiness for authorized admin accounts. Use this view to monitor growth, revenue, environment health, and the production setup work still left to finish."
      actionHref="/dashboard"
      actionLabel="Back to dashboard"
      icon={<ShieldCheck className="h-6 w-6" />}
      highlights={[
        { icon: <Activity className="h-4 w-4" />, label: "Live usage and revenue metrics" },
        { icon: <KeyRound className="h-4 w-4" />, label: "Integration readiness by environment" },
        { icon: <Sparkles className="h-4 w-4" />, label: "Testing tools for onboarding flows" },
      ]}
      visual={
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <AdminVisualCard label="Users" value={String(metrics.overview.totalUsers)} tone="teal" />
          <AdminVisualCard label="Estimated MRR" value={`$${metrics.subscriptions.estimatedMrr}`} tone="sky" />
          <AdminVisualCard label="Configured integrations" value={String(integrations.summary.configured)} tone="amber" />
        </div>
      }
    >
      <AdminDashboard
        feedback={feedback}
        integrations={integrations}
        metrics={metrics}
        firstTimeState={{
          isFirstTime: user.isFirstTime,
          previewHref: "/dashboard?tour=1&tourPreview=1",
        }}
      />
    </AppShell>
  );
}

function AdminVisualCard({ label, value, tone }: { label: string; value: string; tone: "amber" | "sky" | "teal" }) {
  const toneClassNames = {
    amber: "bg-[linear-gradient(180deg,#fff7ea_0%,#ffffff_100%)]",
    sky: "bg-[linear-gradient(180deg,#eef7ff_0%,#ffffff_100%)]",
    teal: "bg-[linear-gradient(180deg,#eefbf8_0%,#ffffff_100%)]",
  } as const;

  return (
    <div className={`rounded-[24px] border border-slate-200 p-5 ${toneClassNames[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}
