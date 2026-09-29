"use client";

import { useState } from "react";

export type TrendPoint = { label: string; value: number };

// A day-by-day trend, e.g. errands posted over the last two weeks. One
// hue (magnitude over time, not identity), rounded data-ends, a hover
// tooltip per bar, and sparse axis labels so the row doesn't turn into a
// wall of dates.
export function TrendBarChart({
  data,
  color = "var(--primary)",
  valueFormatter = (n: number) => String(n),
}: {
  data: TrendPoint[];
  color?: string;
  valueFormatter?: (n: number) => string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const labelEvery = data.length > 10 ? 2 : 1;

  if (data.every((d) => d.value === 0)) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nothing to show yet.</p>;
  }

  return (
    <div>
      <div className="flex h-32 items-end gap-1.5 sm:gap-2">
        {data.map((d, i) => (
          <div
            key={d.label + i}
            className="group relative flex flex-1 justify-center"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
          >
            {hovered === i && (
              <div className="pointer-events-none absolute -top-9 z-10 rounded-md bg-foreground px-2 py-1 text-xs font-medium whitespace-nowrap text-background shadow-sm">
                {valueFormatter(d.value)} · {d.label}
              </div>
            )}
            <div
              className="w-full rounded-t-sm transition-[height] duration-300"
              style={{
                height: `${Math.max((d.value / max) * 100, d.value > 0 ? 4 : 1)}%`,
                backgroundColor: d.value > 0 ? color : "var(--border)",
                opacity: hovered === null || hovered === i ? 1 : 0.45,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {data.map((d, i) => (
          <div key={d.label + i} className="flex-1 text-center">
            {i % labelEvery === 0 && (
              <span className="text-[10px] text-muted-foreground sm:text-xs">{d.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
