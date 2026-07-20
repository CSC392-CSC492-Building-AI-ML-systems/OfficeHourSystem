import Link from "next/link";
import {
  ArrowRight,
  Bug,
  CalendarRange,
  Clock3,
  CreditCard,
  HandHeart,
  ListOrdered,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Sign in with your UTORid",
    body: "Use the Login button to open OHMS with your campus account. Pick Student, Instructor, or Admin based on how you use the system.",
  },
  {
    step: "02",
    title: "Open your course dashboard",
    body: "Students see enrolled courses and upcoming office hours for the week — including time, location, and session type.",
  },
  {
    step: "03",
    title: "Mark that you are interested",
    body: "Tap I'm interested on a session you plan to attend. That tells staff you are coming and helps them collect statistics for future planning.",
  },
  {
    step: "04",
    title: "Join the debugging queue",
    body: "When a Debugging Queue is live, scan your T-Card to check in, then open My Queue to watch your place in line until a TA or instructor helps you.",
  },
];

const OH_TYPES = [
  {
    label: "Drop-In",
    title: "Drop-in office hours",
    description: "Open office hours for quick questions and concept checks.",
    icon: CalendarRange,
  },
  {
    label: "Debugging",
    title: "Debugging Queue",
    description: "One-on-one support for deeper assignment and code blockers.",
    icon: Bug,
  },
  {
    label: "Group",
    title: "Topic Group",
    description: "Small-group sessions focused on a specific topic or review.",
    icon: Users,
  },
];

const INTEREST_POINTS = [
  {
    title: "Find a session on your dashboard",
    body: "Each upcoming office hour shows the course, title, time range, and location so you can plan your week.",
    icon: Clock3,
  },
  {
    title: "Tap “I'm interested”",
    body: "One click records that you plan to attend. The button updates to Already interested so you know it was saved.",
    icon: HandHeart,
  },
  {
    title: "Help staff prepare",
    body: "Interest counts help instructors and TAs see how busy a session may be.",
    icon: Users,
  },
];

const DEBUGGING_STEPS = [
  {
    step: "01",
    title: "Arrive when the queue is active",
    body: "Debugging Queue sessions are for deeper, one-on-one help. When staff open the session, check-in starts at the office hour location.",
    icon: Bug,
  },
  {
    step: "02",
    title: "Scan your T-Card to join",
    body: "A TA or instructor scans your T-Card. That creates your ticket in the live queue — you do not join from the student page alone.",
    icon: CreditCard,
  },
  {
    step: "03",
    title: "Watch My Queue",
    body: "Open My Queue from the student page to see your position (#), estimated wait, and when you move to Being helped. Status refreshes automatically.",
    icon: ListOrdered,
  },
];

