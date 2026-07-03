import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <section className="w-full max-w-3xl rounded-[36px] border border-slate-200/80 bg-white px-8 py-10 shadow-[0_30px_80px_-40px_rgba(7,31,65,0.45)] sm:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#c8102e]">
          OHMS
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#071f41]">
          Office Hour Management System
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Sign in to continue. Instructors open the admin portal or course
          statistics; students open their student page.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Link
            href="/api/auth/session?redirect=/admin"
            className="rounded-[28px] border border-slate-200 bg-[#f8fafc] px-6 py-6 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Instructors
            </p>
            <p className="mt-3 text-2xl font-semibold text-[#071f41]">
              Course administration
            </p>
          </Link>

          <Link
            href="/api/auth/session?redirect=/instructor/course-stats/overview"
            className="rounded-[28px] border border-slate-200 bg-[#f8fafc] px-6 py-6 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Instructors
            </p>
            <p className="mt-3 text-2xl font-semibold text-[#071f41]">
              Course stats
            </p>
          </Link>

          <Link
            href="/api/auth/session?redirect=/student"
            className="rounded-[28px] border border-slate-200 bg-[#f8fafc] px-6 py-6 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Students
            </p>
            <p className="mt-3 text-2xl font-semibold text-[#071f41]">
              Student page
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
