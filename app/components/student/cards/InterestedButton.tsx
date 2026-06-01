"use client";

import { useState } from "react";

export function InterestedButton() {
  const [isInterested, setIsInterested] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={isInterested}
      onClick={() => setIsInterested((current) => !current)}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
        isInterested
          ? "border-[#071f41] bg-[#071f41] text-white shadow-[0_12px_24px_-18px_rgba(7,31,65,0.8)] hover:bg-[#0f2942]"
          : "border-slate-200 bg-white text-[#071f41] hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {isInterested ? "Already interested" : "I'm interested"}
    </button>
  );
}
