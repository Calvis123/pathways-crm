"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  X,
  Menu,
  ArrowRight,
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  CalendarCheck2,
  CreditCard,
  FolderKanban,
  Globe2,
  GraduationCap,
  LineChart,
  MessageSquareMore,
  ShieldCheck
} from "lucide-react";
import { AuthPanel } from "@/components/auth/auth-panel";
import { BrandLogo } from "@/components/branding/brand-logo";
import { StudentPortalAccessCard } from "@/components/portal/student-portal-access-card";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button, LinkButton } from "@/components/ui/button";

const serviceCards = [
  {
    icon: GraduationCap,
    title: "Student Placement",
    description: "Guide students from first inquiry to admission, visa, enrollment, and long-term success."
  },
  {
    icon: CalendarCheck2,
    title: "IELTS Training",
    description: "Run a dedicated IELTS intake and trainer workflow with follow-up, scoring, and conversion support."
  },
  {
    icon: CreditCard,
    title: "Finance Visibility",
    description: "Track payments, reminders, commissions, and revenue forecasting without splitting work across tools."
  },
  {
    icon: FolderKanban,
    title: "Operations Control",
    description: "Review documents, portal activity, internal notes, and audit history from one secure CRM."
  }
];

const crmCards = [
  {
    icon: Bell,
    title: "Follow-up Engine",
    description: "Keep every student moving with structured reminders, status updates, and team accountability."
  },
  {
    icon: MessageSquareMore,
    title: "Communication Tools",
    description: "Use email templates, WhatsApp actions, and portal messaging to stay responsive and consistent."
  },
  {
    icon: LineChart,
    title: "Leadership Reporting",
    description: "Monitor revenue, stuck cases, staff performance, and pipeline health with focused reporting pages."
  }
];

const workflowSteps = [
  {
    number: "01",
    title: "Attract and qualify students",
    description: "Consultation bookings, IELTS registrations, and CRM lead capture all flow into a single admissions system."
  },
  {
    number: "02",
    title: "Operate with confidence",
    description: "Admissions, finance, marketing, operations, and IELTS trainers each get dedicated CRM access with role-aware permissions."
  },
  {
    number: "03",
    title: "Convert and scale",
    description: "With reporting, commissions, reminders, and portal support in one place, Barak Pathways can grow on stronger systems."
  }
];

