"use client";

import { FormEvent, useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";
import type { StaffMember } from "./data";

interface AddTaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStaffMember: (staffMember: StaffMember) => void;
}

type StaffRole = StaffMember["role"];

const initialRole: StaffRole = "TA";

export function AddTaModal({
  isOpen,
  onClose,
  onAddStaffMember,
}: AddTaModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [program, setProgram] = useState("");
  const [role, setRole] = useState<StaffRole>(initialRole);
  const [location, setLocation] = useState("");
  const [isRemote, setIsRemote] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

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

  const resetForm = () => {
    setName("");
    setEmail("");
    setProgram("");
    setRole(initialRole);
    setLocation("");
    setIsRemote(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onAddStaffMember({
      id: `local-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      program: program.trim(),
      role,
      location: location.trim(),
      isRemote,
    });
    resetForm();
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
              STAFF ROSTER
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[#071f41]">
              Add Teaching Assistant
            </h2>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-[#071f41]">
              <span>Full name</span>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Jordan Lee"
                className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[#071f41]">
              <span>Email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="j.lee@university.edu"
                className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-[#071f41]">
              <span>Program</span>
              <input
                required
                value={program}
                onChange={(event) => setProgram(event.target.value)}
                placeholder="Senior Undergraduate"
                className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[#071f41]">
              <span>Role</span>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as StaffRole)}
                className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#071f41] focus:bg-white"
              >
                <option value="TA">TA</option>
                <option value="Lead TA">Lead TA</option>
              </select>
            </label>
          </div>

          <label className="space-y-2 text-sm font-medium text-[#071f41]">
            <span>Office location</span>
            <input
              required
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Tech Plaza, Rm 402"
              className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white"
            />
          </label>

          <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-600">
            <span>Remote office hours</span>
            <input
              type="checkbox"
              checked={isRemote}
              onChange={(event) => setIsRemote(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-[#071f41]"
            />
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(7,31,65,0.7)] transition hover:bg-[#0f2942]"
            >
              <UserPlus className="h-4 w-4" />
              Add TA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
