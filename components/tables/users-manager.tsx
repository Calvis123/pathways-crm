"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AppRole, AppUserRecord } from "@/lib/types";
import { PaginationControls } from "@/components/ui/pagination-controls";

const roleLabels: Record<AppUserRecord["role"], string> = {
  superadmin: "Super Admin",
  employee: "Employee",
  admin: "Admin",
  hr: "HR",
  operations: "Operations",
  marketing: "Marketing",
  consultant: "Consultant",
  ielts_trainer: "IELTS Trainer",
  partner: "Partner"
};

const roleDescriptions: Record<AppUserRecord["role"], string> = {
  superadmin: "Owner-level full control",
  employee: "General CRM operations",
  admin: "Full system, user, and finance control",
  hr: "System oversight",
  operations: "Documents and process",
  marketing: "Leads and campaigns",
  consultant: "Student support",
  ielts_trainer: "IELTS only",
  partner: "Read-only partner dashboard"
};

const roleBadgeTone: Record<AppUserRecord["role"], string> = {
  superadmin: "bg-[linear-gradient(135deg,#213343,#3f5a68)] text-gold",
  employee: "bg-slate-500 text-white",
  admin: "bg-sky-500 text-white",
  hr: "bg-teal-500 text-white",
  operations: "bg-emerald-500 text-white",
  marketing: "bg-amber-500 text-white",
  consultant: "bg-violet-500 text-white",
  ielts_trainer: "bg-rose-500 text-white",
  partner: "bg-slate-700 text-white"
};

const allRoles: AppUserRecord["role"][] = [
  "superadmin",
  "admin",
  "employee",
  "hr",
  "operations",
  "marketing",
  "consultant",
  "ielts_trainer",
  "partner"
];

const ITEMS_PER_PAGE = 10;

