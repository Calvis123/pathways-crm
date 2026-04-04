"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { DocumentRecord, Student } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const tones: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
  uploaded: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200",
  verified: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
  rejected: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200"
};

export function DocumentsManager({
  documents,
  students
}: {
  documents: DocumentRecord[];
  students: Student[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [reviewTarget, setReviewTarget] = useState<{
    id: string;
    status: DocumentRecord["status"];
    label: string;
  } | null>(null);

  const groupedDocuments = useMemo(() => {
    const studentLookup = new Map(students.map((student) => [student.id, student]));
    const groups = new Map<
      string,
      { studentId: string; studentName: string; docs: DocumentRecord[] }
    >();

    for (const document of documents) {
      const studentName =
        document.student?.full_name ??
        studentLookup.get(document.student_id)?.full_name ??
        document.student_id;
      const existing = groups.get(document.student_id) ?? {
        studentId: document.student_id,
        studentName,
        docs: []
      };
      existing.docs.push(document);
      groups.set(document.student_id, existing);
    }

    return Array.from(groups.values()).sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [documents, students]);

  async function handleUpload(formData: FormData) {
    setStatus("Uploading...");
    const response = await fetch("/api/documents", {
      method: "POST",
      body: formData
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus(body.error ?? "Upload failed.");
      return;
    }
    setStatus("Document uploaded.");
    router.refresh();
  }

  async function submitReview(formData: FormData) {
    if (!reviewTarget) return;
    setStatus("Saving review...");
    const response = await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: reviewTarget.status,
        review_notes: String(formData.get("review_notes") ?? "").trim() || undefined
      })
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus(body.error ?? "Review failed.");
      return;
    }
    setStatus("Document reviewed.");
    setReviewTarget(null);
    router.refresh();
  }

  const id = reviewTarget?.id ?? "";

  return (
    <div className="space-y-6">
      <Card className="dark:border-white/10 dark:bg-[#0d1729]">
        <CardHeader title="Upload Document" description="Upload a document to the student record and keep it in the review queue." />
        <form action={handleUpload} className="grid gap-4 md:grid-cols-2">
          <select name="student_id" required className="rounded-2xl border border-slate-200 px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white">
            <option value="">Select student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.full_name}
              </option>
            ))}
          </select>
          <select name="document_type" required className="rounded-2xl border border-slate-200 px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white">
            <option value="">Document type</option>
            <option value="passport">Passport</option>
            <option value="transcript">Transcript</option>
            <option value="ielts">IELTS Certificate</option>
            <option value="diploma">Diploma / Degree</option>
            <option value="personal_statement">Personal Statement</option>
            <option value="recommendation">Recommendation Letter</option>
            <option value="cv">CV</option>
            <option value="other">Other</option>
          </select>
          <label className="md:col-span-2 block rounded-3xl border-2 border-dashed border-gold/30 bg-slate-50 px-6 py-8 text-center transition hover:border-gold hover:bg-gold/5 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]">
            <input name="document" type="file" required accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" />
            <span className="block text-lg font-semibold text-ink dark:text-white">Click to select a file</span>
            <span className="mt-2 block text-sm text-slate-500 dark:text-slate-400">PDF, JPG, PNG, DOC, DOCX up to 5MB</span>
          </label>
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <Button type="submit">Upload</Button>
            {status ? <p className="self-center text-sm text-slate-500 dark:text-slate-300">{status}</p> : null}
          </div>
        </form>
      </Card>

      <Card className="dark:border-white/10 dark:bg-[#0d1729]">
        <CardHeader title="All Documents" description="Review uploaded files, grouped by student, and approve or reject them like the legacy workflow." />
        {groupedDocuments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 px-6 py-16 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
            No documents uploaded yet.
          </div>
        ) : (
          <div className="space-y-5">
            {groupedDocuments.map((group) => {
              const approved = group.docs.filter((doc) => doc.status === "verified").length;
              const pending = group.docs.filter((doc) => doc.status === "pending" || doc.status === "uploaded").length;

              return (
                <section key={group.studentId} className="rounded-3xl border border-gold/20 bg-slate-50/60 p-5 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="mb-5 flex flex-col gap-3 border-b border-gold/15 pb-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xl font-semibold text-ink dark:text-white">{group.studentName}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{group.docs.length} document(s)</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-emerald-100 text-emerald-800">{approved} Approved</Badge>
                      <Badge className="bg-amber-100 text-amber-800">{pending} Pending</Badge>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    {group.docs.map((document) => (
                      <div key={document.id} className="rounded-3xl border border-slate-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.05]">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold uppercase tracking-[0.08em] text-ink dark:text-white">
                              {document.document_type.replaceAll("_", " ")}
                            </p>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{document.original_filename}</p>
                          </div>
                          <Badge className={tones[document.status]}>{document.status}</Badge>
                        </div>

                        <div className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-300">
                          <p>Size: {document.file_size ? `${(document.file_size / 1024).toFixed(1)} KB` : "Unknown"}</p>
                          <p>Uploaded by: {document.uploaded_by ?? "System"}</p>
                          <p>Uploaded: {formatDate(document.uploaded_at, { timeStyle: "short" })}</p>
                          {document.reviewed_by ? <p>Reviewed by: {document.reviewed_by}</p> : null}
                        </div>

                        {document.review_notes ? (
                          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm italic text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">
                            {document.review_notes}
                          </div>
                        ) : null}

                        <div className="mt-4 flex flex-wrap gap-2">
                          {document.file_url ? (
                            <>
                              <a href={document.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-ink ring-1 ring-slate-200 dark:bg-white/[0.06] dark:text-white dark:ring-white/10">
                                View
                              </a>
                              <a href={document.file_url} download className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-ink ring-1 ring-slate-200 dark:bg-white/[0.06] dark:text-white dark:ring-white/10">
                                Download
                              </a>
                            </>
                          ) : null}
                          {document.status === "pending" || document.status === "uploaded" ? (
                            <>
                              <Button
                                type="button"
                                onClick={() =>
                                  setReviewTarget({
                                    id: document.id,
                                    status: "verified",
                                    label: `${document.document_type} · ${group.studentName}`
                                  })
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                type="button"
                                className="bg-rose-600 text-white hover:bg-rose-700"
                                onClick={() =>
                                  setReviewTarget({
                                    id: document.id,
                                    status: "rejected",
                                    label: `${document.document_type} · ${group.studentName}`
                                  })
                                }
                              >
                                Reject
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </Card>

      {reviewTarget ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/50 px-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setReviewTarget(null);
          }}
        >
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel dark:border-white/10 dark:bg-[#0f1b31]">
            <h2 className="mb-5 font-serif text-2xl text-ink dark:text-white">Review Document</h2>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{reviewTarget.label}</p>
            <form action={submitReview} className="space-y-4">
              <textarea
                name="review_notes"
                rows={4}
                placeholder="Add any comments or reasons for rejection..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-400"
              />
              <div className="flex gap-3">
                <Button type="submit">Submit Review</Button>
                <Button type="button" className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.14]" onClick={() => setReviewTarget(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
