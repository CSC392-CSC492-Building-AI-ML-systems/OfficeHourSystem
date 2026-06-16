import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <section className="w-full max-w-3xl rounded-[36px] border border-slate-200/80 bg-white px-8 py-10 shadow-[0_30px_80px_-40px_rgba(7,31,65,0.45)] sm:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#c8102e]">
          OHMS Development
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#071f41]">
          Frontend dashboard entry points
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Use these routes to review the current student and instructor
          dashboard implementations with mock data.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Link
            href="/student"
            className="rounded-[28px] border border-slate-200 bg-[#f8fafc] px-6 py-6 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Student
            </p>
            <p className="mt-3 text-2xl font-semibold text-[#071f41]">
              Student Dashboard
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Review the triple-stream student support layout.
            </p>
          </Link>

          <Link
            href="/instructor"
            className="rounded-[28px] border border-slate-200 bg-[#f8fafc] px-6 py-6 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Instructor
            </p>
            <p className="mt-3 text-2xl font-semibold text-[#071f41]">
              Command Center
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Manage teaching assistants for this course instance.
            </p>
          </Link>

          <Link
            href="/instructor/schedule"
            className="rounded-[28px] border border-slate-200 bg-[#f8fafc] px-6 py-6 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Schedule
            </p>
            <p className="mt-3 text-2xl font-semibold text-[#071f41]">
              Master Schedule
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Review the weekly calendar, session overrides, and recurring rules
              UI.
            </p>
          </Link>

          <Link
            href="/instructor/my-queues"
            className="rounded-[28px] border border-slate-200 bg-[#f8fafc] px-6 py-6 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Queues
            </p>
            <p className="mt-3 text-2xl font-semibold text-[#071f41]">
              My Queues
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Review upcoming queue sessions and open the active workspace.
            </p>
          </Link>

          <Link
            href="/instructor/my-queues/active"
            className="rounded-[28px] border border-slate-200 bg-[#f8fafc] px-6 py-6 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Workspace
            </p>
            <p className="mt-3 text-2xl font-semibold text-[#071f41]">
              Active Queue
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Open the live queue workspace directly for local UI testing.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
