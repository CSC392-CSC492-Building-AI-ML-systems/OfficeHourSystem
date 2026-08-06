"use client";

import { useEffect, useRef, useState } from "react";
import { scanCheckInAction } from "@/actions/scan_check_in/scan-check-in";
import { parseIdentifier } from "@/lib/utils/scan_check_in/parse-identifier";
import type { ScanCheckInResult } from "@/lib/types/queue";

interface ScanPageProps {
  sessionPublicId: string;
}

// ── Result message ────────────────────────────────────────────────────────────

function getResultDisplay(result: ScanCheckInResult): {
  text: string;
  color: string;
} {
  switch (result.outcome) {
    case "checked_in":
      return {
        text: `✓ ${result.studentName} added to queue`,
        color: "text-green-600",
      };
    case "already_in_queue":
      return {
        text: `${result.studentName} is already in the queue`,
        color: "text-amber-600",
      };
    case "mock_user":
      return {
        text: `[DEV] ${result.studentName} — barcode mock`,
        color: "text-blue-600",
      };
    case "student_not_found":
      return { text: "Student not found", color: "text-red-600" };
    case "not_enrolled":
      return {
        text: "Student is not enrolled in this course",
        color: "text-red-600",
      };
    case "csn_lookup_unavailable":
      return {
        text: "TCard lookup unavailable. Enter student number or UTORid.",
        color: "text-red-600",
      };
    case "session_not_active":
      return { text: "Session is no longer active", color: "text-red-600" };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ScanPage({ sessionPublicId }: ScanPageProps) {
  const [inputValue, setInputValue] = useState("");
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<ScanCheckInResult | null>(null);
  const [parseError, setParseError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Keep focus on the input at all times so scanner/swiper input lands correctly
  useEffect(() => {
    const refocusOnBlur = () => inputRef.current?.focus();
    inputRef.current?.focus();
    document.addEventListener("click", refocusOnBlur);
    return () => document.removeEventListener("click", refocusOnBlur);
  }, []);

  // Re-focus the input whenever it becomes enabled again (processing → false).
  // A disabled input can't be focused, so focusing inside the same setTimeout as
  // setProcessing(false) fails — React hasn't re-enabled the element yet. Doing
  // it here runs AFTER the re-render, so the next scan lands without a click.
  useEffect(() => {
    if (!processing) inputRef.current?.focus();
  }, [processing]);

  const handleSubmit = async (raw: string) => {
    if (processing) return;

    const parsed = parseIdentifier(raw);

    if (!parsed) {
      setParseError(true);
      setLastResult(null);
      // Clear after 1.5s and re-enable input
      setTimeout(() => {
        setParseError(false);
        setInputValue("");
        inputRef.current?.focus();
      }, 1500);
      return;
    }

    setProcessing(true);
    setParseError(false);

    try {
      const result = await scanCheckInAction(
        sessionPublicId,
        parsed.type,
        parsed.value,
      );
      setLastResult(result);
    } catch {
      setLastResult({ outcome: "student_not_found" });
    } finally {
      // Disable input briefly to prevent duplicate scans, then clear.
      // Re-focus is handled by the [processing] effect once the input re-enables.
      setTimeout(() => {
        setProcessing(false);
        setInputValue("");
      }, 500);
    }
  };

  // Detect newline from scanner/swiper (they append \n after the payload)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes("\n")) {
      void handleSubmit(val.replace(/\n/g, "").trim());
    } else {
      setInputValue(val);
    }
  };

  // Manual entry: user presses Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleSubmit(inputValue);
    }
  };

  const resultDisplay = lastResult ? getResultDisplay(lastResult) : null;

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

        {/* Search-style input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={processing}
            placeholder="Waiting for scan…"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            className={`w-full rounded-full border px-6 py-4 text-lg shadow-sm outline-none transition
              placeholder:text-slate-400
              ${
                processing
                  ? "border-slate-200 bg-slate-50 text-slate-400"
                  : "border-slate-300 bg-white text-slate-900 focus:border-[#071f41] focus:ring-2 focus:ring-[#071f41]/10"
              }`}
          />
          {processing && (
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              Processing…
            </span>
          )}
        </div>

        {/* Result message */}
        {parseError && (
          <p className="text-center text-sm font-medium text-red-600">
            Unrecognised format — try student number, UTORid, or swipe TCard
          </p>
        )}
        {resultDisplay && !parseError && (
          <p
            className={`text-center text-sm font-medium ${resultDisplay.color}`}
          >
            {resultDisplay.text}
          </p>
        )}

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
