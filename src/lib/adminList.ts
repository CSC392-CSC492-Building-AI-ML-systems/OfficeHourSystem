import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// Admin list
//
// Reads `adminList.txt` (or the path in ADMIN_LIST_PATH env var) to determine
// which UTORids may access /admin. One UTORid per line; comment lines start with #.
//
// File format (one entry per line):
//   utorid
//   # comment lines are ignored
//
// Example:
//   smithj
//   doejohn
// ---------------------------------------------------------------------------

function parseUtoridLines(contents: string): string[] {
  const utorids: string[] = [];
  const seen = new Set<string>();

  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const utorid = line.toLowerCase();
    if (!seen.has(utorid)) {
      seen.add(utorid);
      utorids.push(utorid);
    }
  }

  return utorids;
}

function loadAdminList(): Set<string> {
  const adminListPath = resolve(
    process.env.ADMIN_LIST_PATH ?? "./adminList.txt",
  );

  let contents: string;
  try {
    contents = readFileSync(adminListPath, "utf-8");
  } catch {
    console.warn(
      `[adminList] Could not read admin list at ${adminListPath}. No users will have admin access.`,
    );
    return new Set();
  }

  return new Set(parseUtoridLines(contents));
}

// Loaded once at startup (module-level cache).
// Restart the server to pick up changes to adminList.txt.
const ADMIN_LIST: Set<string> = loadAdminList();

/** Parse UTORids from admin list text (one per line, `#` comments ignored). */
export function parseAdminList(contents: string): string[] {
  return parseUtoridLines(contents);
}

/** Returns true when the UTORid is listed in adminList.txt. */
export function isAdmin(utorid: string): boolean {
  return ADMIN_LIST.has(utorid.toLowerCase());
}
