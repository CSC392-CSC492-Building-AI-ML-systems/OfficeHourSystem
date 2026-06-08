import type { ClasslistRow } from "@/lib/queries/classlist";

/** UofT classlist export column names used by importClasslist. */
export const CLASSLIST_CSV_HEADERS = [
  "Acad_act",
  "Email",
  "Surname",
  "Given Name",
  "Current_sts",
  "UTORid",
  "Person ID",
] as const;

type RawCSVRow = Record<string, string>;

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function parseCSVLines(text: string): string[] {
  return normalizeLineEndings(text)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseRawRows(text: string): RawCSVRow[] {
  const lines = parseCSVLines(text);
  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  const headers = parseCSVLine(lines[0]);
  const missingHeaders = CLASSLIST_CSV_HEADERS.filter(
    (header) => !headers.includes(header),
  );
  if (missingHeaders.length > 0) {
    throw new Error(
      `CSV is missing required columns: ${missingHeaders.join(", ")}`,
    );
  }

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row: RawCSVRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() ?? "";
    });
    return row;
  });
}

/** First segment of Acad_act (e.g. "CSC398H5" from "CSC398H5,..."). */
export function extractCourseCode(acadAct: string): string {
  const trimmed = acadAct.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.includes(",") ? trimmed.split(",")[0].trim() : trimmed;
}

function resolveFirstName(raw: RawCSVRow): string {
  // UofT exports use "Prefered Name"; accept both spellings.
  const preferredName =
    raw["Prefered Name"]?.trim() || raw["Preferred Name"]?.trim() || "";
  if (preferredName) {
    return preferredName;
  }
  return raw["Given Name"]?.trim() ?? "";
}

export function rawRowToClasslistRow(raw: RawCSVRow): ClasslistRow {
  const acadAct = raw["Acad_act"]?.trim() ?? "";
  return {
    Acad_act: extractCourseCode(acadAct) || acadAct,
    Email: raw["Email"]?.trim() ?? "",
    Surname: raw["Surname"]?.trim() ?? "",
    "Given Name": resolveFirstName(raw),
    "Person ID": raw["Person ID"]?.trim() ?? "",
    Current_sts: raw["Current_sts"]?.trim() ?? "",
    UTORid: raw["UTORid"]?.trim() ?? "",
  };
}

export function parseClasslistCSVText(text: string): ClasslistRow[] {
  return parseRawRows(text).map(rawRowToClasslistRow);
}
