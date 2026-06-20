"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, BookOpen, UserPlus } from "lucide-react";

import type { AdminOfferingListItem } from "@/lib/queries/admin/offerings";
import { instructorDashboardHref } from "@/lib/offeringUrls";

import { AddOfferingInstructorModal } from "./AddOfferingInstructorModal";
import { AdminClasslistUploadSection } from "./AdminClasslistUploadSection";
import { BulkInstructorModal } from "./BulkInstructorModal";

type AdminDashboardProps = {
  utorid: string;
  firstName: string;
  lastName: string;
  canBulkAddInstructors: boolean;
  offerings: AdminOfferingListItem[];
};

export function AdminDashboard({
  utorid,
  firstName,
  lastName,
  canBulkAddInstructors,
  offerings: initialOfferings,
}: AdminDashboardProps) {
  const router = useRouter();
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [addInstructorTarget, setAddInstructorTarget] =
    useState<AdminOfferingListItem | null>(null);

  const refresh = () => router.refresh();

  return (
    <>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
        <header className="rounded-[36px] border border-slate-200/80 bg-white px-8 py-8 shadow-[0_30px_80px_-40px_rgba(7,31,65,0.45)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#c8102e]">
            OHMS Admin
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#071f41] sm:text-4xl">
            Administration
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Signed in as{" "}
            <span className="font-mono text-[#071f41]">{utorid}</span> (
            {firstName} {lastName})
          </p>
        </header>

        {canBulkAddInstructors ? (
          <section className="rounded-[30px] border border-slate-200/80 bg-white px-6 py-5 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)]">
            <h2 className="text-lg font-semibold text-[#071f41]">
              Platform instructors
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Grant users access to this admin page and course creation tools.
              Super-admin only.
            </p>
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(7,31,65,0.7)] transition hover:bg-[#0f2942]"
            >
              <UserPlus className="h-4 w-4" />
              Bulk add instructors
            </button>
          </section>
        ) : null}

        <AdminClasslistUploadSection onSuccess={refresh} />

        <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)]">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-[#071f41]">
              Course offerings
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Open a course workspace or add another instructor to an offering.
            </p>
          </div>

          {initialOfferings.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No offerings yet. Upload a classlist above to create the first
              one.
            </div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {initialOfferings.map((offering) => {
                const label = `${offering.courseCode} · Term ${offering.termCode}`;
                const href = instructorDashboardHref(offering.offeringPublicId);

                return (
                  <li
                    key={offering.offeringPublicId}
                    className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#071f41]">
                        <BookOpen className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-[#071f41]">
                          {label}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {offering.studentCount} student
                          {offering.studentCount === 1 ? "" : "s"} ·{" "}
                          {offering.instructorCount} instructor
                          {offering.instructorCount === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      <button
                        type="button"
                        onClick={() => setAddInstructorTarget(offering)}
                        disabled={!offering.canAddInstructor}
                        title={
                          offering.canAddInstructor
                            ? undefined
                            : "You must be an instructor for this course to add instructors."
                        }
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        Add instructor
                      </button>
                      <Link
                        href={href}
                        className="inline-flex items-center gap-2 rounded-full bg-[#071f41] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f2942]"
                      >
                        Open course
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {canBulkAddInstructors ? (
        <BulkInstructorModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
        />
      ) : null}

      {addInstructorTarget ? (
        <AddOfferingInstructorModal
          isOpen
          offeringPublicId={addInstructorTarget.offeringPublicId}
          courseLabel={`${addInstructorTarget.courseCode} · Term ${addInstructorTarget.termCode}`}
          onClose={() => setAddInstructorTarget(null)}
          onSuccess={refresh}
        />
      ) : null}
    </>
  );
}
