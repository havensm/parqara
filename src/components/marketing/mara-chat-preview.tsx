import { MaraPortrait } from "@/components/assistant/mara-portrait";
import { SectionIntro } from "@/components/ui/section-intro";

type ChatMessage = {
  role: "user" | "mara";
  name: string;
  time: string;
  body: string;
};

const chatMessages: ChatMessage[] = [
  {
    role: "user",
    name: "You",
    time: "7:02 PM",
    body: "We want a date night Friday after 7. Can you plan dinner, something to do after, and keep it easy if the babysitter runs late?",
  },
  {
    role: "mara",
    name: "Mara",
    time: "7:03 PM",
    body: "Yes. I would start downtown so parking stays simple. I can hold a 7:30 dinner, a short walk nearby, and one indoor backup if timing slips.",
  },
  {
    role: "user",
    name: "You",
    time: "7:04 PM",
    body: "Can you keep it under $180 and get us home by 10:45?",
  },
  {
    role: "mara",
    name: "Mara",
    time: "7:04 PM",
    body: "Updated. I swapped in a closer restaurant, tightened the route, and added a dessert stop you can skip if you are running late.",
  },
];

const planUpdates = [
  {
    label: "Dinner",
    value: "Laurel Table at 7:15 PM",
  },
  {
    label: "Next move",
    value: "River walk with an indoor backup",
  },
  {
    label: "Shared plan",
    value: "Ready to send with timing and notes",
  },
] as const;

export function MaraChatPreview() {
  return (
    <section id="mara-workflow" className="surface-shell overflow-hidden rounded-[38px] p-6 scroll-mt-32 sm:p-8 lg:p-10">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] xl:items-start">
        <div className="space-y-5">
          <SectionIntro eyebrow="Meet Mara" title="See what planning with Mara actually looks like." />

          <div className="rounded-[30px] border border-white/70 bg-white/78 p-5 shadow-[0_16px_34px_rgba(12,20,37,0.08)]">
            <div className="flex items-center gap-4">
              <MaraPortrait size="md" />
              <div>
                <p className="text-lg font-semibold text-[var(--foreground)]">Warm, smart, and practical</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Ask Mara for suggestions, timing help, tradeoffs, or a faster next move. She responds like a planning partner, not a generic chatbot.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-slate-200/80 pt-5">
              {[
                "Give her the rough idea and your constraints.",
                "Let her tighten timing, budget, and route choices.",
                "Use the updated plan on the day without starting over.",
              ].map((point) => (
                <div key={point} className="flex items-start gap-3 text-sm leading-6 text-[var(--foreground)]">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--teal-500)]" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-[rgba(187,201,227,0.58)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,250,255,0.92))] p-4 shadow-[0_22px_50px_rgba(12,20,37,0.1)] sm:p-5">
          <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-strong)]">Live example</p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                Friday date night planning
              </h3>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(28,198,170,0.25)] bg-[rgba(238,253,249,0.9)] px-3 py-1.5 text-sm font-medium text-[var(--teal-700)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--teal-500)] animate-pulse" />
              Mara is active
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {chatMessages.map((message, index) => {
              const isUser = message.role === "user";

              return (
                <div key={`${message.role}-${index}`} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser ? <MaraPortrait size="sm" className="mt-1" /> : null}
                  <div
                    className={[
                      "max-w-[92%] rounded-[24px] px-4 py-3 shadow-[0_12px_28px_rgba(12,20,37,0.08)] sm:max-w-[85%]",
                      isUser
                        ? "rounded-tr-[10px] bg-[linear-gradient(135deg,#0e2b43_0%,#176b64_56%,#1cc6aa_100%)] text-white"
                        : "rounded-tl-[10px] border border-white/75 bg-white text-[var(--foreground)]",
                    ].join(" ")}
                  >
                    <div className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${isUser ? "text-white/72" : "text-[var(--muted-strong)]"}`}>
                      <span>{message.name}</span>
                      <span className={isUser ? "text-white/45" : "text-slate-300"}>/</span>
                      <span>{message.time}</span>
                    </div>
                    <p className={`mt-2 text-sm leading-7 ${isUser ? "text-white/95" : "text-[var(--foreground)]"}`}>{message.body}</p>
                  </div>
                </div>
              );
            })}

            <div className="flex gap-3">
              <MaraPortrait size="sm" className="mt-1" />
              <div className="max-w-[85%] rounded-[24px] rounded-tl-[10px] border border-dashed border-[rgba(28,198,170,0.32)] bg-[rgba(238,253,249,0.72)] px-4 py-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--teal-700)]">
                  <span>Mara</span>
                  <span className="text-[var(--teal-500)]">/</span>
                  <span>updating the plan</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--teal-500)] animate-pulse" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--teal-500)] animate-pulse [animation-delay:120ms]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--teal-500)] animate-pulse [animation-delay:240ms]" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 border-t border-slate-200/80 pt-5 md:grid-cols-3">
            {planUpdates.map((update) => (
              <div key={update.label} className="rounded-[22px] border border-white/75 bg-white/88 px-4 py-4 shadow-[0_10px_24px_rgba(12,20,37,0.05)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">{update.label}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[var(--foreground)]">{update.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
