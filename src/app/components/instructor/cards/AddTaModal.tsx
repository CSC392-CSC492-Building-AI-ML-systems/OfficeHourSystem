"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { UserPlus, X } from "lucide-react";
interface AddTaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStaffMember: (input: {
    utorid: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  }) => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;
}

export function AddTaModal({
  isOpen,
  onClose,
  onAddStaffMember,
  isSubmitting,
  error,
}: AddTaModalProps) {
  const [utorid, setUtorid] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const utoridRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setUtorid("");
    setFirstName("");
    setLastName("");
    setEmail("");
  };

  const focusUtorid = () => {
    requestAnimationFrame(() => utoridRef.current?.focus());
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    focusUtorid();

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
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const isFormValid = utorid.trim().length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid || isSubmitting) {
      return;
    }

    const success = await onAddStaffMember({
      utorid: utorid.trim(),
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      email: email.trim() || undefined,
    });

    if (success) {
      resetForm();
      focusUtorid();
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
              Add teaching assistant
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              UTORid is required. Name and email can be added later.
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
          {error ? (
            <p className="rounded-2xl border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm text-[#9f1239]">
              {error}
            </p>
          ) : null}

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

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-[#071f41]">
              <span>First name (optional)</span>
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Jordan"
                className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[#071f41]">
              <span>Last name (optional)</span>
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Lee"
                className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white"
              />
            </label>
          </div>

          <label className="block space-y-2 text-sm font-medium text-[#071f41]">
            <span>Email (optional)</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="j.lee@mail.utoronto.ca"
              className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white"
            />
          </label>

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
              {isSubmitting ? "Adding..." : "Add TA"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
