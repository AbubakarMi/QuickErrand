"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("category") ?? "";

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    router.push(value ? `/runner/dashboard?category=${value}` : "/runner/dashboard");
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="input w-auto"
      aria-label="Filter by category"
    >
      <option value="">All categories</option>
      {CATEGORIES.map((c) => (
        <option key={c.value} value={c.value}>
          {c.label}
        </option>
      ))}
    </select>
  );
}
