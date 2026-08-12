/**
 * Import a local classlist CSV via uploadClasslistFromText().
 *
 * Usage:
 *   npx tsx scripts/upload-classlist.ts <file.csv> <termCode>
 *
 * Prerequisite:
 *   DATABASE_URL configured in .env
 *
 * Auth is bypassed for local non-production runs so you can test without
 * a browser session. Production uploads still require an instructor cookie.
 */

import "dotenv/config";
import fs from "node:fs";

async function main() {
  const csvPath = process.argv[2];
  const termCode = process.argv[3];

  if (!csvPath || !termCode) {
    console.error(
      "Usage: npx tsx scripts/upload-classlist.ts <file.csv> <termCode>",
    );
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production") {
    console.error("This script is for local development only.");
    process.exit(1);
  }

  process.env.ALLOW_CLASSLIST_UPLOAD_BYPASS = "1";

  const { uploadClasslistFromText } =
    await import("../src/lib/csv/processClasslistCSV");

  const csvText = fs.readFileSync(csvPath, "utf8");
  const result = await uploadClasslistFromText(csvText, termCode);

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
