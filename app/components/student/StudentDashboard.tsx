import { Bug, CalendarDays, Users } from "lucide-react";
import { Navbar } from "./Navbar";
import { DropInCard } from "./cards/DropInCard";
import { FeatureBanner } from "./cards/FeatureBanner";
import { GroupTopicCard } from "./cards/GroupTopicCard";
import { QueueCard } from "./cards/QueueCard";

interface DropInSession {
  title: string;
  time: string;
  location?: string;
  taName: string;
}

interface DebuggingSession {
  taName: string;
  location: string;
  isOnline?: boolean;
}

interface GroupTopicSession {
  topic: string;
  time: string;
}

const dropInSessions: DropInSession[] = [
  {
    title: "Morning Session",
    time: "10:00 AM - 12:00 PM",
    location: "BA 3110 (In-Person)",
    taName: "Sarah Chen",
  },
  {
    title: "Evening Session",
    time: "Online (Zoom Link)",
    taName: "James Miller",
  },
];

const debuggingSessions: DebuggingSession[] = [
  {
    taName: "David Wu",
    location: "BA 3110 (In-Person)",
  },
  {
    taName: "Sarah Chen",
    location: "Online (Zoom Link)",
    isOnline: true,
  },
];

const groupTopics: GroupTopicSession[] = [
  {
    topic: "Linked Lists Deep-Dive",
    time: "Today, 2:00 PM",
  },
  {
    topic: "Recursion Workshop",
    time: "Today, 3:30 PM",
  },
  {
    topic: "Big O Notation",
    time: "Tomorrow, 11:00 AM",
  },
];

const columnBaseClass =
  "rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)]";

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar />

        <main className="mt-10 space-y-8">
          <section className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#071f41] sm:text-[2.1rem]">
              Welcome back, Alex!
            </h1>
            <p className="text-base text-slate-600">
              CSC108: Introduction to Computer Programming.
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

              <div className="space-y-4">
                {dropInSessions.map((session) => (
                  <DropInCard key={session.title} {...session} />
                ))}
              </div>
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

              <div className="space-y-4">
                {debuggingSessions.map((session) => (
                  <QueueCard
                    key={`${session.taName}-${session.location}`}
                    {...session}
                  />
                ))}
              </div>
            </div>

            <div className={columnBaseClass}>
              <div className="mb-5 flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf7ff] text-[#0f5f8f]">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-[#071f41]">
                    Group Topic sessions
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Small-group workshops focused on core programming concepts.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {groupTopics.map((session) => (
                  <GroupTopicCard
                    key={`${session.topic}-${session.time}`}
                    topic={session.topic}
                    timeString={session.time}
                  />
                ))}
              </div>
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
