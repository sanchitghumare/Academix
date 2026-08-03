import Link from "next/link";
import {getServerSession} from "next-auth/next";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";
import {redirect} from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect(`/${session.user.name}`);
  }

  const cards = [
    {
      icon: "📅",
      title: "Attendance",
      description: "Know exactly how many classes you can miss.",
    },
    {
      icon: "📚",
      title: "Resources",
      description: "Organize notes, PYQs, and study material.",
    },
    {
      icon: "📊",
      title: "GPA",
      description: "Track semester performance without maintaining Excel sheets.",
      
    },
    {
      icon: "⏰",
      title: "Planner",
      description: "Know today's timetable and upcoming lectures.",
     
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] font-sans text-[#FAFAFA] selection:bg-zinc-800 selection:text-white">
      {/* 1. Navbar */}
        <nav className="mx-auto flex max-w-5xl items-center justify-between border-b border-[#27272A]/50 px-6 py-6">
          <span className="text-lg font-bold tracking-tight">Academix</span>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/login"
              className="text-[#A1A1AA] transition-colors hover:text-[#FAFAFA]"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="mx-auto max-w-3xl px-6 pb-16 pt-24 text-center">
        <h1 className="text-5xl font-bold leading-tight tracking-tight text-[#FAFAFA] sm:text-6xl">
          Academic Command Center <br />
          <span className="text-[#A1A1AA]">for College Students.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#A1A1AA] sm:text-lg">
          Attendance. GPA. Resources. Timetable. <br />
          Everything you need to manage your semester, in one place.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-[#FAFAFA] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Get Started
          </Link>
          
        </div>

        <p className="mt-14 text-xs font-medium tracking-wide text-[#A1A1AA]">
          Built for students, not spreadsheets.
        </p>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-5xl px-6">
        <hr className="border-[#27272A]" />
      </div>

      {/* 3. Everything in one place */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-2xl font-bold tracking-tight text-[#FAFAFA]">
          Everything in one place.
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <div
              key={card.title}
              className="group flex flex-col justify-between rounded-xl border border-[#27272A] bg-[#111113] p-6 transition-all hover:-translate-y-1 hover:border-zinc-600"
            >
              <div>
                <span className="text-2xl" role="img" aria-label={card.title}>
                  {card.icon}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-[#FAFAFA]">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-5xl px-6">
        <hr className="border-[#27272A]" />
      </div>

      

      {/* Divider */}
      <div className="mx-auto max-w-5xl px-6">
        <hr className="border-[#27272A]" />
      </div>

      {/* 5. Footer CTA */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-[#FAFAFA]">
          Ready to organize your semester?
        </h2>
        <p className="mt-3 text-sm text-[#A1A1AA]">
          Start using Academix today.
        </p>

        <div className="mt-8">
          <Link
            href="/login"
            className="inline-block rounded-lg bg-[#FAFAFA] px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}
