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
    note_type: "call"
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
          note_text: form.note_text.trim(),
          note_type: form.note_type,
          priority: "medium",
          is_private: false
        })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus(body.error ?? "Failed to save note.");
        return;
      }
      setForm({
        note_text: "",
        note_type: "call"
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
      <Card className="h-fit border-slate-200/80 bg-white/95 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-[#091738]/80 dark:shadow-none">
        <CardHeader
          title={student.full_name}
          description={`${student.email} | ${student.phone ?? "No phone"} | ${student.stage}`}
        />
        <form className="space-y-4" onSubmit={createNote}>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Interaction type</p>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium capitalize text-slate-700 shadow-sm transition focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:border-amber-300/40 dark:focus:ring-amber-400/10"
              value={form.note_type}
              onChange={(event) => setForm((current) => ({ ...current, note_type: event.target.value }))}
            >
              {["call", "meeting", "email", "whatsapp", "general", "important"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Notes</p>
            <textarea
              className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:border-amber-300/40 dark:focus:ring-amber-400/10"
              placeholder="Write interaction notes (required)"
              value={form.note_text}
              onChange={(event) => setForm((current) => ({ ...current, note_text: event.target.value }))}
              required
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">Each entry creates a new timeline record with automatic date and time.</p>
          </div>

          <Button className="h-11 rounded-xl px-5 font-semibold" type="submit" disabled={isPending || !form.note_text.trim()}>
            {isPending ? "Saving..." : "Add Interaction"}
          </Button>
          {status ? <p className="text-sm text-rose-600 dark:text-rose-300">{status}</p> : null}
          <div className="pt-2 text-sm">
            <Link href={`/students/${student.id}`} className="font-medium text-ink underline underline-offset-4 dark:text-slate-100">
              Back to student
            </Link>
          </div>
        </form>
      </Card>

      <Card className="border-slate-200/80 bg-white/95 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-[#091738]/80 dark:shadow-none">
        <CardHeader
          title="Interaction History"
          description="Latest first. Each interaction is saved as a new record with automatic date/time."
        />

        {notes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-white p-8 text-center dark:border-white/15 dark:from-white/[0.05] dark:to-white/[0.02]">
            <p className="text-base font-semibold text-ink dark:text-white">No interactions yet</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Add the first note from the form to start this lead&apos;s communication timeline.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/70 p-4 shadow-sm transition hover:shadow-md dark:border-white/10 dark:from-white/[0.06] dark:to-white/[0.03]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium capitalize text-ink dark:text-white">
                      {note.note_type} | {note.priority}
                      {note.is_private ? " | private" : ""}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {note.creator_name ?? "System"} | {formatDate(note.created_at, { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-md px-1.5 py-1 text-sm text-slate-500 underline underline-offset-4 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                      onClick={() => editNote(note)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-md px-1.5 py-1 text-sm text-rose-600 underline underline-offset-4 transition hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
                      onClick={() => deleteNote(note.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">{note.note_text}</p>
                {note.tags ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">#{note.tags.split(",").map((tag) => tag.trim()).join(" #")}</p> : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
