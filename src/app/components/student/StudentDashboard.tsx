import Link from "next/link";
import { Bug, CalendarDays, Users } from "lucide-react";
import { Navbar } from "./Navbar";
import { DropInCard } from "./cards/DropInCard";
import { FeatureBanner } from "./cards/FeatureBanner";
import { GroupTopicCard } from "./cards/GroupTopicCard";
import { QueueCard } from "./cards/QueueCard";
import type { StudentDashboardSessionDto } from "@/services/student_dashboard/student-dashboard";

const columnBaseClass =
  "rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)]";

function formatTime(startsAt: string, endsAt: string) {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  return `${new Date(startsAt).toLocaleTimeString("en-US", opts)} – ${new Date(endsAt).toLocaleTimeString("en-US", opts)}`;
}

type Props = {
  firstName: string;
  sessions: StudentDashboardSessionDto[];
};

export default function StudentDashboard({ firstName, sessions }: Props) {
  const dropIn = sessions.filter((s) => s.type === "REGULAR");
  const debugging = sessions.filter((s) => s.type === "DEBUGGING");
  const group = sessions.filter((s) => s.type === "GROUP");

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar />

        <Link
          href="/student"
          className="mt-6 inline-block text-sm font-semibold text-[#071f41] underline-offset-4 hover:underline"
        >
          Back to my courses
        </Link>

        <main className="mt-6 space-y-8">
          <section className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#071f41] sm:text-[2.1rem]">
              Welcome back, {firstName}!
            </h1>
            <p className="text-base text-slate-600">
              Today&apos;s office hours across your enrolled courses.
            </p>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className={columnBaseClass}>
              <div className="mb-5 flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#1e4fa1]">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-[#071f41]">
                    Drop-In Office Hours
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Open-door sessions for quick questions and conceptual
                    clarification.
                  </p>
                </div>
              </div>
              {dropIn.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">
                  No drop-in sessions today.
                </p>
              ) : (
                <div className="space-y-4">
                  {dropIn.map((s) => (
                    <DropInCard
                      key={s.sessionPublicId}
                      sessionPublicId={s.sessionPublicId}
                      title={s.title}
                      time={formatTime(s.startsAt, s.endsAt)}
                      location={s.location}
                      courseCode={s.courseCode}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className={`${columnBaseClass} border-l-4 border-l-[#c8102e]`}>
              <div className="mb-5 flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fdecef] text-[#c8102e]">
                  <Bug className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-[#071f41]">
                    Debugging Queue
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Join a TA queue for deeper 1:1 support on blockers and code
                    issues.
                  </p>
                </div>
              </div>
              {debugging.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">
                  No debugging queues today.
                </p>
              ) : (
                <div className="space-y-4">
                  {debugging.map((s) => (
                    <QueueCard
                      key={s.sessionPublicId}
                      sessionPublicId={s.sessionPublicId}
                      title={s.title}
                      location={s.location}
                      courseCode={s.courseCode}
                      isOnline={
                        s.location.toLowerCase().includes("online") ||
                        s.location.toLowerCase().includes("zoom")
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            <div className={columnBaseClass}>
              <div className="mb-5 flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf7ff] text-[#0f5f8f]">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-[#071f41]">
                    Group Topic Sessions
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Small-group workshops focused on core programming concepts.
                  </p>
                </div>
              </div>
              {group.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">
                  No group sessions today.
                </p>
              ) : (
                <div className="space-y-4">
                  {group.map((s) => (
                    <GroupTopicCard
                      key={s.sessionPublicId}
                      topic={s.title}
                      timeString={formatTime(s.startsAt, s.endsAt)}
                      courseCode={s.courseCode}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <FeatureBanner
            title="Enhance Your Learning Experience"
            description="Our Triple-Stream system ensures you get the right support at the right time. From quick questions to deep technical debugging."
            buttonText="How it works"
          />
        </main>
      </div>
    </div>
  );
}
