"use client";

import { useEffect } from "react";

import { ScanInputPanel } from "./ScanInputPanel";

interface ScanPageProps {
  sessionPublicId: string;
}

export function ScanPage({ sessionPublicId }: ScanPageProps) {
  // Lock the page so back button / swipe gesture can't escape the scan page
  useEffect(() => {
    // Push an extra history entry so there's always something to pop back to
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      // When back is pressed, push forward again immediately
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f4f7fb] px-4">
      <div className="w-full max-w-xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-[#071f41]">
            Scan to Check In
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Tap or swipe TCard, scan barcode, or type student number / UTORid
          </p>
        </div>

        <ScanInputPanel sessionPublicId={sessionPublicId} keepFocus />

        {/* Identifier format hint */}
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 space-y-1">
          <p>
            <span className="font-semibold">TCard swipe / barcode scan</span> —
            detected automatically
          </p>
          <p>
            <span className="font-semibold">10-digit number</span> — student
            number
          </p>
          <p>
            <span className="font-semibold">8-char string</span> — UTORid (e.g.
            chenjohn)
          </p>
        </div>
      </div>
    </div>
  );
}
