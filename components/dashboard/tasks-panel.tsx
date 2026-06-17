import type { Task } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";

const priorityTone: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-white/[0.08] dark:text-slate-200",
  medium: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200",
  high: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
  urgent: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200"
};

export function TasksPanel({ tasks }: { tasks: Task[] }) {
  return (
    <Card className="dark:border-white/10 dark:bg-[#182638]">
      <CardHeader title="Tasks" description="For reminders, assignments, and operational follow-up." />
      <div className="space-y-3">
        {tasks.slice(0, 6).map((task) => (
          <div key={task.id} className="rounded-2xl border border-[#f0dfd0] bg-[#fffaf5] p-4 dark:border-white/10 dark:bg-white/[0.05]">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-ink dark:text-white">{task.title}</p>
              <Badge className={priorityTone[task.priority]}>{task.priority}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{task.description ?? "No description"}</p>
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">Due {formatDate(task.due_date)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
