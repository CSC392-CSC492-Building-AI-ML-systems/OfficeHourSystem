"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import type { CommandCenterPageData } from "@/lib/queries/commandCenter";
import { Navbar } from "./Navbar";
import { AddTaModal } from "./cards/AddTaModal";
import { ClasslistUploadSection } from "./cards/ClasslistUploadSection";
import { StaffTable } from "./cards/StaffTable";

const INSTRUCTOR_ONLY_HINT =
  "Only instructors can add or remove TAs or import classlists.";

type CommandCenterProps = {
  initialData: CommandCenterPageData;
};

export default function CommandCenter({ initialData }: CommandCenterProps) {
  const router = useRouter();
  const [isAddTaModalOpen, setIsAddTaModalOpen] = useState(false);
  const canManageTas = initialData.canManageTas;

  const refreshPage = () => {
    router.refresh();
  };

  const courseLabel = `${initialData.offering.courseCode} (${initialData.offering.termCode})`;

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar activeItem="command-center" />

        <main className="mt-10 space-y-8">
          <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-[#071f41] sm:text-[2.1rem]">
                Command Center
              </h1>
              <p className="text-base text-slate-600">{courseLabel}</p>
              {!canManageTas ? (
                <p className="text-sm text-slate-500">{INSTRUCTOR_ONLY_HINT}</p>
              ) : null}
            </div>

            <button
              type="button"
              disabled={!canManageTas}
              title={canManageTas ? undefined : INSTRUCTOR_ONLY_HINT}
              onClick={() => {
                if (canManageTas) {
                  setIsAddTaModalOpen(true);
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(7,31,65,0.7)] transition hover:bg-[#0f2942] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
            >
              <UserPlus className="h-4 w-4" />
              Add TA
            </button>
          </section>

          <StaffTable
            tas={initialData.tas}
            canManageTas={canManageTas}
            onRemoveSuccess={refreshPage}
          />

          <ClasslistUploadSection
            courseCode={initialData.offering.courseCode}
            termCode={initialData.offering.termCode}
            canImport={canManageTas}
            onImportSuccess={refreshPage}
          />
        </main>
      </div>

      {canManageTas ? (
        <AddTaModal
          isOpen={isAddTaModalOpen}
          onClose={() => setIsAddTaModalOpen(false)}
          onSuccess={refreshPage}
        />
      ) : null}
    </div>
  );
}
