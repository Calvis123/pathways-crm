import { formatCurrency } from "@/lib/utils";
import { getStudents } from "@/lib/data";
import { CONSULTATION_FEE, getConsultationBalance, getConsultationPaid } from "@/lib/finance";

const conversionRates = {
  lead_to_consultation: 0.4,
  consultation_to_documents: 0.7,
  documents_to_application: 0.6,
  application_to_visa: 0.5,
  visa_to_enrolled: 0.8
} as const;

const stageFlow = ["lead", "consultation", "documents", "application", "visa", "enrolled"] as const;
const averageConsultationFee = CONSULTATION_FEE;

type StageKey = (typeof stageFlow)[number];

function stageLabel(stage: StageKey) {
  return stage.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function expectedValueForStage(stage: StageKey, count: number, collected: number, outstanding: number) {
  switch (stage) {
    case "lead":
      return (
        count *
        averageConsultationFee *
        conversionRates.lead_to_consultation *
        conversionRates.consultation_to_documents *
        conversionRates.documents_to_application *
        conversionRates.application_to_visa *
        conversionRates.visa_to_enrolled
      );
    case "consultation":
      return (
        count *
        averageConsultationFee *
        conversionRates.consultation_to_documents *
        conversionRates.documents_to_application *
        conversionRates.application_to_visa *
        conversionRates.visa_to_enrolled
      );
    case "documents":
      return (
        count *
        averageConsultationFee *
        conversionRates.documents_to_application *
        conversionRates.application_to_visa *
        conversionRates.visa_to_enrolled
      );
    case "application":
      return (
        count *
        averageConsultationFee *
        conversionRates.application_to_visa *
        conversionRates.visa_to_enrolled
      );
    case "visa":
      return count * averageConsultationFee * conversionRates.visa_to_enrolled;
    case "enrolled":
      return collected + outstanding;
  }
}

export default async function RevenueForecastPage() {
  const students = await getStudents();
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
  const lastMonth = lastMonthDate.getMonth();
  const lastMonthYear = lastMonthDate.getFullYear();

  const pipelineData = stageFlow.map((stage) => {
    const stageStudents = students.filter((student) => student.stage === stage);
    const count = stageStudents.length;
    const collected = stageStudents.reduce((sum, student) => {
      if (student.payment_status === "full" || student.payment_status === "paid") return sum + averageConsultationFee;
      return sum + getConsultationPaid(student);
    }, 0);
    const outstanding = stageStudents.reduce((sum, student) => {
      if (student.payment_status === "full" || student.payment_status === "paid") return sum;
      return sum + getConsultationBalance(student);
    }, 0);

    return {
      stage,
      label: stageLabel(stage),
      count,
      collected,
      outstanding,
      expected_value: expectedValueForStage(stage, count, collected, outstanding)
    };
  });

  const pipelineLookup = Object.fromEntries(pipelineData.map((item) => [item.stage, item])) as Record<
    StageKey,
    (typeof pipelineData)[number]
  >;

  const months = Array.from({ length: 3 }, (_, index) => {
    const i = index + 1;
    const monthDate = new Date(thisYear, thisMonth + i, 1);
    const monthName = monthDate.toLocaleDateString("en-KE", { month: "long", year: "numeric" });
    const cycleStage: StageKey = i === 1 ? "visa" : i === 2 ? "application" : "documents";
    const divisor = 4 - i + 1;
    const revenue = pipelineLookup[cycleStage].expected_value / divisor;
    const enrollments = Math.round((pipelineLookup[cycleStage].count * 0.3) / divisor);

    return {
      name: monthName,
      revenue,
      enrollments
    };
  });

  const lastMonthActual = students
    .filter((student) => {
      if (student.stage !== "enrolled") return false;
      const updated = new Date(student.updated_at);
      return updated.getMonth() === lastMonth && updated.getFullYear() === lastMonthYear;
    })
    .reduce(
      (acc, student) => {
        const paid =
          student.payment_status === "full" || student.payment_status === "paid"
            ? averageConsultationFee
            : getConsultationPaid(student);
        return { revenue: acc.revenue + paid, enrollments: acc.enrollments + 1 };
      },
      { revenue: 0, enrollments: 0 }
    );

  const thisMonthActual = students
    .filter((student) => {
      if (student.stage !== "enrolled") return false;
      const updated = new Date(student.updated_at);
      return updated.getMonth() === thisMonth && updated.getFullYear() === thisYear;
    })
    .reduce(
      (acc, student) => {
        const paid =
          student.payment_status === "full" || student.payment_status === "paid"
            ? averageConsultationFee
            : getConsultationPaid(student);
        return { revenue: acc.revenue + paid, enrollments: acc.enrollments + 1 };
      },
      { revenue: 0, enrollments: 0 }
    );

  const totalPipelineValue = pipelineData.reduce((sum, item) => sum + item.expected_value, 0);
  const totalCollected = pipelineData.reduce((sum, item) => sum + item.collected, 0);
  const totalOutstanding = pipelineData.reduce((sum, item) => sum + item.outstanding, 0);

  const lastRevenue = lastMonthActual.revenue;
  const thisRevenue = thisMonthActual.revenue;
  const growth = lastRevenue > 0 ? ((thisRevenue - lastRevenue) / lastRevenue) * 100 : 0;

  const scenarios = [
    { key: "best", name: "Best Case", desc: "All pipeline converts at top rates", multiplier: 1.3, tone: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { key: "likely", name: "Likely", desc: "Based on historical averages", multiplier: 1.0, tone: "text-sky-600 bg-sky-50 border-sky-200" },
    { key: "worst", name: "Worst Case", desc: "Conservative estimates", multiplier: 0.6, tone: "text-rose-600 bg-rose-50 border-rose-200" }
  ] as const;

  const chartRows = [
    { label: "Last Month", value: lastMonthActual.revenue, tone: "bg-slate-300" },
    { label: "This Month", value: thisMonthActual.revenue, tone: "bg-slate-500" },
    ...months.map((month) => ({ label: month.name, value: month.revenue, tone: "bg-gold" }))
  ];
  const chartMax = Math.max(...chartRows.map((row) => row.value), 1);

  return (
    <section className="rounded-xl border border-[#eadacc] bg-white shadow-panel dark:border-white/10 dark:bg-[#182638]">
      <div className="border-b border-gold/20 bg-[linear-gradient(135deg,#213343,#3f5a68)] px-8 py-6 text-white dark:border-white/10 dark:bg-[linear-gradient(135deg,#213343,#3f5a68)]">
        <h1 className="font-serif text-3xl">Revenue Forecast</h1>
        <p className="mt-2 text-sm text-white/70">
          Predict future revenue based on pipeline stage and historical conversion rates.
        </p>
      </div>

      <div className="space-y-6 px-8 py-8">
        {thisMonthActual.revenue < 100000 ? (
          <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            <span className="text-2xl">!</span>
            <p className="text-sm">
              <span className="font-semibold">Low Revenue Alert:</span> This month&apos;s revenue ({formatCurrency(thisMonthActual.revenue)}) is below target. Consider pushing leads through the pipeline.
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total Pipeline Value" value={formatCurrency(totalPipelineValue)} hint="Weighted expected value" />
          <MetricCard label="Collected to Date" value={formatCurrency(totalCollected)} hint="Already received" accent="text-emerald-600" />
          <MetricCard label="Outstanding" value={formatCurrency(totalOutstanding)} hint="Pending collection" accent="text-amber-600" />
          <MetricCard label="This Month" value={formatCurrency(thisMonthActual.revenue)} hint={`${growth >= 0 ? "+" : ""}${growth.toFixed(1)}% vs last month`} accent={growth >= 0 ? "text-emerald-600" : "text-rose-600"} />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="3-Month Revenue Forecast">
            <div className="space-y-4">
              {chartRows.map((row) => (
                <div key={row.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">{row.label}</span>
                    <span className="font-semibold text-ink dark:text-white">{formatCurrency(row.value)}</span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.08]">
                    <div className={`h-full rounded-full ${row.tone}`} style={{ width: `${(row.value / chartMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Scenario Modeling">
            <div className="space-y-4">
              {scenarios.map((scenario) => (
                <div key={scenario.key} className={`rounded-2xl border p-5 ${scenario.tone}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{scenario.name}</h3>
                      <p className="mt-1 text-sm opacity-80">{scenario.desc}</p>
                    </div>
                    <p className="text-2xl font-extrabold">{formatCurrency(totalPipelineValue * scenario.multiplier)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Pipeline by Stage">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {pipelineData.map((item) => (
                <div key={item.stage} className="rounded-2xl border border-[#eadacc] bg-[#fff6ef] p-4 text-center dark:border-white/10 dark:bg-white/[0.05]">
                  <p className="text-3xl font-extrabold text-ink dark:text-white">{item.count}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{item.label}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{formatCurrency(item.expected_value)}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Monthly Breakdown">
            <div className="overflow-x-auto rounded-2xl border border-[#eadacc] dark:border-white/10">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-[linear-gradient(135deg,#213343,#3f5a68)] text-left text-xs uppercase tracking-[0.08em] text-white">
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3">Est. Revenue</th>
                    <th className="px-4 py-3">Est. Enrollments</th>
                    <th className="px-4 py-3">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  <ForecastRow label="Last Month" revenue={lastMonthActual.revenue} enrollments={lastMonthActual.enrollments} trend="Actual" />
                  <ForecastRow label="This Month" revenue={thisMonthActual.revenue} enrollments={thisMonthActual.enrollments} trend="Actual" />
                  {months.map((month) => (
                    <ForecastRow key={month.name} label={month.name} revenue={month.revenue} enrollments={month.enrollments} trend="Forecast" shaded />
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <Panel title="Conversion Rates (Historical)">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {Object.entries(conversionRates).map(([key, rate]) => (
              <div key={key} className="rounded-2xl border border-[#eadacc] bg-[#fff6ef] p-4 dark:border-white/10 dark:bg-white/[0.05]">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                  {key.replaceAll("_to_", " -> ").replaceAll("_", " ")}
                </p>
                <p className="mt-3 text-3xl font-extrabold text-gold">{(rate * 100).toFixed(0)}%</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  hint,
  accent = "text-ink dark:text-white"
}: {
  label: string;
  value: string;
  hint: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-[#eadacc] bg-white p-5 dark:border-white/10 dark:bg-white/[0.05]">
      <p className="text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-extrabold ${accent}`}>{value}</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  );
}

function Panel({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#eadacc] bg-white p-6 dark:border-white/10 dark:bg-white/[0.05]">
      <h2 className="mb-5 font-serif text-2xl text-ink dark:text-white">{title}</h2>
      {children}
    </section>
  );
}

function ForecastRow({
  label,
  revenue,
  enrollments,
  trend,
  shaded = false
}: {
  label: string;
  revenue: number;
  enrollments: number;
  trend: string;
  shaded?: boolean;
}) {
  return (
    <tr className={`${shaded ? "bg-[#fff6ef] dark:bg-white/[0.03]" : ""} border-b border-[#f0dfd0] last:border-b-0 dark:border-white/10`}>
      <td className="px-4 py-3 text-sm font-medium text-ink dark:text-white">{label}</td>
      <td className="px-4 py-3 text-sm dark:text-slate-200">{formatCurrency(revenue)}</td>
      <td className="px-4 py-3 text-sm dark:text-slate-200">{enrollments}</td>
      <td className="px-4 py-3 text-sm">
        <span className={trend === "Forecast" ? "font-semibold text-gold" : "text-slate-500 dark:text-slate-400"}>{trend}</span>
      </td>
    </tr>
  );
}
