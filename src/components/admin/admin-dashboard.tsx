"use client";

import type { ReactNode } from "react";
import {
  Activity,
  BadgeDollarSign,
  LayoutDashboard,
  PlugZap,
  Rocket,
  ShieldCheck,
  TestTubeDiagonal,
  Users2,
  type LucideIcon,
} from "lucide-react";
import { AuthProvider, OnboardingStatus, SubscriptionTier, TripStatus } from "@prisma/client";

import type { AdminDashboardMetrics } from "@/server/services/admin-service";
import type { AdminFeedbackSnapshot } from "@/server/services/feedback-service";
import type {
  AdminIntegration,
  AdminIntegrationsSnapshot,
  AdminIntegrationStage,
  AdminIntegrationStatus,
} from "@/server/services/integration-service";

import { AdminFeedbackPanel } from "@/components/admin/admin-feedback-panel";
import { AdminFirstTimeControls } from "@/components/admin/admin-first-time-controls";
import { AdminTesterAccessControls } from "@/components/admin/admin-tester-access-controls";
import { PlanBadge } from "@/components/billing/plan-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatDateTimeLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getTripStatusVariant(status: TripStatus): "neutral" | "info" | "warning" | "success" {
  switch (status) {
    case TripStatus.LIVE:
      return "info";
    case TripStatus.PLANNED:
      return "success";
    case TripStatus.DRAFT:
      return "warning";
    default:
      return "neutral";
  }
}

function getOnboardingVariant(status: OnboardingStatus): "neutral" | "warning" | "success" {
  switch (status) {
    case OnboardingStatus.COMPLETED:
      return "success";
    case OnboardingStatus.IN_PROGRESS:
      return "warning";
    default:
      return "neutral";
  }
}

function getAuthProviderLabel(provider: AuthProvider) {
  return provider === AuthProvider.GOOGLE ? "Google" : "Local";
}

function getIntegrationStatusVariant(status: AdminIntegrationStatus): "critical" | "warning" | "success" {
  switch (status) {
    case "configured":
      return "success";
    case "partial":
      return "warning";
    default:
      return "critical";
  }
}

function getIntegrationStatusLabel(status: AdminIntegrationStatus) {
  switch (status) {
    case "configured":
      return "Configured";
    case "partial":
      return "Needs follow-up";
    default:
      return "Missing";
  }
}

function getIntegrationStageVariant(stage: AdminIntegrationStage): "info" | "warning" | "success" {
  switch (stage) {
    case "live":
      return "success";
    case "scaffolded":
      return "warning";
    default:
      return "info";
  }
}

function getIntegrationStageLabel(stage: AdminIntegrationStage) {
  switch (stage) {
    case "live":
      return "Live in app";
    case "scaffolded":
      return "Scaffolded";
    default:
      return "Recommended next";
  }
}

