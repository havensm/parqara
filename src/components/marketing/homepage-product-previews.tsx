import type { ReactNode } from "react";
import {
  AlertTriangle,
  BellRing,
  CalendarRange,
  CheckCircle2,
  Clock3,
  CloudRain,
  Compass,
  MapPinned,
  Route,
  Sparkles,
  Users2,
} from "lucide-react";

import { StatusChip } from "@/components/ui/status-chip";

export function RouteBoardPreview() {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(119,219,255,0.28),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,247,255,0.94))] p-4 shadow-[0_20px_44px_rgba(12,20,37,0.1)]">
      <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(99,167,255,0.4),transparent)]" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Planner board</p>
          <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">Route-first planning</h3>
        </div>
        <StatusChip label="Mara active" tone="teal" />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[0.95fr_1.2fr_0.95fr]">
        <div className="space-y-3">
          <PreviewPanel icon={<Clock3 className="h-4 w-4" />} title="Today" tone="sky">
            <PreviewLine label="8:45" value="Rope drop" />
            <PreviewLine label="11:30" value="Lunch window" />
            <PreviewLine label="7:10" value="Sunset ride" />
          </PreviewPanel>
          <PreviewPanel icon={<Users2 className="h-4 w-4" />} title="Shared context" tone="teal">
            <PreviewPill>Family pace saved</PreviewPill>
            <PreviewPill>Two must-dos locked</PreviewPill>
          </PreviewPanel>
        </div>

        <div className="relative min-h-[15.5rem] overflow-hidden rounded-[22px] border border-[rgba(99,167,255,0.18)] bg-[radial-gradient(circle_at_20%_18%,rgba(120,221,209,0.22),transparent_24%),linear-gradient(180deg,rgba(239,248,255,0.98),rgba(230,242,255,0.94))] px-4 py-3">
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(136,163,192,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(136,163,192,0.12)_1px,transparent_1px)] [background-size:34px_34px]" />
          <svg viewBox="0 0 340 220" className="absolute inset-0 h-full w-full">
            <path d="M42 170 C88 148, 102 72, 156 82 S232 174, 292 112" fill="none" stroke="rgba(50,165,255,0.8)" strokeWidth="8" strokeLinecap="round" strokeDasharray="2 18" />
            <path d="M58 154 C100 124, 118 54, 168 66 S240 152, 286 102" fill="none" stroke="rgba(28,198,170,0.28)" strokeWidth="26" strokeLinecap="round" />
            <circle cx="58" cy="154" r="13" fill="#1cc6aa" />
            <circle cx="122" cy="88" r="13" fill="#63a7ff" />
            <circle cx="190" cy="121" r="13" fill="#ff8d6b" />
            <circle cx="286" cy="102" r="13" fill="#8472ff" />
          </svg>
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <StatusChip label="Route board" tone="sky" />
              <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Clear pace
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-[18px] border border-white/72 bg-white/84 px-3 py-3 shadow-[0_12px_28px_rgba(12,20,37,0.06)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Next</p>
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">Lantern Rapids</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Low walk, strong fit, lunch nearby.</p>
              </div>
              <div className="rounded-[18px] border border-white/72 bg-white/84 px-3 py-3 shadow-[0_12px_28px_rgba(12,20,37,0.06)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Then</p>
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">Moonlit Manor</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Indoor buffer before the afternoon heat.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <PreviewPanel icon={<Compass className="h-4 w-4" />} title="Momentum" tone="amber">
            <PreviewMetric label="Walking kept tight" value="18 min saved" />
            <PreviewMetric label="Open tradeoffs" value="1 decision" />
          </PreviewPanel>
          <PreviewPanel icon={<Sparkles className="h-4 w-4" />} title="Mara note" tone="indigo">
            <p className="text-sm leading-6 text-[var(--muted)]">
              Shift the coaster later and keep the family-friendly cluster together while waits stay soft.
            </p>
          </PreviewPanel>
        </div>
      </div>
    </div>
  );
}

