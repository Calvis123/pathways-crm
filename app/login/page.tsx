import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthPanel } from "@/components/auth/auth-panel";
import { BrandLogo } from "@/components/branding/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fffaf4] px-4 py-10 transition-colors dark:bg-[#09111f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,122,89,0.12),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(33,51,67,0.12),transparent_24%),linear-gradient(180deg,#fffaf4_0%,#fff2e7_100%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col justify-center">
        <div className="mb-8 flex items-center justify-between gap-4">
          <BrandLogo imageClassName="w-[188px] rounded-xl bg-white px-3 py-2 ring-1 ring-[#eadfd0] dark:ring-white/10" priority />
          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-[#eadfd0] bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-[#fff3ea] hover:text-[#c9692c] dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/16 dark:hover:text-[#ffbeab]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back Home
            </Link>
          </div>
        </div>

        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#c9692c] dark:text-[#ffbeab]">Welcome to Barak Pathways</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#213343] dark:text-white md:text-5xl">
            Sign in to keep every student pathway moving with confidence.
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300 md:text-lg">
            Access your CRM for consultations, applications, IELTS support, document reviews, finances, and day-to-day
            student follow-up from one clean system.
          </p>
        </div>

        <div className="mx-auto w-full max-w-xl">
          <AuthPanel />
        </div>
      </div>
    </div>
  );
}
