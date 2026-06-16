/**
 * Tests: parseIdentifier()
 *
 * How to run:
 *   pnpm dlx tsx src/lib/tests/scan_check_in/parse-identifier.test.ts
 *
 * No database needed — pure function tests.
 *
 * Scenarios covered:
 *   TCard swipe (well-formed):
 *     1.  ASCII separators  %name^name^1011661168^date?;barcode?
 *     2.  Chinese ellipsis  %NAME……NAME……1011661168……date？；barcode？
 *     3.  Different student / multi-field swipe
 *   TCard swipe (edge-case — missing trailing separator):
 *     4.  Date digits fused into student number → barcode fallback
 *   Barcode:
 *     5.  Standalone 16-digit string
 *     6.  16-digit with surrounding whitespace
 *   Student number:
 *     7.  Exactly 10 digits
 *     8.  10 digits with surrounding whitespace
 *   UTORid:
 *     9.  Standard 8-char id
 *     10. Must start with a letter (not a digit)
 *     11. Exactly 8 chars (9-char input rejected)
 *   Invalid inputs:
 *     12. Empty string
 *     13. Whitespace only
 *     14. 9-digit number
 *     15. 11-digit number
 *     16. 15-digit barcode (one short)
 *     17. 17-digit barcode (one long)
 *     18. Mixed alphanumeric that looks like neither
 *     19. UTORid with uppercase (rejected — must be lowercase)
 *     20. 7-char lowercase string
 */

import { parseIdentifier } from "@/lib/utils/scan_check_in/parse-identifier";

// ── Minimal test runner (no external deps) ────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}`);
    console.log(`    → ${(e as Error).message}`);
    failed++;
  }
}

