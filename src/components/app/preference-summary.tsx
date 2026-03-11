import { Card } from "@/components/ui/card";

export function PreferenceSummary({ items }: { items: string[] }) {
  return (
    <Card className="p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Saved defaults</p>
      <h2 className="mt-4 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
        Your planning style, saved.
      </h2>
      <div className="mt-6 flex flex-wrap gap-3">
        {items.map((item) => (
          <div key={item} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
            {item}
          </div>
        ))}
      </div>
    </Card>
  );
}
