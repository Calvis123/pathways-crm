export function PageLoading({
  title = "Opening CRM",
  description = "Loading your Barak Pathways CRM data and preparing the next view."
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="min-h-[70vh]">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/90 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(255,122,89,0.16),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(247,243,234,0.96))] p-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ff7a59,#e09a54)] shadow-[0_18px_30px_rgba(255,122,89,0.22)]">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/35 border-t-white" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold">Barak CRM</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">{description}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-8 lg:grid-cols-[1.45fr_0.9fr]">
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#fffdf8_0%,#fff6eb_100%)] p-5"
                >
                  <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
                  <div className="mt-4 h-8 w-20 animate-pulse rounded-xl bg-slate-200" />
                  <div className="mt-3 h-3 w-28 animate-pulse rounded-full bg-slate-100" />
                </div>
              ))}
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
              <div className="h-5 w-48 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-6 space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
                      <div className="h-7 w-20 animate-pulse rounded-full bg-amber-100" />
                    </div>
                    <div className="mt-3 h-3 w-56 animate-pulse rounded-full bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[1.5rem] border border-slate-200 bg-[#0f172a] p-6 text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)]">
              <div className="h-4 w-28 animate-pulse rounded-full bg-white/15" />
              <div className="mt-5 h-8 w-32 animate-pulse rounded-xl bg-white/10" />
              <div className="mt-4 h-3 w-44 animate-pulse rounded-full bg-white/10" />
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
              <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-5 space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
