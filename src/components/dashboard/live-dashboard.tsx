"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CircleAlert,
  CloudSun,
  Footprints,
  Gauge,
  MapPinned,
  Route,
  TimerReset,
  Waves,
} from "lucide-react";
import { startTransition, useEffect, useEffectEvent, useState } from "react";

import type { LiveDashboardDto } from "@/lib/contracts";
import { generatedVisuals } from "@/lib/generated-assets";

import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VisualShowcase } from "@/components/ui/visual-showcase";

export function LiveDashboard({ initialState }: { initialState: LiveDashboardDto }) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadLiveState() {
    const response = await fetch(`/api/trips/${state.tripId}/live`, { cache: "no-store" });
    if (response.ok) {
      setState((await response.json()) as LiveDashboardDto);
    }
  }

  const refreshLiveState = useEffectEvent(() => {
    void loadLiveState();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      refreshLiveState();
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  async function completeStep() {
    setError(null);
    setIsPending(true);
    try {
      const response = await fetch(`/api/trips/${state.tripId}/complete`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to complete the current step.");
      }

      if (payload.metrics) {
        startTransition(() => {
          router.push(`/trips/${state.tripId}/summary`);
          router.refresh();
        });
        return;
      }

      setState(payload as LiveDashboardDto);
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : "Unable to update the live plan.");
    } finally {
      setIsPending(false);
    }
  }

  async function replan() {
    setError(null);
    setIsPending(true);
    try {
      const response = await fetch(`/api/trips/${state.tripId}/replan`, {
        method: "POST",
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Unable to replan right now.");
      }

      await loadLiveState();
    } catch (replanError) {
      setError(replanError instanceof Error ? replanError.message : "Unable to replan.");
    } finally {
      setIsPending(false);
    }
  }

  const confidence = state.recommendation?.confidence ?? state.currentAction?.confidence ?? 0;
  const nextTitle = state.recommendation?.title ?? state.currentAction?.title ?? "Plan complete";
  const nextReason = state.recommendation?.reason ?? state.currentAction?.reason ?? "No action pending";
  const nextExplanation =
    state.recommendation?.explanation ?? state.currentAction?.explanation ?? "All planned items are complete.";
  const nextWait = state.recommendation?.waitMinutes ?? state.currentAction?.predictedWaitMinutes ?? 0;
  const nextWalk = state.recommendation?.walkingMinutes ?? state.currentAction?.walkingMinutes ?? 0;
  const nextZone = state.recommendation?.zone ?? state.currentAction?.zone ?? "No zone";

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Card className="overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)]">
            <div className="px-6 py-6 sm:px-8 sm:py-8 lg:px-10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Badge variant="warning">Live park mode</Badge>
                  <h1 className="mt-5 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--foreground)] sm:text-4xl lg:text-5xl">
                    {state.tripName}
                  </h1>
                  <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">{state.latestPlanSummary}</p>
                </div>
                <div className="rounded-[28px] border border-[var(--card-border)] bg-white px-5 py-4 text-sm text-[var(--muted)]">
                  <p>Simulated park time</p>
                  <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
                    {new Date(state.simulatedTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </p>
                  <p className="mt-2">{state.status}</p>
                </div>
              </div>

              <div className="mt-8 rounded-[32px] border border-sky-100 bg-cyan-50 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--teal-700)]">Recommended next move</p>
                    <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{nextTitle}</h2>
                  </div>
                  {confidence ? <Badge variant="info">{confidence}% confidence</Badge> : null}
                </div>
                <p className="mt-4 max-w-3xl text-base leading-8 text-[#4f625d]">{nextExplanation}</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-4">
                  <DataTile label="Wait" value={`${nextWait}m`} icon={<TimerReset className="h-4 w-4" />} />
                  <DataTile label="Walk" value={`${nextWalk}m`} icon={<Footprints className="h-4 w-4" />} />
                  <DataTile label="Zone" value={nextZone} icon={<MapPinned className="h-4 w-4" />} />
                  <DataTile label="Driver" value={nextReason} icon={<Route className="h-4 w-4" />} />
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    <span>Confidence</span>
                    <span>{confidence}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#dce8e2]">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,#0f7a72_0%,#73d2c0_100%)]"
                      style={{ width: `${Math.min(Math.max(confidence, 8), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-[var(--card-border)] p-4 lg:border-l lg:border-t-0">
              <VisualShowcase
                src={generatedVisuals.planners.studio}
                alt="Parqara live mode visual"
                eyebrow="Live mode"
                title="The planner stays alive when the day changes."
                description="Realtime status, replans, and next moves stay attached to the route."
                chips={[state.weather.condition.replaceAll("_", " "), `${state.alerts.length} alerts`, `${confidence}% confidence`]}
                aspect="square"
                className="h-full"
              />
            </div>
          </div>
        </Card>

        <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <Card className="p-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Controls</p>
            <div className="mt-5 space-y-3">
              <Button className="w-full" disabled={isPending} onClick={completeStep}>
                {isPending ? "Updating..." : "Ride completed"}
              </Button>
              <Button className="w-full" variant="secondary" disabled={isPending} onClick={replan}>
                Replan now
              </Button>
              <Link href={`/trips/${state.tripId}`} className={buttonStyles({ variant: "ghost", size: "default" }) + " w-full"}>
                View itinerary
              </Link>
            </div>
            {error ? <p className="mt-4 rounded-[22px] border border-[#efc1bc] bg-[#fff0ee] px-4 py-3 text-sm text-[#b14b41]">{error}</p> : null}
          </Card>

          <Card className="p-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Park conditions</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <ConditionTile label="Weather" value={state.weather.condition.replaceAll("_", " ")} icon={<CloudSun className="h-4 w-4" />} />
              <ConditionTile label="Temperature" value={`${state.weather.tempF}F`} icon={<Gauge className="h-4 w-4" />} />
              <ConditionTile label="Rain chance" value={`${state.weather.rainChance}%`} icon={<Waves className="h-4 w-4" />} />
              <ConditionTile label="Live alerts" value={String(state.alerts.length)} icon={<CircleAlert className="h-4 w-4" />} />
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Card className="p-6 sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Route queue</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">What happens after this</h2>
            </div>
            <p className="text-sm text-[var(--muted)]">Remaining items update after completions and replans.</p>
          </div>

          {state.currentAction ? (
            <div className="mt-6 rounded-[30px] border border-[var(--card-border)] bg-white p-5 shadow-[0_12px_28px_rgba(12,20,37,0.06)]">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Current planned slot</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-semibold text-[var(--foreground)]">{state.currentAction.title}</h3>
                <Badge variant={state.currentAction.type === "DINING" ? "success" : state.currentAction.type === "BREAK" ? "warning" : "neutral"}>
                  {state.currentAction.type}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{state.currentAction.explanation}</p>
              <p className="mt-4 text-sm text-[var(--muted)]">
                {new Date(state.currentAction.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} • {state.currentAction.predictedWaitMinutes}m wait • {state.currentAction.walkingMinutes}m walk
              </p>
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            {state.upcomingItems.length ? (
              state.upcomingItems.map((item, index) => (
                <div key={item.id} className="relative pl-10">
                  {index < state.upcomingItems.length - 1 ? (
                    <div className="absolute left-[15px] top-12 h-[calc(100%+1rem)] w-px bg-[rgba(124,149,182,0.22)]" />
                  ) : null}
                  <div className="absolute left-0 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--card-border)] bg-white text-sm font-semibold text-[var(--foreground)]">
                    {index + 1}
                  </div>
                  <div className="rounded-[28px] border border-[var(--card-border)] bg-white p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold text-[var(--foreground)]">{item.title}</h3>
                          <Badge variant={item.type === "DINING" ? "success" : item.type === "BREAK" ? "warning" : "neutral"}>
                            {item.type}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-[var(--muted)]">
                          {new Date(item.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} • {item.predictedWaitMinutes}m wait • {item.walkingMinutes}m walk
                        </p>
                        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.explanation}</p>
                      </div>
                      <div className="rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--muted)] lg:min-w-[220px]">
                        <p className="font-semibold text-[var(--foreground)]">Why it stays in the plan</p>
                        <p className="mt-2">{item.reason}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-[26px] border border-[var(--card-border)] bg-white p-5 text-sm text-[var(--muted)]">No remaining itinerary items. Complete the last step to reach the summary.</p>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Alerts</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">Operational changes</h2>
              </div>
              <Badge variant={state.alerts.length ? "warning" : "success"}>{state.alerts.length ? `${state.alerts.length} active` : "All clear"}</Badge>
            </div>
            <div className="mt-5 space-y-3">
              {state.alerts.length ? (
                state.alerts.map((alert, index) => (
                  <div key={`${alert.title}-${index}`} className="rounded-[26px] border border-[var(--card-border)] bg-white p-4">
                    <div className="flex items-center gap-3">
                      <Badge variant={alert.severity}>{alert.severity}</Badge>
                      <p className="font-semibold text-[var(--foreground)]">{alert.title}</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{alert.detail}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-[26px] border border-[var(--card-border)] bg-white p-4 text-sm text-[var(--muted)]">No live alerts right now.</p>
              )}
            </div>
          </Card>

          <Card className="p-6 sm:p-7">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Weather readout</p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">{state.weather.condition.replaceAll("_", " ")}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{state.weather.summary}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ConditionTile label="Temperature" value={`${state.weather.tempF}F`} icon={<CloudSun className="h-4 w-4" />} />
              <ConditionTile label="Rain chance" value={`${state.weather.rainChance}%`} icon={<Waves className="h-4 w-4" />} />
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

function ConditionTile({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-[24px] border border-[var(--card-border)] bg-white p-4">
      <div className="flex items-center gap-3 text-[var(--foreground)]">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(238,253,249,0.9)] text-[var(--teal-700)]">{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function DataTile({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-[24px] border border-sky-100 bg-slate-50 p-4">
      <div className="flex items-center gap-3 text-[var(--foreground)]">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(238,253,249,0.9)] text-[var(--teal-700)]">{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{value}</p>
        </div>
      </div>
    </div>
  );
}
