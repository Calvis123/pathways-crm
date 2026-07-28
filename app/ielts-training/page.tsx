"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  PenLine,
  Phone,
  ShieldCheck,
  Target
} from "lucide-react";

const destinations = ["UK", "Canada", "Australia", "USA", "Germany", "Other"];
const targetScores = ["6.0", "6.5", "7.0", "7.5", "8.0+"];
const testTypes = ["IELTS Academic", "IELTS General Training", "IELTS for UKVI", "Not sure yet"];
const testFormats = ["IELTS on computer", "Computer with Writing on Paper", "IELTS Online (Academic)", "Help me choose"];
const RATE_LIMIT_MS = 30_000;

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as {
      error?: string;
    };
  } catch {
    return { error: text };
  }
}

export default function IeltsTrainingPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");

  const source = useMemo(() => searchParams.get("source") ?? "facebook_ielts", [searchParams]);
  const campaign = useMemo(() => searchParams.get("campaign") ?? "Direct", [searchParams]);

  async function handleSubmit(formData: FormData) {
    const lastSubmitAt = Number(window.localStorage.getItem("ielts-training-last-submit") ?? "0");
    if (Date.now() - lastSubmitAt < RATE_LIMIT_MS) {
      setError("Please wait 30 seconds before submitting again.");
      return;
    }

    setStatus("submitting");
    setError("");

    const response = await fetch("/api/public/ielts-training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...Object.fromEntries(formData.entries()), source, campaign })
    });
    const body = await readJsonResponse(response);

    if (!response.ok) {
      setError(body.error ?? "We could not save your IELTS registration.");
      setStatus("idle");
      return;
    }

    window.localStorage.setItem("ielts-training-last-submit", String(Date.now()));
    setStatus("success");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#102c37] text-white">
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=88&w=2000')"
        }}
      />
      <div className="fixed inset-0 bg-[linear-gradient(105deg,rgba(9,32,42,0.96)_0%,rgba(13,43,54,0.88)_42%,rgba(10,29,38,0.6)_100%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(222,193,91,0.13),transparent_28%),linear-gradient(0deg,rgba(7,24,32,0.3),transparent_45%)]" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1320px] items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16 lg:px-12 lg:py-14">
        <section className="max-w-xl py-4 lg:py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e2c665]/35 bg-[#e2c665]/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#f2d878] backdrop-blur-md">
            <Target className="h-4 w-4" />
            IELTS preparation
          </div>
          <h1 className="mt-7 font-serif text-[44px] leading-[1.02] tracking-[-0.035em] text-white sm:text-6xl lg:text-[68px]">
            Tell us your target.
            <span className="block text-[#e2c665]">We’ll help you plan the journey.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/70 sm:text-lg">
            Register your interest and our IELTS team will contact you to discuss preparation, scheduling, and the right test for your goals.
          </p>

          <div className="mt-9 grid gap-4">
            <Benefit icon={Clock3} title="Flexible preparation" text="Plan your learning around your availability." />
            <Benefit icon={Target} title="Goal-led approach" text="Prepare for the band score you need." />
            <Benefit icon={Phone} title="Fast follow-up" text="Our team will contact you directly on WhatsApp." />
          </div>

          <p className="mt-9 flex items-center gap-2 text-xs text-white/45">
            <ShieldCheck className="h-4 w-4 text-[#e2c665]" />
            Your information is kept private and used only for your enquiry.
          </p>
        </section>

        <section className="rounded-[28px] border border-white/30 bg-white/[0.96] p-5 text-[#193240] shadow-[0_30px_90px_rgba(3,18,25,0.35)] backdrop-blur-xl sm:p-8 lg:p-9">
          {status === "success" ? (
            <SuccessState />
          ) : (
            <>
              <div className="flex items-start justify-between gap-5">
                <div>
                  <h2 className="font-serif text-3xl sm:text-4xl">Reserve your place</h2>
                  <p className="mt-2 text-sm text-slate-500">Fields marked with * are required.</p>
                </div>
                <div className="hidden rounded-2xl bg-[#f3eedf] p-3 text-[#9b8129] sm:block">
                  <PenLine className="h-6 w-6" />
                </div>
              </div>

              {error ? (
                <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {error}
                </div>
              ) : null}

              <form action={handleSubmit} className="mt-7 grid gap-4">
                <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

                <Field label="Full name *">
                  <input name="full_name" required placeholder="As it appears on your ID" className={fieldClass} />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email address *">
                    <input name="email" type="email" required placeholder="name@example.com" autoComplete="email" className={fieldClass} />
                  </Field>
                  <Field label="WhatsApp number *">
                    <input
                      name="phone"
                      type="tel"
                      required
                      placeholder="07XXXXXXXX or +2547XXXXXXXX"
                      inputMode="tel"
                      autoComplete="tel"
                      title="Enter a Kenyan number beginning with 07, 01, +2547, or +2541"
                      className={fieldClass}
                    />
                  </Field>
                </div>

                <Field label="Current location">
                  <input name="location" placeholder="City or town" autoComplete="address-level2" className={fieldClass} />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="IELTS test type">
                    <select name="test_type" defaultValue="IELTS Academic" className={fieldClass}>
                      {testTypes.map((testType) => <option key={testType} value={testType}>{testType}</option>)}
                    </select>
                  </Field>
                  <Field label="Preferred test format">
                    <select name="test_format" defaultValue="IELTS on computer" className={fieldClass}>
                      {testFormats.map((format) => <option key={format} value={format}>{format}</option>)}
                    </select>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Target band">
                    <select name="target_score" defaultValue="6.5" className={fieldClass}>
                      {targetScores.map((score) => <option key={score} value={score}>{score}</option>)}
                    </select>
                  </Field>
                  <Field label="Study destination">
                    <select name="destination" defaultValue="UK" className={fieldClass}>
                      {destinations.map((destination) => <option key={destination} value={destination}>{destination}</option>)}
                    </select>
                  </Field>
                </div>

                <label className="mt-1 flex cursor-pointer items-start gap-3 rounded-xl border border-[#e3dbd0] bg-[#faf8f4] px-4 py-3.5">
                  <input
                    type="checkbox"
                    name="consent"
                    required
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#cbbda9] accent-[#193b49]"
                  />
                  <span className="text-xs leading-5 text-slate-600">
                    I consent to Barak Pathways storing my details and contacting me by phone, WhatsApp, or email about IELTS training and my enquiry.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#193b49] px-5 py-4 text-sm font-bold text-white shadow-[0_12px_30px_rgba(25,59,73,0.2)] transition hover:-translate-y-0.5 hover:bg-[#265364] disabled:cursor-wait disabled:opacity-70"
                >
                  {status === "submitting" ? "Sending your registration..." : "Start my IELTS journey"}
                  {status !== "submitting" ? <ArrowRight className="h-4 w-4" /> : null}
                </button>

                <p className="flex items-center justify-center gap-2 text-center text-[11px] leading-5 text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Your details are used only to respond to your enquiry.
                </p>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

const fieldClass =
  "w-full rounded-xl border border-[#ddd3c7] bg-[#fbfaf8] px-4 py-3.5 text-sm text-[#193240] outline-none transition placeholder:text-slate-400 focus:border-[#b99b39] focus:bg-white focus:ring-4 focus:ring-[#b99b39]/10";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#304b57]">{label}</span>
      {children}
    </label>
  );
}

function Benefit({
  icon: Icon,
  title,
  text
}: {
  icon: typeof Clock3;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[#e2c665] backdrop-blur">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="mt-1 text-xs text-white/55">{text}</p>
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="flex min-h-[570px] flex-col items-center justify-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <h2 className="mt-8 font-serif text-4xl text-[#193240]">Registration received.</h2>
      <p className="mt-4 max-w-md text-sm leading-7 text-slate-500">
        Thank you for registering for IELTS training. Our team has received your details and will contact you shortly to discuss your next steps.
      </p>
    </div>
  );
}
