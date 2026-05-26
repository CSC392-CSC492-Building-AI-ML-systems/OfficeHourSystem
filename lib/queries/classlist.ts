import { prisma } from "@/lib/prisma";

export type ClasslistRow = {
  Acad_act: string;
  Email: string;
  Surname: string;
  "Given Name": string;
  Current_sts: string;
  UTORid: string;
};

export type ImportClasslistInput = {
  termCode: string;
  rows: ClasslistRow[];
};

export async function importClasslist(input: ImportClasslistInput) {
  // Use transaction to make sure this import is all-or-nothing.
  // If any error happens inside, Prisma will rollback all database changes.
  return await prisma.$transaction(async (tx) => {
    const { termCode, rows } = input;

    if (!rows || rows.length === 0) {
      throw new Error("Cannot import an empty classlist");
    }

    // Assumption: one CSV is for one course offering.
    // So we get the course code from the first row.
    // e.g. "CSC398H5", "STA398H5"
    const courseCode = rows[0].Acad_act.trim();

    // 1. Find course based on course code.
    // If this course does not exist, create a new one.
    const course = await tx.course.upsert({
      where: {
        code: courseCode,
      },
      update: {},
      create: {
        code: courseCode,
      },
    });

    // 2. Find offering based on course id and term code.
    // In current schema, one course + one term = one offering.
    // If this offering does not exist, create a new one.
    const offering = await tx.courseOffering.upsert({
      where: {
        courseId_termCode: {
          courseId: course.id,
          termCode: termCode,
        },
      },
      update: {},
      create: {
        courseId: course.id,
        termCode: termCode,
      },
    });

    // 3. Check whether this offering already has imported students.
    // We only check STUDENT role here.
    // Do not delete TA or INSTRUCTOR members, because they are not from classlist CSV.
    const existingStudentCount = await tx.offeringMember.count({
      where: {
        offeringId: offering.id,
        role: "STUDENT",
      },
    });

    let cleared = 0;

    // 4. If this offering already has at least one student,
    // clear old student roster first.
    // This means the new CSV will replace the old CSV result.
    if (existingStudentCount > 0) {
      const deleteResult = await tx.offeringMember.deleteMany({
        where: {
          offeringId: offering.id,
          role: "STUDENT",
        },
      });

      cleared = deleteResult.count;
    }

    let imported = 0;
    let skipped = 0;

    // 5. Import students one row at a time.
    for (const row of rows) {
      const status = row.Current_sts.trim().toUpperCase();
      const utorid = row.UTORid.trim();

      // Only import active students.
      // For now, we only accept "APP".
      // Other status values will be skipped.
      // TODO: not 100% sure
      if (status !== "APP") {
        skipped++;
        continue;
      }

      // If an active student does not have utorid,
      // this means the CSV data is not valid enough for import.
      // Throw error here so transaction can rollback everything.
      if (!utorid) {
        throw new Error("CSV contains an active student row without UTORid");
      }

      // 6. Find user based on utorid.
      // If the user does not exist, create a new user.
      // If the user already exists, update name and email.
      const user = await tx.user.upsert({
        where: {
          utorid: utorid,
        },
        update: {
          email: row.Email.trim(),
          firstName: row["Given Name"].trim(),
          lastName: row.Surname.trim(),
        },
        create: {
          utorid: utorid,
          email: row.Email.trim(),
          firstName: row["Given Name"].trim(),
          lastName: row.Surname.trim(),
        },
      });

      // 7. Add this user to this offering as a student.
      // Since we may have cleared old student members above,
      // this usually creates a new OfferingMember.
      // But we still use upsert to avoid duplicate error if the CSV has repeated rows.
      await tx.offeringMember.upsert({
        where: {
          userId_offeringId: {
            userId: user.id,
            offeringId: offering.id,
          },
        },
        update: {
          role: "STUDENT",
        },
        create: {
          userId: user.id,
          offeringId: offering.id,
          role: "STUDENT",
        },
      });

      imported++;
    }

    // Return the import result to the caller.
    // This is useful for showing a success message on frontend.
    return {
      courseId: course.id,
      offeringId: offering.id,
      cleared,
      imported,
      skipped,
    };
  });
}
