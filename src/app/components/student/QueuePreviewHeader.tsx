"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

const COOLDOWN_MS = 5_000;

function formatUpdatedAt(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function QueuePreviewHeader() {
  const [updatedAt, setUpdatedAt] = useState(() => new Date());
  const [cooldown, setCooldown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
      if (spinTimer.current) clearTimeout(spinTimer.current);
    };
  }, []);

  function refresh() {
    if (cooldown || refreshing) return;
    setRefreshing(true);
    setUpdatedAt(new Date());
    spinTimer.current = setTimeout(() => setRefreshing(false), 400);
    setCooldown(true);
    cooldownTimer.current = setTimeout(() => setCooldown(false), COOLDOWN_MS);
  }

  return (
    <div className="mb-6 flex items-center justify-between gap-3">
      <div>
        <p className="text-2xl font-semibold tracking-tight text-[#071f41]">
          My Queue
        </p>
        <p className="mt-0.5 text-sm text-slate-500">
          Updated at {formatUpdatedAt(updatedAt)} · auto-refreshes every 15 s
        </p>
      </div>
      <button
        type="button"
        onClick={refresh}
        disabled={cooldown || refreshing}
        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-[#071f41] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        {cooldown ? "Wait 5 s…" : "Refresh"}
      </button>
    </div>
  );
}
