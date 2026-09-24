"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/timeAgo";

// "5 min ago", kept fresh while the page stays open. The server and the
// browser render a moment apart so their text can differ by a tick, hence
// suppressHydrationWarning: it's the one text that's allowed to.
export function TimeAgo({ date, prefix }: { date: Date | string; prefix?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span suppressHydrationWarning>
      {prefix}
      {timeAgo(date, now)}
    </span>
  );
}
