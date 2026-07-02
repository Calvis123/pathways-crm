"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { BrandLogo } from "@/components/branding/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { StudentPortalAccessCard } from "@/components/portal/student-portal-access-card";
import { Card, CardHeader } from "@/components/ui/card";
import { CONSULTATION_FEE, getConsultationBalance, getConsultationPaid } from "@/lib/finance";
import type { DocumentRecord, PaymentRecord, PortalMessage, Student, StudentNote } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const stageLabels = [
  { key: "lead", name: "New Inquiry", icon: "01", desc: "We're reviewing your inquiry." },
  { key: "consultation", name: "Consultation", icon: "02", desc: "Book your consultation session." },
  { key: "application", name: "Application", icon: "03", desc: "We're preparing your application." },
  { key: "visa", name: "Visa Processing", icon: "04", desc: "Your visa work is in progress." },
  { key: "enrolled", name: "Enrolled", icon: "05", desc: "Congratulations, you're enrolled." },
  { key: "placed", name: "Placed", icon: "06", desc: "You're ready for the next milestone." }
] as const;

const requiredDocs = [
  { type: "Passport", label: "Passport Copy", icon: "ID" },
  { type: "CV", label: "CV/Resume", icon: "CV" },
  { type: "Academic Transcript", label: "Academic Transcripts", icon: "TR" },
  { type: "Recommendation Letter", label: "Recommendation Letter", icon: "RL" },
  { type: "IELTS Certificate", label: "IELTS Certificate", icon: "IE" }
];

const countries = ["Kenya", "Uganda", "Tanzania", "Rwanda", "Nigeria", "Ghana", "UK", "USA", "Canada", "Australia", "Other"];
const programs = ["Diploma", "Undergraduate", "Postgraduate"];

type PortalSnapshot = {
  student: Student;
  documents: DocumentRecord[];
  notes: StudentNote[];
  messages: PortalMessage[];
  payments: PaymentRecord[];
};

