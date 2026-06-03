import Link from "next/link";

export default function Home() {
  const features = [
    {
      title: "Attendance Insights",
      description: "See your subject-wise percentage and prediction instantly so you always know where you stand.",
      icon: "../calendar.png",
      tone: "from-cyan-400/30 to-emerald-300/20",
    },
    {
      title: "Smart Planning",
      description: "Plan when to attend and when it is safe to skip without dropping below your minimum target.",
      icon: "../book.png",
      tone: "from-orange-400/30 to-amber-300/20",
    },
    {
      title: "Goal Tracking",
      description: "Set performance goals and track your momentum with a dashboard designed for daily use.",
      icon: "../gpa.png",
      tone: "from-violet-400/30 to-pink-300/20",
    },
  ];

  return (
    <main className="relative overflow-hidden px-4 pb-20 pt-10 md:px-8">
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

      <section className="mx-auto grid max-w-6xl items-center gap-10 rounded-3xl border border-white/8 bg-[#121a2b] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] md:grid-cols-2 md:p-10">
        <div>
          <p className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/8 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
            Student Workflow, Simplified
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Turn attendance into your competitive edge.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-slate-300 md:text-base">
            Stratos helps you track classes, predict safe skips, and keep your goals on target with clean real-time analytics.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-linear-to-br from-cyan-400 to-blue-500 px-6 py-3 text-sm font-black text-slate-950 transition hover:brightness-95"
            >
              Start Tracking
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Open Dashboard
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="relative rounded-3xl border border-white/8 bg-[#0f1728] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-300">Live Snapshot</p>
              <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-xs font-bold text-emerald-300">ON TRACK</span>
            </div>
            <p className="mt-5 text-5xl font-black text-white">84%</p>
            <p className="mt-1 text-sm text-slate-400">Overall attendance</p>
            <div className="mt-5 h-2 w-full rounded-full bg-slate-800">
              <div className="h-full w-[84%] rounded-full bg-linear-to-r from-cyan-400 to-emerald-400" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-white/8 bg-white/4 p-3">
                <p className="text-slate-400">Safe Subjects</p>
                <p className="mt-1 text-xl font-black text-emerald-300">5</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/4 p-3">
                <p className="text-slate-400">Need Focus</p>
                <p className="mt-1 text-xl font-black text-amber-300">2</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-black tracking-tight md:text-4xl">What you get</h2>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Built for daily consistency</p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-white/8 bg-[#121a2b] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/25"
            >
              <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-linear-to-br ${feature.tone} opacity-70 blur-2xl`} />
              <img
                src={feature.icon}
                width={52}
                height={52}
                alt={feature.title}
                className="rounded-xl border border-white/8 bg-slate-800 p-2"
              />
              <h3 className="mt-4 text-xl font-extrabold">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl rounded-3xl border border-white/8 bg-[#121a2b] p-6 md:p-10">
        <div className="grid items-center gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black leading-tight md:text-5xl">Ready to stay ahead every week?</h2>
            <p className="mt-3 text-sm text-slate-300 md:text-base">
              Join Stratos and make attendance planning fast, clear, and stress-free.
            </p>
          </div>
          <div className="flex flex-wrap justify-start gap-3 md:justify-end">
            <Link href="/login" className="rounded-xl bg-linear-to-br from-cyan-400 to-blue-500 px-6 py-3 text-sm font-black text-slate-950">
              Continue with Sign In
            </Link>
            <Link href="/dashboard" className="rounded-xl border border-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">
              Dashboard Preview
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}


