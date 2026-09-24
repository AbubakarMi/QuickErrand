import type { Category } from "@prisma/client";

// Stable sort: tasks matching `specialty` come first, everything else
// keeps its original relative order. Shared by the server-rendered
// runner dashboard and its client-side live-poll refresh so both stay
// visually consistent.
export function sortTasksBySpecialty<T extends { category: Category }>(
  tasks: T[],
  specialty: Category | null,
): T[] {
  return [...tasks].sort((a, b) => {
    const aMatches = a.category === specialty ? 0 : 1;
    const bMatches = b.category === specialty ? 0 : 1;
    return aMatches - bMatches;
  });
}
