import { requireInstructorSession } from "@/lib/auth/getUserRole";
import { importClasslist } from "@/lib/queries/classlist";

import { parseClasslistCSVText } from "./csv";

export type ClasslistUploadSuccess = {
  ok: true;
  courseCode: string;
  termCode: string;
  courseId: number;
  offeringId: number;
  cleared: number;
  imported: number;
};

export type ClasslistUploadFailure = {
  ok: false;
  error: string;
};

export type ClasslistUploadResult =
  | ClasslistUploadSuccess
  | ClasslistUploadFailure;

async function readCsvTextFromFormData(formData: FormData): Promise<string> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error('Missing CSV file. Expected form field "file".');
  }

  if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
    throw new Error("Upload must be a .csv file");
  }

  return file.text();
}

function readTermCodeFromFormData(formData: FormData): string {
  const termCode = formData.get("termCode");
  if (typeof termCode !== "string" || termCode.trim().length === 0) {
    throw new Error('Missing term code. Expected form field "termCode".');
  }

  return termCode.trim();
}

function toFailure(error: unknown): ClasslistUploadFailure {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Classlist upload failed",
  };
}

async function assertInstructorAccess(): Promise<void> {
  if (
    process.env.ALLOW_CLASSLIST_UPLOAD_BYPASS === "1" &&
    process.env.NODE_ENV !== "production"
  ) {
    return;
  }

  await requireInstructorSession();
}

/**
 * Parse an uploaded classlist CSV and import it in a single DB transaction.
 * Requires an authenticated instructor session (`ohsystem_session` cookie).
 */
export async function uploadClasslistFromFormData(
  formData: FormData,
): Promise<ClasslistUploadResult> {
  try {
    await assertInstructorAccess();

    const termCode = readTermCodeFromFormData(formData);
    const csvText = await readCsvTextFromFormData(formData);
    const rows = parseClasslistCSVText(csvText);

    if (rows.length === 0) {
      throw new Error("CSV file contains no student rows");
    }

    const courseCode = rows[0].Acad_act.trim();
    const result = await importClasslist({ termCode, rows });

    return {
      ok: true,
      courseCode,
      termCode,
      courseId: result.courseId,
      offeringId: result.offeringId,
      cleared: result.cleared,
      imported: result.imported,
    };
  } catch (error) {
    return toFailure(error);
  }
}

/**
 * Same as {@link uploadClasslistFromFormData} but accepts raw CSV text.
 * Used by `scripts/upload-classlist.ts` for local testing.
 */
export async function uploadClasslistFromText(
  csvText: string,
  termCode: string,
): Promise<ClasslistUploadResult> {
  const formData = new FormData();
  formData.set("termCode", termCode);
  formData.set(
    "file",
    new File([csvText], "classlist.csv", { type: "text/csv" }),
  );

  return uploadClasslistFromFormData(formData);
}