export function LiveSignalsPreview() {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[rgba(110,154,210,0.18)] bg-[radial-gradient(circle_at_top_right,rgba(119,219,255,0.18),transparent_22%),linear-gradient(180deg,#eef7ff_0%,#ffffff_100%)] p-4 shadow-[0_20px_44px_rgba(12,20,37,0.1)]">
      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(136,163,192,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(136,163,192,0.08)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Live follow-through</p>
            <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">Signals, alerts, and replans</h3>
          </div>
          <StatusChip label="Auto-updating" tone="sky" />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.18fr_0.82fr]">
          <div className="space-y-3">
            <SignalCard
              icon={<AlertTriangle className="h-4 w-4" />}
              title="Weather shift"
              detail="Rain risk moved up to 3:00 PM, so indoor options are now favored earlier."
              tone="amber"
            />
            <SignalCard
              icon={<BellRing className="h-4 w-4" />}
              title="Ride delay"
              detail="Comet Run is paused. Mara has already lined up the next best open path."
              tone="coral"
            />
            <SignalCard
              icon={<CheckCircle2 className="h-4 w-4" />}
              title="Replan ready"
              detail="A tighter sequence is available now with shorter walks and a cleaner lunch handoff."
              tone="teal"
            />
          </div>

          <div className="space-y-3">
            <PreviewPanel icon={<Route className="h-4 w-4" />} title="Next move" tone="sky">
              <p className="text-sm font-semibold text-[var(--foreground)]">Head to Moonlit Manor</p>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Indoor fallback with stable waits and an easy pivot back to the main route.</p>
            </PreviewPanel>
            <div className="rounded-[20px] border border-[rgba(110,154,210,0.18)] bg-white/88 p-4 shadow-[0_14px_30px_rgba(12,20,37,0.06)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Live signals</p>
              <div className="mt-3 space-y-2.5">
                <SignalPill icon={<CloudRain className="h-3.5 w-3.5" />} text="Storm chance 3:00 PM" />
                <SignalPill icon={<MapPinned className="h-3.5 w-3.5" />} text="2 min walk to fallback" />
                <SignalPill icon={<CalendarRange className="h-3.5 w-3.5" />} text="Lunch still holds at 11:30" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewPanel({
  icon,
  title,
  tone,
  children,
}: {
  icon: ReactNode;
  title: string;
  tone: "amber" | "indigo" | "sky" | "teal";
  children: ReactNode;
}) {
  const toneClassNames = {
    amber: "bg-[linear-gradient(180deg,rgba(255,248,235,0.98),rgba(255,255,255,0.94))] border-[rgba(245,179,66,0.2)]",
    indigo: "bg-[linear-gradient(180deg,rgba(245,242,255,0.98),rgba(255,255,255,0.94))] border-[rgba(132,114,255,0.18)]",
    sky: "bg-[linear-gradient(180deg,rgba(239,247,255,0.98),rgba(255,255,255,0.94))] border-[rgba(99,167,255,0.18)]",
    teal: "bg-[linear-gradient(180deg,rgba(238,253,249,0.98),rgba(255,255,255,0.94))] border-[rgba(28,198,170,0.18)]",
  } as const;

  return (
    <div className={`rounded-[20px] border p-4 shadow-[0_14px_30px_rgba(12,20,37,0.06)] ${toneClassNames[tone]}`}>
      <div className="flex items-center gap-2 text-[var(--foreground)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-white/86 shadow-[0_8px_20px_rgba(12,20,37,0.05)]">
          {icon}
        </div>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="mt-3 space-y-2.5">{children}</div>
    </div>
  );
}

function PreviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-white/72 bg-white/84 px-3 py-2 text-xs shadow-[0_8px_18px_rgba(12,20,37,0.04)]">
      <span className="font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</span>
      <span className="font-medium text-[var(--foreground)]">{value}</span>
    </div>
  );
}

function PreviewPill({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-full border border-white/76 bg-white/84 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)] shadow-[0_8px_18px_rgba(12,20,37,0.04)]">
      {children}
    </div>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/72 bg-white/84 px-3 py-3 shadow-[0_8px_18px_rgba(12,20,37,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function SignalCard({
  icon,
  title,
  detail,
  tone,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  tone: "amber" | "coral" | "teal";
}) {
  const toneClassNames = {
    amber: "border-[rgba(245,179,66,0.2)] bg-[linear-gradient(180deg,rgba(255,248,235,0.98),rgba(255,255,255,0.94))]",
    coral: "border-[rgba(255,140,113,0.2)] bg-[linear-gradient(180deg,rgba(255,241,238,0.98),rgba(255,255,255,0.94))]",
    teal: "border-[rgba(28,198,170,0.18)] bg-[linear-gradient(180deg,rgba(238,253,249,0.98),rgba(255,255,255,0.94))]",
  } as const;

  return (
    <div className={`rounded-[20px] border p-4 shadow-[0_14px_30px_rgba(12,20,37,0.06)] ${toneClassNames[tone]}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-white/86 text-[var(--foreground)] shadow-[0_8px_18px_rgba(12,20,37,0.05)]">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function SignalPill({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/76 bg-white/86 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)] shadow-[0_8px_18px_rgba(12,20,37,0.04)]">
      {icon}
      <span>{text}</span>
    </div>
  );
}
