"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { EmailTemplate } from "@/lib/types";
import {
  builtInEmailTemplates,
  emailTemplateCategories,
  emailTemplatePlaceholders
} from "@/lib/email-templates";

type LibraryTemplate = {
  id: string;
  category: string;
  name: string;
  subject: string;
  body: string;
  isCustom: boolean;
};

export function TemplatesTable({ templates }: { templates: EmailTemplate[] }) {
  const router = useRouter();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const allTemplates = useMemo<LibraryTemplate[]>(
    () => [
      ...builtInEmailTemplates.map((template) => ({
        id: template.id,
        category: template.category,
        name: template.name,
        subject: template.subject,
        body: template.body,
        isCustom: false
      })),
      ...templates.map((template) => ({
        id: template.id,
        category: template.category,
        name: template.template_name,
        subject: template.subject,
        body: template.body,
        isCustom: true
      }))
    ],
    [templates]
  );

  const visibleTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allTemplates.filter((template) => {
      if (category !== "all" && template.category !== category) return false;
      if (!query) return true;
      return `${template.name} ${template.subject} ${template.body}`.toLowerCase().includes(query);
    });
  }, [allTemplates, category, search]);

  async function copyTemplate(template: LibraryTemplate) {
    const fullText = `Subject: ${template.subject}\n\n${template.body}`;
    try {
      await navigator.clipboard.writeText(fullText);
      showToast("Template copied to clipboard!", "success");
    } catch {
      showToast("Could not copy the template.", "error");
    }
  }

  async function saveTemplate(formData: FormData) {
    setIsSaving(true);

    const response = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template_name: formData.get("template_name"),
        category: formData.get("category"),
        subject: formData.get("subject"),
        body: formData.get("body")
      })
    });

    const body = (await response.json()) as { error?: string };

    if (!response.ok) {
      showToast(body.error ?? "Could not save template.", "error");
      setIsSaving(false);
      return;
    }

    showToast("Template saved successfully!", "success");
    setShowModal(false);
    setIsSaving(false);
    router.refresh();
  }

  function showToast(message: string, tone: "success" | "error") {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3000);
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white shadow-panel dark:border-white/10 dark:bg-[#0d1729] dark:shadow-[0_22px_70px_rgba(2,6,23,0.32)]">
      <div className="flex flex-col gap-4 border-b border-gold/20 bg-[#0f172a] px-8 py-6 text-white dark:border-white/10 dark:bg-[linear-gradient(135deg,#09111f,#15223a)] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl">Email Templates Library</h1>
          <p className="mt-2 text-sm text-white/70">Professional email templates for every situation.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="rounded-2xl bg-gold px-4 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95"
          >
            Save Template
          </button>
          <Link
            href="/"
            className="rounded-2xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <div className="space-y-6 px-8 py-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <h2 className="font-serif text-2xl text-ink dark:text-slate-50">Personalization Guide</h2>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Use these placeholders in your emails. They can be replaced before sending.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {emailTemplatePlaceholders.map((placeholder) => (
              <span key={placeholder} className="rounded-full bg-gold px-4 py-2 font-mono text-xs font-semibold text-ink">
                {placeholder}
              </span>
            ))}
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <StatCard label="Built-in Templates" value={String(builtInEmailTemplates.length)} />
          <StatCard label="Your Templates" value={String(templates.length)} />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              category === "all"
                ? "bg-gold text-ink"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
            }`}
          >
            All ({allTemplates.length})
          </button>
          {Object.entries(emailTemplateCategories).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                category === key
                  ? "bg-gold text-ink"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search templates by name, subject, or content..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-400"
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {visibleTemplates.map((template) => {
            const expanded = expandedId === template.id;
            return (
              <article
                key={template.id}
                className={`rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04] ${expanded ? "xl:col-span-2" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-ink dark:text-slate-50">{template.name}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {template.subject.slice(0, 100)}
                      {template.subject.length > 100 ? "..." : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {template.isCustom ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 dark:bg-white/[0.08] dark:text-slate-300">
                        Custom
                      </span>
                    ) : null}
                    <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-gold">
                      {emailTemplateCategories[template.category as keyof typeof emailTemplateCategories] ?? template.category}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : template.id)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200"
                  >
                    {expanded ? "Hide" : "View"}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyTemplate(template)}
                    className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white dark:bg-[#ff7a59]"
                  >
                    Copy
                  </button>
                </div>

                {expanded ? (
                  <div className="mt-5 border-t border-slate-100 pt-5 dark:border-white/10">
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.05]">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Subject</p>
                      <p className="mt-2 text-sm text-ink dark:text-slate-100">{template.subject}</p>
                    </div>
                    <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-ink dark:bg-white/[0.05] dark:text-slate-100">
                      {template.body}
                    </div>
                    <button
                      type="button"
                      onClick={() => copyTemplate(template)}
                      className="mt-4 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white dark:bg-[#ff7a59]"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        {visibleTemplates.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 px-6 py-16 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
            No templates matched your current filters.
          </div>
        ) : null}
      </div>

      {showModal ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/50 px-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowModal(false);
          }}
        >
          <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel dark:border-white/10 dark:bg-[#101a2d]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-2xl text-ink dark:text-slate-50">Save Custom Template</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-2xl text-slate-400 dark:text-slate-500">
                ×
              </button>
            </div>

            <form action={saveTemplate} className="space-y-4">
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-2 block font-medium text-ink dark:text-slate-100">Template Name</span>
                <input name="template_name" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white" />
              </label>
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-2 block font-medium text-ink dark:text-slate-100">Category</span>
                <select name="category" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white">
                  {Object.entries(emailTemplateCategories).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-2 block font-medium text-ink dark:text-slate-100">Subject Line</span>
                <input name="subject" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white" />
              </label>
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-2 block font-medium text-ink dark:text-slate-100">Email Body</span>
                <textarea name="body" rows={10} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white" />
              </label>
              <button type="submit" disabled={isSaving} className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-70 dark:bg-[#ff7a59]">
                {isSaving ? "Saving..." : "Save Template"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          className={`fixed bottom-5 right-5 z-[1100] rounded-2xl px-5 py-4 text-sm font-semibold text-white shadow-lg ${
            toast.tone === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-3xl font-extrabold text-gold">{value}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
