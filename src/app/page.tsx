import Link from "next/link";
import {
  ArrowRight,
  Bug,
  CalendarRange,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { HomeHeroCards } from "@/app/components/home/HomeHeroCards";
import { QueuePreviewHeader } from "@/app/components/student/QueuePreviewHeader";
import { SessionRow } from "@/app/components/student/cards/SessionRow";
import { getHomeHeroStatsService } from "@/services/home_stats/home-stats";

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  // { label: "Interest", href: "#mark-interest" },
  // { label: "Sessions", href: "#session-types" },
  { label: "Queue", href: "#debugging-queue" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Sign in with your UTORid",
    body: "Use the Login button to open HourSpace with your campus account.",
  },
  {
    step: "02",
    title: "Open your course dashboard",
    body: "See your enrolled courses and the upcoming office hours for the week including time, location, and session type.",
  },
  {
    step: "03",
    title: "Mark that you are interested",
    body: "Tap I'm interested on a session you plan to attend.",
  },
];

const OH_TYPES = [
  {
    title: "Professor Office Hours",
    description:
      "Regular open ended office hours for any questions or concerns.",
    icon: CalendarRange,
  },
  {
    title: "Help Centre",
    description:
      "Get clarity on any debugging issues or questions with course TAs.",
    icon: Bug,
  },
  {
    title: "Custom",
    description:
      "Create your own sessions and work together with other students. Good for study groups or review sessions.",
    icon: Users,
  },
];

const INTEREST_POINTS = [
  {
    title: "Find a session on your dashboard",
    body: "Each upcoming office hour shows the course, title, time range, and location so you can plan your week.",
  },
  {
    title: "Tap “I'm interested”",
    body: "One click records that you plan to attend. The button updates to Already interested so you know it was saved.",
  },
  {
    title: "Change your response anytime",
    body: "Tap Already interested if you no longer plan to attend.",
  },
];

const DEBUGGING_STEPS = [
  {
    step: "01",
    title: "Arrive to the session",
    body: "Come to the session with your T Card ready. You can use it to check in.",
  },
  {
    step: "02",
    title: "Scan your T-Card to join",
    body: "Scan your T-Card and you'll be placed into the queue.",
  },
  {
    step: "03",
    title: "Watch My Queue",
    body: "Open My Queue from the student page to track your position and see your estimated wait time.",
  },
];

