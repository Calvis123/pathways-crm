"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, MessageCircleMore, Send, Smartphone, Users2 } from "lucide-react";
import { builtInEmailTemplates } from "@/lib/email-templates";
import type { CommunicationLog, EmailTemplate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";

type EmailStudent = {
  id: string;
  full_name: string;
  email: string;
  stage: string;
  country_interest: string | null;
};

type ChannelType = "email" | "whatsapp" | "sms";

type RecipientStatus = {
  id: string;
  full_name: string;
  status: "sent" | "failed" | "pending";
  error?: string | null;
};

function channelLabel(channel: ChannelType) {
  if (channel === "whatsapp") return "WhatsApp";
  if (channel === "sms") return "SMS";
  return "Email";
}

function channelFromTags(tags: string | null) {
  const value = tags ?? "";
  if (value.includes("channel:whatsapp")) return "WhatsApp";
  if (value.includes("channel:sms")) return "SMS";
  return "Email";
}

export function EmailCenter({
  students,
  templates,
  logs,
  initialStudentIds
}: {
  students: EmailStudent[];
  templates: EmailTemplate[];
  logs: CommunicationLog[];
  initialStudentIds?: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(initialStudentIds ?? []);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("custom");
  const [channel, setChannel] = useState<ChannelType>("email");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [recipientStatuses, setRecipientStatuses] = useState<RecipientStatus[]>([]);

  const allTemplates = useMemo(
    () => [
      ...builtInEmailTemplates.map((template) => ({
        id: template.id,
        template_name: template.name,
        subject: template.subject,
        body: template.body,
        category: template.category
      })),
      ...templates
    ],
    [templates]
  );

  const filteredStudents = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return students;
    return students.filter((student) =>
      [student.full_name, student.email, student.stage, student.country_interest]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [query, students]);

  const selectedStudents = students.filter((student) => selectedIds.includes(student.id));
  const allVisibleSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((student) => selectedIds.includes(student.id));

  const visibleLogs = useMemo(
    () =>
      logs.filter((log) => {
        const tags = log.tags ?? "";
        return tags.includes("bulk-message") || tags.includes("email-center");
      }),
    [logs]
  );

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !filteredStudents.some((student) => student.id === id)));
      return;
    }

    setSelectedIds((current) => Array.from(new Set([...current, ...filteredStudents.map((student) => student.id)])));
  }

  function toggleStudent(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function applyTemplate(templateId: string) {
    setSelectedTemplateId(templateId);

    if (templateId === "custom") {
      return;
    }

    const template = allTemplates.find((item) => item.id === templateId);
    if (!template) return;
    setSubject(template.subject);
    setMessage(template.body);
  }

  async function sendBulkMessage() {
    if (selectedIds.length === 0) {
      setStatus("Select at least one recipient.");
      return;
    }

    if (channel === "email" && !subject.trim()) {
      setStatus("Email subject is required.");
      return;
    }

    if (!message.trim()) {
      setStatus("Message content is required.");
      return;
    }

    setStatus(null);
    setRecipientStatuses([]);

    startTransition(async () => {
      const response = await fetch("/api/email-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_ids: selectedIds,
          channel,
          subject,
          message
        })
      });

      const result = (await response.json().catch(() => null)) as
        | {
            error?: string;
            sentCount?: number;
            failedCount?: number;
            pendingCount?: number;
            recipients?: RecipientStatus[];
          }
        | null;

      if (!response.ok) {
        setStatus(result?.error ?? "Could not process bulk message.");
        return;
      }

      const sentCount = result?.sentCount ?? 0;
      const failedCount = result?.failedCount ?? 0;
      const pendingCount = result?.pendingCount ?? 0;
      setRecipientStatuses(result?.recipients ?? []);
      setStatus(
        `${channelLabel(channel)} broadcast processed. Sent: ${sentCount}, Failed: ${failedCount}, Pending: ${pendingCount}.`
      );

      setSelectedIds([]);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card className="border-[#e8d7c6] bg-[linear-gradient(135deg,#fffaf4_0%,#fff2e6_100%)] dark:border-white/10 dark:bg-[linear-gradient(160deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))]">
        <CardHeader
          title="Communication Center"
          description="Broadcast one message to multiple recipients, delivered privately per lead and logged in each communication history."
        />
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <label className="block text-sm text-slate-600 dark:text-slate-300">
              <span className="mb-2 block font-medium text-ink dark:text-white">Communication Type</span>
              <select
                value={channel}
                onChange={(event) => setChannel(event.target.value as ChannelType)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
              </select>
            </label>

            <label className="block text-sm text-slate-600 dark:text-slate-300">
              <span className="mb-2 block font-medium text-ink dark:text-white">Template</span>
              <select
                value={selectedTemplateId}
                onChange={(event) => applyTemplate(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              >
                <option value="custom">Custom Message</option>
                {allTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.template_name}
                  </option>
                ))}
              </select>
            </label>

            {selectedIds.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                Select recipients to open the compose form.
              </div>
            ) : (
              <>
                {channel === "email" ? (
                  <label className="block text-sm text-slate-600 dark:text-slate-300">
                    <span className="mb-2 block font-medium text-ink dark:text-white">Subject</span>
                    <input
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-400"
                      placeholder="Subject line"
                    />
                  </label>
                ) : null}

                <label className="block text-sm text-slate-600 dark:text-slate-300">
                  <span className="mb-2 block font-medium text-ink dark:text-white">Message</span>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    className="min-h-44 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-400"
                    placeholder="Write your broadcast message here..."
                  />
                  <span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">
                    Supported placeholders: <code>{"{name}"}</code> and <code>{"{country}"}</code>
                  </span>
                </label>

                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={sendBulkMessage} disabled={isPending}>
                    <Send className="mr-2 h-4 w-4" />
                    {isPending ? "Processing..." : "Send Bulk Message"}
                  </Button>
                </div>
              </>
            )}

            {status ? <p className="text-sm text-slate-600 dark:text-slate-300">{status}</p> : null}
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ff7a59,#e09a54)] text-white">
                {channel === "email" ? (
                  <Mail className="h-5 w-5" />
                ) : channel === "whatsapp" ? (
                  <MessageCircleMore className="h-5 w-5" />
                ) : (
                  <Smartphone className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Recipients</p>
                <p className="text-2xl font-semibold text-ink dark:text-white">{selectedIds.length}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {selectedStudents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                  Select recipients to open the broadcast composer.
                </div>
              ) : (
                selectedStudents.slice(0, 6).map((student) => (
                  <div key={student.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="font-medium text-ink dark:text-white">{student.full_name}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{student.email}</p>
                  </div>
                ))
              )}

              {selectedStudents.length > 6 ? (
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  +{selectedStudents.length - 6} more selected recipient(s)
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      {recipientStatuses.length > 0 ? (
        <Card className="dark:border-white/10 dark:bg-[#0d1729]">
          <CardHeader title="Delivery Status" description="Per-recipient broadcast result." />
          <div className="grid gap-3 xl:grid-cols-2">
            {recipientStatuses.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <p className="font-semibold text-ink dark:text-slate-100">{item.full_name}</p>
                <p className={cn(
                  "mt-1 text-xs font-semibold uppercase tracking-[0.08em]",
                  item.status === "sent"
                    ? "text-emerald-600 dark:text-emerald-300"
                    : item.status === "failed"
                      ? "text-rose-600 dark:text-rose-300"
                      : "text-amber-600 dark:text-amber-300"
                )}>
                  {item.status}
                </p>
                {item.error ? <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{item.error}</p> : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card className="dark:border-white/10 dark:bg-[#0d1729]">
        <CardHeader
          title="Recipients"
          description={`${students.length} contacts are available for broadcast messaging.`}
          action={
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} className="h-4 w-4" />
              Select visible
            </label>
          }
        />
        <div className="mb-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email, country, or stage"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-400"
          />
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          {filteredStudents.map((student) => {
            const selected = selectedIds.includes(student.id);
            return (
              <div
                key={student.id}
                className={cn(
                  "rounded-2xl border p-4 transition",
                  selected ? "border-gold bg-gold/10 dark:border-[#ffbeab] dark:bg-[#ff7a59]/10" : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink dark:text-slate-100">{student.full_name}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{student.email}</p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {student.stage}
                      {student.country_interest ? ` | ${student.country_interest}` : ""}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleStudent(student.id)}
                    className="mt-1 h-4 w-4"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="dark:border-white/10 dark:bg-[#0d1729]">
        <CardHeader
          title="Recent Communication Log"
          description="Recent outbound bulk messages recorded privately per lead."
          action={
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:bg-white/[0.08] dark:text-slate-300">
              <Users2 className="h-3.5 w-3.5" />
              {visibleLogs.length} items
            </div>
          }
        />
        <div className="space-y-3">
          {visibleLogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              No communication activity has been logged yet.
            </div>
          ) : (
            visibleLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink dark:text-slate-100">{log.student?.full_name ?? log.student_id}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{channelFromTags(log.tags)} | {log.student?.email ?? "No email"}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Sent by {log.creator_name ?? "System"}</p>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {formatDate(log.created_at, { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-slate-700 dark:text-slate-200">{log.note_text}</pre>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
