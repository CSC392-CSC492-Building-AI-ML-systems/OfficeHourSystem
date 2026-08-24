import { isAdmin } from "@/lib/adminList";
import { prisma } from "@/lib/prisma";

export type UserAudienceProfile = {
  kind: "student" | "staff";
  isInstructor: boolean;
};

type AudienceClient = {
  user: {
    findUnique(args: unknown): Promise<{
      isInstructor: boolean;
      memberships: { role: "TA" | "INSTRUCTOR" }[];
    } | null>;
  };
};

export async function getUserAudienceProfile(
  userId: number,
  utorid: string,
  client?: AudienceClient,
): Promise<UserAudienceProfile | null> {
  const db = client ?? (prisma as unknown as AudienceClient);
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      isInstructor: true,
      memberships: {
        where: { role: { in: ["TA", "INSTRUCTOR"] } },
        select: { role: true },
        take: 1,
      },
    },
  });

  if (!user) return null;
  const isStaff =
    isAdmin(utorid) || user.isInstructor || user.memberships.length > 0;
  return {
    kind: isStaff ? "staff" : "student",
    isInstructor: user.isInstructor,
  };
}
