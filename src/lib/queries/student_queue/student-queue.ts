import { prisma } from "@/lib/prisma";

export async function getActiveTicketsForStudent(userId: number) {
  const tickets = await prisma.officeHourAttendance.findMany({
    where: {
      studentId: userId,
      status: { in: ["WAITING", "IN_HELP"] },
    },
    select: {
      publicId: true,
      status: true,
      checkedInAt: true,
      session: {
        select: {
          publicId: true,
          title: true,
          location: true,
          startsAt: true,
          endsAt: true,
          offering: {
            select: { course: { select: { code: true } } },
          },
        },
      },
    },
    orderBy: { checkedInAt: "asc" },
  });

  return tickets;
}

// Count how many WAITING students checked in before this student in the same session
export async function getQueuePosition(
  sessionId: string,
  checkedInAt: Date,
): Promise<number> {
  const ahead = await prisma.officeHourAttendance.count({
    where: {
      session: { publicId: sessionId },
      status: "WAITING",
      checkedInAt: { lt: checkedInAt },
    },
  });
  return ahead + 1; // 1-indexed
}
