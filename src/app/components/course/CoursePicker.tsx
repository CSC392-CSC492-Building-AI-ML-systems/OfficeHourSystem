"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

import { AdminClasslistUploadSection } from "@/app/components/admin/AdminClasslistUploadSection";
import type { CoursePickerItem } from "@/lib/queries/course/offerings";

function CourseCard({ course }: { course: CoursePickerItem }) {
  const instructors =
    course.instructorNames.length > 0
      ? course.instructorNames.join(", ")
      : "No instructors listed";
  // termCode stores the user-facing course name (no separate DB column).
  const courseName = course.termCode;

  return (
    <Link
      href={course.href}
      className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-[0_2px_8px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.16)]"
    >
      <div className="flex min-h-36 items-center justify-center bg-[#5b9ed0] px-4 py-8">
        <p className="text-center text-2xl font-black leading-tight tracking-tight text-[#0a3d66] sm:text-3xl">
          {courseName}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-4 py-4">
        <p className="truncate text-sm font-semibold text-[#0b5cab] group-hover:underline">
          {courseName}
        </p>
        <p className="text-sm text-slate-700">{course.roleLabel}</p>
        <p className="text-sm text-slate-500">{instructors}</p>
        <p className="mt-1 text-xs text-slate-400">Code {course.courseCode}</p>
      </div>
    </Link>
  );
}

function AddCourseCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-lg border-2 border-dashed border-[#071f41]/25 bg-white/60 text-left shadow-[0_2px_8px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-[#071f41]/45 hover:bg-white hover:shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
    >
      <div className="flex min-h-36 items-center justify-center bg-[#071f41]/8 px-4 py-8">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#071f41] text-white transition group-hover:scale-105">
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-4 py-4">
        <p className="text-sm font-semibold text-[#071f41]">Add a course</p>
        <p className="text-sm text-slate-500">
          Upload a classlist to create a new offering.
        </p>
      </div>
    </button>
  );
}

function AddCourseOverlay({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#071f41]/55 px-4 py-8 backdrop-blur-[2px] sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create course offering"
        className="relative my-auto w-full max-w-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -right-1 -top-1 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 sm:-right-3 sm:-top-3"
        >
          <X className="h-4 w-4" />
        </button>
        <AdminClasslistUploadSection onSuccess={onSuccess} />
      </div>
    </div>
  );
}

type CoursePickerProps = {
  courses: CoursePickerItem[];
  canAddCourse: boolean;
};

export function CoursePicker({ courses, canAddCourse }: CoursePickerProps) {
  const router = useRouter();
  const [overlayOpen, setOverlayOpen] = useState(false);

  return (
    <>
      {courses.length === 0 && !canAddCourse ? (
        <p className="rounded-lg bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
          You are not in any courses yet.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.offeringPublicId} course={course} />
          ))}
          {canAddCourse ? (
            <AddCourseCard onClick={() => setOverlayOpen(true)} />
          ) : null}
        </div>
      )}

      {canAddCourse ? (
        <AddCourseOverlay
          isOpen={overlayOpen}
          onClose={() => setOverlayOpen(false)}
          onSuccess={() => {
            setOverlayOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}
