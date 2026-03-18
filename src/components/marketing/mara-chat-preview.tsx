import Image from "next/image";

import { generatedVisuals } from "@/lib/generated-assets";

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
    body: "We want a Friday date night after 7. Dinner, something after, and a backup if the sitter runs late?",
  },
  {
    role: "mara",
    name: "Mara",
    time: "7:03 PM",
    body: "Yes. I would start downtown: a 7:30 dinner, a short walk nearby, and one easy indoor backup.",
  },
  {
    role: "user",
    name: "You",
    time: "7:04 PM",
    body: "Keep it under $180 and get us home by 10:45?",
  },
  {
    role: "mara",
    name: "Mara",
    time: "7:04 PM",
    body: "Done. I tightened the route, moved dinner closer, and kept dessert optional.",
  },
];

const maraCapabilities = [
  {
    title: "Ask the next question",
    image: generatedVisuals.homepage.dayOf,
    imageAlt: "Mara guiding the next planning question",
  },
  {
    title: "Shape the route",
    image: generatedVisuals.planners.studio,
    imageAlt: "Mara shaping a trip route",
  },
  {
    title: "Split up prep",
    image: generatedVisuals.homepage.story,
    imageAlt: "Shared trip logistics and prep planning",
  },
] as const;

export function MaraChatPreview() {
  return (
    <section id="mara-workflow" className="surface-shell overflow-hidden rounded-[38px] p-6 scroll-mt-32 sm:p-8 lg:p-10">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] xl:items-start">
        <div className="space-y-5">
          <SectionIntro eyebrow="Mara on Plus" title="What Mara does." />

          <div className="rounded-[30px] border border-white/70 bg-white/78 p-5 shadow-[0_16px_34px_rgba(12,20,37,0.08)]">
            <div className="flex items-center gap-4">
              <MaraPortrait size="md" />
              <div>
                <p className="text-lg font-semibold text-[var(--foreground)]">Simple, direct, useful</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Ask. refine. lock the plan.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {maraCapabilities.map((item) => (
              <div key={item.title} className="overflow-hidden rounded-[24px] border border-white/70 bg-white/80 shadow-[0_12px_26px_rgba(12,20,37,0.08)]">
                <div className="relative h-28">
                  <Image src={item.image} alt={item.imageAlt} fill sizes="(min-width: 1280px) 18rem, 100vw" className="object-cover object-center" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,17,30,0.08)_0%,rgba(8,17,30,0.56)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 px-4 py-3">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-[rgba(187,201,227,0.58)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,250,255,0.92))] p-4 shadow-[0_22px_50px_rgba(12,20,37,0.1)] sm:p-5">
          <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-strong)]">Example chat</p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                Friday night out
              </h3>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(28,198,170,0.25)] bg-[rgba(238,253,249,0.9)] px-3 py-1.5 text-sm font-medium text-[var(--teal-700)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--teal-500)] animate-pulse" />
              Plus feature
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
          </div>
        </div>
      </div>
    </section>
  );
}
