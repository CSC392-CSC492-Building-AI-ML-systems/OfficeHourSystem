"use client";

import { useState } from "react";

const baseButtonClass =
  "inline-flex items-center justify-center whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium transition";

export function InterestedButton() {
  const [isInterested, setIsInterested] = useState<boolean>(false);

  return (
    <button
      type="button"
      disabled={isInterested}
      onClick={() => setIsInterested(true)}
      className={`${baseButtonClass} ${
        isInterested
          ? "cursor-not-allowed border-[#071f41] bg-[#071f41] text-white"
          : "border-slate-200 bg-white text-[#071f41] hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {isInterested ? "Already interested" : "I'm interested"}
    </button>
  );
}
