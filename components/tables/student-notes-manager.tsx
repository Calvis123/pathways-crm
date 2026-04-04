"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import type { Student, StudentNote } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function StudentNotesManager({
  student,
  notes
}: {
  student: Student;
  notes: StudentNote[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    note_text: "",
    note_type: "general",
    priority: "medium",
    tags: "",
    reminder_date: "",
    is_private: false
  });

  async function createNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    startTransition(async () => {
      const response = await fetch("/api/student-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: student.id,
          ...form,
          tags: form.tags || null,
          reminder_date: form.reminder_date || null
        })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus(body.error ?? "Failed to save note.");
        return;
      }
      setForm({
        note_text: "",
        note_type: "general",
        priority: "medium",
        tags: "",
        reminder_date: "",
        is_private: false
      });
      router.refresh();
    });
  }

  async function editNote(note: StudentNote) {
    const next = window.prompt("Edit note", note.note_text);
    if (!next || next === note.note_text) return;

    startTransition(async () => {
      const response = await fetch(`/api/student-notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_text: next })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus(body.error ?? "Failed to update note.");
        return;
      }
      router.refresh();
    });
  }

  async function deleteNote(id: string) {
    if (!window.confirm("Delete this note?")) return;
    startTransition(async () => {
      const response = await fetch(`/api/student-notes/${id}`, { method: "DELETE" });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setStatus(body?.error ?? "Failed to delete note.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card className="h-fit">
        <CardHeader
          title={student.full_name}
          description={`${student.email} · ${student.phone ?? "No phone"} · ${student.stage}`}
        />
        <form className="space-y-4" onSubmit={createNote}>
          <select
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
            value={form.note_type}
            onChange={(event) => setForm((current) => ({ ...current, note_type: event.target.value }))}
          >
            {["general", "call", "meeting", "email", "whatsapp", "payment", "visa", "important"].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
            value={form.priority}
            onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
          >
            {["low", "medium", "high", "urgent"].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <textarea
            className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
            placeholder="Add a note"
            value={form.note_text}
            onChange={(event) => setForm((current) => ({ ...current, note_text: event.target.value }))}
          />
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
            placeholder="Tags, comma separated"
            value={form.tags}
            onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
          />
          <input
            type="datetime-local"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
            value={form.reminder_date}
            onChange={(event) => setForm((current) => ({ ...current, reminder_date: event.target.value }))}
          />
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.is_private}
              onChange={(event) => setForm((current) => ({ ...current, is_private: event.target.checked }))}
            />
            Private note
          </label>
          <Button type="submit" disabled={isPending || !form.note_text.trim()}>
            {isPending ? "Saving..." : "Add Note"}
          </Button>
          {status ? <p className="text-sm text-rose-600 dark:text-rose-300">{status}</p> : null}
          <div className="pt-2 text-sm">
            <Link href={`/students/${student.id}`} className="text-ink underline dark:text-slate-100">
              Back to student
            </Link>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader
          title="Follow-up Log"
          description="Track calls, meetings, emails, WhatsApp follow-up, reminders, and private/internal notes in one place."
        />
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">
                    {note.note_type} · {note.priority}
                    {note.is_private ? " · private" : ""}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {note.creator_name ?? "System"} · {formatDate(note.created_at, { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="text-sm text-slate-500 underline dark:text-slate-300" onClick={() => editNote(note)}>
                    Edit
                  </button>
                  <button type="button" className="text-sm text-rose-600 underline" onClick={() => deleteNote(note.id)}>
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{note.note_text}</p>
              {note.tags ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">#{note.tags.split(",").map((tag) => tag.trim()).join(" #")}</p> : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
