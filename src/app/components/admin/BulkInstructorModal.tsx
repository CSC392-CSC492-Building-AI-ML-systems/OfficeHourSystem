"use client";

import { FormEvent, useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";

import { bulkUpsertInstructorsAction } from "@/actions/admin/bulkUpsertInstructors";

interface BulkInstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLACEHOLDER = `# One UTORid per line
testprof
smithj
# commented lines are ignored`;

export function BulkInstructorModal({
  isOpen,
  onClose,
}: BulkInstructorModalProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, submitting]);

  if (!isOpen) {
    return null;
  }

  const resetForm = () => {
    setText("");
    setError(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    if (submitting) {
      return;
    }
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const result = await bulkUpsertInstructorsAction(text);

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccessMessage(
      `Added ${result.total} instructor${result.total === 1 ? "" : "s"} (${result.created} created, ${result.updated} updated).`,
    );
    setText("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071f41]/55 px-4 py-8 backdrop-blur-[2px]"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_-28px_rgba(7,31,65,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">
              ADMIN
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[#071f41]">
              Bulk add instructors
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter UTORids one per line. Existing users will have{" "}
              <span className="font-mono">isInstructor</span> set to true.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close bulk instructor modal"
            onClick={handleClose}
            disabled={submitting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <label className="block space-y-2 text-sm font-medium text-[#071f41]">
            <span>UTORids</span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={PLACEHOLDER}
              rows={10}
              disabled={submitting}
              className="w-full resize-y rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 font-mono text-sm text-slate-700 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {successMessage ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {successMessage}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {successMessage ? "Close" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={submitting || text.trim().length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(7,31,65,0.7)] transition hover:bg-[#0f2942] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <UserPlus className="h-4 w-4" />
              {submitting ? "Saving..." : "Add instructors"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
