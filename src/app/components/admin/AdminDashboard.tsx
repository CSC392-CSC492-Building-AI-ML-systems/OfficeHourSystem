"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

import { BulkInstructorModal } from "./BulkInstructorModal";

interface AdminDashboardProps {
  utorid: string;
  firstName: string;
  lastName: string;
}

export function AdminDashboard({
  utorid,
  firstName,
  lastName,
}: AdminDashboardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className="w-full max-w-3xl rounded-[36px] border border-slate-200/80 bg-white px-8 py-10 shadow-[0_30px_80px_-40px_rgba(7,31,65,0.45)] sm:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#c8102e]">
          OHMS Admin
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#071f41]">
          Administration
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Signed in as{" "}
          <span className="font-mono text-[#071f41]">{utorid}</span> (
          {firstName} {lastName}). Your UTORid is on the admin list.
        </p>

        <div className="mt-10 border-t border-slate-200 pt-8">
          <h2 className="text-lg font-semibold text-[#071f41]">
            User management
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Bulk-create or update users and mark them as instructors in the
            database.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(7,31,65,0.7)] transition hover:bg-[#0f2942]"
          >
            <UserPlus className="h-4 w-4" />
            Bulk add instructors
          </button>
        </div>
      </section>

      <BulkInstructorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
