"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

const destinations = ["UK", "Canada", "Australia", "USA", "Germany", "Other"];
const targetScores = ["6.0", "6.5", "7.0", "7.5", "8.0+"];
const RATE_LIMIT_MS = 30_000;

export default function IeltsTrainingPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");
  const [links, setLinks] = useState<{ whatsappUrl: string; consultationUrl: string } | null>(null);

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
      body: JSON.stringify({
        ...Object.fromEntries(formData.entries()),
        source,
        campaign
      })
    });

    const body = (await response.json()) as {
      error?: string;
      whatsappUrl?: string;
      consultationUrl?: string;
    };

    if (!response.ok) {
      setError(body.error ?? "We could not save your IELTS registration.");
      setStatus("idle");
      return;
    }

    window.localStorage.setItem("ielts-training-last-submit", String(Date.now()));
    setLinks({
      whatsappUrl: body.whatsappUrl ?? "https://wa.me/254113043315",
      consultationUrl: body.consultationUrl ?? "/book-consultation"
    });
    setStatus("success");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_50%,#0f172a_100%)] px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(175,146,51,0.08),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(175,146,51,0.12),transparent_35%)]" />

      <div className="relative w-full max-w-[560px] overflow-hidden rounded-[2rem] border border-gold/25 bg-white/95 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <header className="border-b border-gold/15 bg-white px-8 py-6 text-center">
          <div className="text-xs font-bold uppercase tracking-[0.35em] text-ink">Barak Pathways</div>
          <div className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
            <span>Official British Council Partner</span>
          </div>
        </header>

        <section className="relative overflow-hidden bg-ink px-8 py-10 text-center text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(175,146,51,0.12),transparent_45%)]" />
          <h1 className="relative font-serif text-3xl">IELTS Training & Preparation</h1>
          <p className="relative mt-3 text-sm leading-6 text-slate-200">
            Expert guidance and proven strategies to help you achieve your target score.
          </p>
        </section>

        <section className="px-8 py-8">
          {status === "success" && links ? (
            <div className="py-4 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-3xl font-bold text-white">
                OK
              </div>
              <h2 className="mt-6 font-serif text-3xl text-ink">Registration Complete</h2>
              <p className="mt-3 text-slate-500">We have received your application for training.</p>

              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left">
                <div className="mb-3 text-sm text-ink">Our team will contact you on WhatsApp within 24 hours</div>
                <div className="mb-3 text-sm text-ink">You will receive your assessment details via email</div>
                <div className="text-sm text-ink">Prepare for your first training session</div>
              </div>

              <div className="mt-6 grid gap-3">
                <a
                  href={links.whatsappUrl}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#25D366] px-4 py-4 text-sm font-semibold text-white transition hover:bg-[#20BA5A]"
                >
                  Chat on WhatsApp
                </a>
                <a
                  href={links.consultationUrl}
                  className="text-sm font-semibold text-gold transition hover:underline"
                >
                  Need help applying to university? Book Consultation
                </a>
              </div>
            </div>
          ) : (
            <>
              {error ? (
                <div className="mb-6 rounded-2xl border-l-4 border-rose-600 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-700">
                  {error}
                </div>
              ) : null}

              <form action={handleSubmit} className="grid gap-5">
                <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-ink">Full Name</label>
                  <input
                    name="full_name"
                    required
                    placeholder="As it appears on your ID"
                    className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/10"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-ink">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/10"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-ink">WhatsApp Number</label>
                  <input
                    name="phone"
                    required
                    placeholder="07..."
                    inputMode="numeric"
                    className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/10"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-xs font-bold uppercase tracking-[0.08em] text-ink">Current Location</label>
                    <input
                      name="location"
                      placeholder="City"
                      className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/10"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-xs font-bold uppercase tracking-[0.08em] text-ink">Target Score</label>
                    <select
                      name="target_score"
                      defaultValue="6.5"
                      className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/10"
                    >
                      {targetScores.map((score) => (
                        <option key={score} value={score}>
                          {score}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-ink">Study Destination</label>
                  <select
                    name="destination"
                    defaultValue="UK"
                    className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/10"
                  >
                    {destinations.map((destination) => (
                      <option key={destination} value={destination}>
                        {destination}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#AF9233,#9a7d2d)] px-4 py-4 text-sm font-bold uppercase tracking-[0.08em] text-ink shadow-[0_4px_16px_rgba(175,146,51,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {status === "submitting" ? "Registering..." : "Register Now"}
                </button>
              </form>

              <div className="mt-8 border-t border-slate-200 pt-6 text-center">
                <div className="mb-3 text-sm font-semibold text-slate-500">British Council Approved Materials</div>
                <div className="mb-3 text-sm font-semibold text-slate-500">Certified Trainers</div>
                <div className="text-sm font-semibold text-slate-500">Flexible Schedule</div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
