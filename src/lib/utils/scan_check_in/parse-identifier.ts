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
 * 1. NFC UID - seven hexadecimal bytes, converted to the decimal CSN expected
 *    by the MCS Admin API.
 *
 * 2. TCard swipe — magnetic strip produces a string starting with `%` that
 *    contains a 10-digit student number wrapped in matching separators, e.g.
 *      %sample^student^1234567890^1/1/2030?;9876543210123456?
 *      %SAMPLE……STUDENT……1234567890……1/1/2030？；9876543210123456？
 *    Regex: non-word/space/digit chars + 10 digits + the SAME chars again.
 *
 * 3. TCard swipe fallback — some swipers omit the trailing separator so the
 *    date digits run directly into the student number, making the symmetric
 *    match fail. If the input starts with `%` and case 1 didn't match, we
 *    look for any 16-digit sequence (the physical barcode on the card) instead.
 *      %SAMPLE……STUDENT……12345678901/1/2030？；9876543210123456？
 *                                            ^^^^^^^^^^^^^^^^ ← extracted
 *
 * 4. Barcode scanner — exactly 16 digits with no other content.
 *
 * 5. Decimal CSN - exactly 17 digits.
 *
 * 6. Student number — exactly 10 digits.
 *
 * 7. UTORid — 8 chars, starts with a lowercase letter, rest lowercase
 *    alphanumeric (e.g. "chenjohn").
 */
export function parseIdentifier(raw: string): ParsedIdentifier | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // NFC readers expose the 7-byte TCard UID in display order. MCS stores the
  // reversed byte sequence as a decimal CSN.
  const nfcBytes = trimmed.split(/[\s:-]+/);
  if (
    nfcBytes.length === 7 &&
    nfcBytes.every((byte) => /^[0-9a-f]{2}$/i.test(byte))
  ) {
    const reversedHex = nfcBytes.reverse().join("");
    return { type: "csn", value: BigInt(`0x${reversedHex}`).toString(10) };
  }

  if (/^[0-9a-f]{14}$/i.test(trimmed)) {
    const bytes = trimmed.match(/.{2}/g)!;
    const reversedHex = bytes.reverse().join("");
    return { type: "csn", value: BigInt(`0x${reversedHex}`).toString(10) };
  }

  // 2. TCard swipe: symmetric non-digit separator wrapping a 10-digit number
  //    e.g.  ^1234567890^   or   ……1234567890……
  const swiperMatch = trimmed.match(/([^\w\s\d]+)(\d{10})\1/);
  if (swiperMatch) return { type: "student_number", value: swiperMatch[2]! };

  // 3. TCard swipe fallback: the trailing separator was swallowed by the date
  //    digits. If the string came from a swiper (starts with %) look for a
  //    16-digit barcode sequence anywhere in the string.
  if (trimmed.startsWith("%")) {
    const barcodeInSwipe = trimmed.match(/(\d{16})/);
    if (barcodeInSwipe) return { type: "barcode", value: barcodeInSwipe[1]! };
  }

  // 4. Standalone barcode: exactly 16 digits
  if (/^\d{16}$/.test(trimmed)) return { type: "barcode", value: trimmed };

  // 5. Decimal CSN returned by a reader or entered for diagnostics.
  if (/^\d{17}$/.test(trimmed)) return { type: "csn", value: trimmed };

  // 6. Manual student number: exactly 10 digits
  if (/^\d{10}$/.test(trimmed))
    return { type: "student_number", value: trimmed };

  // 7. Manual UTORid: 8 chars, starts with a lowercase letter
  if (/^[a-z][a-z0-9]{7}$/.test(trimmed))
    return { type: "utorid", value: trimmed };

  return null;
}
