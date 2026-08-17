"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { UserPlus, X } from "lucide-react";

type AddMode = "single" | "bulk";

interface AddTaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStaffMember: (input: { utorid: string }) => Promise<boolean>;
  onBulkAddStaffMembers: (text: string) => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;
}

const BULK_PLACEHOLDER = `# One UTORid per line
jlee1234
smithj
# commented lines are ignored`;

export function AddTaModal({
  isOpen,
  onClose,
  onAddStaffMember,
  onBulkAddStaffMembers,
  isSubmitting,
  error,
}: AddTaModalProps) {
  const [mode, setMode] = useState<AddMode>("single");
  const [utorid, setUtorid] = useState("");
  const [bulkText, setBulkText] = useState("");
  const utoridRef = useRef<HTMLInputElement>(null);
  const bulkTextRef = useRef<HTMLTextAreaElement>(null);

  const resetForm = () => {
    setUtorid("");
    setBulkText("");
  };

  const focusActiveInput = () => {
    requestAnimationFrame(() => {
      if (mode === "bulk") {
        bulkTextRef.current?.focus();
        return;
      }
      utoridRef.current?.focus();
    });
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    focusActiveInput();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, mode]);

  if (!isOpen) {
    return null;
  }

  const isSingleFormValid = utorid.trim().length > 0;
  const isBulkFormValid = bulkText.trim().length > 0;
  const isFormValid = mode === "single" ? isSingleFormValid : isBulkFormValid;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid || isSubmitting) {
      return;
    }

    const success =
      mode === "single"
        ? await onAddStaffMember({ utorid: utorid.trim() })
        : await onBulkAddStaffMembers(bulkText);

    if (success) {
      resetForm();
      focusActiveInput();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071f41]/55 px-4 py-8 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_-28px_rgba(7,31,65,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">
              STAFF MANAGEMENT
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[#071f41]">
              Add teaching assistant{mode === "bulk" ? "s" : ""}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              They must have signed in to the app at least once. Students
              already on the classlist cannot be added as TAs.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close add TA modal"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {(["single", "bulk"] as AddMode[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                disabled={isSubmitting}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  mode === option
                    ? "bg-white text-[#071f41] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {option === "single" ? "Single" : "Bulk"}
              </button>
            ))}
          </div>

          {error ? (
            <p className="rounded-2xl border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm text-[#9f1239]">
              {error}
            </p>
          ) : null}

          {mode === "single" ? (
            <label className="block space-y-2 text-sm font-medium text-[#071f41]">
              <span>UTORid</span>
              <input
                ref={utoridRef}
                required
                value={utorid}
                onChange={(event) => setUtorid(event.target.value)}
                placeholder="jlee1234"
                className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white"
              />
            </label>
          ) : (
            <label className="block space-y-2 text-sm font-medium text-[#071f41]">
              <span>UTORids</span>
              <textarea
                ref={bulkTextRef}
                value={bulkText}
                onChange={(event) => setBulkText(event.target.value)}
                placeholder={BULK_PLACEHOLDER}
                rows={10}
                disabled={isSubmitting}
                className="w-full resize-y rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 font-mono text-sm text-slate-700 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(7,31,65,0.7)] transition hover:bg-[#0f2942] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <UserPlus className="h-4 w-4" />
              {isSubmitting
                ? "Adding..."
                : mode === "single"
                  ? "Add TA"
                  : "Add TAs"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
