import { redirect } from "next/navigation";

import CommandCenter from "@/app/components/instructor/CommandCenter";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { getCommandCenterPage } from "@/lib/queries/commandCenter";

export default async function InstructorPage() {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/instructor");
  }

  const userId = parseSessionUserId(session);
  const initialData = await getCommandCenterPage(userId);

  return (
    <main>
      <CommandCenter initialData={initialData} />
    </main>
  );
}
