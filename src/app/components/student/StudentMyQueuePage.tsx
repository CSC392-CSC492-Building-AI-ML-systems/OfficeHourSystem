"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, MapPin, RefreshCw, Users } from "lucide-react";

import { getStudentQueueAction } from "@/actions/student_queue/student-queue";
import { LocationText } from "@/app/components/student/LocationText";
import type { StudentQueueTicketDto } from "@/lib/types/queue";

const AUTO_REFRESH_MS = 15_000;
const MANUAL_COOLDOWN_MS = 5_000;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function WaitBadge({
  minutes,
  margin,
}: {
  minutes: number;
  margin: number | null;
}) {
  const text =
    minutes === 0
      ? "You're next!"
      : `~${minutes} min${margin !== null ? ` ±${margin} min` : ""}`;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf1ff] px-3 py-1 text-xs font-semibold text-[#1e4fa1]">
      <Clock className="h-3 w-3" />
      {text}
    </span>
  );
}

function QueueTicket({ ticket }: { ticket: StudentQueueTicketDto }) {
  const isHelping = ticket.status === "IN_HELP";

  return (
    <div
      className={`rounded-[24px] border bg-white p-6 shadow-[0_12px_40px_-24px_rgba(15,41,66,0.3)] transition ${
        isHelping
          ? "border-l-4 border-[#16a34a] border-l-[#16a34a]"
          : "border-slate-200/80"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c8102e]">
            {ticket.courseLabel}
          </p>
          <h3 className="text-lg font-semibold text-[#071f41]">
            {ticket.sessionTitle}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            <span className="flex min-w-0 items-start gap-1">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <LocationText value={ticket.location} className="break-all" />
            </span>
            <span>
              {formatDate(ticket.startsAt)} · {formatTime(ticket.startsAt)}–
              {formatTime(ticket.endsAt)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {isHelping ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-semibold text-[#16a34a]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#16a34a]" />
              Being helped
            </span>
          ) : (
            <>
              <span className="flex items-center gap-1.5 text-2xl font-black text-[#071f41]">
                <Users className="h-5 w-5 text-slate-400" />#{ticket.position}
              </span>
              {ticket.estimatedWaitMinutes !== null && (
                <>
                  <WaitBadge
                    minutes={ticket.estimatedWaitMinutes}
                    margin={ticket.estimatedWaitMargin}
                  />
                  <span className="text-left text-[11px] leading-4 text-slate-400 sm:text-right">
                    {ticket.waitEstimateAverageMinutes} min average
                    <br />
                    {ticket.waitEstimateSampleSize} completed-help samples
                  </span>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1 border-t border-slate-100 pt-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>Checked in at {formatTime(ticket.checkedInAt)}</span>
        <span>Waited {ticket.waitedMinutes} min</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white py-20 text-center">
      <Users className="mb-4 h-10 w-10 text-slate-300" />
      <p className="text-base font-semibold text-slate-500">
        No active queue tickets
      </p>
      <p className="mt-1 text-sm text-slate-400">
        Scan your T-Card at an office hour to join a queue.
      </p>
    </div>
  );
}

export function StudentMyQueuePage({
  initialTickets,
}: {
  initialTickets: StudentQueueTicketDto[];
}) {
  const [tickets, setTickets] = useState(initialTickets);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [cooldown, setCooldown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const data = await getStudentQueueAction();
      setTickets(data);
      setLastRefreshed(new Date());
    } catch {
      // silently fail — stale data stays visible
    } finally {
      setRefreshing(false);
    }
  }, [refreshing]);

  const manualRefresh = useCallback(() => {
    if (cooldown || refreshing) return;
    setCooldown(true);
    void refresh();
    cooldownTimer.current = setTimeout(
      () => setCooldown(false),
      MANUAL_COOLDOWN_MS,
    );
  }, [cooldown, refreshing, refresh]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => void refresh(), AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#071f41]">
            My Queue
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Updated at{" "}
            {lastRefreshed.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
            })}
            {" · "}auto-refreshes every 15 s
          </p>
        </div>

        <button
          type="button"
          onClick={manualRefresh}
          disabled={cooldown || refreshing}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-[#071f41] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {cooldown ? "Wait 5 s…" : "Refresh"}
        </button>
      </div>

      {tickets.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <QueueTicket key={t.attendancePublicId} ticket={t} />
          ))}
        </div>
      )}
    </div>
  );
}
