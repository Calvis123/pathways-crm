"use client";

import { useMemo, useState, useTransition } from "react";
import { ExternalLink, MessageCircleMore, Send, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { cn } from "@/lib/utils";

type ReachableStudent = {
  id: string;
  full_name: string;
  phone: string;
  stage: string;
  country_interest: string | null;
};

const messagePresets = [
  {
    id: "consultation",
    label: "Consultation Follow-up",
    text: "Hello {name}, this is Barak Pathways following up on your consultation journey. We are ready to guide you on the next steps for {country}. Reply here and we will help you move forward."
  },
  {
    id: "documents",
    label: "Documents Reminder",
    text: "Hello {name}, this is a reminder from Barak Pathways. Please share your pending application documents so we can keep your process moving without delays."
  },
  {
    id: "payment",
    label: "Payment Reminder",
    text: "Hello {name}, this is Barak Pathways. We are following up on your outstanding payment so your application process can continue smoothly. Please reply if you need help."
  },
  {
    id: "ielts",
    label: "IELTS Follow-up",
    text: "Hello {name}, Barak Pathways here. We are checking in on your IELTS preparation and next booking steps. Reply and we will help you plan the best next move."
  }
] as const;

const ITEMS_PER_PAGE = 10;

function humanizeStage(stage: string) {
  return stage.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildMessage(template: string, student: ReachableStudent) {
  return template
    .replace(/\{name\}/g, student.full_name)
    .replace(/\{country\}/g, student.country_interest ?? "your study destination");
}

export function WhatsAppBulkManager({ students }: { students: ReachableStudent[] }) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string>(messagePresets[0].text);
  const [status, setStatus] = useState<string | null>(null);
  const [launchedLinks, setLaunchedLinks] = useState<Array<{ id: string; name: string; link: string }>>([]);
  const [contactsPage, setContactsPage] = useState(0);
  const [linksPage, setLinksPage] = useState(0);
  const [isPending, startTransition] = useTransition();

  const filteredStudents = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return students;
    return students.filter((student) =>
      [student.full_name, student.phone, student.stage, student.country_interest]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [query, students]);

  const contactsPageCount = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));
  const safeContactsPage = Math.min(contactsPage, contactsPageCount - 1);
  const paginatedStudents = filteredStudents.slice(
    safeContactsPage * ITEMS_PER_PAGE,
    safeContactsPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );
  const linksPageCount = Math.max(1, Math.ceil(launchedLinks.length / ITEMS_PER_PAGE));
  const safeLinksPage = Math.min(linksPage, linksPageCount - 1);
  const paginatedLinks = launchedLinks.slice(safeLinksPage * ITEMS_PER_PAGE, safeLinksPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE);
  const selectedStudents = filteredStudents.filter((student) => selectedIds.includes(student.id));
  const allVisibleSelected =
    paginatedStudents.length > 0 &&
    paginatedStudents.every((student) => selectedIds.includes(student.id));

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !paginatedStudents.some((student) => student.id === id)));
      return;
    }

    setSelectedIds((current) => Array.from(new Set([...current, ...paginatedStudents.map((student) => student.id)])));
  }

  function toggleStudent(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function launchCampaign() {
    if (selectedIds.length === 0) {
      setStatus("Select at least one student first.");
      return;
    }

    setStatus(null);

    startTransition(async () => {
      const response = await fetch("/api/whatsapp-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_ids: selectedIds,
          message
        })
      });

      const body = (await response.json().catch(() => null)) as
        | { error?: string; recipients?: Array<{ id: string; full_name: string; link: string }> }
        | null;

      if (!response.ok || !body?.recipients) {
        setStatus(body?.error ?? "Could not prepare WhatsApp campaign.");
        return;
      }

      setLaunchedLinks(body.recipients.map((recipient) => ({
        id: recipient.id,
        name: recipient.full_name,
        link: recipient.link
      })));

      for (const recipient of body.recipients.slice(0, 8)) {
        window.open(recipient.link, "_blank", "noopener,noreferrer");
      }

      setStatus(
        body.recipients.length > 8
          ? `Prepared ${body.recipients.length} chats. Opened the first 8 in new tabs and listed the rest below.`
          : `Prepared ${body.recipients.length} WhatsApp chats successfully.`
      );
    });
  }

  async function copyCampaignMessage() {
    if (selectedIds.length === 0) {
      setStatus("Select at least one student to copy the campaign text.");
      return;
    }

    const preview = students
      .filter((student) => selectedIds.includes(student.id))
      .slice(0, 5)
      .map((student) => `To ${student.full_name}: ${buildMessage(message, student)}`)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(preview);
      setStatus("Sample WhatsApp messages copied to clipboard.");
    } catch {
      setStatus("Could not copy the WhatsApp message preview.");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="dark:border-white/10 dark:bg-[#182638]">
        <CardHeader
          title="WhatsApp Campaign Launcher"
          description="Select students, tailor a message, and launch personalized WhatsApp chats in one workflow."
        />

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <label className="block text-sm text-slate-600 dark:text-slate-300">
              <span className="mb-2 block font-medium text-ink dark:text-slate-100">Search reachable contacts</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, phone, country, or stage"
                className="w-full rounded-lg border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-400"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {messagePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setMessage(preset.text)}
                  className="rounded-full border border-[#eadacc] bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-[#fff6ef] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <label className="block text-sm text-slate-600 dark:text-slate-300">
              <span className="mb-2 block font-medium text-ink dark:text-slate-100">Campaign message</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-36 w-full rounded-lg border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              />
              <span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">
                Supported placeholders: <code>{"{name}"}</code> and <code>{"{country}"}</code>
              </span>
            </label>

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={launchCampaign} disabled={isPending || selectedIds.length === 0}>
                <Send className="mr-2 h-4 w-4" />
                {isPending ? "Preparing..." : "Launch WhatsApp Chats"}
              </Button>
              <Button type="button" variant="secondary" onClick={copyCampaignMessage}>
                Copy Preview
              </Button>
            </div>

            {status ? <p className="text-sm text-slate-600 dark:text-slate-300">{status}</p> : null}
          </div>

          <div className="rounded-xl border border-[#eadacc] bg-[linear-gradient(180deg,#fffdf8_0%,#fff7ee_100%)] p-5 dark:border-white/10 dark:bg-[linear-gradient(180deg,#1b263c_0%,#141f33_100%)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#22c55e,#16a34a)] text-white">
                <MessageCircleMore className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Selected Audience</p>
                <p className="text-2xl font-semibold text-ink dark:text-slate-50">{selectedIds.length}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {selectedStudents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#d9c1ad] bg-white/70 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
                  Choose students from the list to prepare a WhatsApp outreach batch.
                </div>
              ) : (
                selectedStudents.slice(0, 6).map((student) => (
                  <div key={student.id} className="rounded-lg border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="font-medium text-ink dark:text-slate-100">{student.full_name}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {student.phone} · {humanizeStage(student.stage)}
                    </p>
                  </div>
                ))
              )}

              {selectedStudents.length > 6 ? (
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  +{selectedStudents.length - 6} more selected contact(s)
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <Card className="dark:border-white/10 dark:bg-[#182638]">
        <CardHeader
          title="Reachable Contacts"
          description={`${students.length} students currently have WhatsApp-ready numbers.`}
          action={
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} className="h-4 w-4" />
              Select page
            </label>
          }
        />

        {filteredStudents.length > ITEMS_PER_PAGE ? (
          <div className="mb-4">
            <PaginationControls
              page={safeContactsPage}
              pageCount={contactsPageCount}
              total={filteredStudents.length}
              perPage={ITEMS_PER_PAGE}
              onPageChange={setContactsPage}
              label="contacts"
            />
          </div>
        ) : null}

        <div className="grid gap-3 xl:grid-cols-2">
          {paginatedStudents.map((student) => {
            const selected = selectedIds.includes(student.id);
            return (
              <div
                key={student.id}
                className={cn(
                  "rounded-lg border p-4 transition",
                  selected ? "border-gold bg-gold/10 dark:border-[#ffbeab] dark:bg-[#ff7a59]/10" : "border-[#eadacc] bg-white dark:border-white/10 dark:bg-white/[0.04]"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink dark:text-slate-100">{student.full_name}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{student.phone}</p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {humanizeStage(student.stage)}
                      {student.country_interest ? ` · ${student.country_interest}` : ""}
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

        {filteredStudents.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-[#d9c1ad] px-4 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
            No reachable WhatsApp contacts matched your search.
          </div>
        ) : null}
      </Card>

      {launchedLinks.length > 0 ? (
        <Card className="dark:border-white/10 dark:bg-[#182638]">
          <CardHeader
            title="Prepared Campaign Links"
            description="Use these direct WhatsApp links if your browser blocked some new tabs."
          />
          {launchedLinks.length > ITEMS_PER_PAGE ? (
            <div className="mb-4">
              <PaginationControls
                page={safeLinksPage}
                pageCount={linksPageCount}
                total={launchedLinks.length}
                perPage={ITEMS_PER_PAGE}
                onPageChange={setLinksPage}
                label="links"
              />
            </div>
          ) : null}
          <div className="grid gap-3 xl:grid-cols-2">
            {paginatedLinks.map((item) => (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-lg border border-[#eadacc] bg-[#fff6ef] px-4 py-3 text-sm text-slate-700 transition hover:border-gold hover:bg-gold/5 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-[#ffbeab] dark:hover:bg-white/[0.08]"
              >
                <span className="font-medium">{item.name}</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            ))}
          </div>
        </Card>
      ) : null}

      <Card className="dark:border-white/10 dark:bg-[#182638]">
        <CardHeader
          title="How This Works"
          description="WhatsApp Web does not support silent bulk sending without a third-party business API, so this launcher prepares personalized chats and logs the campaign inside the CRM."
        />
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-[#eadacc] bg-[#fff6ef] p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <Users2 className="h-5 w-5 text-gold" />
            <p className="mt-3 font-medium text-ink dark:text-slate-100">Select an audience</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose students by stage, country, or search term.</p>
          </div>
          <div className="rounded-lg border border-[#eadacc] bg-[#fff6ef] p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <MessageCircleMore className="h-5 w-5 text-gold" />
            <p className="mt-3 font-medium text-ink dark:text-slate-100">Tailor the message</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use placeholders so each chat opens with a personalized note.</p>
          </div>
          <div className="rounded-lg border border-[#eadacc] bg-[#fff6ef] p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <ExternalLink className="h-5 w-5 text-gold" />
            <p className="mt-3 font-medium text-ink dark:text-slate-100">Launch and track</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Open WhatsApp chats quickly while keeping an audit trail in the CRM.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
