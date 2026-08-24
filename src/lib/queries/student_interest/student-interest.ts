import { prisma } from "@/lib/prisma";
import { formatCourseLabel } from "@/lib/courseLabel";

export type InterestedSessionDto = {
  sessionId: number;
  sessionPublicId: string;
  type: "REGULAR" | "DEBUGGING" | "GROUP";
  courseLabel: string;
  title: string;
  location: string;
  startsAt: string;
  endsAt: string;
};

type InterestedSessionRecord = {
  session: {
    id: number;
    publicId: string;
    type: "REGULAR" | "DEBUGGING" | "GROUP";
    title: string;
    location: string | null;
    startsAt: Date;
    endsAt: Date;
    offering: { termCode: string; course: { code: string } };
  };
};

export type InterestedSessionsClient = {
  officeHourInterest: {
    findMany(args: unknown): Promise<InterestedSessionRecord[]>;
  };
};

export async function getInterestedSessionsForStudent(
  userId: number,
  now = new Date(),
  client?: InterestedSessionsClient,
): Promise<InterestedSessionDto[]> {
  const db = client ?? (prisma as unknown as InterestedSessionsClient);
  const interests = await db.officeHourInterest.findMany({
    where: {
      userId,
      session: {
        endsAt: { gt: now },
        status: { in: ["SCHEDULED", "DELAYED"] },
        offering: {
          archivedAt: null,
          members: { some: { userId, role: "STUDENT" } },
        },
      },
    },
    select: {
      session: {
        select: {
          id: true,
          publicId: true,
          type: true,
          title: true,
          location: true,
          startsAt: true,
          endsAt: true,
          offering: {
            select: {
              termCode: true,
              course: { select: { code: true } },
            },
          },
        },
      },
    },
    orderBy: { session: { startsAt: "asc" } },
  });

  return interests.map(({ session }) => ({
    sessionId: session.id,
    sessionPublicId: session.publicId,
    type: session.type,
    courseLabel: formatCourseLabel(
      session.offering.course.code,
      session.offering.termCode,
    ),
    title: session.title,
    location: session.location ?? "TBD",
    startsAt: session.startsAt.toISOString(),
    endsAt: session.endsAt.toISOString(),
  }));
}
