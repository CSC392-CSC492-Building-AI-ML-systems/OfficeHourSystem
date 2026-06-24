import { redirect } from "next/navigation";

// Course stats now always start from the course picker.
export default function InstructorCourseStatsRoute() {
  redirect("/instructor/course-stats/overview");
}
