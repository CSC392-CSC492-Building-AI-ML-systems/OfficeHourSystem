"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CreditCard, ScanLine } from "lucide-react";

import { scanCheckInAction } from "@/actions/scan_check_in/scan-check-in";
import type { ScanCheckInResult } from "@/lib/types/queue";
import { parseIdentifier } from "@/lib/utils/scan_check_in/parse-identifier";

type ScanInputPanelProps = {
  sessionPublicId: string;
  lastScanName?: string | null;
  keepFocus?: boolean;
  onResult?: (result: ScanCheckInResult) => void | Promise<void>;
};

function getResultDisplay(result: ScanCheckInResult): {
  text: string;
  color: string;
} {
  switch (result.outcome) {
    case "checked_in":
      return {
        text: `✓ ${result.studentName} added to queue`,
        color: "text-green-700",
      };
    case "already_in_queue":
      return {
        text: `${result.studentName} is already in the queue`,
        color: "text-amber-700",
      };
    case "mock_user":
      return {
        text: `[DEV] ${result.studentName} — barcode mock`,
        color: "text-blue-700",
      };
    case "student_not_found":
      return {
        text: "No HourSpace student matches this student number or UTORid. Check the identifier and try again.",
        color: "text-red-700",
      };
    case "barcode_not_found":
      return {
        text: "This barcode is not recognized. Use a T-Card, student number, or UTORid instead.",
        color: "text-red-700",
      };
    case "mcs_not_found":
      return {
        text: "Card not recognized. No match in the MCS card database.",
        color: "text-red-700",
      };
    case "not_in_app":
      return {
        text: "Card recognized, but this person is not in HourSpace for this course. They may need to be on the classlist and sign in once.",
        color: "text-red-700",
      };
    case "not_enrolled":
      return {
        text: "This person is in HourSpace but is not enrolled as a student in this course.",
        color: "text-red-700",
      };
    case "staff_member":
      return {
        text: "This is a staff member (TA or instructor). Staff cannot check in as students.",
        color: "text-red-700",
      };
    case "csn_lookup_unavailable":
      return {
        text: "TCard lookup is temporarily unavailable. Enter the student number or UTORid instead.",
        color: "text-red-700",
      };
    case "session_not_active":
      return {
        text: "This session is not active. Return to Help Centre and open an active session.",
        color: "text-red-700",
      };
    case "scan_failed":
      return {
        text: "Check-in could not be completed because HourSpace encountered a system or connection error. Try again; if it continues, reload the page.",
        color: "text-red-700",
      };
  }
}

export function ScanInputPanel({
  sessionPublicId,
  lastScanName,
  keepFocus = false,
  onResult,
}: ScanInputPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<ScanCheckInResult | null>(null);
  const [parseError, setParseError] = useState(false);
  const [refreshWarning, setRefreshWarning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = useCallback(() => {
    const input = inputRef.current;
    if (input && input.getClientRects().length > 0) {
      input.focus();
    }
  }, []);

  useEffect(() => {
    if (keepFocus) {
      focusInput();
    } else {
      inputRef.current?.blur();
    }
  }, [focusInput, keepFocus]);

  useEffect(() => {
    if (!keepFocus) return undefined;
    const refocusOnClick = () => focusInput();
    document.addEventListener("click", refocusOnClick);
    return () => document.removeEventListener("click", refocusOnClick);
  }, [focusInput, keepFocus]);

  useEffect(() => {
    if (keepFocus && !processing) focusInput();
  }, [focusInput, keepFocus, processing]);

  const handleSubmit = async (raw: string) => {
    if (processing) return;
    setRefreshWarning(null);

    const parsed = parseIdentifier(raw);
    if (!parsed) {
      setParseError(true);
      setLastResult(null);
      window.setTimeout(() => {
        setParseError(false);
        setInputValue("");
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
      try {
        await onResult?.(result);
      } catch (error) {
        console.error("Failed to refresh queue after scan:", error);
        setRefreshWarning(
          "The scan result was returned, but the queue could not refresh. Reload the page to see the latest queue.",
        );
      }
    } catch (error) {
      console.error("Scan check-in request failed:", error);
      setLastResult({ outcome: "scan_failed" });
    } finally {
      window.setTimeout(() => {
        setProcessing(false);
        setInputValue("");
      }, 500);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value.includes("\n")) {
      void handleSubmit(value.replace(/\n/g, "").trim());
      return;
    }
    setInputValue(value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void handleSubmit(inputValue);
  };

  const resultDisplay = lastResult ? getResultDisplay(lastResult) : null;

  return (
    <section className="rounded-[28px] border border-slate-200 border-l-4 border-l-[#c8102e] bg-white p-5 shadow-[0_18px_50px_-32px_rgba(15,41,66,0.35)] sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[#071f41]">
          <ScanLine className="h-4 w-4" />
          Student check-in
        </h2>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-[#15803d]">
          <span className="h-2 w-2 rounded-full bg-[#16a34a]" />
          T-Card ready
        </span>
      </div>

      <div className="relative mt-4">
        <label htmlFor={`scan-input-${sessionPublicId}`} className="sr-only">
          T-Card, student number, or UTORid
        </label>
        <input
          id={`scan-input-${sessionPublicId}`}
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={processing}
          placeholder="Tap or swipe T-Card, scan barcode, or enter student number / UTORid"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className={`w-full rounded-2xl border px-5 py-4 pr-12 text-base outline-none transition placeholder:text-slate-400 ${
            processing
              ? "border-slate-200 bg-slate-50 text-slate-400"
              : "border-slate-300 bg-[#f8fafc] text-slate-900 focus:border-[#071f41] focus:bg-white focus:ring-2 focus:ring-[#071f41]/10"
          }`}
        />
        <CreditCard className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      <div className="mt-3 flex min-h-5 flex-col gap-2 text-sm sm:flex-row sm:items-start sm:justify-between">
        <p className="text-slate-600">
          Last scan: {lastScanName ?? "No check-ins yet"}
        </p>
        <div className="sm:text-right" aria-live="polite">
          {processing ? (
            <p className="text-slate-500">Processing…</p>
          ) : parseError ? (
            <p className="font-medium text-red-700">
              Unrecognised format — try student number, UTORid, or T-Card
            </p>
          ) : resultDisplay ? (
            <p className={`font-medium ${resultDisplay.color}`}>
              {resultDisplay.text}
            </p>
          ) : (
            <p className="text-slate-500">Press Enter after manual entry</p>
          )}
          {refreshWarning ? (
            <p className="mt-1 font-medium text-amber-700">{refreshWarning}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
