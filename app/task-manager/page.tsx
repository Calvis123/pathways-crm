import { ModuleShell } from "@/components/dashboard/module-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { getTasks } from "@/lib/data";

export default async function TaskManagerPage() {
  const tasks = await getTasks();

  return (
    <ModuleShell
      title="Task Manager"
      description="Internal follow-up and operations task queue."
    >
      <Card className="dark:border-white/10 dark:bg-[#0d1729]">
        <CardHeader title="Open Tasks" description={`${tasks.length} tracked tasks in the CRM.`} />
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.05]">
              <p className="font-semibold text-ink dark:text-white">{task.title}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                {task.status} · {task.priority} · {task.due_date ?? "No due date"}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </ModuleShell>
  );
}
