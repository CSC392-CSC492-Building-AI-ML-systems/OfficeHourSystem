import { redirect } from "next/navigation";

import { StudentMyQueuePage } from "@/app/components/student/StudentMyQueuePage";
import { Navbar } from "@/app/components/student/Navbar";
import { getRequestSession } from "@/lib/auth/getRequestSession";
import { getStudentQueueService } from "@/services/student_queue/student-queue";

export default async function StudentMyQueueRoute() {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/student/my-queue");
  }

  const tickets = await getStudentQueueService();

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar />
        <main className="mt-10">
          <StudentMyQueuePage initialTickets={tickets} />
        </main>
      </div>
    </div>
  );
}
