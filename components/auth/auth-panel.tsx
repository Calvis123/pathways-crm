"use client";

import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { startTransition, useEffect, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { TAB_SESSION_STORAGE_KEY } from "@/components/auth/session-tab-guard";
import { BrandLogo } from "@/components/branding/brand-logo";
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

      const responseText = await response.text();
      let body: { error?: string; redirectTo?: string } = {};

      try {
        body = responseText ? JSON.parse(responseText) : {};
      } catch {
        body = {
          error: response.ok
            ? "The server returned an unreadable login response."
            : `Login failed with HTTP ${response.status}.`
        };
      }

      if (!response.ok) {
        setError(body.error ?? `Login failed with HTTP ${response.status}.`);
        setLoading(false);
        return;
      }

      establishTabSession();
      const redirectTo = (body.redirectTo ?? "/dashboard") as Route;
      startTransition(() => {
        router.replace(redirectTo);
        router.refresh();
      });
    } catch (error) {
      console.error("Sign in failed", error);
      setError(error instanceof Error ? error.message : "Could not sign in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#e6d4c5] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,249,244,0.98)_100%)] p-6 shadow-[0_28px_90px_rgba(33,51,67,0.14)] backdrop-blur transition-colors dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,27,45,0.98)_0%,rgba(18,32,52,0.98)_100%)] dark:shadow-[0_28px_90px_rgba(2,6,23,0.44)] xl:p-8">
      <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,122,89,0.09),transparent)]" />

      <div className="relative flex items-center justify-between gap-4 border-b border-[#eadacc] pb-6 dark:border-white/10">
        <div className="min-w-0">
          <BrandLogo imageClassName="w-[148px] drop-shadow-none dark:drop-shadow-none" priority />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#c9692c] dark:text-[#ffbeab]">
            Team access
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            Sign in to your CRM workspace.
          </p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#eadacc] bg-[#fff6ef] text-[#213343] shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-[#ffbeab]">
          <LockKeyhole className="h-5 w-5" />
        </div>
      </div>

      <div>
        <form onSubmit={handleSignIn} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#284255] dark:text-slate-200">Email Address</span>
            <input
              type="email"
              value={signInForm.email}
              onChange={(event) => setSignInForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-xl border border-[#e4d3c4] bg-[#fffaf6] px-4 py-3 text-[#213343] outline-none ring-[#ff7a59]/25 transition focus:border-[#ffb089] focus:bg-white focus:ring-2 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-slate-400 dark:focus:bg-white/14"
              placeholder="name@barakpathways.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#284255] dark:text-slate-200">Password</span>
            <input
              type="password"
              value={signInForm.password}
              onChange={(event) => setSignInForm((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-xl border border-[#e4d3c4] bg-[#fffaf6] px-4 py-3 text-[#213343] outline-none ring-[#ff7a59]/25 transition focus:border-[#ffb089] focus:bg-white focus:ring-2 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-slate-400 dark:focus:bg-white/14"
              placeholder="Enter your password"
            />
          </label>

          {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">{error}</p> : null}

          <Button
            type="submit"
            className="w-full rounded-xl bg-[linear-gradient(135deg,#ff7a59,#ef6b49)] py-3 text-white shadow-[0_14px_30px_rgba(255,122,89,0.22)] hover:bg-[#ef6b49]"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
            {!loading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
          </Button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
        Use your Barak Pathways team email and password.
      </p>
    </div>
  );
}
