import { redirect } from "next/navigation";

// Keep both entry points: new UI at /course/stats, legacy at overview.
export default function InstructorCourseStatsRoute() {
  redirect("/instructor/course-stats/overview");
}
