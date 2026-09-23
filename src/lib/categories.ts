// Mirrors the Prisma `Category` enum as plain string literals so client
// components can render a category picker without importing @prisma/client
// (which pulls server-only code into the client bundle). Keep this in sync
// with prisma/schema.prisma by hand. It's six values, not worth codegen.
export const CATEGORIES = [
  { value: "GENERAL_ERRAND", label: "General errand" },
  { value: "PLUMBING", label: "Plumbing" },
  { value: "CARPENTRY", label: "Carpentry" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "CLEANING", label: "Cleaning" },
  { value: "OTHER", label: "Other" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];
