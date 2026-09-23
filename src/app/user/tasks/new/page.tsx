import { NewTaskForm } from "./new-task-form";

export default function NewTaskPage() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">Post an errand</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell a runner what you need. You can track it live once it&apos;s posted.
      </p>
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <NewTaskForm />
      </div>
    </div>
  );
}
