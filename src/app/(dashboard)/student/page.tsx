import { redirect } from "next/navigation";

import StudentDashboard from "@/app/components/student/StudentDashboard";
import { getRequestSession } from "@/lib/auth/getRequestSession";
import { getStudentDashboardService } from "@/services/student_dashboard/student-dashboard";

export default async function StudentPage() {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/student");
  }

  const sessions = await getStudentDashboardService();

  return (
    <main>
      <StudentDashboard
        firstName={session.firstName || session.utorid}
        sessions={sessions}
      />
    </main>
  );
}
