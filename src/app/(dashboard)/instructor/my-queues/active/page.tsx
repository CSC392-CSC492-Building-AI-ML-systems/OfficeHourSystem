import { Suspense } from "react";
import ActiveQueuePage from "@/app/components/instructor/queues/ActiveQueuePage";

export default function InstructorActiveQueueRoute() {
  return (
    <main>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#f4f7fb]" aria-hidden="true" />
        }
      >
        <ActiveQueuePage />
      </Suspense>
    </main>
  );
}