const STUDENT_FEATURES = [
  {
    title: "Course list & weekly schedule",
    body: "See every course you are enrolled in, then open a dashboard of upcoming office hours for the next week.",
  },
  {
    title: "Mark interest before you go",
    body: "Signal which sessions you plan to attend so teaching staff know who is coming.",
  },
  {
    title: "My Queue across courses",
    body: "When a debugging queue is live, check your position from one place — even if you are waiting in more than one course.",
  },
  {
    title: "Clear session details",
    body: "Time, location, and session type (Drop-In, Debugging, or Group) are shown up front before you commit.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-[linear-gradient(165deg,#071f41_0%,#0f2942_42%,#1a3a5c_100%)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 20%, rgba(200,16,46,0.35), transparent 42%), radial-gradient(circle at 88% 10%, rgba(234,241,255,0.12), transparent 35%)",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between py-2">
            <p className="text-2xl font-black tracking-[0.22em] text-white">
              OHMS
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#071f41] transition hover:bg-[#eaf1ff]"
            >
              Login
              <ArrowRight className="h-4 w-4" />
            </Link>
          </header>

          <div className="flex min-h-[70vh] flex-col justify-center py-16 sm:py-24">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#f8b4bf]">
              University of Toronto
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Office Hour Management System
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
              Find drop-in hours, mark interest in upcoming sessions, join
              debugging queues, and get help faster — built for students, TAs,
              and instructors.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-[#c8102e] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(200,16,46,0.8)] transition hover:bg-[#a50d25]"
              >
                Login to continue
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="text-sm font-semibold text-slate-200 underline-offset-4 transition hover:text-white hover:underline"
              >
                How it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#c8102e]">
          How it works
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#071f41] sm:text-4xl">
          From sign-in to getting help
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          OHMS keeps office hours organized so you spend less time waiting and
          more time learning.
        </p>

        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item) => (
            <li key={item.step} className="relative">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                {item.step}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-[#071f41]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Mark interest — featured */}
      <section
        id="mark-interest"
        className="border-y border-slate-200/80 bg-white"
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#c8102e]">
            Marking interest
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#071f41] sm:text-4xl">
            Tell staff you plan to attend
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            On your student dashboard, every upcoming session has an{" "}
            <span className="font-semibold text-[#071f41]">
              I&apos;m interested
            </span>{" "}
            button. Use it when you intend to show up — it is the simplest way
            to let instructors and TAs know you are coming.
          </p>

          <div className="mt-10 overflow-hidden rounded-[32px] border border-slate-200/80 bg-[#f8fafc]">
            <div className="flex flex-col gap-6 border-b border-slate-200/80 bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1e4fa1]">
                  Drop-In
                </p>
                <p className="mt-1 text-lg font-semibold text-[#071f41]">
                  Example session on your dashboard
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    2:00 PM – 3:00 PM
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    DH 2014
                  </span>
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-[#071f41]">
                I&apos;m interested
              </span>
            </div>

            <div className="grid gap-8 px-6 py-8 sm:grid-cols-3 sm:px-8">
              {INTEREST_POINTS.map((point) => {
                const Icon = point.icon;
                return (
                  <div key={point.title}>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#071f41]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-[#071f41]">
                      {point.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {point.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="mt-6 max-w-3xl text-sm leading-6 text-slate-500">
            After you mark interest, the button shows{" "}
            <span className="font-medium text-[#071f41]">
              Already interested
            </span>
            . Marking interest is not a formal appointment — it is a signal that
            you plan to attend so staff can prepare. For live debugging queues,
            you still join the queue when the session is active.
          </p>
        </div>
      </section>

      {/* OH types */}
      <section className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#c8102e]">
          Office hour types
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#071f41] sm:text-4xl">
          Pick the session that fits your question
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Courses may offer one or more of these formats. You can mark interest
          on any upcoming session from your student dashboard.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {OH_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <article
                key={type.label}
                className="rounded-[28px] border border-slate-200/80 bg-white px-6 py-7 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.2)]"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#071f41]">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {type.label}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[#071f41]">
                  {type.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {type.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Debugging queue — student side */}
      <section
        id="debugging-queue"
        className="border-y border-slate-200/80 bg-white"
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#c8102e]">
            Debugging Queue
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#071f41] sm:text-4xl">
            How the live queue works for students
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Debugging Queue sessions are for deeper, one-on-one help with
            assignments and code. From the student side, you check in on site,
            then track your place in line in{" "}
            <span className="font-semibold text-[#071f41]">My Queue</span>.
          </p>

          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {DEBUGGING_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.step}>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fdecef] text-[#c8102e]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {item.step}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[#071f41]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.body}
                  </p>
                </li>
              );
            })}
          </ol>

          <div className="mt-12 overflow-hidden rounded-[32px] border border-slate-200/80 bg-[#f8fafc] shadow-[0_18px_50px_-30px_rgba(15,41,66,0.25)]">
            <div className="flex flex-col gap-2 border-b border-slate-100 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div>
                <p className="text-sm font-semibold text-[#071f41]">
                  My Queue — example ticket
                </p>
                <p className="text-xs text-slate-500">
                  What you see after checking in at a live Debugging Queue
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <RefreshCw className="h-3.5 w-3.5" />
                Updates automatically
              </span>
            </div>

            <div className="px-6 py-6 sm:px-8">
              <div className="rounded-[24px] border border-slate-200/80 bg-white p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#c8102e]">
                      CSC108
                    </p>
                    <h3 className="text-lg font-semibold text-[#071f41]">
                      Debugging Queue
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        DH 2014
                      </span>
                      <span>Today · 2:00 PM–4:00 PM</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    <span className="flex items-center gap-1.5 text-2xl font-black text-[#071f41]">
                      <Users className="h-5 w-5 text-slate-400" />
                      #3
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf1ff] px-3 py-1 text-xs font-semibold text-[#1e4fa1]">
                      <Clock3 className="h-3 w-3" />
                      ~20 min
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-3 text-xs text-slate-400">
                  <span>Checked in at 2:12 PM</span>
                  <span>Waited 8 min so far</span>
                </div>
              </div>

              <ul className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                <li className="rounded-2xl bg-white px-4 py-3">
                  <span className="font-semibold text-[#071f41]">Your #</span>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Position in line. When you are first, My Queue can show
                    You&apos;re next!
                  </p>
                </li>
                <li className="rounded-2xl bg-white px-4 py-3">
                  <span className="font-semibold text-[#071f41]">
                    Estimated wait
                  </span>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    A rough wait time based on people ahead of you in the queue.
                  </p>
                </li>
                <li className="rounded-2xl bg-white px-4 py-3">
                  <span className="font-semibold text-[#071f41]">
                    Being helped
                  </span>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    When a TA or instructor starts helping you, your ticket
                    switches to Being helped.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Student features */}
      <section className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#c8102e]">
          For students
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#071f41] sm:text-4xl">
          What you can do in OHMS
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Everything below is available after you sign in as a student.
        </p>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {STUDENT_FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="rounded-[28px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.2)]"
            >
              <h3 className="text-lg font-semibold text-[#071f41]">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {feature.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-slate-200/80 bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="rounded-[36px] border border-slate-200/80 bg-[#071f41] px-8 py-12 text-center shadow-[0_30px_80px_-40px_rgba(7,31,65,0.45)] sm:px-12">
            <ListOrdered className="mx-auto h-8 w-8 text-[#f8b4bf]" />
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">
              Ready to mark interest and join a debugging queue?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-slate-300">
              Sign in to see your courses, tap I&apos;m interested on sessions
              you plan to attend, then track live Debugging Queue tickets in My
              Queue.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#071f41] transition hover:bg-[#eaf1ff]"
            >
              Login
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
