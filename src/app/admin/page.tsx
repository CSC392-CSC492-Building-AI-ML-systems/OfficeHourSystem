import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminDashboard } from "@/app/components/admin/AdminDashboard";
import {
  COURSE_NAV_ITEMS,
  courseNavEndItems,
} from "@/app/components/course/courseNav";
import { Navbar } from "@/app/components/shared/Navbar";
import { isAdmin } from "@/lib/adminList";
import { userCanAccessAdmin } from "@/lib/auth/canAccessAdmin";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { listAllOfferings } from "@/lib/queries/admin/offerings";

export default async function AdminPage() {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/admin");
  }

  const userId = parseSessionUserId(session);
  const allowed = await userCanAccessAdmin(userId, session.utorid);

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4 py-16">
        <section className="w-full max-w-lg rounded-[36px] border border-slate-200/80 bg-white px-8 py-10 text-center shadow-[0_30px_80px_-40px_rgba(7,31,65,0.45)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#c8102e]">
            Access denied
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#071f41]">
            Admin access required
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Your UTORid (<span className="font-mono">{session.utorid}</span>) is
            not on the admin list and does not have instructor access.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/course"
              className="inline-block rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-[#071f41] transition hover:bg-slate-50"
            >
              Go to my courses
            </Link>
            <Link
              href="/"
              className="inline-block rounded-full bg-[#071f41] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0a2a57]"
            >
              Return home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const viewerIsSuperAdmin = isAdmin(session.utorid);
  const offerings = await listAllOfferings({
    viewerUserId: userId,
    viewerIsSuperAdmin,
  });

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar
          brandHref="/course"
          activeKey="admin"
          items={COURSE_NAV_ITEMS}
          endItems={courseNavEndItems(true)}
        />
        <AdminDashboard
          utorid={session.utorid}
          firstName={session.firstName}
          lastName={session.lastName}
          canBulkAddInstructors={viewerIsSuperAdmin}
          canUploadClasslist={viewerIsSuperAdmin}
          offerings={offerings}
        />
      </div>
    </main>
  );
}
