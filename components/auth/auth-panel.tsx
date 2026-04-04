"use client";

import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { startTransition, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole } from "lucide-react";
import { TAB_SESSION_STORAGE_KEY } from "@/components/auth/session-tab-guard";
import { Button } from "@/components/ui/button";

export function AuthPanel() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [signInForm, setSignInForm] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function resetMessages() {
    setError("");
  }

  function establishTabSession() {
    window.sessionStorage.setItem(TAB_SESSION_STORAGE_KEY, crypto.randomUUID());
  }

  useEffect(() => {
    const nextRoute = searchParams.get("next");

    if (nextRoute?.startsWith("/")) {
      router.prefetch(nextRoute as Route);
    }
  }, [router, searchParams]);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) {
      return;
    }

    setLoading(true);
    resetMessages();

    try {
      const response = await fetch("/api/session/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signInForm.email,
          password: signInForm.password,
          next: searchParams.get("next") ?? undefined
        })
      });

      const body = (await response.json()) as { error?: string; redirectTo?: string };

      if (!response.ok) {
        setError(body.error ?? "Could not sign in.");
        setLoading(false);
        return;
      }

      establishTabSession();
      const redirectTo = (body.redirectTo ?? "/dashboard") as Route;
      window.location.assign(redirectTo);
    } catch {
      setError("Could not sign in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[#e8d7c6] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,247,240,0.98)_100%)] p-6 shadow-[0_28px_90px_rgba(33,51,67,0.16)] backdrop-blur transition-colors dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(10,18,33,0.98)_0%,rgba(15,23,42,0.98)_100%)] dark:shadow-[0_28px_90px_rgba(2,6,23,0.44)] xl:p-8">
      <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(255,122,89,0.18),transparent_72%)]" />
      <div className="absolute -right-16 top-12 h-36 w-36 rounded-full bg-[#213343]/[0.06] blur-3xl" />

      <div className="relative inline-flex rounded-full border border-[#e4cfbd] bg-[#fff1e6] px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-white/10 dark:bg-white/10">
        <span className="rounded-full bg-[linear-gradient(135deg,#ff7a59,#ef6b49)] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(255,122,89,0.28)]">
          Team Sign In
        </span>
      </div>

      <div>
        <h2 className="mt-6 text-3xl font-semibold text-[#173042] dark:text-white">Welcome back to Barak Pathways</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Sign in with your work email and password to continue managing student pathways, admissions, IELTS,
          finance, and operations.
        </p>

        <form onSubmit={handleSignIn} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#284255] dark:text-slate-200">Email Address</span>
            <input
              type="email"
              value={signInForm.email}
              onChange={(event) => setSignInForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-2xl border border-[#e4d3c4] bg-[#fffaf6] px-4 py-3 text-[#173042] outline-none ring-[#ff7a59]/25 transition focus:border-[#ffb089] focus:bg-white focus:ring-2 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-slate-400 dark:focus:bg-white/14"
              placeholder="name@barakpathways.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#284255] dark:text-slate-200">Password</span>
            <input
              type="password"
              value={signInForm.password}
              onChange={(event) => setSignInForm((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-2xl border border-[#e4d3c4] bg-[#fffaf6] px-4 py-3 text-[#173042] outline-none ring-[#ff7a59]/25 transition focus:border-[#ffb089] focus:bg-white focus:ring-2 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-slate-400 dark:focus:bg-white/14"
              placeholder="Enter your password"
            />
          </label>

          {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">{error}</p> : null}

          <Button
            type="submit"
            className="w-full rounded-full bg-[linear-gradient(135deg,#ff7a59,#ef6b49)] py-3 text-white shadow-[0_14px_30px_rgba(255,122,89,0.24)] hover:bg-[#ef6b49]"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
            {!loading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
          </Button>
        </form>
      </div>

      <div className="mt-8 rounded-[1.6rem] border border-[#e7d5c4] bg-[linear-gradient(180deg,#fff7f0_0%,#fff1e6_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.03)_100%)]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#213343,#2f495c)] text-white shadow-[0_12px_22px_rgba(33,51,67,0.22)]">
            <LockKeyhole className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-[#173042] dark:text-white">Keep every student journey moving</p>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Access the internal CRM for consultations, applications, documents, payments, IELTS support,
              and client communication.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#c9692c]">
              <CheckCircle2 className="h-4 w-4" />
              User access is created and managed by Barak Pathways admins
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
