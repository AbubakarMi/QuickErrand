"use client";

import { useState } from "react";

export type BarDatum = { label: string; value: number; color?: string };

// Ranked-magnitude comparison, e.g. errands by status or by category. A
// single measure per row, direct-labelled, so no legend is needed, per row
// colour is only ever the app's own established mapping (status colours)
// or one consistent brand hue, never an invented categorical palette.
export function HorizontalBarChart({
  data,
  color = "var(--primary)",
  valueFormatter = (n: number) => String(n),
}: {
  data: BarDatum[];
  color?: string;
  valueFormatter?: (n: number) => string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.every((d) => d.value === 0)) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nothing to show yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((d, i) => (
        <div
          key={d.label}
          className="group flex items-center gap-3"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
        >
          <span className="w-28 shrink-0 truncate text-xs text-muted-foreground sm:w-36 sm:text-sm">
            {d.label}
          </span>
          <div className="relative h-6 flex-1 rounded-full bg-muted">
            <div
              className="h-6 rounded-full transition-[width] duration-300"
              style={{
                width: `${Math.max((d.value / max) * 100, d.value > 0 ? 3 : 0)}%`,
                backgroundColor: d.color ?? color,
                opacity: hovered === null || hovered === i ? 1 : 0.45,
              }}
            />
            {hovered === i && (
              <div className="pointer-events-none absolute -top-8 left-0 rounded-md bg-foreground px-2 py-1 text-xs font-medium whitespace-nowrap text-background shadow-sm">
                {valueFormatter(d.value)}
              </div>
            )}
          </div>
          <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums sm:text-sm">
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}
