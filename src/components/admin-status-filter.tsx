"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { TaskStatus } from "@prisma/client";

const LABEL: Record<TaskStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// Same merge-the-query-string approach as admin-search-box.tsx, a change
// here keeps whatever text search is already set, and vice versa.
export function AdminStatusFilter({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "";

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams);
    if (event.target.value) params.set("status", event.target.value);
    else params.delete("status");
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  return (
    <select value={current} onChange={handleChange} className="input w-auto" aria-label="Filter by status">
      <option value="">All statuses</option>
      {Object.values(TaskStatus).map((status) => (
        <option key={status} value={status}>
          {LABEL[status]}
        </option>
      ))}
    </select>
  );
}
