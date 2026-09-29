// Buckets a list of timestamps into one count per day, oldest to newest,
// for the admin dashboard's trend charts. UTC day boundaries throughout,
// good enough for a two-week trend sparkline, not meant to be
// timezone-exact.
export function bucketByDay(dates: Date[], days: number): { label: string; value: number }[] {
  const counts = new Map<string, number>();
  const keys: string[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    keys.push(key);
    counts.set(key, 0);
  }

  for (const date of dates) {
    const key = date.toISOString().slice(0, 10);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return keys.map((key) => ({
    label: new Date(`${key}T00:00:00Z`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }),
    value: counts.get(key) ?? 0,
  }));
}
