import { redirect } from "next/navigation";

import { AdminDashboard } from "@/app/components/admin/AdminDashboard";
import {
  COURSE_NAV_ITEMS,
  courseNavEndItems,
} from "@/app/components/course/courseNav";
import { Navbar } from "@/app/components/shared/Navbar";
import { isAdmin } from "@/lib/adminList";
import { canUploadAdminClasslist } from "@/lib/auth/canAccessAdmin";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { resolveHomeRedirectPath } from "@/lib/auth/resolveHomeRedirect";
import { listAllOfferings } from "@/lib/queries/admin/offerings";

export default async function AdminPage() {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/admin");
  }

  const userId = parseSessionUserId(session);
  if (!isAdmin(session.utorid)) {
    redirect(await resolveHomeRedirectPath(userId, session.utorid));
  }

  const viewerIsSuperAdmin = true;
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
          canUploadClasslist={canUploadAdminClasslist(session.utorid)}
          offerings={offerings}
        />
      </div>
    </main>
  );
}
