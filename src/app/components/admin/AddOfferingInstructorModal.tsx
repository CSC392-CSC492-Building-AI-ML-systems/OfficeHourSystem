"use client";

import { FormEvent, useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";

import { addOfferingInstructorAction } from "@/actions/admin/addOfferingInstructor";

type AddOfferingInstructorModalProps = {
  isOpen: boolean;
  offeringPublicId: string;
  courseLabel: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function AddOfferingInstructorModal({
  isOpen,
  offeringPublicId,
  courseLabel,
  onClose,
  onSuccess,
}: AddOfferingInstructorModalProps) {
  const [utorid, setUtorid] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, submitting]);

  const handleClose = () => {
    if (submitting) return;
    setUtorid("");
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const result = await addOfferingInstructorAction({
      offeringPublicId,
      utorid: utorid.trim(),
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccessMessage(
      result.created
        ? "Instructor added to this offering."
        : "Instructor role updated for this offering.",
    );
    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071f41]/55 px-4 py-8 backdrop-blur-[2px]"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_-28px_rgba(7,31,65,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">
              COURSE OFFERING
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[#071f41]">
              Add instructor
            </h2>
            <p className="mt-1 text-sm text-slate-500">{courseLabel}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            disabled={submitting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <label className="block space-y-2 text-sm font-medium text-[#071f41]">
            <span>UTORid</span>
            <input
              required
              value={utorid}
              onChange={(event) => setUtorid(event.target.value)}
              placeholder="jlee1234"
              disabled={submitting}
              className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:border-[#071f41] focus:bg-white"
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
              className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
            >
              {successMessage ? "Close" : "Cancel"}
            </button>
            {!successMessage ? (
              <button
                type="submit"
                disabled={submitting || !utorid.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-300"
              >
                <UserPlus className="h-4 w-4" />
                {submitting ? "Adding..." : "Add instructor"}
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