export function StudentPortalDashboard({
  snapshot,
  invalidToken = false
}: {
  snapshot: PortalSnapshot | null;
  invalidToken?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedDocType, setSelectedDocType] = useState(requiredDocs[0].type);
  const [error, setError] = useState<string | null>(invalidToken ? "This portal link is invalid or expired." : null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    phone: snapshot?.student.phone ?? "",
    country_interest: snapshot?.student.country_interest ?? "Kenya",
    program_level: snapshot?.student.program_level ?? "Undergraduate",
    university_name: snapshot?.student.university_name ?? ""
  });
  const [consultationForm, setConsultationForm] = useState({ preferred_date: "", preferred_time: "" });
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });

  async function handleLogout() {
    await fetch("/api/portal/session/logout", { method: "POST" });
    router.push("/");
  }

  async function handleProfileSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const response = await fetch("/api/portal/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm)
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error ?? "Could not update profile.");
        return;
      }
      setSuccess("Profile updated successfully.");
      router.refresh();
    });
  }

  async function handleConsultationRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const response = await fetch("/api/portal/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consultationForm)
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error ?? "Could not request consultation.");
        return;
      }
      setSuccess("Consultation requested. We'll confirm shortly.");
      setConsultationForm({ preferred_date: "", preferred_time: "" });
      router.refresh();
    });
  }

  async function handleDocumentChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("document_type", selectedDocType);
    formData.append("document", file);

    startTransition(async () => {
      const response = await fetch("/api/portal/documents", {
        method: "POST",
        body: formData
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error ?? "Could not upload document.");
        return;
      }
      setSuccess("Document uploaded successfully.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    });
  }

  async function handlePasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError("New password and confirmation do not match.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/portal/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        })
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error ?? "Could not change password.");
        return;
      }
      setSuccess("Password changed successfully.");
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      router.refresh();
    });
  }

  if (!snapshot) {
    return <StudentPortalAccessCard invalidToken={invalidToken} />;
  }

  const { student, documents, notes, messages, payments } = snapshot;
  const stageIndex = Math.max(stageLabels.findIndex((stage) => stage.key === student.stage), 0);
  const progress = Math.round(((stageIndex + 1) / stageLabels.length) * 100);
  const totalPaid = getConsultationPaid(student);
  const remaining = getConsultationBalance(student);
  const paymentProgress = Math.min(100, Math.round((totalPaid / CONSULTATION_FEE) * 100));
  const paymentMessage = `Hi Barak Pathways, I am ${student.full_name}. I want to complete my outstanding balance of ${formatCurrency(remaining)}.`;
  const recentPayments = [...payments].sort((a, b) =>
    (b.paid_at ?? b.created_at).localeCompare(a.paid_at ?? a.created_at)
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffaf4_0%,#f9f6f0_38%,#f5f7fb_100%)] dark:bg-[linear-gradient(180deg,#07101d_0%,#0c1627_38%,#101b30_100%)]">
      <header className="overflow-hidden border-b border-[#eadbcf] bg-[radial-gradient(circle_at_top_left,rgba(255,122,89,0.14),transparent_24%),linear-gradient(135deg,#fffaf4_0%,#fff1e7_46%,#fff7f1_100%)] text-[#213343] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(255,122,89,0.16),transparent_24%),linear-gradient(135deg,#172434_0%,#132037_46%,#182845_100%)] dark:text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-6">
          <div className="flex items-center gap-4">
            <BrandLogo imageClassName="w-[148px] px-3 py-2 shadow-[0_16px_30px_rgba(15,23,42,0.12)] dark:shadow-[0_16px_30px_rgba(15,23,42,0.16)]" />
            <div>
              <h1 className="text-2xl font-semibold">Student Portal</h1>
              <p className="mt-1 text-sm text-[#5a7088] dark:text-white/80">Welcome back, {student.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="border-[#e7d3c4] bg-white/90 text-[#213343] hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/16" />
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center rounded-2xl border border-[#e7d3c4] bg-white/92 px-4 py-2 text-sm font-medium text-[#213343] shadow-[0_12px_24px_rgba(33,51,67,0.06)] hover:bg-white dark:border-white/10 dark:bg-white/12 dark:text-white dark:ring-1 dark:ring-white/12"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {success ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200">{success}</p> : null}
        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/12 dark:text-rose-200">{error}</p> : null}

        <section className="overflow-hidden rounded-xl border border-[#eadfd4] bg-white/95 p-6 shadow-panel dark:border-white/10 dark:bg-[linear-gradient(180deg,#142136_0%,#0f1b2d_100%)] dark:shadow-[0_24px_60px_rgba(2,6,23,0.34)]">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c9692c] dark:text-[#ffcfbf]">Your journey overview</p>
              <h2 className="mt-3 text-3xl font-semibold text-ink dark:text-[#f8fafc]">Hello, {student.full_name}!</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-[#d6dfeb]">
                Your application is currently in the <strong>{student.stage.replace(/_/g, " ")}</strong> stage. Use
                this portal to stay updated, upload documents, and keep your Barak Pathways process moving.
              </p>
              <p className="mt-4 text-xs text-slate-500 dark:text-[#93a6bf]">Last updated: {formatDate(student.updated_at)}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <PortalMetric label="Progress" value={`${progress}%`} />
              <PortalMetric label="Paid" value={formatCurrency(totalPaid)} />
              <PortalMetric label="Balance" value={formatCurrency(remaining)} />
            </div>
          </div>
        </section>

        <Card className="dark:bg-[linear-gradient(180deg,#142136_0%,#0f1b2d_100%)]">
          <CardHeader title="Application Progress" description={`${progress}% complete`} />
          <div className="h-3 overflow-hidden rounded-full bg-[#f0e7de] dark:bg-white/10">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#ff7a59_0%,#e0a04f_100%)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            {stageLabels.map((stage, index) => {
              const isCompleted = index < stageIndex;
              const isActive = index === stageIndex;
              return (
                <div
                  key={stage.key}
                  className={`rounded-2xl border p-4 text-center ${
                    isCompleted
                      ? "border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10"
                      : isActive
                        ? "border-[#ffb089] bg-[#fff4ea] dark:border-[#ffb089]/50 dark:bg-[#ff7a59]/10"
                        : "border-[#eadacc] bg-[#fff6ef] dark:border-white/10 dark:bg-white/5"
                  }`}
                >
                  <p className="text-2xl">{stage.icon}</p>
                  <p className="mt-2 text-sm font-semibold text-ink dark:text-[#f8fafc]">{stage.name}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-[#a6b6cb]">{stage.desc}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {(student.stage === "lead" || !student.consultation_requested) ? (
          <Card className="border-[#f0c8a5] bg-[linear-gradient(135deg,#fff6ee_0%,#fff1de_100%)] dark:border-[#ffb089]/25 dark:bg-[linear-gradient(180deg,#162338_0%,#111c30_100%)] dark:shadow-[0_24px_54px_rgba(2,6,23,0.34)]">
            <CardHeader title="Book Your Free Consultation" description="Let's discuss your study abroad goals." />
            <form className="grid gap-4 md:grid-cols-3" onSubmit={handleConsultationRequest}>
              <input
                type="date"
                className="rounded-2xl border border-[#eadacc] px-4 py-3 dark:border-white/10 dark:bg-[#162236] dark:text-white"
                value={consultationForm.preferred_date}
                onChange={(event) =>
                  setConsultationForm((current) => ({ ...current, preferred_date: event.target.value }))
                }
                required
              />
              <input
                type="time"
                className="rounded-2xl border border-[#eadacc] px-4 py-3 dark:border-white/10 dark:bg-[#162236] dark:text-white"
                value={consultationForm.preferred_time}
                onChange={(event) =>
                  setConsultationForm((current) => ({ ...current, preferred_time: event.target.value }))
                }
                required
              />
              <button
                type="submit"
                disabled={isPending}
                className="rounded-2xl bg-[linear-gradient(135deg,#213343,#2a5167)] px-4 py-3 font-semibold text-white dark:bg-[linear-gradient(135deg,#ff7a59,#cf6a34)] dark:shadow-[0_18px_34px_rgba(255,122,89,0.2)]"
              >
                {isPending ? "Requesting..." : "Request Consultation"}
              </button>
            </form>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="dark:bg-[linear-gradient(180deg,#142136_0%,#0f1b2d_100%)]">
            <CardHeader title="Your Profile" description="Update your phone, country, program, and target university." />
            <form className="space-y-4" onSubmit={handleProfileSave}>
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-2 block font-medium text-ink dark:text-white">Email</span>
                <input value={student.email} disabled className="w-full rounded-2xl border border-[#eadacc] bg-[#fff6ef] px-4 py-3 dark:border-white/10 dark:bg-white/5 dark:text-slate-200" />
              </label>
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-2 block font-medium text-ink dark:text-white">WhatsApp number / alternative phone number</span>
                <input
                  className="w-full rounded-2xl border border-[#eadacc] px-4 py-3 dark:border-white/10 dark:bg-[#18263b] dark:text-white"
                  value={profileForm.phone}
                  onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </label>
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-2 block font-medium text-ink dark:text-white">Country</span>
                <select
                  className="w-full rounded-2xl border border-[#eadacc] px-4 py-3 dark:border-white/10 dark:bg-[#18263b] dark:text-white"
                  value={profileForm.country_interest}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, country_interest: event.target.value }))
                  }
                >
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-2 block font-medium text-ink dark:text-white">Program</span>
                <select
                  className="w-full rounded-2xl border border-[#eadacc] px-4 py-3 dark:border-white/10 dark:bg-[#18263b] dark:text-white"
                  value={profileForm.program_level}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, program_level: event.target.value }))
                  }
                >
                  {programs.map((program) => (
                    <option key={program} value={program}>
                      {program}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-2 block font-medium text-ink dark:text-white">Target University</span>
                <input
                  className="w-full rounded-2xl border border-[#eadacc] px-4 py-3 dark:border-white/10 dark:bg-[#18263b] dark:text-white"
                  value={profileForm.university_name}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, university_name: event.target.value }))
                  }
                />
              </label>
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-2xl bg-[linear-gradient(135deg,#213343,#2a5167)] px-4 py-3 font-semibold text-white dark:bg-[linear-gradient(135deg,#ff7a59,#cf6a34)] dark:shadow-[0_18px_34px_rgba(255,122,89,0.2)]"
              >
                {isPending ? "Saving..." : "Update Profile"}
              </button>
            </form>
          </Card>

          <Card className="dark:bg-[linear-gradient(180deg,#142136_0%,#0f1b2d_100%)]">
            <CardHeader title="Payment Status" description="Live view of your consultation and IELTS balances." />
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-[#f0dfd0] pb-3 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400">Consultation Fee</span>
                <span className="font-semibold text-ink dark:text-white">{formatCurrency(CONSULTATION_FEE)}</span>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Payment progress</span>
                  <span>{paymentProgress}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#22c55e_0%,#d7a85b_100%)]"
                    style={{ width: `${paymentProgress}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-[#f0dfd0] pb-3 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400">Amount Paid</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#f0dfd0] pb-3 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400">Remaining Balance</span>
                <span className={`font-semibold ${remaining > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  {formatCurrency(remaining)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#f0dfd0] pb-3 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400">Due Date</span>
                <span className={`font-semibold ${student.payment_due_date && remaining > 0 ? "text-ink dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
                  {student.payment_due_date ? formatDate(student.payment_due_date) : "Not set"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#f0dfd0] pb-3 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400">Status</span>
                <span className={`font-semibold ${remaining > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  {remaining > 0 ? "Partial Payment" : "Fully Paid"}
                </span>
              </div>
              {student.ielts_enrolled ? (
                <>
                  <div className="flex items-center justify-between border-b border-[#f0dfd0] pb-3 dark:border-white/10">
                    <span className="text-slate-500 dark:text-slate-400">IELTS Training Fee</span>
                    <span className="font-semibold text-ink dark:text-white">{formatCurrency(student.ielts_amount ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">IELTS Payment</span>
                    <span className={`font-semibold ${student.ielts_payment_status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                      {student.ielts_payment_status === "paid" ? "Paid" : "Pending"}
                    </span>
                  </div>
                </>
              ) : null}
              {remaining > 0 ? (
                <div className="rounded-2xl bg-blue-50 p-4 text-center dark:border dark:border-sky-400/15 dark:bg-[linear-gradient(180deg,#17253a_0%,#122033_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <p className="mb-3 text-sm text-blue-700 dark:text-[#d7e7fb]">To complete your payment, contact us via WhatsApp.</p>
                  <a
                    href={`https://wa.me/254113043315?text=${encodeURIComponent(paymentMessage)}`}
                    className="inline-flex rounded-2xl bg-[#25d366] px-4 py-3 font-semibold text-white shadow-[0_14px_28px_rgba(37,211,102,0.22)] dark:shadow-[0_16px_30px_rgba(37,211,102,0.16)]"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Pay via WhatsApp
                  </a>
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        <Card className="dark:bg-[linear-gradient(180deg,#142136_0%,#0f1b2d_100%)]">
          <CardHeader title="Portal Password" description="Change the temporary password sent to your email." />
          <form className="grid gap-4 md:grid-cols-3" onSubmit={handlePasswordChange}>
            <label className="block text-sm text-slate-600 dark:text-slate-300">
              <span className="mb-2 block font-medium text-ink dark:text-white">Current Password</span>
              <input
                type="password"
                className="w-full rounded-2xl border border-[#eadacc] px-4 py-3 dark:border-white/10 dark:bg-[#18263b] dark:text-white"
                value={passwordForm.current_password}
                onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))}
                required
              />
            </label>
            <label className="block text-sm text-slate-600 dark:text-slate-300">
              <span className="mb-2 block font-medium text-ink dark:text-white">New Password</span>
              <input
                type="password"
                className="w-full rounded-2xl border border-[#eadacc] px-4 py-3 dark:border-white/10 dark:bg-[#18263b] dark:text-white"
                value={passwordForm.new_password}
                onChange={(event) => setPasswordForm((current) => ({ ...current, new_password: event.target.value }))}
                minLength={8}
                required
              />
            </label>
            <label className="block text-sm text-slate-600 dark:text-slate-300">
              <span className="mb-2 block font-medium text-ink dark:text-white">Confirm Password</span>
              <input
                type="password"
                className="w-full rounded-2xl border border-[#eadacc] px-4 py-3 dark:border-white/10 dark:bg-[#18263b] dark:text-white"
                value={passwordForm.confirm_password}
                onChange={(event) => setPasswordForm((current) => ({ ...current, confirm_password: event.target.value }))}
                minLength={8}
                required
              />
            </label>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-2xl bg-[linear-gradient(135deg,#213343,#2a5167)] px-4 py-3 font-semibold text-white dark:bg-[linear-gradient(135deg,#ff7a59,#cf6a34)] dark:shadow-[0_18px_34px_rgba(255,122,89,0.2)] md:col-span-3"
            >
              {isPending ? "Saving..." : "Change Password"}
            </button>
          </form>
        </Card>

        <Card className="dark:bg-[linear-gradient(180deg,#142136_0%,#0f1b2d_100%)]">
          <CardHeader title="Required Documents" description="Upload PDF or image files up to 5MB." />
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleDocumentChange} accept=".pdf,.jpg,.jpeg,.png" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {requiredDocs.map((doc) => {
              const existing = documents.find((item) => item.document_type.toLowerCase() === doc.type.toLowerCase());
              return (
                <div
                  key={doc.type}
                  className={`rounded-2xl border-2 p-4 text-center ${
                    existing
                      ? "border-emerald-400 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10"
                      : "border-dashed border-[#d9c6b8] bg-[#fff6ef] dark:border-white/15 dark:bg-white/5"
                  }`}
                >
                  <p className="text-3xl">{doc.icon}</p>
                  <p className="mt-2 text-sm font-semibold text-ink dark:text-[#f8fafc]">{doc.label}</p>
                  <p className={`mt-2 text-xs ${existing ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}>
                    {existing ? `Uploaded - ${formatDate(existing.uploaded_at)}` : "Pending"}
                  </p>
                  <button
                    type="button"
                    className="mt-4 rounded-xl bg-[linear-gradient(135deg,#213343,#2a5167)] px-3 py-2 text-xs font-semibold text-white"
                    onClick={() => {
                      setSelectedDocType(doc.type);
                      fileInputRef.current?.click();
                    }}
                  >
                    {existing ? "Replace" : "Upload"}
                  </button>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="dark:bg-[linear-gradient(180deg,#142136_0%,#0f1b2d_100%)]">
            <CardHeader title="Messages" description="Updates sent to you by the CRM team." />
            <div className="space-y-3">
              {messages.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">No messages yet.</p> : null}
              {messages.map((message) => (
                <div key={message.id} className="rounded-2xl border border-[#f0dfd0] bg-[#fff6ef] p-4 dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <p className="font-medium text-ink dark:text-white">{message.subject}</p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{message.message}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{formatDate(message.created_at, { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="dark:bg-[linear-gradient(180deg,#142136_0%,#0f1b2d_100%)]">
            <CardHeader title="Notes and Guidance" description="Shared notes and recommendations from your file." />
            <div className="space-y-3">
              {notes.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">No shared notes yet.</p> : null}
              {notes.map((note) => (
                <div key={note.id} className="rounded-2xl border border-[#f0dfd0] bg-[#fff6ef] p-4 dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <p className="font-medium capitalize text-ink dark:text-white">{note.note_type}</p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{note.note_text}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {recentPayments.length > 0 ? (
          <Card className="dark:bg-[linear-gradient(180deg,#142136_0%,#0f1b2d_100%)]">
            <CardHeader title="Recorded Payments" description="Transactions already captured in your CRM record." />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-[#f0dfd0] bg-[#fff6ef] p-4 dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <p className="text-sm font-semibold capitalize text-ink dark:text-white">{payment.payment_type.replace(/_/g, " ")}</p>
                  <p className="mt-2 text-xl font-semibold text-ink dark:text-white">{formatCurrency(payment.amount)}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {payment.status} - {formatDate(payment.paid_at ?? payment.created_at)}
                  </p>
                  {payment.reference_number ? (
                    <p className="mt-2 break-words text-xs text-slate-500 dark:text-slate-400">Ref: {payment.reference_number}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function PortalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-[#eadfd4] bg-[linear-gradient(180deg,#fff8f2_0%,#ffffff_100%)] p-4 text-center dark:border-white/10 dark:bg-[linear-gradient(180deg,#1a2740_0%,#152236_100%)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-[#213343] dark:text-white">{value}</p>
    </div>
  );
}

