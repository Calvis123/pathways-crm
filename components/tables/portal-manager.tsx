"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { readJsonBody } from "@/lib/http";
import type { PortalAccessRecord, PortalActivity, PortalMessage, Student } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

export function PortalManager({
  students,
  access,
  messages,
  activity
}: {
  students: Student[];
  access: PortalAccessRecord[];
  messages: PortalMessage[];
  activity: PortalActivity[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState("");
  const [accessPage, setAccessPage] = useState(0);
  const [messagesPage, setMessagesPage] = useState(0);
  const [activityPage, setActivityPage] = useState(0);
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [messageForm, setMessageForm] = useState({
    student_id: students[0]?.id ?? "",
    subject: "",
    message: ""
  });
  const accessPageCount = Math.max(1, Math.ceil(access.length / ITEMS_PER_PAGE));
  const safeAccessPage = Math.min(accessPage, accessPageCount - 1);
  const paginatedAccess = access.slice(safeAccessPage * ITEMS_PER_PAGE, safeAccessPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE);
  const messagesPageCount = Math.max(1, Math.ceil(messages.length / ITEMS_PER_PAGE));
  const safeMessagesPage = Math.min(messagesPage, messagesPageCount - 1);
  const paginatedMessages = messages.slice(safeMessagesPage * ITEMS_PER_PAGE, safeMessagesPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE);
  const activityPageCount = Math.max(1, Math.ceil(activity.length / ITEMS_PER_PAGE));
  const safeActivityPage = Math.min(activityPage, activityPageCount - 1);
  const paginatedActivity = activity.slice(safeActivityPage * ITEMS_PER_PAGE, safeActivityPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  async function generateAccess() {
    setStatus("");
    startTransition(async () => {
      const response = await fetch("/api/portal/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId })
      });
      const body = await readJsonBody<{ error?: string; link?: string }>(response);
      if (!response.ok) {
        setStatus(body?.error ?? "Failed to generate access.");
        return;
      }
      setStatus(body?.link ? `Portal link ready: ${body.link}` : "Portal access generated.");
      router.refresh();
    });
  }

  async function revokeAccess(targetStudentId: string) {
    setStatus("");
    startTransition(async () => {
      const response = await fetch(`/api/portal/access/${targetStudentId}`, { method: "PATCH" });
      const body = await readJsonBody<{ error?: string }>(response);
      if (!response.ok) {
        setStatus(body?.error ?? "Failed to revoke access.");
        return;
      }
      setStatus("Portal access revoked.");
      router.refresh();
    });
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    startTransition(async () => {
      const response = await fetch("/api/portal/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageForm)
      });
      const body = await readJsonBody<{ error?: string }>(response);
      if (!response.ok) {
        setStatus(body?.error ?? "Failed to send message.");
        return;
      }
      setMessageForm((current) => ({ ...current, subject: "", message: "" }));
      setStatus("Message sent to student.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card className="dark:border-white/10 dark:bg-[#182638]">
        <CardHeader
          title="Portal Access"
          description="Generate student portal links, monitor last login, and revoke access when needed."
        />
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[280px] flex-1 text-sm text-slate-600 dark:text-slate-300">
            <span className="mb-2 block font-medium text-ink dark:text-slate-100">Student</span>
            <select
              className="w-full rounded-lg border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name} · {student.email}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" onClick={generateAccess} disabled={isPending || !studentId}>
            {isPending ? "Working..." : "Generate Portal Link"}
          </Button>
        </div>
        {status ? (
          <p className="mt-3 rounded-lg border border-[#eadacc] bg-[#fff6ef] px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
            {status}
          </p>
        ) : null}
      </Card>

      <Card className="dark:border-white/10 dark:bg-[#182638]">
        <CardHeader title="Active Access" description="Current portal credentials and recent student activity." />
        <div className="overflow-x-auto rounded-lg border border-[#eadacc] dark:border-white/10">
          {access.length > ITEMS_PER_PAGE ? (
            <div className="border-b border-[#eadacc] bg-[#fffaf5] p-3 dark:border-white/10 dark:bg-white/[0.03]">
              <PaginationControls
                page={safeAccessPage}
                pageCount={accessPageCount}
                total={access.length}
                perPage={ITEMS_PER_PAGE}
                onPageChange={setAccessPage}
                label="access records"
              />
            </div>
          ) : null}
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr>
                <th className="pb-3 font-medium">Student</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Last Login</th>
                <th className="pb-3 font-medium">Expires</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {access.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500 dark:text-slate-300">
                    No student portal access links have been created yet.
                  </td>
                </tr>
              ) : (
                paginatedAccess.map((entry) => (
                  <tr key={entry.id} className="border-t border-[#f0dfd0] dark:border-white/10">
                    <td className="py-3">
                      <p className="font-medium text-ink dark:text-slate-100">{entry.student?.full_name ?? entry.student_id}</p>
                      <p className="text-slate-500 dark:text-slate-400">{entry.student?.email ?? ""}</p>
                    </td>
                    <td className="py-3 dark:text-slate-200">{entry.is_active ? "Active" : "Inactive"}</td>
                    <td className="py-3 dark:text-slate-300">{formatDate(entry.last_login_at, { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="py-3 dark:text-slate-300">{formatDate(entry.token_expires_at)}</td>
                    <td className="py-3">
                      {entry.is_active ? (
                        <Button type="button" variant="secondary" onClick={() => revokeAccess(entry.student_id)}>
                          Revoke
                        </Button>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">Revoked</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="dark:border-white/10 dark:bg-[#182638]">
        <CardHeader title="Send Message" description="Send portal messages that appear on the student's dashboard." />
        <form className="grid gap-4 md:grid-cols-2" onSubmit={sendMessage}>
          <label className="text-sm text-slate-600 dark:text-slate-300">
            <span className="mb-2 block font-medium text-ink dark:text-slate-100">Student</span>
            <select
              className="w-full rounded-lg border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              value={messageForm.student_id}
              onChange={(event) =>
                setMessageForm((current) => ({ ...current, student_id: event.target.value }))
              }
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600 dark:text-slate-300">
            <span className="mb-2 block font-medium text-ink dark:text-slate-100">Subject</span>
            <input
              className="w-full rounded-lg border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              value={messageForm.subject}
              onChange={(event) => setMessageForm((current) => ({ ...current, subject: event.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-600 md:col-span-2 dark:text-slate-300">
            <span className="mb-2 block font-medium text-ink dark:text-slate-100">Message</span>
            <textarea
              className="min-h-28 w-full rounded-lg border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              value={messageForm.message}
              onChange={(event) => setMessageForm((current) => ({ ...current, message: event.target.value }))}
            />
          </label>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="dark:border-white/10 dark:bg-[#182638]">
          <CardHeader title="Message History" description="Recent CRM-to-student communication." />
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#d9c1ad] px-4 py-8 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                No portal messages have been sent yet.
              </div>
            ) : (
              <>
                {messages.length > ITEMS_PER_PAGE ? (
                  <PaginationControls
                    page={safeMessagesPage}
                    pageCount={messagesPageCount}
                    total={messages.length}
                    perPage={ITEMS_PER_PAGE}
                    onPageChange={setMessagesPage}
                    label="messages"
                  />
                ) : null}
                {paginatedMessages.map((message) => (
                  <div key={message.id} className="rounded-lg border border-[#f0dfd0] bg-[#fff6ef] p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-ink dark:text-slate-100">{message.subject}</p>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(message.created_at, { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message.student?.full_name ?? message.student_id}</p>
                    <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{message.message}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </Card>

        <Card className="dark:border-white/10 dark:bg-[#182638]">
          <CardHeader title="Portal Activity" description="Logins, uploads, and student self-service activity." />
          <div className="space-y-3">
            {activity.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#d9c1ad] px-4 py-8 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                No recent student portal activity was recorded.
              </div>
            ) : (
              <>
                {activity.length > ITEMS_PER_PAGE ? (
                  <PaginationControls
                    page={safeActivityPage}
                    pageCount={activityPageCount}
                    total={activity.length}
                    perPage={ITEMS_PER_PAGE}
                    onPageChange={setActivityPage}
                    label="activity"
                  />
                ) : null}
                {paginatedActivity.map((item) => (
                  <div key={item.id} className="rounded-lg border border-[#f0dfd0] bg-[#fff6ef] p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-ink dark:text-slate-100">{item.activity_type.replace(/_/g, " ")}</p>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(item.created_at, { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.student?.full_name ?? item.student_id}</p>
                    <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{item.activity_details ?? "No details"}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
