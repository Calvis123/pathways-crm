"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const countries = ["UK", "Malta", "Cyprus", "Spain", "Canada", "Australia", "Germany", "USA", "New Zealand"];
const programs = ["Undergraduate", "Postgraduate", "Other"];
const startDates = ["2026", "2027", "Not decided yet"];

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as {
      error?: string;
      calendlyUrl?: string;
      whatsappUrl?: string;
    };
  } catch {
    return { error: text };
  }
}

export default function BookConsultationPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");
  const [links, setLinks] = useState<{ calendlyUrl: string; whatsappUrl: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setStatus("submitting");
    setError("");

    const response = await fetch("/api/public/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...Object.fromEntries(formData.entries()),
        source: formData.get("source") || searchParams.get("source") || "Website",
        campaign: formData.get("campaign") || searchParams.get("campaign") || "Direct",
        referral_code: searchParams.get("ref") ?? undefined
      })
    });

    const body = await readJsonResponse(response);

    if (!response.ok) {
      setError(body.error ?? "We could not save your consultation request.");
      setStatus("idle");
      return;
    }

    setLinks({
      calendlyUrl: body.calendlyUrl ?? "https://calendly.com/barakpathways/30min",
      whatsappUrl: body.whatsappUrl ?? "https://wa.me/254113043315"
    });
    setStatus("success");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(175,146,51,0.2),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#fff8e8_100%)] px-4 py-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="overflow-hidden rounded-[2.5rem] border border-[#d9c27a]/30 bg-ink text-white shadow-panel">
          <div className="border-b border-white/10 px-8 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold">Barak Pathways</p>
            <h1 className="mt-4 max-w-lg text-4xl font-semibold tracking-tight">
              Book your free 15-minute study abroad consultation.
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-200">
              Get help with countries, universities, visas, scholarships, and your next move.
            </p>
          </div>

          <div className="grid gap-6 px-8 py-8">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-gold">What students say</p>
              <blockquote className="mt-4 text-lg leading-8 text-slate-100">
                &ldquo;Barak Pathways helped me get into University of Derby. Now I&apos;m earning 3.5M KES per year.&rdquo;
              </blockquote>
              <p className="mt-3 text-sm text-slate-300">James, Eldoret</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <p className="text-2xl font-semibold text-gold">1</p>
                <p className="mt-2 text-sm text-slate-200">Tell us where you want to study.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <p className="text-2xl font-semibold text-gold">2</p>
                <p className="mt-2 text-sm text-slate-200">We capture your lead and prep your consultation.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <p className="text-2xl font-semibold text-gold">3</p>
                <p className="mt-2 text-sm text-slate-200">You pick your preferred time on Calendly.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-white/60 bg-white/92 p-8 shadow-panel">
          {status === "success" && links ? (
            <div className="flex h-full flex-col justify-center text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-3xl font-semibold text-emerald-700">
                OK
              </div>
              <h2 className="mt-6 text-3xl font-semibold text-ink">Almost there</h2>
              <p className="mt-3 text-slate-600">
                Your lead is in the CRM. Choose your consultation time below or continue on WhatsApp.
              </p>
              <div className="mt-8 grid gap-3">
                <a
                  href={links.calendlyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#006BFF] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0056d3]"
                >
                  Pick Your Time on Calendly
                </a>
                <a
                  href={links.whatsappUrl}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#20ba5a]"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Consultation Form</p>
              <h2 className="mt-3 text-3xl font-semibold text-ink">Tell us about your plans</h2>
              <p className="mt-2 text-sm text-slate-500">
                This page stays public while the internal CRM remains protected by role-based access.
              </p>

              <form action={handleSubmit} className="mt-8 grid gap-4">
                <input type="hidden" name="source" value={searchParams.get("source") ?? "Website"} />
                <input type="hidden" name="campaign" value={searchParams.get("campaign") ?? "Direct"} />

                <input
                  name="full_name"
                  required
                  placeholder="Full name"
                  className="rounded-2xl border border-[#eadacc] px-4 py-3 outline-none ring-gold/30 focus:ring-2"
                />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Email address"
                  className="rounded-2xl border border-[#eadacc] px-4 py-3 outline-none ring-gold/30 focus:ring-2"
                />
                <input
                  name="phone"
                  required
                  placeholder="WhatsApp number"
                  className="rounded-2xl border border-[#eadacc] px-4 py-3 outline-none ring-gold/30 focus:ring-2"
                />
                <input
                  name="location"
                  placeholder="City / location"
                  className="rounded-2xl border border-[#eadacc] px-4 py-3 outline-none ring-gold/30 focus:ring-2"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    name="country_interest"
                    required
                    className="rounded-2xl border border-[#eadacc] px-4 py-3 outline-none ring-gold/30 focus:ring-2"
                  >
                    <option value="">Country interest</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>

                  <select
                    name="program_level"
                    required
                    className="rounded-2xl border border-[#eadacc] px-4 py-3 outline-none ring-gold/30 focus:ring-2"
                  >
                    <option value="">Program level</option>
                    {programs.map((program) => (
                      <option key={program} value={program}>
                        {program}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  name="start_date"
                  required
                  className="rounded-2xl border border-[#eadacc] px-4 py-3 outline-none ring-gold/30 focus:ring-2"
                >
                  <option value="">When do you want to start?</option>
                  {startDates.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>

                {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

                <Button type="submit" className="w-full">
                  {status === "submitting" ? "Booking..." : "Book My Free Consultation"}
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
