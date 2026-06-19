import { ModuleShell } from "@/components/dashboard/module-shell";
import { HrSectionNav } from "@/components/hr/hr-section-nav";
import { Card, CardHeader } from "@/components/ui/card";
import { permissionMatrix, roleLabel } from "@/lib/auth";
import { getStudents, getTasks, getUsers } from "@/lib/data";
import type { AppRole } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const roleOrder: AppRole[] = ["admin", "hr", "employee", "operations", "consultant", "marketing", "ielts_trainer", "partner"];

export default async function HrTeamPage() {
  const [users, students, tasks] = await Promise.all([getUsers(), getStudents(), getTasks()]);
  const openTasks = tasks.filter((task) => !["completed", "cancelled"].includes(task.status));

  const teamRows = users
    .map((user) => ({
      user,
      ownedStudents: students.filter((student) => student.created_by === user.username).length,
      openTasks: openTasks.filter((task) => task.assigned_to === user.username).length
    }))
    .sort((a, b) => a.user.full_name.localeCompare(b.user.full_name));

  const roleCounts = roleOrder.map((role) => ({
    role,
    total: users.filter((user) => user.role === role).length,
    active: users.filter((user) => user.role === role && user.status === "active").length
  }));

  return (
    <ModuleShell
      title="Team & Roles"
      description="HR visibility into who has access, which roles are active, and how work is distributed across the team."
    >
      <div className="space-y-6">
        <HrSectionNav />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {roleCounts.map((item) => (
            <div key={item.role} className="rounded-xl border border-[#eadacc] bg-white p-5 dark:border-white/10 dark:bg-[#182638]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                {roleLabel(item.role)}
              </p>
              <p className="mt-4 text-3xl font-semibold text-ink dark:text-white">{item.total}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{item.active} active</p>
            </div>
          ))}
        </div>

        <Card className="dark:border-white/10 dark:bg-[#182638]">
          <CardHeader title="Team Directory" description="A read-only HR view of CRM users and work ownership." />
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#f0dfd0] text-left text-xs uppercase tracking-[0.14em] text-slate-400 dark:border-white/10">
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Students</th>
                  <th className="px-3 py-3">Open Tasks</th>
                  <th className="px-3 py-3">Last Login</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {teamRows.map(({ user, ownedStudents, openTasks: userTasks }) => (
                  <tr key={user.id} className="border-b border-[#f0dfd0] dark:border-white/10">
                    <td className="px-3 py-4 font-medium text-ink dark:text-white">{user.full_name}</td>
                    <td className="px-3 py-4 text-slate-500 dark:text-slate-300">{user.email}</td>
                    <td className="px-3 py-4 text-slate-600 dark:text-slate-300">{roleLabel(user.role)}</td>
                    <td className="px-3 py-4 text-slate-600 dark:text-slate-300">{ownedStudents}</td>
                    <td className="px-3 py-4 text-slate-600 dark:text-slate-300">{userTasks}</td>
                    <td className="px-3 py-4 text-slate-500 dark:text-slate-300">
                      {user.last_login_at ? formatDate(user.last_login_at) : "Never"}
                    </td>
                    <td className="px-3 py-4">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="dark:border-white/10 dark:bg-[#182638]">
          <CardHeader title="HR Permission View" description="The routes HR can oversee compared with other CRM roles." />
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#f0dfd0] text-left text-xs uppercase tracking-[0.14em] text-slate-400 dark:border-white/10">
                  <th className="px-3 py-3">Area</th>
                  <th className="px-3 py-3">Route</th>
                  <th className="px-3 py-3">HR</th>
                  <th className="px-3 py-3">Allowed Roles</th>
                </tr>
              </thead>
              <tbody>
                {permissionMatrix.map((entry) => (
                  <tr key={entry.prefix} className="border-b border-[#f0dfd0] dark:border-white/10">
                    <td className="px-3 py-4 font-medium text-ink dark:text-white">{entry.label}</td>
                    <td className="px-3 py-4 text-slate-500 dark:text-slate-300">{entry.prefix}</td>
                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          entry.roles.includes("hr")
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
                            : "bg-slate-100 text-slate-500 dark:bg-white/[0.08] dark:text-slate-300"
                        }`}
                      >
                        {entry.roles.includes("hr") ? "Allowed" : "Blocked"}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-slate-500 dark:text-slate-300">
                      {entry.roles.map((role) => roleLabel(role)).join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </ModuleShell>
  );
}