export default async function Home() {
  const heroStats = await getHomeHeroStatsService();

  return (
    <main className="min-h-screen bg-[#f0ebe3] text-slate-900">
      <nav
        aria-label="Page sections"
        className="fixed top-4 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-1 rounded-full border-2 border-[#c8102e] bg-white px-2 py-2 shadow-[0_12px_40px_-12px_rgba(7,31,65,0.35)] backdrop-blur-md sm:gap-2 sm:px-3"
      >
        <a
          href="#top"
          className="shrink-0 rounded-full px-3 py-2 text-sm font-black tracking-[0.08em] text-[#071f41] transition hover:bg-slate-100"
        >
          HourSpace
        </a>
        <div
          className="mx-0.5 hidden h-5 w-px bg-[#071f41]/15 sm:block"
          aria-hidden
        />
        <div className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-full px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-[#c8102e] hover:text-white sm:px-3 sm:text-sm"
            >
              {link.label}
            </a>
          ))}
        </div>
        <Link
          href="/course"
          className="shrink-0 rounded-full bg-[#c8102e] px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#a50d25] sm:px-4 sm:text-sm"
        >
          Login
        </Link>
      </nav>

      <section
        id="top"
        className="relative overflow-hidden bg-[#071f41] text-white"
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-12deg, transparent, transparent 48px, rgba(255,255,255,0.03) 48px, rgba(255,255,255,0.03) 49px)",
          }}
        />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-6 pb-8 pt-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-10 lg:pb-16 lg:pt-28">
          <div className="flex flex-col justify-center pb-12 lg:pb-20">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-[#c8102e] px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
              University of Toronto
            </p>
            <h1 className="mt-8 text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              OFFICE
              <br />
              HOUR
              <br />
              <span className="text-[#f8b4bf]">SYSTEM</span>
            </h1>
            <p className="mt-8 max-w-md text-lg leading-8 text-slate-300">
              Track your office hours, with live queues and student “I’m
              interested” presses. Prevent students from crowding teaching staff
              with a digital queue.
            </p>
            <Link
              href="/course"
              className="mt-10 inline-flex w-fit items-center gap-3 bg-white px-7 py-4 text-sm font-bold uppercase tracking-wider text-[#071f41] transition hover:bg-[#eaf1ff]"
            >
              Login
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <HomeHeroCards stats={heroStats} />
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-20 lg:px-10"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-4xl font-black tracking-tight text-[#071f41] sm:text-5xl">
            How it works
          </h2>
          <p className="max-w-sm text-base text-slate-600"></p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <article
              key={item.step}
              className="group relative overflow-hidden rounded-[28px] bg-white p-6 shadow-[0_20px_50px_-30px_rgba(7,31,65,0.25)]"
            >
              <p className="text-6xl font-black leading-none text-[#f0ebe3] transition group-hover:text-[#fdecef]">
                {item.step}
              </p>
              <h3 className="mt-4 text-lg font-bold text-[#071f41]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="mark-interest"
        className="scroll-mt-24 bg-[#c8102e] py-20 text-white"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">
              Marking interest
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Tell staff
              <br />
              you&apos;re coming
            </h2>
            <ul className="mt-6 space-y-4">
              {INTEREST_POINTS.map((point) => (
                <li key={point.title} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-white" />
                  <div>
                    <p className="font-semibold text-white">{point.title}</p>
                    <p className="mt-0.5 text-sm text-white/80">{point.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="h-fit self-center rounded-[32px] bg-white p-5 text-slate-900 shadow-2xl">
            <SessionRow
              sessionId={0}
              type="REGULAR"
              courseLabel="CSC108 · 20265"
              title="Morning Professor Office Hours"
              time="2:00 – 3:00 PM"
              location="DH 2014"
              demo
            />
          </div>
        </div>
      </section>

      <section
        id="session-types"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-20 lg:px-10"
      >
        <h2 className="text-4xl font-black tracking-tight text-[#071f41]">
          Session types
        </h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {OH_TYPES.map((type, i) => {
            const Icon = type.icon;
            const tall = i === 1;
            return (
              <article
                key={type.title}
                className={`flex flex-col rounded-[28px] p-7 ${
                  tall
                    ? "bg-[#071f41] text-white md:row-span-1"
                    : "bg-white shadow-[0_20px_50px_-30px_rgba(7,31,65,0.2)]"
                }`}
              >
                <Icon
                  className={`h-8 w-8 ${tall ? "text-[#f8b4bf]" : "text-[#c8102e]"}`}
                />
                <h3
                  className={`mt-6 text-2xl font-bold ${tall ? "text-white" : "text-[#071f41]"}`}
                >
                  {type.title}
                </h3>
                <p
                  className={`mt-3 flex-1 text-sm leading-6 ${tall ? "text-slate-300" : "text-slate-600"}`}
                >
                  {type.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="debugging-queue"
        className="scroll-mt-24 border-y border-[#071f41]/10 bg-white py-20"
      >
        <div className="mx-auto w-full max-w-6xl px-6 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#c8102e]">
                The Queue
              </p>
              <h2 className="mt-4 text-4xl font-black leading-tight text-[#071f41]">
                Help Centre Explained
              </h2>
              <p className="mt-6 text-base leading-7 text-slate-600">
                Scan your T-Card on site, then track position and wait time in
                My Queue.
              </p>

              <ol className="mt-10 space-y-6">
                {DEBUGGING_STEPS.map((item) => (
                  <li key={item.step} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fdecef] text-xs font-bold text-[#c8102e]">
                      {item.step}
                    </span>
                    <div>
                      <h3 className="font-bold text-[#071f41]">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-[32px] bg-[#f4f7fb] p-6 sm:p-8">
              <QueuePreviewHeader />

              <div className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_-24px_rgba(15,41,66,0.3)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#c8102e]">
                      CSC108 · 20265
                    </p>
                    <h3 className="text-lg font-semibold text-[#071f41]">
                      Help Centre
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        DH 2014
                      </span>
                      <span>Aug 11 · 2:00 PM–3:00 PM</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="flex items-center gap-1.5 text-2xl font-black text-[#071f41]">
                      <Users className="h-5 w-5 text-slate-400" />
                      #3
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf1ff] px-3 py-1 text-xs font-semibold text-[#1e4fa1]">
                      <Clock className="h-3 w-3" />
                      ~20 min ±5 min
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                  <span>Checked in at 2:08 PM</span>
                  <span>Waited 12 min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
