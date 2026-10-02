"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

// A text search box for the admin Users/Errands lists. Reads the current
// query string rather than just the one param it owns, so submitting a
// search doesn't clobber a status filter set alongside it (see
// admin-status-filter.tsx), and always resets back to page 1, a stale
// page number from before the search would otherwise just show "nothing
// here" instead of the actual results.
export function AdminSearchBox({
  basePath,
  placeholder,
}: {
  basePath: string;
  placeholder: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams);
    const trimmed = value.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full sm:w-64">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="input pl-9"
      />
    </form>
  );
}
