"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function QuickAddStudentForm() {
  const [status, setStatus] = useState<string>("");

  async function handleSubmit(formData: FormData) {
    setStatus("Saving...");
    const response = await fetch("/api/students", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData.entries())),
      headers: {
        "Content-Type": "application/json"
      }
    });

    setStatus(response.ok ? "Student created." : "Could not create student.");
  }

  return (
    <form action={handleSubmit} className="grid gap-3 rounded-xl border border-[#f0dfd0] bg-[#fffaf5] p-5 md:grid-cols-2 xl:grid-cols-4">
      <input name="full_name" required placeholder="Student name" className="rounded-2xl border border-[#eadacc] bg-white px-4 py-3 text-sm outline-none ring-gold/30 focus:ring-2" />
      <input name="email" required type="email" placeholder="Email address" className="rounded-2xl border border-[#eadacc] bg-white px-4 py-3 text-sm outline-none ring-gold/30 focus:ring-2" />
      <input name="phone" placeholder="Phone number" className="rounded-2xl border border-[#eadacc] bg-white px-4 py-3 text-sm outline-none ring-gold/30 focus:ring-2" />
      <input name="country_interest" placeholder="Country interest" className="rounded-2xl border border-[#eadacc] bg-white px-4 py-3 text-sm outline-none ring-gold/30 focus:ring-2" />
      <input name="program_level" placeholder="Program level" className="rounded-2xl border border-[#eadacc] bg-white px-4 py-3 text-sm outline-none ring-gold/30 focus:ring-2" />
      <select name="lead_source" className="rounded-2xl border border-[#eadacc] bg-white px-4 py-3 text-sm outline-none ring-gold/30 focus:ring-2">
        <option>Website</option>
        <option>Facebook Consultation</option>
        <option>WhatsApp</option>
        <option>Referral</option>
      </select>
      <label className="flex items-center gap-2 rounded-2xl border border-[#eadacc] bg-white px-4 py-3 text-sm text-slate-600">
        <input type="checkbox" name="consultation_requested" value="true" className="size-4 rounded border-[#d9c6b8]" />
        Consultation requested
      </label>
      <Button type="submit">Add Lead</Button>
      {status ? <p className="text-sm text-slate-500 md:col-span-2 xl:col-span-4">{status}</p> : null}
    </form>
  );
}