function expect<T>(actual: T, expected: T, label = ""): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${label ? label + ": " : ""}expected ${e}, got ${a}`);
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log("=== parse-identifier.test.ts ===\n");

// ── TCard swipe: well-formed ──────────────────────────────────────────────────

test("TCard swipe — ASCII separators (^) extracts student number", () => {
  // Real swipe: %haozhe^huo^1011661168^8/20/2024?;2176103009687101?
  const raw = "%haozhe^huo^1011661168^8/20/2024?;2176103009687101?";
  expect(parseIdentifier(raw), { type: "student_number", value: "1011661168" });
});

test("TCard swipe — uppercase name, Chinese ellipsis (……) separator", () => {
  // Real swipe from field testing
  const raw =
    "%HAOZHE\u2026\u2026HUO\u2026\u2026" +
    "1011661168" +
    "\u2026\u20268/20/2024\uff1f\uff1b2176103009687101\uff1f";
  expect(parseIdentifier(raw), { type: "student_number", value: "1011661168" });
});

test("TCard swipe — different student (jingcheng liang)", () => {
  // Real swipe: %jingcheng^liang^1011097965^2/6/2026?;2176102914868302?
  const raw = "%jingcheng^liang^1011097965^2/6/2026?;2176102914868302?";
  expect(parseIdentifier(raw), { type: "student_number", value: "1011097965" });
});

test("TCard swipe — single-char separator wrapping student number", () => {
  // Simplified: ;1234567890;
  expect(parseIdentifier(";1234567890;"), {
    type: "student_number",
    value: "1234567890",
  });
});

test("TCard swipe — full-width question marks as separator", () => {
  // ？1234567890？
  expect(parseIdentifier("\uff1f1234567890\uff1f"), {
    type: "student_number",
    value: "1234567890",
  });
});

// ── TCard swipe: edge-case (missing trailing separator) ───────────────────────

test("TCard swipe fallback — missing trailing separator, extracts barcode", () => {
  // Date digits (8/20) fused into student number → swiper regex fails,
  // fallback finds the 16-digit barcode that follows
  const raw =
    "%HAOZHE\u2026\u2026HUO\u2026\u20261011661168" +
    "8/20/2024\uff1f\uff1b2176103009687101\uff1f";
  // Student number would be 10116611688 (11 digits) — no match for regex
  // Barcode fallback: first 16-digit run = 2176103009687101
  expect(parseIdentifier(raw), { type: "barcode", value: "2176103009687101" });
});

test("TCard swipe fallback — % prefix but no 16-digit sequence → null", () => {
  // A swiper string with no extractable barcode
  expect(parseIdentifier("%name^nodigits^here^"), null);
});

// ── Barcode (standalone) ──────────────────────────────────────────────────────

test("Barcode — exactly 16 digits", () => {
  expect(parseIdentifier("2176301960087102"), {
    type: "barcode",
    value: "2176301960087102",
  });
});

test("Barcode — 16 digits with surrounding whitespace", () => {
  expect(parseIdentifier("  2176301960087102  "), {
    type: "barcode",
    value: "2176301960087102",
  });
});

test("Barcode — all zeros (valid 16-digit string)", () => {
  expect(parseIdentifier("0000000000000000"), {
    type: "barcode",
    value: "0000000000000000",
  });
});

// ── Student number (manual) ───────────────────────────────────────────────────

test("Student number — exactly 10 digits", () => {
  expect(parseIdentifier("1234567890"), {
    type: "student_number",
    value: "1234567890",
  });
});

test("Student number — 10 digits with surrounding whitespace", () => {
  expect(parseIdentifier("  1234567890  "), {
    type: "student_number",
    value: "1234567890",
  });
});

test("Student number — 10 zeros", () => {
  expect(parseIdentifier("0000000000"), {
    type: "student_number",
    value: "0000000000",
  });
});

// ── UTORid (manual) ───────────────────────────────────────────────────────────

test("UTORid — standard 8-char id", () => {
  expect(parseIdentifier("chenjohn"), { type: "utorid", value: "chenjohn" });
});

test("UTORid — starts with letter, rest contains digits", () => {
  expect(parseIdentifier("huo00001"), { type: "utorid", value: "huo00001" });
});

test("UTORid — all lowercase letters", () => {
  expect(parseIdentifier("abcdefgh"), { type: "utorid", value: "abcdefgh" });
});

test("UTORid — with leading/trailing whitespace", () => {
  expect(parseIdentifier("  chenjohn  "), {
    type: "utorid",
    value: "chenjohn",
  });
});

// ── Invalid inputs ────────────────────────────────────────────────────────────

test("Invalid — empty string → null", () => {
  expect(parseIdentifier(""), null);
});

test("Invalid — whitespace only → null", () => {
  expect(parseIdentifier("   "), null);
});

test("Invalid — 9-digit number (too short for student number) → null", () => {
  expect(parseIdentifier("123456789"), null);
});

test("Invalid — 11-digit number (too long for student number) → null", () => {
  expect(parseIdentifier("12345678901"), null);
});

test("Invalid — 15-digit number (one short of barcode) → null", () => {
  expect(parseIdentifier("217630196008710"), null);
});

test("Invalid — 17-digit number (one long of barcode) → null", () => {
  expect(parseIdentifier("21763019600871020"), null);
});

test("Invalid — UTORid with uppercase (must be all lowercase) → null", () => {
  expect(parseIdentifier("ChenJohn"), null);
});

test("Invalid — UTORid starting with digit → null", () => {
  expect(parseIdentifier("1henjohn"), null);
});

test("Invalid — 7-char lowercase string (one short of UTORid) → null", () => {
  expect(parseIdentifier("abcdefg"), null);
});

test("Invalid — 9-char lowercase string (one long for UTORid) → null", () => {
  expect(parseIdentifier("abcdefghi"), null);
});

test("Invalid — arbitrary mixed string → null", () => {
  expect(parseIdentifier("hello world"), null);
});

test("Invalid — looks like swipe but separator doesn't match (asymmetric) → null", () => {
  // ^1234567890! — opening ^ does not match closing !
  expect(parseIdentifier("^1234567890!"), null);
});

// ── Edge cases ────────────────────────────────────────────────────────────────

test("Newline appended by scanner — stripped before parse (student number)", () => {
  // ScanPage strips \\n before calling parseIdentifier
  expect(parseIdentifier("1234567890\n"), {
    type: "student_number",
    value: "1234567890",
  });
});

test("Newline appended by scanner — stripped before parse (UTORid)", () => {
  expect(parseIdentifier("chenjohn\n"), { type: "utorid", value: "chenjohn" });
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
