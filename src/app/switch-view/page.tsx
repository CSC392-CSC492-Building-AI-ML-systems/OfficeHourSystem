import Link from "next/link";
import { redirect } from "next/navigation";

import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import {
  resolveAvailableWorkspaceViews,
  resolveDefaultWorkspacePath,
  WORKSPACE_VIEW_HREFS,
  type WorkspaceView,
} from "@/lib/auth/resolveHomeRedirect";

const VIEW_LABELS: Record<WorkspaceView, string> = {
  student: "Student",
  instructor: "Instructor",
  admin: "Admin",
};

export default async function SwitchViewPage() {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/switch-view");
  }

  const views = await resolveAvailableWorkspaceViews(
    parseSessionUserId(session),
    session.utorid,
  );
  if (views.length < 2) {
    redirect(resolveDefaultWorkspacePath(views));
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-12 text-slate-900 sm:px-6">
      <section className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-semibold text-[#071f41] sm:text-4xl">
          Select a view
        </h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {views.map((view) => (
            <Link
              key={view}
              href={WORKSPACE_VIEW_HREFS[view]}
              className="flex min-h-36 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-2xl font-semibold text-[#071f41] shadow-sm transition hover:border-[#071f41]"
            >
              {VIEW_LABELS[view]}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
