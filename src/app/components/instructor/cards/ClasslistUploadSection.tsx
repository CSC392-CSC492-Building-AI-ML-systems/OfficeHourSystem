"use client";

import { useRef, useState, useTransition, type DragEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  X,
} from "lucide-react";
import { uploadClasslistCSV } from "@/actions/uploadClasslistCSV";
import { CLASSLIST_CSV_HEADERS } from "@/lib/csv/parseCSV";
import type { ClasslistUploadSuccess } from "@/lib/csv/processClasslistCSV";

const INSTRUCTOR_ONLY_HINT = "Only instructors can import classlists.";

interface ClasslistUploadSectionProps {
  courseCode: string;
  termCode: string;
  canImport: boolean;
  onImportSuccess: () => void;
}

function formatSuccessMessage(result: ClasslistUploadSuccess): string {
  const parts = [
    `Imported ${result.imported} student${result.imported === 1 ? "" : "s"}`,
  ];

  if (result.cleared > 0) {
    parts.push(
      `replaced ${result.cleared} previously enrolled student${result.cleared === 1 ? "" : "s"}`,
    );
  }

  return `${parts.join(" and ")} for ${result.courseCode} (${result.termCode}).`;
}

export function ClasslistUploadSection({
  courseCode,
  termCode,
  canImport,
  onImportSuccess,
}: ClasslistUploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetSelection = () => {
    setSelectedFile(null);
    setShowConfirm(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const acceptFile = (file: File | undefined) => {
    if (!canImport || !file) {
      return;
    }

    setError(null);
    setSuccess(null);
    setShowConfirm(false);

    const isCsv =
      file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";

    if (!isCsv) {
      setError("Please choose a .csv file exported from the UofT classlist.");
      resetSelection();
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (canImport) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);

    if (!canImport) {
      return;
    }

    acceptFile(event.dataTransfer.files[0]);
  };

  const handleImport = () => {
    if (!canImport || !selectedFile) {
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", selectedFile);
      formData.set("termCode", termCode);

      const result = await uploadClasslistCSV(formData);

      if (!result.ok) {
        setError(result.error);
        setShowConfirm(false);
        return;
      }

      setSuccess(formatSuccessMessage(result));
      resetSelection();
      onImportSuccess();
    });
  };

  return (
    <section
      className={`overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)] ${canImport ? "" : "opacity-95"}`}
      aria-disabled={!canImport}
    >
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#071f41]">
              Student Classlist
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              {canImport
                ? "Import enrolled students from a UofT classlist CSV. Re-importing replaces the existing student roster for this term; TAs and instructors are not affected."
                : "Review how students are imported for this course. Classlist uploads are limited to instructors."}
            </p>
          </div>

          {!canImport ? (
            <p className="rounded-full border border-slate-200 bg-[#f8fafc] px-4 py-2 text-xs font-medium text-slate-500">
              {INSTRUCTOR_ONLY_HINT}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-5 px-6 py-5">
        <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-4">
          <p className="text-xs font-semibold tracking-[0.16em] text-slate-500">
            TARGET OFFERING
          </p>
          <p className="mt-2 text-sm font-medium text-[#071f41]">
            {courseCode} · Term {termCode}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            The CSV course code must match{" "}
            <span className="font-medium text-slate-700">{courseCode}</span> or
            students will be imported into a different course.
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-[#071f41]">
            Required CSV columns
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CLASSLIST_CSV_HEADERS.map((header) => (
              <span
                key={header}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
              >
                {header}
              </span>
            ))}
          </div>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-[24px] border-2 border-dashed px-6 py-8 transition ${
            canImport
              ? isDragActive
                ? "border-[#071f41] bg-[#eef4ff]"
                : "border-slate-200 bg-[#fbfdff] hover:border-slate-300"
              : "cursor-not-allowed border-slate-200 bg-slate-50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            disabled={!canImport || isPending}
            className="sr-only"
            onChange={(event) => acceptFile(event.target.files?.[0])}
          />

          <div className="flex flex-col items-center text-center">
            <div
              className={`inline-flex h-14 w-14 items-center justify-center rounded-full ${
                canImport
                  ? "bg-[#eaf1ff] text-[#071f41]"
                  : "bg-slate-200 text-slate-400"
              }`}
            >
              <Upload className="h-6 w-6" />
            </div>

            <p className="mt-4 text-sm font-medium text-[#071f41]">
              {canImport
                ? "Drag and drop your classlist CSV here"
                : "Classlist upload is disabled for teaching assistants"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {canImport
                ? "or choose a file from your computer"
                : "Ask a course instructor to import the roster"}
            </p>

            <button
              type="button"
              disabled={!canImport || isPending}
              title={canImport ? undefined : INSTRUCTOR_ONLY_HINT}
              onClick={() => inputRef.current?.click()}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#071f41] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Choose CSV file
            </button>
          </div>
        </div>

        {selectedFile ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#071f41]">
                {selectedFile.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {(selectedFile.size / 1024).toFixed(1)} KB · ready to import for
                term {termCode}
              </p>
            </div>

            <button
              type="button"
              disabled={!canImport || isPending}
              onClick={resetSelection}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Remove
            </button>
          </div>
        ) : null}

        {showConfirm && selectedFile ? (
          <div className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-4 py-4">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#b45309]" />
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-[#92400e]">
                    Replace existing student roster?
                  </p>
                  <p className="mt-1 text-sm text-[#a16207]">
                    Importing this file will enroll students from the CSV into{" "}
                    {courseCode} for term {termCode}. If students are already
                    enrolled, they will be removed and replaced. TAs and
                    instructors will not be changed.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setShowConfirm(false)}
                    className="inline-flex items-center justify-center rounded-full border border-[#fcd34d] bg-white px-4 py-2.5 text-sm font-semibold text-[#92400e] transition hover:bg-[#fff7d6] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleImport}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f41] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f2942] disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isPending ? "Importing..." : "Confirm import"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm font-medium text-[#9f1239]">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="flex items-start gap-2 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm font-medium text-[#166534]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{success}</span>
          </p>
        ) : null}

        {selectedFile && !showConfirm ? (
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={!canImport || isPending}
              onClick={resetSelection}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear selection
            </button>
            <button
              type="button"
              disabled={!canImport || isPending}
              title={canImport ? undefined : INSTRUCTOR_ONLY_HINT}
              onClick={() => setShowConfirm(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(7,31,65,0.7)] transition hover:bg-[#0f2942] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <Upload className="h-4 w-4" />
              Review import
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
