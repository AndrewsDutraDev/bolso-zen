import type { ReactNode } from "react";

interface SummaryCardProps {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}

export function SummaryCard({ label, value, hint, icon }: SummaryCardProps) {
  return (
    <article className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-soft backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-moss/80">{label}</p>
          <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
        </div>
        <div className="rounded-2xl bg-mint p-3 text-moss">{icon}</div>
      </div>
      <p className="mt-4 text-sm text-moss/80">{hint}</p>
    </article>
  );
}
