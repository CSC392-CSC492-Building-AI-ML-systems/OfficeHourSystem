import Link from "next/link";
import { redirect } from "next/navigation";

import { getRequestSession } from "@/lib/auth/getRequestSession";
import { getRoleFromWhitelist } from "@/lib/whitelist";

export default async function AdminPage() {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/admin");
  }

  const whitelistRole = getRoleFromWhitelist(session.utorid);
  if (whitelistRole !== "INSTRUCTOR") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-16">
        <section className="w-full max-w-lg rounded-[36px] border border-slate-200/80 bg-white px-8 py-10 text-center shadow-[0_30px_80px_-40px_rgba(7,31,65,0.45)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#c8102e]">
            Access denied
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#071f41]">
            Admin access required
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Your UTORid (<span className="font-mono">{session.utorid}</span>) is
            not listed in the instructor whitelist.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-full bg-[#071f41] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0a2a57]"
          >
            Return home
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <section className="w-full max-w-3xl rounded-[36px] border border-slate-200/80 bg-white px-8 py-10 shadow-[0_30px_80px_-40px_rgba(7,31,65,0.45)] sm:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#c8102e]">
          OHMS Admin
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#071f41]">
          Administration
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Signed in as{" "}
          <span className="font-mono text-[#071f41]">{session.utorid}</span> (
          {session.firstName} {session.lastName}). Your UTORid is on the
          instructor whitelist.
        </p>
      </section>
    </main>
  );
}