export function AdminDashboard({
  feedback,
  integrations,
  metrics,
  firstTimeState,
}: {
  feedback: AdminFeedbackSnapshot;
  integrations: AdminIntegrationsSnapshot;
  metrics: AdminDashboardMetrics;
  firstTimeState: {
    isFirstTime: boolean;
    previewHref: string;
  };
}) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_30%),linear-gradient(180deg,rgba(248,252,255,0.98),rgba(255,255,255,0.98))] px-6 py-6 sm:px-7">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Admin only</p>
              <Badge variant="warning">Internal</Badge>
            </div>
            <h2 className="mt-4 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
              Control room for metrics and integrations
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Metrics are pulled from the database. Integration status is derived from the current environment so you can see what is live, what still needs keys, and what should be added next.
            </p>
          </div>
          <div className="grid gap-3 bg-white px-6 py-6 sm:px-7 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <AdminHeroChip label="Updated" value={formatDateTimeLabel(metrics.generatedAt)} tone="sky" />
            <AdminHeroChip label="Configured" value={`${integrations.summary.configured}`} tone="teal" />
            <AdminHeroChip label="Missing" value={`${integrations.summary.missing}`} tone="amber" />
          </div>
        </div>
      </Card>

      <Tabs defaultValue="metrics" className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <TabsList>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Badge variant="success">{integrations.summary.configured} configured</Badge>
            <Badge variant="warning">{integrations.summary.partial} partial</Badge>
            <Badge variant="critical">{integrations.summary.missing} missing</Badge>
          </div>
        </div>

        <TabsContent value="metrics" className="space-y-6">
          <MetricsPanel metrics={metrics} />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <AdminFeedbackPanel feedback={feedback} />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <IntegrationsPanel integrations={integrations} />
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <TestingPanel firstTimeState={firstTimeState} recentUsers={metrics.recentUsers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricsPanel({ metrics }: { metrics: AdminDashboardMetrics }) {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total users"
          value={formatInteger(metrics.overview.totalUsers)}
          detail={`${metrics.growth.usersLast30Days} signed up in the last 30 days`}
          icon={Users2}
          tone="teal"
        />
        <MetricCard
          label="Active paid users"
          value={formatInteger(metrics.subscriptions.activePaidUsers)}
          detail={`${metrics.ratios.paidConversionRate}% paid conversion`}
          icon={BadgeDollarSign}
          tone="amber"
        />
        <MetricCard
          label="Total trips"
          value={formatInteger(metrics.overview.totalTrips)}
          detail={`${metrics.growth.tripsLast30Days} created in the last 30 days`}
          icon={LayoutDashboard}
          tone="sky"
        />
        <MetricCard
          label="Estimated MRR"
          value={formatCurrency(metrics.subscriptions.estimatedMrr)}
          detail="Based on active Plus and Pro seats"
          icon={Rocket}
          tone="violet"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Growth</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricPanel label="Users, 7 days" value={metrics.growth.usersLast7Days} helper="Fresh signups" />
            <MetricPanel label="Users, 30 days" value={metrics.growth.usersLast30Days} helper="Rolling month" />
            <MetricPanel label="Trips, 7 days" value={metrics.growth.tripsLast7Days} helper="New trip drafts and plans" />
            <MetricPanel label="Trips, 30 days" value={metrics.growth.tripsLast30Days} helper="Rolling month" />
            <MetricPanel label="Completed trips, 30 days" value={metrics.growth.completedTripsLast30Days} helper="Finished days" />
            <MetricPanel label="Trip completion rate" value={`${metrics.ratios.tripCompletionRate30Days}%`} helper="Completed vs created in 30 days" />
          </div>
        </Card>

        <Card className="p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Health</p>
          <div className="mt-5 grid gap-3">
            <HealthRow label="Verified email rate" value={`${metrics.ratios.verificationRate}%`} />
            <HealthRow label="Onboarding completion rate" value={`${metrics.ratios.onboardingCompletionRate}%`} />
            <HealthRow label="Avg trips per user" value={String(metrics.ratios.avgTripsPerUser)} />
            <HealthRow label="Active sessions" value={formatInteger(metrics.overview.activeSessions)} />
            <HealthRow label="Shared trips" value={formatInteger(metrics.overview.tripsWithCollaborators)} />
            <HealthRow label="Avg collaborators per shared trip" value={String(metrics.ratios.avgCollaboratorsPerSharedTrip)} />
            <HealthRow label="Park catalog" value={`${metrics.overview.totalParks} parks / ${metrics.overview.totalAttractions} attractions`} />
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Subscriptions</p>
          <div className="mt-5 space-y-3">
            {metrics.subscriptions.breakdown.map((item) => (
              <div key={item.tier} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <PlanBadge tier={item.tier as SubscriptionTier} />
                  <span className="text-sm font-semibold text-slate-950">{formatInteger(item.totalUsers)}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-500">
                  <div>
                    <p>Active</p>
                    <p className="mt-1 font-semibold text-slate-950">{formatInteger(item.activeUsers)}</p>
                  </div>
                  <div>
                    <p>Inactive</p>
                    <p className="mt-1 font-semibold text-slate-950">{formatInteger(item.inactiveUsers)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Trips by status</p>
          <div className="mt-5 space-y-3">
            {metrics.tripsByStatus.map((item) => (
              <BreakdownRow key={item.status} label={item.status} value={item.count} badge={<Badge variant={getTripStatusVariant(item.status)}>{item.status}</Badge>} />
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Onboarding</p>
          <div className="mt-5 space-y-3">
            {metrics.onboardingByStatus.map((item) => (
              <BreakdownRow key={item.status} label={item.status.replaceAll("_", " ")} value={item.count} badge={<Badge variant={getOnboardingVariant(item.status)}>{item.status.replaceAll("_", " ")}</Badge>} />
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Auth mix</p>
          <div className="mt-5 space-y-3">
            {metrics.authProviders.map((item) => (
              <BreakdownRow key={item.provider} label={getAuthProviderLabel(item.provider)} value={item.count} />
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Recent users</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950">Latest signups</h3>
            </div>
            <Badge variant="neutral">{metrics.recentUsers.length}</Badge>
          </div>
          <div className="mt-5 space-y-3">
            {metrics.recentUsers.map((user) => (
              <div key={user.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-950">{user.name}</p>
                  <PlanBadge tier={user.subscriptionTier as SubscriptionTier} />
                </div>
                <p className="mt-2 text-sm text-slate-500">{user.email}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>Created {formatDateTimeLabel(user.createdAt)}</span>
                  <span>Status: {user.subscriptionStatus.replaceAll("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Recent trips</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950">Latest planner activity</h3>
            </div>
            <Badge variant="neutral">{metrics.recentTrips.length}</Badge>
          </div>
          <div className="mt-5 space-y-3">
            {metrics.recentTrips.map((trip) => (
              <div key={trip.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-950">{trip.name}</p>
                  <Badge variant={getTripStatusVariant(trip.status)}>{trip.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500">{trip.parkName} · {trip.ownerEmail}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>Created {formatDateTimeLabel(trip.createdAt)}</span>
                  <span>Visit date {formatDateLabel(trip.visitDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </>
  );
}

function TestingPanel({
  firstTimeState,
  recentUsers,
}: {
  firstTimeState: { isFirstTime: boolean; previewHref: string };
  recentUsers: AdminDashboardMetrics["recentUsers"];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr] xl:grid-cols-1">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),linear-gradient(180deg,rgba(248,252,255,0.98),rgba(255,255,255,0.98))] px-6 py-6 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-sky-100 text-sky-700">
                <TestTubeDiagonal className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Walkthrough testing</p>
                <h3 className="mt-1 text-2xl font-semibold text-slate-950">First-time planner tour</h3>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              Reset the first-time flag on your own admin account when you want to run the real onboarding walkthrough again, or open the preview mode when you just want to inspect the guided overlay without changing saved state.
            </p>
          </div>
          <div className="flex items-center bg-white px-6 py-6 sm:px-7">
            <div className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5 text-sm text-slate-500">
              Current flag: {firstTimeState.isFirstTime ? "first-time" : "completed"}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-6 py-6 sm:px-7">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <AdminFirstTimeControls initialIsFirstTime={firstTimeState.isFirstTime} previewHref={firstTimeState.previewHref} />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr] xl:grid-cols-1">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_28%),linear-gradient(180deg,rgba(255,251,235,0.98),rgba(255,255,255,0.98))] px-6 py-6 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-amber-100 text-amber-700">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700/80">Tester access</p>
                <h3 className="mt-1 text-2xl font-semibold text-slate-950">Grant manual upgrades</h3>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              Upgrade testers to Plus or Pro without sending them through Stripe. Use Free to reset them back to the normal plan.
            </p>
          </div>
          <div className="flex items-center bg-white px-6 py-6 sm:px-7">
            <div className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5 text-sm text-slate-500">
              Manual tester access sets the existing billing fields directly and takes effect right away.
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-6 py-6 sm:px-7">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <AdminTesterAccessControls recentUsers={recentUsers} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function IntegrationsPanel({ integrations }: { integrations: AdminIntegrationsSnapshot }) {
  const launchIntegrations = integrations.integrations
    .filter((integration) => integration.stage !== "recommended")
    .sort(compareIntegrationsForRoadmap);
  const laterIntegrations = integrations.integrations
    .filter((integration) => integration.stage === "recommended")
    .sort(compareIntegrationsForRoadmap);
  const launchPendingCount = launchIntegrations.filter((integration) => integration.status !== "configured").length;
  const readyCount = launchIntegrations.filter((integration) => integration.status === "configured").length;

  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Set up now"
          value={formatInteger(launchPendingCount)}
          detail="Core launch integrations that still need keys or final wiring"
          icon={PlugZap}
          tone="amber"
        />
        <MetricCard
          label="Ready now"
          value={formatInteger(readyCount)}
          detail="Core integrations that already have the required production settings"
          icon={ShieldCheck}
          tone="teal"
        />
        <MetricCard
          label="Add later"
          value={formatInteger(laterIntegrations.length)}
          detail="Useful follow-up integrations for observability, analytics, and routing"
          icon={Activity}
          tone="sky"
        />
      </section>

      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),linear-gradient(180deg,rgba(248,252,255,0.98),rgba(255,255,255,0.98))] px-6 py-6 sm:px-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Integration roadmap</p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950">Follow the setup in this order</h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Keep this simple: finish the launch integrations first, then add the recommended tooling once the app is stable in production.
            </p>
          </div>
          <div className="grid gap-3 bg-white px-6 py-6 sm:px-7 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <RoadmapSummaryCard
              label="1. Launch"
              detail="Google OAuth, billing, email, and AI"
              value={`${launchPendingCount} left`}
              tone="amber"
            />
            <RoadmapSummaryCard
              label="2. Stable"
              detail="Anything already configured"
              value={`${readyCount} ready`}
              tone="teal"
            />
            <RoadmapSummaryCard
              label="3. Later"
              detail="Sentry, PostHog, and Mapbox"
              value={`${laterIntegrations.length} later`}
              tone="sky"
            />
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <RoadmapSection
          title="Launch integrations"
          description="These are the integrations that affect sign-in, payments, messaging, or the core planning experience. Finish these before broad testing."
          integrations={launchIntegrations}
        />
        <RoadmapSection
          title="Add after launch"
          description="These are worthwhile next additions, but they are not blocking the first live version."
          integrations={laterIntegrations}
        />
      </div>
    </>
  );
}

function compareIntegrationsForRoadmap(a: AdminIntegration, b: AdminIntegration) {
  const statusPriority = getIntegrationRoadmapStatusPriority(a.status) - getIntegrationRoadmapStatusPriority(b.status);
  if (statusPriority !== 0) {
    return statusPriority;
  }

  const stagePriority = getIntegrationRoadmapStagePriority(a.stage) - getIntegrationRoadmapStagePriority(b.stage);
  if (stagePriority !== 0) {
    return stagePriority;
  }

  return a.name.localeCompare(b.name);
}

function getIntegrationRoadmapStatusPriority(status: AdminIntegrationStatus) {
  switch (status) {
    case "missing":
      return 0;
    case "partial":
      return 1;
    default:
      return 2;
  }
}

function getIntegrationRoadmapStagePriority(stage: AdminIntegrationStage) {
  switch (stage) {
    case "live":
      return 0;
    case "scaffolded":
      return 1;
    default:
      return 2;
  }
}

function RoadmapSection({
  title,
  description,
  integrations,
}: {
  title: string;
  description: string;
  integrations: AdminIntegration[];
}) {
  return (
    <section className="space-y-4">
      <Card className="p-6 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">{title}</p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        {integrations.map((integration, index) => (
          <IntegrationCard key={integration.key} integration={integration} order={index + 1} />
        ))}
      </div>
    </section>
  );
}

function IntegrationCard({ integration, order }: { integration: AdminIntegration; order: number }) {
  const missingRequiredEnvVars = integration.envVars.filter((item) => item.required && !item.present);
  const optionalEnvVars = integration.envVars.filter((item) => !item.required);

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">Step {order}</Badge>
            <Badge variant="neutral">{integration.category}</Badge>
            <Badge variant={getIntegrationStageVariant(integration.stage)}>{getIntegrationStageLabel(integration.stage)}</Badge>
            <Badge variant={getIntegrationStatusVariant(integration.status)}>{getIntegrationStatusLabel(integration.status)}</Badge>
          </div>
          <h3 className="mt-4 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
            {integration.name}
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">{integration.description}</p>
        </div>
        <a
          href={integration.docsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
        >
          Open docs
        </a>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <SimpleRoadmapPanel title="Current state" body={integration.statusDetail} />
          <SimpleRoadmapPanel title="Why add it" body={integration.benefit} />
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">Required env vars</p>
              <Badge variant={missingRequiredEnvVars.length ? "warning" : "success"}>
                {missingRequiredEnvVars.length ? `${missingRequiredEnvVars.length} missing` : "All set"}
              </Badge>
            </div>
            {missingRequiredEnvVars.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {missingRequiredEnvVars.map((item) => (
                  <code key={item.name} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    {item.name}
                  </code>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-slate-500">All required keys for this integration are present in the current environment.</p>
            )}
            {optionalEnvVars.length ? (
              <p className="mt-3 text-xs leading-6 text-slate-500">
                Optional later: {optionalEnvVars.map((item) => item.name).join(", ")}
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <p className="text-sm font-semibold text-slate-950">Do this next</p>
          <ol className="mt-4 space-y-3">
            {integration.steps.map((step, index) => (
              <li key={step.title} className="rounded-[20px] border border-slate-200 bg-white px-4 py-4">
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{step.title}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-500">{step.detail}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Card>
  );
}

function SimpleRoadmapPanel({ body, title }: { body: string; title: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate-500">{body}</p>
    </div>
  );
}

function RoadmapSummaryCard({
  label,
  detail,
  value,
  tone,
}: {
  label: string;
  detail: string;
  value: string;
  tone: "amber" | "sky" | "teal";
}) {
  const toneClassNames = {
    amber: "bg-[linear-gradient(180deg,#fff8eb_0%,#ffffff_100%)]",
    sky: "bg-[linear-gradient(180deg,#eef7ff_0%,#ffffff_100%)]",
    teal: "bg-[linear-gradient(180deg,#eefbf8_0%,#ffffff_100%)]",
  } as const;

  return (
    <div className={`rounded-[24px] border border-slate-200 px-4 py-4 ${toneClassNames[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-sm font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  );
}

function AdminHeroChip({ label, value, tone }: { label: string; value: string; tone: MetricTone }) {
  const toneClassNames = {
    amber: "bg-[linear-gradient(180deg,#fff8eb_0%,#ffffff_100%)]",
    sky: "bg-[linear-gradient(180deg,#eef7ff_0%,#ffffff_100%)]",
    teal: "bg-[linear-gradient(180deg,#eefbf8_0%,#ffffff_100%)]",
    violet: "bg-[linear-gradient(180deg,#f6f2ff_0%,#ffffff_100%)]",
  } as const;

  return (
    <div className={`rounded-[24px] border border-slate-200 px-4 py-4 ${toneClassNames[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

type MetricTone = "amber" | "sky" | "teal" | "violet";

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: MetricTone;
}) {
  const surfaceClassNames = {
    amber: "bg-[linear-gradient(180deg,rgba(255,248,235,0.98),rgba(255,255,255,0.98))]",
    sky: "bg-[linear-gradient(180deg,rgba(238,247,255,0.98),rgba(255,255,255,0.98))]",
    teal: "bg-[linear-gradient(180deg,rgba(238,251,248,0.98),rgba(255,255,255,0.98))]",
    violet: "bg-[linear-gradient(180deg,rgba(246,242,255,0.98),rgba(255,255,255,0.98))]",
  } as const;
  const iconClassNames = {
    amber: "bg-amber-100 text-amber-700",
    sky: "bg-sky-100 text-sky-700",
    teal: "bg-teal-100 text-teal-700",
    violet: "bg-violet-100 text-violet-700",
  } as const;

  return (
    <Card className={`overflow-hidden p-6 ${surfaceClassNames[tone]}`}>
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] ${iconClassNames[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
          <p className="mt-4 font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-3 text-sm leading-7 text-slate-500">{detail}</p>
        </div>
      </div>
    </Card>
  );
}

function MetricPanel({ label, value, helper }: { label: string; value: number | string; helper: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function HealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function BreakdownRow({ label, value, badge }: { label: string; value: number; badge?: ReactNode }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-slate-700">{label}</p>
          {badge}
        </div>
        <p className="text-sm font-semibold text-slate-950">{formatInteger(value)}</p>
      </div>
    </div>
  );
}




