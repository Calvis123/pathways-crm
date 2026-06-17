"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, CreditCard, FileBadge2, ShieldCheck, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/branding/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

function PortalHighlight({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-[#eadfd4] bg-white/85 p-4 shadow-[0_14px_30px_rgba(33,51,67,0.06)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#17253a_0%,#101b2d_100%)] dark:shadow-[0_22px_44px_rgba(2,6,23,0.24)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#213343,#2d5165)] text-white dark:bg-[linear-gradient(135deg,#ff7a59,#cf6a34)] dark:shadow-[0_16px_28px_rgba(255,122,89,0.18)]">
        {icon}
      </div>
      <p className="mt-4 font-semibold text-[#213343] dark:text-[#f8fafc]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-[#c4d0df]">{description}</p>
    </div>
  );
}

export function StudentPortalAccessCard({
  invalidToken = false,
  compact = false
}: {
  invalidToken?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(invalidToken ? "This portal link is invalid or expired." : null);
  const [loginForm, setLoginForm] = useState({ email: "", phone: "" });
  const formRef = useRef<HTMLFormElement | null>(null);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/portal/session/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error ?? "Login failed.");
        return;
      }
      router.refresh();
      router.push("/student-portal");
    });
  }

  return (
    <div className={compact ? "w-full" : "relative mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-10 lg:px-8"}>
      <div className={compact ? "w-full rounded-xl border border-[#e9d8c8] bg-[linear-gradient(180deg,#fffdf9_0%,#fff6ef_100%)] p-5 shadow-[0_30px_80px_rgba(33,51,67,0.14)] backdrop-blur dark:border-[#24344d] dark:bg-[linear-gradient(180deg,#111b2d_0%,#0d1627_100%)] dark:shadow-[0_30px_80px_rgba(2,6,23,0.36)] sm:p-6" : "w-full rounded-[2.25rem] border border-[#e9d8c8] bg-white/92 p-6 shadow-[0_30px_80px_rgba(33,51,67,0.14)] backdrop-blur dark:border-white/10 dark:bg-[#111c30]/92 dark:shadow-[0_30px_80px_rgba(2,6,23,0.32)] sm:p-8"}>
        {compact ? (
          <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#ecddd1] pb-5 dark:border-white/8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#eed8c6] bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c9692c] shadow-[0_12px_30px_rgba(33,51,67,0.06)] dark:border-[#31415b] dark:bg-[linear-gradient(180deg,#202d43_0%,#172337_100%)] dark:text-[#ffc3b0] dark:shadow-[0_14px_30px_rgba(2,6,23,0.24)]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Student Portal
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#213343] dark:text-[#f8fafc]">
                Sign in to continue
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#5b6f86] dark:text-[#c9d5e3]">
                Use your student email and phone number to open your Barak Pathways portal.
              </p>
            </div>
            <ThemeToggle className="border-[#ead5c4] bg-white/90 text-[#213343] shadow-[0_10px_26px_rgba(33,51,67,0.06)] dark:border-[#31415b] dark:bg-[linear-gradient(180deg,#202d43_0%,#182438_100%)] dark:text-white dark:shadow-[0_14px_28px_rgba(2,6,23,0.2)]" />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-5 border-b border-[#ecddd1] pb-6 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#eed8c6] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#c9692c] shadow-[0_12px_30px_rgba(33,51,67,0.06)] dark:border-white/10 dark:bg-white/10 dark:text-[#ffc3b0]">
                  <ShieldCheck className="h-4 w-4" />
                  Secure Student Portal
                </div>
                <div className="mt-5 flex items-center gap-4">
                  <BrandLogo priority imageClassName="w-[178px] px-3 py-2 shadow-[0_16px_36px_rgba(33,51,67,0.08)] dark:shadow-[0_20px_40px_rgba(2,6,23,0.25)]" />
                  <ThemeToggle className="border-[#ead5c4] bg-white/90 text-[#213343] dark:border-white/10 dark:bg-white/10 dark:text-white" />
                </div>
                <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[#213343] dark:text-white sm:text-5xl">
                  Stay close to your Barak Pathways journey.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
                  Check your application stage, upload documents, review payment progress, request consultations, and
                  receive updates from the Barak Pathways team in one professional portal.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <PortalHighlight
                icon={<CalendarDays className="h-4 w-4" />}
                title="Consultations"
                description="Request and track your next meeting."
              />
              <PortalHighlight
                icon={<FileBadge2 className="h-4 w-4" />}
                title="Documents"
                description="Upload and replace required files easily."
              />
              <PortalHighlight
                icon={<CreditCard className="h-4 w-4" />}
                title="Payments"
                description="Follow your current balances in real time."
              />
            </div>
          </>
        )}

        <div className={compact ? "rounded-[1.75rem] border border-[#ecd9cb] bg-white/88 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-[#31415b] dark:bg-[linear-gradient(180deg,#18253a_0%,#122033_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_40px_rgba(2,6,23,0.2)] sm:p-6" : "mt-6 rounded-[1.9rem] border border-[#ecd9cb] bg-[#fffaf6]/92 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-white/10 dark:bg-[#162338]/92 sm:p-8"}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ead5c4] bg-[#fff3ea] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#c9692c] dark:border-[#31415b] dark:bg-[linear-gradient(180deg,#25344a_0%,#1a2639_100%)] dark:text-[#ffc3b0]">
            <Sparkles className="h-4 w-4" />
            Student Access
          </div>
          <h2 className={compact ? "mt-5 text-2xl font-semibold text-[#213343] dark:text-[#f8fafc]" : "mt-6 text-3xl font-semibold text-[#213343] dark:text-white"}>Sign in to your portal</h2>
          <p className={compact ? "mt-2 text-sm leading-6 text-[#5b6f86] dark:text-[#c9d5e3]" : "mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300"}>
            Use the same email and phone number shared with Barak Pathways so we can open your student record
            securely.
          </p>

          {error ? <p className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/12 dark:text-rose-200">{error}</p> : null}

          <form ref={formRef} className={compact ? "mt-5 space-y-3.5" : "mt-6 space-y-4"} onSubmit={handleLogin}>
            <label className="block text-sm text-[#5b6f86] dark:text-[#c9d5e3]">
              <span className="mb-2 block font-medium text-[#213343] dark:text-[#f8fafc]">Email Address</span>
              <input
                type="email"
                className="w-full rounded-2xl border border-[#e4d3c4] bg-[#fffaf6] px-4 py-3 text-[#213343] outline-none ring-[#ff7a59]/25 transition focus:border-[#ffb089] focus:bg-white focus:ring-2 dark:border-white/10 dark:bg-[#162236] dark:text-white dark:focus:bg-[#1a2740]"
                value={loginForm.email}
                onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </label>
            <label className="block text-sm text-[#5b6f86] dark:text-[#c9d5e3]">
              <span className="mb-2 block font-medium text-[#213343] dark:text-[#f8fafc]">Phone Number</span>
              <input
                type="tel"
                className="w-full rounded-2xl border border-[#e4d3c4] bg-[#fffaf6] px-4 py-3 text-[#213343] outline-none ring-[#ff7a59]/25 transition focus:border-[#ffb089] focus:bg-white focus:ring-2 dark:border-white/10 dark:bg-[#162236] dark:text-white dark:focus:bg-[#1a2740]"
                value={loginForm.phone}
                onChange={(event) => setLoginForm((current) => ({ ...current, phone: event.target.value }))}
                required
              />
            </label>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff7a59,#ef6b49)] px-4 py-3.5 font-semibold text-white shadow-[0_16px_30px_rgba(255,122,89,0.24)]"
            >
              Open Student Portal
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </form>

            <div className={compact ? "mt-6 rounded-[1.5rem] border border-[#e7d5c4] bg-[linear-gradient(180deg,#fff7f0_0%,#fff1e6_100%)] p-4 dark:border-[#31415b] dark:bg-[linear-gradient(180deg,#203149_0%,#162338_100%)]" : "mt-8 rounded-[1.6rem] border border-[#e7d5c4] bg-[linear-gradient(180deg,#fff7f0_0%,#fff1e6_100%)] p-5 dark:border-white/10 dark:bg-[linear-gradient(180deg,#18253a_0%,#131f33_100%)]"}>
            <p className="text-sm font-semibold text-[#213343] dark:text-[#f8fafc]">Need access or support?</p>
            <p className="mt-2 text-sm leading-6 text-[#5b6f86] dark:text-[#c9d5e3]">
              If you haven&apos;t received a portal-ready record yet, book a consultation and our team will guide you
              through the next steps.
            </p>
            <a
              href="/book-consultation"
              className="mt-4 inline-flex items-center text-sm font-semibold text-[#c9692c] hover:underline dark:text-[#ffc3b0]"
            >
              Book a consultation
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
