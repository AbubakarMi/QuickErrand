import type { TaskStatus } from "@prisma/client";

const STATUS_CONFIG: Record<TaskStatus, { label: string; colorVar: string }> = {
  PENDING: { label: "Pending", colorVar: "--status-pending" },
  ACCEPTED: { label: "Accepted", colorVar: "--status-accepted" },
  IN_PROGRESS: { label: "In progress", colorVar: "--status-in-progress" },
  COMPLETED: { label: "Completed", colorVar: "--status-completed" },
  CANCELLED: { label: "Cancelled", colorVar: "--status-cancelled" },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        backgroundColor: `color-mix(in oklch, var(${config.colorVar}), transparent 85%)`,
        color: `var(${config.colorVar})`,
      }}
    >
      {config.label}
    </span>
  );
}
