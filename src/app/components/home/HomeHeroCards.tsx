import Link from "next/link";
import { CalendarRange, Heart, Users } from "lucide-react";

import type { HomeHeroStats } from "@/lib/queries/home_stats/home-stats";

type Card = {
  label: string;
  value: string;
  detail: string;
  href?: string;
  icon: typeof CalendarRange;
  color: string;
};

function cardsForStats(stats: HomeHeroStats): Card[] {
  if (stats.kind === "student") {
    return [
      {
        label: "Upcoming Sessions",
        value: String(stats.upcomingSessions),
        detail: "Next 14 days",
        href: "/course",
        icon: CalendarRange,
        color: "bg-[#c8102e] text-white",
      },
      {
        label: "Interested Sessions",
        value: String(stats.interestedSessions),
        detail: "My interested office hours",
        href: "/course/my-interested-office-hours",
        icon: Heart,
        color: "bg-white/10 text-white backdrop-blur-sm",
      },
      {
        label: "My Queue",
        value: String(stats.waitingQueues),
        detail: "Active queues waiting",
        href: "/course/my-queue",
        icon: Users,
        color: "bg-[#1e4fa1] text-white",
      },
    ];
  }

  if (stats.kind === "staff") {
    return [
      {
        label: "Upcoming Hosted Sessions",
        value: String(stats.upcomingHostedSessions),
        detail: "Next 14 days",
        icon: CalendarRange,
        color: "bg-[#c8102e] text-white",
      },
      {
        label: "Interest Presses",
        value: String(stats.interestPresses),
        detail: "Across upcoming hosted sessions",
        icon: Heart,
        color: "bg-white/10 text-white backdrop-blur-sm",
      },
      {
        label: "Students Waiting",
        value: String(stats.studentsWaiting),
        detail: "In active hosted queues",
        icon: Users,
        color: "bg-[#1e4fa1] text-white",
      },
    ];
  }

  const detail =
    stats.kind === "unavailable" ? "Unavailable" : "Profile unavailable";
  return [
    {
      label: "Upcoming Sessions",
      value: "—",
      detail,
      icon: CalendarRange,
      color: "bg-[#c8102e] text-white",
    },
    {
      label: "Interested Sessions",
      value: "—",
      detail,
      icon: Heart,
      color: "bg-white/10 text-white backdrop-blur-sm",
    },
    {
      label: "My Queue",
      value: "—",
      detail,
      icon: Users,
      color: "bg-[#1e4fa1] text-white",
    },
  ];
}

function CardContent({ card }: { card: Card }) {
  const Icon = card.icon;
  return (
    <>
      <Icon className="h-6 w-6 text-white/85" aria-hidden />
      <p className="mt-6 text-3xl font-black">{card.value}</p>
      <p className="mt-2 text-sm font-semibold">{card.label}</p>
      <p className="mt-1 text-xs text-white/70">{card.detail}</p>
    </>
  );
}

export function HomeHeroCards({ stats }: { stats: HomeHeroStats }) {
  return (
    <div className="grid grid-cols-1 gap-3 self-center pb-12 sm:grid-cols-3 lg:pb-0">
      {cardsForStats(stats).map((card) => {
        const className = `min-h-44 rounded-3xl p-5 text-left shadow-[0_18px_45px_-28px_rgba(0,0,0,0.65)] transition sm:min-h-52 sm:p-6 ${card.color}`;
        if (card.href) {
          return (
            <Link
              key={card.label}
              href={card.href}
              className={`${className} hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50`}
            >
              <CardContent card={card} />
            </Link>
          );
        }

        return (
          <button
            key={card.label}
            type="button"
            disabled
            className={`${className} cursor-default disabled:opacity-100`}
          >
            <CardContent card={card} />
          </button>
        );
      })}
    </div>
  );
}
