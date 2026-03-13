import { StaticPageShell } from "@/components/marketing/static-page-shell";

const roadmapMonths = [
  {
    month: "April 2026",
    title: "Trip sharing that actually works for families and groups",
    summary:
      "Shared trip spaces, cleaner guest coordination, and faster plan handoff so one person is not manually relaying every change.",
    items: [
      "Invite family and friends into a trip with clearer roles and simpler collaboration.",
      "Share a polished trip view that keeps everyone aligned without exposing editing controls they do not need.",
      "See trip readiness at a glance with status signals for draft, in-progress, and park-day-ready plans.",
    ],
  },
  {
    month: "May 2026",
    title: "Smarter daily timelines with less manual tuning",
    summary:
      "Planning shifts from list-building to flow-building, with stronger schedule structure and better pacing across the day.",
    items: [
      "A redesigned timeline view that makes park-day pacing easier to understand before you arrive.",
      "Suggested ride, dining, and break windows that account for the shape of the day instead of isolated picks.",
      "More visible trip friction alerts when a plan is overpacked, missing downtime, or likely to create unnecessary backtracking.",
    ],
  },
  {
    month: "June 2026",
    title: "Calendar sync that keeps the whole trip visible",
    summary:
      "Parqara becomes easier to fit into the rest of your life with deeper calendar visibility before, during, and after a trip.",
    items: [
      "Richer calendar sync so upcoming park trips, trip phases, and planning milestones stay visible alongside your personal schedule.",
      "Trip-level status chips in the calendar for ideas, booked plans, final prep, active trip days, and completed visits.",
      "Faster jump-in actions from the calendar so opening a trip takes you directly back into the planner workspace.",
    ],
  },
  {
    month: "July 2026",
    title: "Mara becomes a stronger planning partner",
    summary:
      "The assistant moves beyond general guidance and gets better at spotting missing inputs, tradeoffs, and plan weaknesses early.",
    items: [
      "More proactive planning prompts that surface missing details before they turn into park-day problems.",
      "Stronger plan pressure-testing for families, multi-person groups, and trips with tight timing constraints.",
      "A clearer planning conversation that uses saved trip context first instead of repeating questions you already answered.",
    ],
  },
  {
    month: "August 2026",
    title: "Live trip mode gets more useful in the park",
    summary:
      "Parqara starts feeling less like a planning document and more like a live operating layer for the day itself.",
    items: [
      "A more focused live trip surface built for fast decisions while you are moving through the park.",
      "Trip-state cues that make it easier to understand what is next, what is slipping, and where flexibility still exists.",
      "Quicker re-entry into the right trip view when plans change mid-day and you need to recover fast.",
    ],
  },
  {
    month: "September 2026",
    title: "A more polished trip system from first idea to final recap",
    summary:
      "The product experience tightens up end to end, with a cleaner path from trip kickoff through completion.",
    items: [
      "A stronger trip home experience that helps you see all upcoming plans, recent visits, and what still needs attention.",
      "Sharper completion states and post-trip organization so finished trips remain useful instead of becoming clutter.",
      "A more premium planning experience across the app with tighter visuals, faster workflows, and less friction in core actions.",
    ],
  },
] as const;

const focusAreas = [
  "Group planning that reduces coordination overhead.",
  "Schedule clarity before the park day starts.",
  "Calendar awareness that keeps trips visible in real life.",
  "A more capable Mara without turning the product into a chatbot shell.",
  "Stronger live-trip support when the day stops matching the original plan.",
] as const;

export default function RoadmapPage() {
  return (
    <StaticPageShell
      eyebrow="Roadmap"
      title="What Parqara is building from April through September 2026"
      description="This roadmap is built to show where the product is headed over the next six months: more collaboration, clearer schedules, stronger calendar visibility, a smarter Mara, and better live-trip support."
    >
      <section>
        <h2>Why we are publishing this</h2>
        <p>
          Parqara is still early, but the direction is clear. We are building toward a trip system that feels useful before the park day, calm during
          the park day, and organized after it. The roadmap below is meant to show that momentum in concrete terms.
        </p>
        <p>
          The exact order can shift as we learn, but these are the product areas we expect to push forward from <strong>April 2026</strong> through{" "}
          <strong>September 2026</strong>.
        </p>
      </section>

      <section>
        <h2>What is coming into focus</h2>
        <ul>
          {focusAreas.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Six-month roadmap</h2>
        <div className="grid gap-4 sm:gap-5">
          {roadmapMonths.map((entry) => (
            <article
              key={entry.month}
              className="rounded-[28px] border border-slate-200/80 bg-slate-50/80 px-5 py-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)] sm:px-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{entry.month}</p>
              <h3 className="mt-2 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
                {entry.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{entry.summary}</p>
              <ul className="mt-4">
                {entry.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>What this means for early users</h2>
        <p>
          If you are joining Parqara now, you are getting in while the core trip model is taking shape. The next stretch is focused on making that
          foundation feel more collaborative, more visible across your schedule, and more dependable when the day gets real.
        </p>
        <p>
          We want the product to feel progressively more complete each month, not just bigger. That means better trip clarity, stronger coordination,
          and faster recovery when plans change.
        </p>
      </section>
    </StaticPageShell>
  );
}
