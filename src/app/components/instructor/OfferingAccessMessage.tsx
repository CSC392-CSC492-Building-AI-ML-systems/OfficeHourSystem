import Link from "next/link";

import { OfferingAccessError } from "@/lib/auth/requireOfferingAccess";

type OfferingAccessMessageProps = {
  error: OfferingAccessError;
};

export function OfferingAccessMessage({ error }: OfferingAccessMessageProps) {
  const title =
    error.code === "missing"
      ? "No course selected"
      : error.code === "not_found"
        ? "Course not found"
        : "Access denied";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4 py-16">
      <section className="w-full max-w-lg rounded-[36px] border border-slate-200/80 bg-white px-8 py-10 text-center shadow-[0_30px_80px_-40px_rgba(7,31,65,0.45)]">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#c8102e]">
          {title}
        </p>
        <p className="mt-4 text-base leading-7 text-slate-600">
          {error.message}
        </p>
        <Link
          href="/admin"
          className="mt-8 inline-block rounded-full bg-[#071f41] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0a2a57]"
        >
          Back to admin
        </Link>
      </section>
    </main>
  );
}

export function offeringAccessFromUnknown(error: unknown): OfferingAccessError {
  if (error instanceof OfferingAccessError) {
    return error;
  }
  return new OfferingAccessError(
    error instanceof Error ? error.message : "Access denied",
    "forbidden",
  );
}
