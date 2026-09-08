"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { UserPlus, X } from "lucide-react";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (input: {
    utorid: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;
}

export function AddStudentModal({
  isOpen,
  onClose,
  onAddStudent,
  isSubmitting,
  error,
}: AddStudentModalProps) {
  const [utorid, setUtorid] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const utoridRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    requestAnimationFrame(() => utoridRef.current?.focus());

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        setUtorid("");
        setFirstName("");
        setLastName("");
        setClientError(null);
        setHasSubmitted(false);
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    setUtorid("");
    setFirstName("");
    setLastName("");
    setClientError(null);
    setHasSubmitted(false);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const normalizedUtorid = utorid.trim();
    if (!normalizedUtorid) {
      setClientError("UTORid is required.");
      return;
    }

    setClientError(null);
    setHasSubmitted(true);
    const normalizedFirstName = firstName.trim() || undefined;
    const normalizedLastName = lastName.trim() || undefined;
    const added = await onAddStudent({
      utorid: normalizedUtorid,
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
    });

    if (added) {
      setUtorid("");
      setFirstName("");
      setLastName("");
      setHasSubmitted(false);
      onClose();
    }
  };

  const visibleError = clientError ?? (hasSubmitted ? error : null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071f41]/55 px-4 py-8 backdrop-blur-[2px]"
      onClick={handleClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-student-title"
        className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_-28px_rgba(7,31,65,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">
              STUDENT MANAGEMENT
            </p>
            <h2
              id="add-student-title"
              className="mt-2 text-xl font-semibold text-[#071f41]"
            >
              Add Student
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close add student dialog"
            onClick={handleClose}
            disabled={isSubmitting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          {visibleError ? (
            <p
              role="alert"
              className="rounded-2xl border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm text-[#9f1239]"
            >
              {visibleError}
            </p>
          ) : null}

          <label className="block space-y-2 text-sm font-medium text-[#071f41]">
            <span>UTORid *</span>
            <input
              ref={utoridRef}
              required
              value={utorid}
              onChange={(event) => {
                setUtorid(event.target.value);
                setClientError(null);
              }}
              onInvalid={() => setClientError("UTORid is required.")}
              placeholder="jdoe123"
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label className="block space-y-2 text-sm font-medium text-[#071f41]">
            <span>First Name (optional)</span>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="John"
              disabled={isSubmitting}
              autoComplete="given-name"
              className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label className="block space-y-2 text-sm font-medium text-[#071f41]">
            <span>Last Name (optional)</span>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Smith"
              disabled={isSubmitting}
              autoComplete="family-name"
              className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !utorid.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(7,31,65,0.7)] transition hover:bg-[#0f2942] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <UserPlus className="h-4 w-4" />
              {isSubmitting ? "Adding..." : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