export function UsersManager({
  users,
  currentUsername,
  permissions
}: {
  users: AppUserRecord[];
  currentUsername: string | null;
  permissions: Array<{ label: string; prefix: string; roles: AppRole[] }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<{ id: string; username: string } | null>(null);
  const [editTarget, setEditTarget] = useState<AppUserRecord | null>(null);
  const [page, setPage] = useState(0);

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [users]
  );
  const pageCount = Math.max(1, Math.ceil(sortedUsers.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const paginatedUsers = sortedUsers.slice(safePage * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }

  function handleCreateUser(formData: FormData) {
    clearMessages();

    startTransition(async () => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.get("username"),
          full_name: formData.get("full_name"),
          email: formData.get("email"),
          password: formData.get("password"),
          role: formData.get("role")
        })
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error ?? "Error creating user.");
        return;
      }

      setSuccess("User created successfully!");
      router.refresh();
    });
  }

  function handleEditUser(formData: FormData) {
    if (!editTarget) return;
    clearMessages();

    startTransition(async () => {
      const response = await fetch(`/api/users/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.get("username"),
          full_name: formData.get("full_name"),
          email: formData.get("email"),
          role: formData.get("role"),
          status: formData.get("status"),
          phone: formData.get("phone") || null
        })
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error ?? "Failed to update user.");
        return;
      }

      setSuccess("User updated successfully.");
      setEditTarget(null);
      router.refresh();
    });
  }

  function handleResetPassword(formData: FormData) {
    if (!resetTarget) return;
    clearMessages();

    startTransition(async () => {
      const response = await fetch(`/api/users/${resetTarget.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: formData.get("new_password") })
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error ?? "Error resetting password.");
        return;
      }

      setSuccess("Password reset successfully!");
      setResetTarget(null);
      router.refresh();
    });
  }

  function handleDelete(user: AppUserRecord) {
    if (!window.confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
      return;
    }

    clearMessages();

    startTransition(async () => {
      const response = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error ?? "Error deleting user.");
        return;
      }

      setSuccess("User deleted successfully!");
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-[#eadacc] bg-white shadow-panel dark:border-white/10 dark:bg-[#182638] dark:shadow-[0_22px_70px_rgba(2,6,23,0.32)]">
      <div className="border-b border-gold/20 bg-[linear-gradient(135deg,#213343,#3f5a68)] px-8 py-6 text-white dark:border-white/10 dark:bg-[linear-gradient(135deg,#213343,#3f5a68)]">
        <h1 className="font-serif text-3xl">User Management</h1>
        <p className="mt-2 text-sm text-white/70">Manage users, edit access profiles, and review role permissions.</p>
      </div>

      <div className="space-y-6 px-8 py-8">
        {error ? <Banner tone="error" message={error} /> : null}
        {success ? <Banner tone="success" message={success} /> : null}

        <section className="rounded-xl border border-[#eadacc] bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <h2 className="mb-5 font-serif text-2xl text-ink dark:text-slate-50">Add New User</h2>
          <form action={handleCreateUser} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Username *" name="username" placeholder="e.g. jdoe" required />
              <Field label="Full Name *" name="full_name" placeholder="e.g. John Doe" required />
              <Field label="Email *" name="email" type="email" placeholder="e.g. john@example.com" required />
              <Field label="Password *" name="password" type="password" placeholder="Minimum 8 characters" required />
              <RoleField />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-70 dark:bg-[#ff7a59]"
            >
              Add User
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-[#eadacc] bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl text-ink dark:text-slate-50">Current Users</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create, edit, reset, activate, and deactivate users from one screen.</p>
            </div>
            <div className="rounded-2xl border border-[#eadacc] bg-[#fff6ef] px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
              {sortedUsers.length} users
            </div>
          </div>
          {sortedUsers.length > ITEMS_PER_PAGE ? (
            <div className="mb-4">
              <PaginationControls
                page={safePage}
                pageCount={pageCount}
                total={sortedUsers.length}
                perPage={ITEMS_PER_PAGE}
                onPageChange={setPage}
                label="users"
              />
            </div>
          ) : null}
          <div className="overflow-x-auto rounded-2xl border border-[#eadacc] dark:border-white/10">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-[linear-gradient(135deg,#213343,#3f5a68)] text-left text-xs uppercase tracking-[0.08em] text-white">
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last Login</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => {
                  const isSelf = currentUsername === user.username;
                  return (
                    <tr key={user.id} className="border-b border-[#f0dfd0] hover:bg-gold/5 dark:border-white/10 dark:hover:bg-white/[0.03]">
                      <td className="px-4 py-4 font-semibold text-ink dark:text-slate-50">{user.username}</td>
                      <td className="px-4 py-4 text-sm text-ink dark:text-slate-100">{user.full_name}</td>
                      <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{user.email || "N/A"}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${roleBadgeTone[user.role]}`}>
                          {roleLabels[user.role]}
                        </span>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{roleDescriptions[user.role]}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${user.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-300">
                        {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString("en-KE") : "Never"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setEditTarget(user)}
                            className="rounded-xl border border-[#eadacc] px-3 py-2 text-xs font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setResetTarget({ id: user.id, username: user.username })}
                            className="rounded-xl border border-[#eadacc] px-3 py-2 text-xs font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200"
                          >
                            Reset
                          </button>
                          {!isSelf ? (
                            <button
                              type="button"
                              onClick={() => handleDelete(user)}
                              className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-[#eadacc] bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="mb-5">
            <h2 className="font-serif text-2xl text-ink dark:text-slate-50">Role & Permission Matrix</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Current route-level access for every built-in role in the CRM.</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[#eadacc] dark:border-white/10">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-[linear-gradient(135deg,#213343,#3f5a68)] text-left text-xs uppercase tracking-[0.08em] text-white">
                  <th className="px-4 py-3">Module</th>
                  {allRoles.map((role) => (
                    <th key={role} className="px-4 py-3">{roleLabels[role]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((entry) => (
                  <tr key={entry.prefix} className="border-b border-[#f0dfd0] dark:border-white/10">
                    <td className="px-4 py-4">
                      <p className="font-medium text-ink dark:text-slate-100">{entry.label}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{entry.prefix}</p>
                    </td>
                    {allRoles.map((role) => {
                      const allowed = entry.roles.includes(role);
                      return (
                        <td key={role} className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${allowed ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-white/[0.08] dark:text-slate-400"}`}>
                            {allowed ? "Allowed" : "Blocked"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {resetTarget ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#213343]/50 px-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setResetTarget(null);
          }}
        >
          <div className="w-full max-w-lg rounded-xl border border-[#eadacc] bg-white p-6 shadow-panel dark:border-white/10 dark:bg-[#182638]">
            <h2 className="mb-5 font-serif text-2xl text-ink dark:text-slate-50">Reset Password</h2>
            <form action={handleResetPassword} className="space-y-4">
              <Field label="Username" name="username_display" defaultValue={resetTarget.username} readOnly />
              <Field label="New Password *" name="new_password" type="password" required />
              <div className="flex gap-3">
                <button type="submit" disabled={isPending} className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-70 dark:bg-[#ff7a59]">
                  Reset Password
                </button>
                <button type="button" onClick={() => setResetTarget(null)} className="rounded-xl border border-[#eadacc] px-4 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editTarget ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#213343]/50 px-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setEditTarget(null);
          }}
        >
          <div className="w-full max-w-3xl rounded-xl border border-[#eadacc] bg-white p-6 shadow-panel dark:border-white/10 dark:bg-[#182638]">
            <h2 className="mb-5 font-serif text-2xl text-ink dark:text-slate-50">Edit User</h2>
            <form action={handleEditUser} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Username *" name="username" required defaultValue={editTarget.username} />
                <Field label="Full Name *" name="full_name" required defaultValue={editTarget.full_name} />
                <Field label="Email *" name="email" type="email" required defaultValue={editTarget.email} />
                <Field label="Phone" name="phone" defaultValue={editTarget.phone ?? ""} />
                <label className="block text-sm text-slate-600">
                  <span className="mb-2 block font-medium text-ink">Role *</span>
                  <select name="role" required className="w-full rounded-xl border border-[#eadacc] bg-[#fff6ef] px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white" defaultValue={editTarget.role}>
                    {allRoles.map((role) => (
                      <option key={role} value={role}>
                        {roleLabels[role]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-slate-600">
                  <span className="mb-2 block font-medium text-ink">Status *</span>
                  <select name="status" required className="w-full rounded-xl border border-[#eadacc] bg-[#fff6ef] px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white" defaultValue={editTarget.status}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </label>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={isPending} className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-70 dark:bg-[#ff7a59]">
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditTarget(null)} className="rounded-xl border border-[#eadacc] px-4 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function RoleField() {
  return (
    <label className="block text-sm text-slate-600 dark:text-slate-300">
      <span className="mb-2 block font-medium text-ink dark:text-slate-100">Role *</span>
      <select
        name="role"
        required
        className="w-full rounded-xl border border-[#eadacc] bg-[#fff6ef] px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
        defaultValue=""
      >
        <option value="" disabled>
          Select role
        </option>
        <option value="superadmin">Super Admin (Owner)</option>
        <option value="admin">Admin</option>
        <option value="employee">Employee</option>
        <option value="hr">HR</option>
        <option value="operations">Operations</option>
        <option value="marketing">Marketing</option>
        <option value="consultant">Consultant</option>
        <option value="ielts_trainer">IELTS Trainer</option>
        <option value="partner">Partner</option>
      </select>
      <span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">
        Super Admin/Admin: Full control including finance | Operations: Documents | Marketing: Leads
      </span>
    </label>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  defaultValue,
  readOnly = false
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="block text-sm text-slate-600 dark:text-slate-300">
      <span className="mb-2 block font-medium text-ink dark:text-slate-100">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        readOnly={readOnly}
        className="w-full rounded-xl border border-[#eadacc] bg-[#fff6ef] px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
      />
    </label>
  );
}

function Banner({ tone, message }: { tone: "error" | "success"; message: string }) {
  return (
    <div
      className={`rounded-2xl px-4 py-4 text-sm font-semibold ${
        tone === "error" ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
      }`}
    >
      {message}
    </div>
  );
}
