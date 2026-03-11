"use client";

import type { ReactNode } from "react";
import { AuthProvider, OnboardingStatus, SubscriptionTier, TripStatus } from "@prisma/client";

import type { AdminDashboardMetrics } from "@/server/services/admin-service";
import type {
  AdminIntegration,
  AdminIntegrationsSnapshot,
  AdminIntegrationStage,
  AdminIntegrationStatus,
} from "@/server/services/integration-service";

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
  integrations,
  metrics,
}: {
  integrations: AdminIntegrationsSnapshot;
  metrics: AdminDashboardMetrics;
}) {
  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
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
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Refreshed {formatDateTimeLabel(metrics.generatedAt)}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="metrics" className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <TabsList>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
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

        <TabsContent value="integrations" className="space-y-6">
          <IntegrationsPanel integrations={integrations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricsPanel({ metrics }: { metrics: AdminDashboardMetrics }) {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total users" value={formatInteger(metrics.overview.totalUsers)} detail={`${metrics.growth.usersLast30Days} signed up in the last 30 days`} />
        <MetricCard label="Active paid users" value={formatInteger(metrics.subscriptions.activePaidUsers)} detail={`${metrics.ratios.paidConversionRate}% paid conversion`} />
        <MetricCard label="Total trips" value={formatInteger(metrics.overview.totalTrips)} detail={`${metrics.growth.tripsLast30Days} created in the last 30 days`} />
        <MetricCard label="Estimated MRR" value={formatCurrency(metrics.subscriptions.estimatedMrr)} detail="Based on active Plus and Pro seats" />
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

function IntegrationsPanel({ integrations }: { integrations: AdminIntegrationsSnapshot }) {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Configured" value={formatInteger(integrations.summary.configured)} detail="Integrations with the required production settings present" />
        <MetricCard label="Needs follow-up" value={formatInteger(integrations.summary.partial)} detail="Partially configured integrations that still need cleanup" />
        <MetricCard label="Live in app" value={formatInteger(integrations.summary.live)} detail="Integrations already supported directly by the codebase" />
        <MetricCard label="Recommended next" value={formatInteger(integrations.summary.recommended)} detail="High-value additions for observability, analytics, and routing" />
      </section>

      <Card className="p-6 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Integration roadmap</p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950">Current providers and next additions</h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Each card shows two things: how far the codebase is prepared for that provider, and whether the current environment has the right secrets to actually use it.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <Badge variant="success">{integrations.summary.live} live</Badge>
            <Badge variant="warning">{integrations.summary.scaffolded} scaffolded</Badge>
            <Badge variant="info">{integrations.summary.recommended} recommended</Badge>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        {integrations.integrations.map((integration) => (
          <IntegrationCard key={integration.key} integration={integration} />
        ))}
      </div>
    </>
  );
}

function IntegrationCard({ integration }: { integration: AdminIntegration }) {
  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
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

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <InfoPanel title="Implementation state" body={integration.stageDetail} />
          <InfoPanel title="Why it matters" body={integration.benefit} />
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">Environment checklist</p>
              <Badge variant={getIntegrationStatusVariant(integration.status)}>{getIntegrationStatusLabel(integration.status)}</Badge>
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-500">{integration.statusDetail}</p>
            <div className="mt-4 space-y-3">
              {integration.envVars.map((item) => (
                <div key={item.name} className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <code className="text-sm font-semibold text-slate-950">{item.name}</code>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={item.required ? "warning" : "neutral"}>{item.required ? "Required" : "Optional"}</Badge>
                      <Badge variant={item.present ? "success" : "neutral"}>{item.present ? "Set" : "Missing"}</Badge>
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <p className="text-sm font-semibold text-slate-950">Steps to complete</p>
          <ol className="mt-4 space-y-4">
            {integration.steps.map((step, index) => (
              <li key={step.title} className="rounded-[20px] border border-slate-200 bg-white px-4 py-4">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
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

function InfoPanel({ body, title }: { body: string; title: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate-500">{body}</p>
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card className="p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-4 font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-3 text-sm leading-7 text-slate-500">{detail}</p>
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