export function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showStudentPortalModal, setShowStudentPortalModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if (!showAuthModal && !showStudentPortalModal) {
      return undefined;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowAuthModal(false);
        setShowStudentPortalModal(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showAuthModal, showStudentPortalModal]);

  useEffect(() => {
    if (!showMobileMenu) {
      return undefined;
    }

    function handleScroll() {
      setShowMobileMenu(false);
    }

    function handleResize() {
      if (window.innerWidth >= 768) {
        setShowMobileMenu(false);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [showMobileMenu]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8f4_0%,#fff2eb_52%,#fffaf6_100%)] text-slate-900 transition-colors dark:bg-[linear-gradient(180deg,#08111f_0%,#0c1628_52%,#0f1b31_100%)] dark:text-slate-100">
      <header className="sticky top-0 z-40 px-3 pt-3 transition-colors sm:px-4 lg:px-6">
        <div className="mx-auto max-w-7xl rounded-[1.75rem] border border-[#eadfd0]/90 bg-[#fffaf4]/88 px-4 py-3 shadow-[0_20px_60px_rgba(33,51,67,0.08)] backdrop-blur-2xl transition-colors dark:border-white/10 dark:bg-[#09111f]/78 dark:shadow-[0_24px_70px_rgba(2,6,23,0.34)]">
          <div className="flex items-center justify-between gap-4">
          <Link href="/" className="group flex min-w-0 items-center gap-3">
            <div className="rounded-[1.35rem] border border-[#eadfd0] bg-white p-2.5 shadow-[0_14px_34px_rgba(33,51,67,0.08)] transition group-hover:-translate-y-0.5 dark:border-white/15 dark:bg-white dark:shadow-[0_18px_38px_rgba(2,6,23,0.24)]">
              <BrandLogo priority imageClassName="w-[156px] rounded-lg bg-white px-1 py-1 shadow-none ring-0" />
            </div>
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c9692c] dark:text-[#ffbeab]">
                Barak Pathways
              </p>
              <p className="mt-1 truncate text-sm text-[#55657a] dark:text-slate-400">
                Premium admissions CRM for education pathways
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-[#e2cbbb] bg-white/92 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_24px_rgba(33,51,67,0.06)] dark:border-white/10 dark:bg-white/[0.05] md:flex">
              <ThemeToggle compact className="border-transparent bg-transparent text-[#49596e] shadow-none hover:bg-[#fff3ea] dark:hover:bg-white/10" />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowStudentPortalModal(true)}
                className="rounded-full border-0 bg-transparent px-4 text-[#425166] shadow-none hover:bg-[#fff3ea] hover:text-[#213343] dark:bg-transparent dark:text-slate-100 dark:hover:bg-white/10"
              >
                Student Portal
              </Button>
            </div>

            <ThemeToggle compact className="text-[#49596e] md:hidden" />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowMobileMenu((open) => !open)}
              className="h-11 w-11 rounded-full border border-[#e1cab9] bg-white/96 p-0 text-[#425166] shadow-[0_12px_24px_rgba(33,51,67,0.06)] hover:border-[#d18b5b] hover:bg-[#fff3ea] hover:text-[#213343] dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/16 md:hidden"
              aria-label={showMobileMenu ? "Close menu" : "Open menu"}
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAuthModal(true)}
              className="hidden rounded-full border border-[#e1cab9] bg-white/96 px-4 text-[#425166] shadow-[0_12px_24px_rgba(33,51,67,0.06)] hover:border-[#d18b5b] hover:bg-[#fff3ea] hover:text-[#213343] dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/16 md:inline-flex sm:px-5"
            >
              Sign in
            </Button>
            <LinkButton
              href="/book-consultation"
              className="hidden rounded-full bg-[linear-gradient(135deg,#ff7a59,#ef6b49)] px-4 text-white shadow-[0_16px_30px_rgba(255,122,89,0.24)] hover:bg-[#ef6b49] md:inline-flex sm:px-5"
            >
              Book Consultation
            </LinkButton>
          </div>
        </div>

          {showMobileMenu ? (
            <div className="mt-4 rounded-[1.5rem] border border-[#ead9cc] bg-white/92 p-3 shadow-[0_20px_50px_rgba(33,51,67,0.08)] dark:border-white/10 dark:bg-[#101a2d]/94 md:hidden">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowStudentPortalModal(true);
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#ead9cc] bg-[#fff6f0] px-4 py-2 text-sm font-medium text-[#213343] transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  Student Portal
                </button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowAuthModal(true);
                  }}
                  className="justify-center rounded-2xl border border-[#ead9cc] bg-white text-[#213343] hover:bg-[#fff3ea] dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/16"
                >
                  Sign in
                </Button>
                <Link
                  href="/book-consultation"
                  onClick={() => setShowMobileMenu(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ff7a59,#ef6b49)] px-4 py-2 text-sm font-medium text-white shadow-[0_16px_30px_rgba(255,122,89,0.24)] transition hover:opacity-95"
                >
                  Book Consultation
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,190,171,0.38),transparent_26%),radial-gradient(circle_at_78%_20%,rgba(255,216,202,0.32),transparent_24%),linear-gradient(180deg,rgba(255,249,244,0.9),rgba(255,241,232,0.56))] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,122,89,0.14),transparent_28%),radial-gradient(circle_at_78%_20%,rgba(94,234,212,0.08),transparent_25%),linear-gradient(180deg,rgba(9,17,31,0.22),rgba(9,17,31,0.02))]" />
          <div className="mx-auto grid max-w-7xl gap-14 px-4 pb-20 pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:px-6 lg:pb-24 lg:pt-20">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#efcfbf] bg-white/92 px-4 py-2 text-sm font-medium text-[#b86439] shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-[#ffbeab]">
                <ShieldCheck className="h-4 w-4" />
                A professional digital home for the Barak Pathways admissions operation
              </div>

              <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-[#213343] dark:text-white lg:text-6xl">
                Help more students move from ambition to global opportunity with a CRM built around pathways.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4c5d72] dark:text-slate-300">
                Barak Pathways now has a cleaner public front door and a more structured internal platform for student
                placement, IELTS training, payment follow-up, documents, portal access, and leadership reporting.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="rounded-full bg-[#ff7a59] px-6 py-3 text-base text-white hover:bg-[#ef6b49]"
                >
                  Open the CRM
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <LinkButton
                  href="/ielts-training"
                  variant="secondary"
                  className="rounded-full border border-[#e7d6c7] bg-white px-6 py-3 text-base text-slate-700 hover:bg-[#fff3ea] dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/16"
                >
                  Explore IELTS Training
                </LinkButton>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-[#f6ddd2] bg-[linear-gradient(180deg,#fff4ee_0%,#ffe9df_100%)] p-5 shadow-[0_18px_48px_rgba(33,51,67,0.06)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(33,43,64,0.98),rgba(21,31,49,0.98))] dark:shadow-[0_20px_55px_rgba(2,6,23,0.3)]">
                  <p className="text-sm font-semibold text-[#fffdfb] dark:text-white">Better lead handling</p>
                  <p className="mt-2 text-sm leading-6 text-[#72849a] dark:text-slate-300">
                    Keep every inquiry, consultation, and application visible across the full student journey.
                  </p>
                </div>
                <div className="rounded-3xl border border-[#f6ddd2] bg-[linear-gradient(180deg,#fff4ee_0%,#ffe6da_100%)] p-5 shadow-[0_18px_48px_rgba(33,51,67,0.06)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(33,43,64,0.98),rgba(21,31,49,0.98))] dark:shadow-[0_20px_55px_rgba(2,6,23,0.3)]">
                  <p className="text-sm font-semibold text-[#fffdfb] dark:text-white">Cleaner team workflows</p>
                  <p className="mt-2 text-sm leading-6 text-[#72849a] dark:text-slate-300">
                    Give admissions, operations, finance, and IELTS teams dedicated spaces to work with confidence.
                  </p>
                </div>
                <div className="rounded-3xl border border-[#f6ddd2] bg-[linear-gradient(180deg,#fff5ef_0%,#ffe9de_100%)] p-5 shadow-[0_18px_48px_rgba(33,51,67,0.06)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(33,43,64,0.98),rgba(21,31,49,0.98))] dark:shadow-[0_20px_55px_rgba(2,6,23,0.3)]">
                  <p className="text-sm font-semibold text-[#fffdfb] dark:text-white">Stronger leadership visibility</p>
                  <p className="mt-2 text-sm leading-6 text-[#72849a] dark:text-slate-300">
                    Use reports, reminders, commissions, and forecasting to see what needs action next.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <div className="relative overflow-hidden rounded-[2.25rem] border border-[#f3d9cd] bg-[linear-gradient(180deg,#fff8f4_0%,#fff0e8_100%)] p-4 shadow-[0_30px_80px_rgba(33,51,67,0.12)] dark:border-[#22314a] dark:bg-[linear-gradient(180deg,#10192c_0%,#152239_100%)] dark:shadow-[0_28px_80px_rgba(2,6,23,0.34)]">
                <div className="relative overflow-hidden rounded-[1.75rem] border border-[#eadfd0] bg-[linear-gradient(135deg,rgba(255,246,240,0.98),rgba(255,230,218,0.96))] p-6 dark:border-[#2a3954] dark:bg-[linear-gradient(180deg,#18243a_0%,#131f33_100%)]">
                  <div
                    className="absolute inset-0 opacity-30 dark:hidden"
                    style={{
                      backgroundImage: "url('/barak-pathways-logo.jpeg')",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "cover"
                    }}
                  />
                  <div className="absolute inset-0 hidden dark:block dark:bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.05),transparent_18%),radial-gradient(circle_at_82%_18%,rgba(255,122,89,0.12),transparent_20%),linear-gradient(180deg,rgba(20,31,50,0.08),rgba(9,16,29,0.12))]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,169,142,0.24),transparent_26%),radial-gradient(circle_at_20%_80%,rgba(255,214,197,0.24),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04))] dark:bg-[radial-gradient(circle_at_80%_18%,rgba(255,122,89,0.08),transparent_22%),radial-gradient(circle_at_20%_80%,rgba(148,163,184,0.06),transparent_24%),linear-gradient(180deg,rgba(9,16,29,0.02),rgba(9,16,29,0.16))]" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="max-w-md">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#c9692c] shadow-sm backdrop-blur dark:border-[#344664] dark:bg-[#22314a] dark:text-[#ffc7b6]">
                          <Globe2 className="h-3.5 w-3.5" />
                          Hero Snapshot
                        </div>
                        <h2 className="mt-4 text-3xl font-semibold leading-tight text-[#2b4057] dark:text-[#f8f5f2]">
                          Designed to present Barak Pathways like a serious, trusted education brand.
                        </h2>
                        <p className="mt-3 max-w-md text-sm leading-7 text-[#4f647d] dark:text-[#cad3df]">
                          Every touchpoint now feels more intentional, from public trust-building to the internal CRM that keeps student pathways moving.
                        </p>
                      </div>
                      <div className="rounded-[1.4rem] border border-white/30 bg-[#213343] px-4 py-3 text-white shadow-[0_16px_34px_rgba(33,51,67,0.24)] dark:border-[#2f4261] dark:bg-[linear-gradient(135deg,#ff7a59,#ef6b49)] dark:shadow-[0_16px_34px_rgba(255,122,89,0.22)]">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                    </div>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.8rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,247,242,0.94),rgba(255,236,227,0.9))] p-5 shadow-lg shadow-[#213343]/5 backdrop-blur dark:border-[#2d3b55] dark:bg-[linear-gradient(180deg,#202b41_0%,#182236_100%)] dark:shadow-[0_18px_40px_rgba(2,6,23,0.22)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d47b62] dark:text-[#8f9ab0]">Core promise</p>
                        <p className="mt-3 text-lg font-semibold text-[#2f455d] dark:text-[#f8f5f2]">
                          A better student pathway from consultation to placement.
                        </p>
                        <p className="mt-3 text-sm leading-6 text-[#5e748c] dark:text-[#cad3df]">
                          Clearer admissions follow-up, more consistent client handling, and a stronger digital presence.
                        </p>
                      </div>
                      <div className="rounded-[1.8rem] bg-[#213343] p-5 text-white shadow-lg shadow-[#213343]/15 dark:bg-[linear-gradient(135deg,#f07843,#cf6a34)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ffe2d8]">Operations value</p>
                        <p className="mt-3 text-lg font-semibold text-[#fff9f4]">
                          One connected system for admissions, IELTS, documents, and finance.
                        </p>
                        <p className="mt-3 text-sm leading-6 text-[#fff1ea]/88">
                          Leadership visibility, role-aware execution, and a cleaner system for the whole consultancy.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-[1.5rem] border border-white/65 bg-[linear-gradient(135deg,rgba(255,247,242,0.94),rgba(255,233,223,0.9))] p-4 backdrop-blur dark:border-[#2d3b55] dark:bg-[linear-gradient(180deg,#202b41_0%,#182236_100%)]">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#d47b62] dark:text-[#8f9ab0]">Admissions</p>
                        <p className="mt-2 text-sm font-semibold text-[#2f455d] dark:text-[#f8f5f2]">Lead pipeline, consultations, placements</p>
                      </div>
                      <div className="rounded-[1.5rem] border border-white/65 bg-[linear-gradient(135deg,rgba(255,247,242,0.94),rgba(255,233,223,0.9))] p-4 backdrop-blur dark:border-[#2d3b55] dark:bg-[linear-gradient(180deg,#202b41_0%,#182236_100%)]">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#d47b62] dark:text-[#8f9ab0]">Student support</p>
                        <p className="mt-2 text-sm font-semibold text-[#2f455d] dark:text-[#f8f5f2]">Portal, messages, reminders, document review</p>
                      </div>
                      <div className="rounded-[1.5rem] border border-white/65 bg-[linear-gradient(135deg,rgba(255,247,242,0.94),rgba(255,233,223,0.9))] p-4 backdrop-blur dark:border-[#2d3b55] dark:bg-[linear-gradient(180deg,#202b41_0%,#182236_100%)]">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#d47b62] dark:text-[#8f9ab0]">Leadership</p>
                        <p className="mt-2 text-sm font-semibold text-[#2f455d] dark:text-[#f8f5f2]">Forecasting, reports, audit visibility</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="border-y border-[#f2d8cb] bg-[linear-gradient(180deg,#fff8f2_0%,#fff1e7_48%,#fff7f1_100%)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#0b1424_0%,#111c31_100%)]">
          <div className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#c9692c] dark:text-[#ffbeab]">Services</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[#213343] dark:text-white">
                  Everything Barak Pathways needs to support students more professionally.
                </h2>
              </div>
              <p className="max-w-xl text-base leading-7 text-[#4f6075] dark:text-slate-300">
                The platform now reflects the real work of an education consultancy: student trust, admissions follow-through,
                IELTS support, finance discipline, and better internal coordination.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {serviceCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <article key={card.title} className="group relative overflow-hidden rounded-[2rem] border border-[#f0d6c8] bg-[linear-gradient(180deg,#fff3eb_0%,#ffe7db_100%)] p-6 shadow-[0_18px_48px_rgba(33,51,67,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(33,51,67,0.1)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#202b41_0%,#182236_100%)] dark:shadow-[0_20px_52px_rgba(2,6,23,0.22)] dark:hover:bg-[linear-gradient(180deg,#263248_0%,#1c2740_100%)]">
                    <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(255,190,171,0.24),transparent_72%)] opacity-80 transition group-hover:opacity-100 dark:bg-[radial-gradient(circle_at_top,rgba(255,190,171,0.12),transparent_72%)]" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-[#ffd7c7] text-[#e38b70] dark:bg-[#ff7a59]/15 dark:text-[#ffbeab]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="relative mt-5 flex items-center justify-between gap-3">
                      <h3 className="text-xl font-semibold text-[#2b4057] dark:text-white">{card.title}</h3>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d47b62] dark:text-[#ffbeab]">
                        0{index + 1}
                      </span>
                    </div>
                    <p className="relative mt-3 text-sm leading-7 text-[#5a7088] dark:text-slate-300">{card.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="crm" className="mx-auto max-w-7xl px-4 py-20 lg:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#c9692c] dark:text-[#ffbeab]">CRM Platform</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[#213343] dark:text-white">
                A cleaner, more credible digital foundation for the Barak Pathways brand.
              </h2>
              <p className="mt-4 text-lg leading-8 text-[#4f6075] dark:text-slate-300">
                The public experience now feels more like a polished modern software brand, while the internal experience
                keeps the power your team needs for admissions, payments, IELTS, documents, and oversight.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {crmCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="rounded-3xl border border-[#eadfd0] bg-white p-5 shadow-[0_18px_48px_rgba(33,51,67,0.05)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#202b41_0%,#182236_100%)] dark:shadow-[0_20px_52px_rgba(2,6,23,0.22)]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#213343] text-white dark:bg-[#3f3140]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-[#213343] dark:text-white">{card.title}</p>
                    <p className="mt-3 text-sm leading-7 text-[#5a6c82] dark:text-slate-300">{card.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="workflow" className="border-y border-[#f2d8cb] bg-[linear-gradient(180deg,#fff7f1_0%,#ffede2_54%,#fff6f0_100%)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#091322_0%,#101b30_100%)]">
          <div className="mx-auto max-w-7xl px-4 py-20 lg:px-6">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#c9692c] dark:text-[#ffbeab]">Workflow</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[#213343] dark:text-white">
                A better pathway for students, and a better operating rhythm for your team.
              </h2>
              <p className="mt-4 text-lg leading-8 text-[#4f6075] dark:text-slate-300">
                The process is now structured around the real Barak Pathways journey: attract serious prospects, guide them professionally, and keep the whole team aligned through delivery.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {workflowSteps.map((step, index) => (
                <div key={step.number} className="group relative overflow-hidden rounded-[2rem] border border-[#f0d6c8] bg-[linear-gradient(180deg,#fff4ed_0%,#ffe7db_100%)] p-6 shadow-[0_18px_48px_rgba(33,51,67,0.05)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#202b41_0%,#182236_100%)] dark:shadow-[0_20px_52px_rgba(2,6,23,0.22)]">
                  <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#ff7a59,#e09a54)]" />
                  {index < workflowSteps.length - 1 ? (
                    <div className="absolute right-[-28px] top-1/2 hidden h-px w-14 bg-[linear-gradient(90deg,rgba(255,122,89,0.45),rgba(224,154,84,0.1))] lg:block" />
                  ) : null}
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#c9692c] dark:text-[#ffbeab]">{step.number}</p>
                    <div className="rounded-full border border-[#f3d6c8] bg-[#fff1e8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ff9e85] dark:border-white/10 dark:bg-white/[0.06] dark:text-[#ffbeab]">
                      Step
                    </div>
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold text-[#2b4057] dark:text-white">{step.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#5a7088] dark:text-slate-300">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="mx-auto max-w-7xl px-4 py-20 lg:px-6">
          <div className="rounded-[2.5rem] border border-[#f2d8cb] bg-[linear-gradient(135deg,#fff6f0_0%,#ffeade_46%,#fff4ec_100%)] p-8 text-[#213343] shadow-[0_30px_90px_rgba(33,51,67,0.12)] dark:border-white/10 dark:bg-[linear-gradient(135deg,#101a2d_0%,#15243a_52%,#0f2036_100%)] dark:text-white dark:shadow-[0_30px_90px_rgba(2,6,23,0.34)] lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f0a28b] dark:text-[#ffbeab]">Barak Pathways</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight">
                  Present the brand with more confidence and run the team with more clarity.
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-[#5f7188] dark:text-slate-300">
                  From student placement to IELTS training, documents, portal access, payments, and reporting, this CRM
                  is now shaped around how Barak Pathways actually works.
                </p>
              </div>

              <div className="space-y-4 rounded-[2rem] border border-white/60 bg-white/35 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] dark:border-white/10 dark:bg-white/[0.04]">
                <div className="rounded-2xl bg-white/55 p-4 dark:bg-[linear-gradient(180deg,#202b41_0%,#182236_100%)]">
                  <div className="flex items-center gap-3">
                    <BadgeCheck className="h-5 w-5 text-[#f0a28b] dark:text-[#ffbeab]" />
                    <p className="font-semibold text-[#213343] dark:text-white">Professional brand presentation</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/55 p-4 dark:bg-[linear-gradient(180deg,#202b41_0%,#182236_100%)]">
                  <div className="flex items-center gap-3">
                    <BriefcaseBusiness className="h-5 w-5 text-[#f0a28b] dark:text-[#ffbeab]" />
                    <p className="font-semibold text-[#213343] dark:text-white">Connected internal operations</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/55 p-4 dark:bg-[linear-gradient(180deg,#202b41_0%,#182236_100%)]">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-[#f0a28b] dark:text-[#ffbeab]" />
                    <p className="font-semibold text-[#213343] dark:text-white">Role-aware secure data workflows</p>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      onClick={() => setShowAuthModal(true)}
                      className="rounded-full bg-[#ff7a59] px-6 py-3 text-white hover:bg-[#ef6b49]"
                    >
                      Launch CRM
                    </Button>
                    <LinkButton
                      href="/book-consultation"
                      variant="secondary"
                      className="rounded-full border border-[#efcfc1] bg-white/80 px-6 py-3 text-[#213343] hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                    >
                      Book a Consultation
                    </LinkButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {showAuthModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#213343]/55 px-4 py-8 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setShowAuthModal(false)} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-2xl">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Close sign in dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <AuthPanel />
          </div>
        </div>
      ) : null}

      {showStudentPortalModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#213343]/55 px-4 py-8 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setShowStudentPortalModal(false)} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-3xl">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowStudentPortalModal(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Close student portal dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <StudentPortalAccessCard compact />
          </div>
        </div>
      ) : null}
    </div>
  );
}
