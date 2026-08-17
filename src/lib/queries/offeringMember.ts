import { type CourseRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * User identifier: one of four options.
 *   utorid e.g. "abcede12"
 *   email e.g. "xxx@mail.utoronto.ca"
 *   studentNumber e.g. "1011662167"
 *   publicId cuid from the User table (public id see schema)
 */
export type UserIdentifier =
  | { utorid: string }
  | { email: string }
  | { studentNumber: string }
  | { publicId: string };

/** Optional profile fields when registering staff by UTORid only. */
export type StaffMemberInput = {
  utorid: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

export type StaffUserRef = UserIdentifier | StaffMemberInput;

/**
 * Offering identifier: one of two options.
 *   publicId cuid from the CourseOffering table
 *   courseCode + termCode — e.g. { courseCode: "CSC392H5", termCode: "2026F" }
 */
export type OfferingIdentifier =
  | { publicId: string }
  | { courseCode: string; termCode: string };

function normalizeUtorid(utorid: string) {
  return utorid.trim().toLowerCase();
}

/** Convert a staff/user reference into a Prisma where condition */
function userWhere(id: StaffUserRef) {
  if ("utorid" in id) return { utorid: normalizeUtorid(id.utorid) };
  if ("email" in id) return { email: id.email };
  if ("studentNumber" in id) return { studentNumber: id.studentNumber };
  return { publicId: id.publicId };
}

/** Convert an OfferingIdentifier into a Prisma where condition */
function offeringWhere(id: OfferingIdentifier) {
  if ("publicId" in id) return { publicId: id.publicId };
  return {
    course: { code: id.courseCode },
    termCode: id.termCode,
  };
}

// Get a user's role in a given offering

/**
 * Look up a user's role in a given course offering.
 *
 * Returns:
 *   - { role: CourseRole } if the user is a member of the offering
 *   - null if the user does not exist, the offering does not exist,
 *     or the user is not a member of the offering
 *
 * Example:
 *   const result = await getMemberRole(
 *     { utorid: "abcde123" },
 *     { courseCode: "CSC392H5", termCode: "2026F" }
 *   );
 *   // result?.role === "INSTRUCTOR"
 */
export async function getMemberRole(
  userIdentifier: UserIdentifier,
  offeringIdentifier: OfferingIdentifier,
): Promise<{ role: CourseRole } | null> {
  // 1. Find user
  const user = await prisma.user.findFirst({
    where: userWhere(userIdentifier),
    select: { id: true },
  });

  if (!user) return null;

  // 2. Find offering
  const offering = await prisma.courseOffering.findFirst({
    where: offeringWhere(offeringIdentifier),
    select: { id: true },
  });

  if (!offering) return null;

  // 3. Find membership record
  const member = await prisma.offeringMember.findUnique({
    where: {
      userId_offeringId: {
        userId: user.id,
        offeringId: offering.id,
      },
    },
    select: { role: true },
  });

  if (!member) return null;

  return { role: member.role };
}

//Add or update a staff member in an offering

/**
 * Add a user to an offering or update their staff role.
 *
 * Add an INSTRUCTOR / TA role to an offering.
 * The STUDENT role can only be assigned via importClasslist() from a CSV file,
 * not through this function.
 *
 * Behaviour:
 *   - Offering does not exist -> throw error
 *   - Attempting to set STUDENT role -> throw error
 *   - User does not exist -> throw error (must have signed in via Shibboleth first)
 *   - User already enrolled as STUDENT on this offering -> throw error
 *   - User not yet in the offering -> create a new OfferingMember
 *   - User already staff on the offering -> update role
 *
 * Example:
 *   const result = await addOrUpdateStaffMember(
 *     { utorid: "tauser01" },
 *     { courseCode: "CSC392H5", termCode: "2026F" },
 *     "TA"
 *   );
 */
export async function addOrUpdateStaffMember(
  userRef: StaffUserRef,
  offeringIdentifier: OfferingIdentifier,
  role: CourseRole,
): Promise<{
  userId: number;
  offeringId: number;
  role: CourseRole;
  created: boolean;
}> {
  // Safety check: reject STUDENT role to prevent bypassing the classlist import process
  if (role === "STUDENT") {
    throw new Error(
      "STUDENT role cannot be assigned via this function. Use importClasslist() to import students from a classlist CSV.",
    );
  }

  // 1. Require an existing user (created via Shibboleth / auth session — never invent staff).
  const user = await prisma.user.findFirst({
    where: userWhere(userRef),
    select: { id: true },
  });

  if (!user) {
    throw new Error(
      "User not found. They must sign in to the app at least once before they can be added as staff.",
    );
  }

  // 2. Find offering (also throw if not found)
  const offering = await prisma.courseOffering.findFirst({
    where: offeringWhere(offeringIdentifier),
    select: { id: true },
  });

  if (!offering) {
    throw new Error("Course offering not found");
  }

  // 3. Check whether a membership record already exists (used to determine the created flag)
  const existing = await prisma.offeringMember.findUnique({
    where: {
      userId_offeringId: {
        userId: user.id,
        offeringId: offering.id,
      },
    },
    select: { id: true, role: true },
  });

  if (existing?.role === "STUDENT") {
    throw new Error(
      "This person is enrolled as a student in this course and cannot be added as staff. Remove them from the classlist first.",
    );
  }

  // 4. Upsert: create or update role
  const member = await prisma.offeringMember.upsert({
    where: {
      userId_offeringId: {
        userId: user.id,
        offeringId: offering.id,
      },
    },
    update: { role },
    create: {
      userId: user.id,
      offeringId: offering.id,
      role,
    },
    select: { role: true },
  });

  return {
    userId: user.id,
    offeringId: offering.id,
    role: member.role,
    created: existing === null,
  };
}

export type OfferingStaffMember = {
  id: string;
  utorid: string;
  name: string;
  email: string;
  role: "TA" | "Instructor";
};

function formatStaffName(user: {
  utorid: string;
  firstName: string | null;
  lastName: string | null;
}) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return name || user.utorid;
}

/** List teaching staff (TAs and instructors) for an offering. */
export async function getOfferingStaffMembers(
  offeringPublicId: string,
): Promise<OfferingStaffMember[]> {
  const offering = await prisma.courseOffering.findUnique({
    where: { publicId: offeringPublicId },
    select: { id: true },
  });

  if (!offering) {
    return [];
  }

  const members = await prisma.offeringMember.findMany({
    where: {
      offeringId: offering.id,
      role: { in: ["TA", "INSTRUCTOR"] },
    },
    include: {
      user: {
        select: {
          publicId: true,
          utorid: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { user: { lastName: "asc" } }],
  });

  return members.map((member) => ({
    id: member.user.publicId,
    utorid: member.user.utorid,
    name: formatStaffName(member.user),
    email: member.user.email ?? "",
    role: member.role === "INSTRUCTOR" ? "Instructor" : "TA",
  }));
}

/** Count active recurring office-hour blocks for an offering. */
export async function getActiveWeeklySlotCount(
  offeringPublicId: string,
): Promise<number> {
  const offering = await prisma.courseOffering.findUnique({
    where: { publicId: offeringPublicId },
    select: { id: true },
  });

  if (!offering) {
    return 0;
  }

  return prisma.officeHourSchedule.count({
    where: {
      offeringId: offering.id,
      isActive: true,
    },
  });
}

/** Remove a TA from an offering. Instructors cannot be removed here. */
export async function removeOfferingStaffMember(
  offeringPublicId: string,
  userPublicId: string,
): Promise<void> {
  const offering = await prisma.courseOffering.findUnique({
    where: { publicId: offeringPublicId },
    select: { id: true },
  });

  if (!offering) {
    throw new Error("Course offering not found");
  }

  const user = await prisma.user.findUnique({
    where: { publicId: userPublicId },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const member = await prisma.offeringMember.findUnique({
    where: {
      userId_offeringId: {
        userId: user.id,
        offeringId: offering.id,
      },
    },
    select: { role: true },
  });

  if (!member) {
    throw new Error("Staff member not found");
  }

  if (member.role !== "TA") {
    throw new Error("Only teaching assistants can be removed from this page.");
  }

  await prisma.offeringMember.delete({
    where: {
      userId_offeringId: {
        userId: user.id,
        offeringId: offering.id,
      },
    },
  });
}

export type OfferingStudentMember = {
  id: string;
  utorid: string;
  name: string;
  email: string;
};

/** List students enrolled in an offering. */
export async function getOfferingStudentMembers(
  offeringPublicId: string,
): Promise<OfferingStudentMember[]> {
  const offering = await prisma.courseOffering.findUnique({
    where: { publicId: offeringPublicId },
    select: { id: true },
  });

  if (!offering) {
    return [];
  }

  const members = await prisma.offeringMember.findMany({
    where: {
      offeringId: offering.id,
      role: "STUDENT",
    },
    include: {
      user: {
        select: {
          publicId: true,
          utorid: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [{ user: { lastName: "asc" } }, { user: { firstName: "asc" } }],
  });

  return members.map((member) => ({
    id: member.user.publicId,
    utorid: member.user.utorid,
    name: formatStaffName(member.user),
    email: member.user.email ?? "",
  }));
}

/** Remove a student from an offering roster. */
export async function removeOfferingStudentMember(
  offeringPublicId: string,
  userPublicId: string,
): Promise<void> {
  const offering = await prisma.courseOffering.findUnique({
    where: { publicId: offeringPublicId },
    select: { id: true },
  });

  if (!offering) {
    throw new Error("Course offering not found");
  }

  const user = await prisma.user.findUnique({
    where: { publicId: userPublicId },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const member = await prisma.offeringMember.findUnique({
    where: {
      userId_offeringId: {
        userId: user.id,
        offeringId: offering.id,
      },
    },
    select: { role: true },
  });

  if (!member) {
    throw new Error("Student not found in this course");
  }

  if (member.role !== "STUDENT") {
    throw new Error("Only enrolled students can be removed from this list.");
  }

  await prisma.offeringMember.delete({
    where: {
      userId_offeringId: {
        userId: user.id,
        offeringId: offering.id,
      },
    },
  });
}
