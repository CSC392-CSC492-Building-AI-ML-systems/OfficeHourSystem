import type { IdentifierType } from "@/lib/types/queue";

export interface ParsedIdentifier {
  type: IdentifierType;
  value: string;
}

/**
 * Parses raw scanner / swiper / manual input into a typed identifier.
 *
 * Formats recognised (in priority order):
 *
 * 1. TCard swipe — magnetic strip produces a string starting with `%` that
 *    contains a 10-digit student number wrapped in matching separators, e.g.
 *      %haozhe^huo^1011661168^8/20/2024?;2176103009687101?
 *      %HAOZHE……HUO……1011661168……8/20/2024？；2176103009687101？
 *    Regex: non-word/space/digit chars + 10 digits + the SAME chars again.
 *
 * 2. TCard swipe fallback — some swipers omit the trailing separator so the
 *    date digits run directly into the student number, making the symmetric
 *    match fail. If the input starts with `%` and case 1 didn't match, we
 *    look for any 16-digit sequence (the physical barcode on the card) instead.
 *      %HAOZHE……HUO……10116611688/20/2024？；2176103009687101？
 *                                            ^^^^^^^^^^^^^^^^ ← extracted
 *
 * 3. Barcode scanner — exactly 16 digits with no other content.
 *
 * 4. Student number — exactly 10 digits.
 *
 * 5. UTORid — 8 chars, starts with a lowercase letter, rest lowercase
 *    alphanumeric (e.g. "chenjohn").
 */
export function parseIdentifier(raw: string): ParsedIdentifier | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 1. TCard swipe: symmetric non-digit separator wrapping a 10-digit number
  //    e.g.  ^1011661168^   or   ……1011661168……
  const swiperMatch = trimmed.match(/([^\w\s\d]+)(\d{10})\1/);
  if (swiperMatch) return { type: "student_number", value: swiperMatch[2]! };

  // 2. TCard swipe fallback: the trailing separator was swallowed by the date
  //    digits. If the string came from a swiper (starts with %) look for a
  //    16-digit barcode sequence anywhere in the string.
  if (trimmed.startsWith("%")) {
    const barcodeInSwipe = trimmed.match(/(\d{16})/);
    if (barcodeInSwipe) return { type: "barcode", value: barcodeInSwipe[1]! };
  }

  // 3. Standalone barcode: exactly 16 digits
  if (/^\d{16}$/.test(trimmed)) return { type: "barcode", value: trimmed };

  // 4. Manual student number: exactly 10 digits
  if (/^\d{10}$/.test(trimmed)) return { type: "student_number", value: trimmed };

  // 5. Manual UTORid: 8 chars, starts with a lowercase letter
  if (/^[a-z][a-z0-9]{7}$/.test(trimmed)) return { type: "utorid", value: trimmed };

  return null;
}
