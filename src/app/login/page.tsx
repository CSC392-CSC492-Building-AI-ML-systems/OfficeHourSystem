import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Shield,
  UserRound,
} from "lucide-react";

const ROLES = [
  {
    href: "/api/auth/session?redirect=/student",
    eyebrow: "Students",
    title: "Student",
    description:
      "Open your course list, upcoming office hours, and live queue status.",
    icon: GraduationCap,
  },
  {
    href: "/api/auth/session?redirect=/admin",
    eyebrow: "Teaching staff",
    title: "Instructor",
    description:
      "Open course administration to manage offerings, staff, schedules, and queues.",
    icon: UserRound,
  },
  {
    href: "/api/auth/session?redirect=/admin",
    eyebrow: "Course administration",
    title: "Admin",
    description:
      "Manage course offerings, instructors, and classlists from the admin portal.",
    icon: Shield,
  },
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[#071f41] underline-offset-4 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <section className="mt-10 rounded-[36px] border border-slate-200/80 bg-white px-8 py-10 shadow-[0_30px_80px_-40px_rgba(7,31,65,0.45)] sm:px-12">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#c8102e]">
            HourSpace
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#071f41] sm:text-4xl">
            Choose how you want to sign in
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Select a role to continue. Campus Shibboleth sign-in will be wired
            here next; for now this routes you into the matching workspace.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <Link
                  key={role.title}
                  href={role.href}
                  className="group flex flex-col rounded-[28px] border border-slate-200 bg-[#f8fafc] px-6 py-6 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#071f41]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {role.eyebrow}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[#071f41]">
                    {role.title}
                  </p>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                    {role.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#071f41]">
                    Continue
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
