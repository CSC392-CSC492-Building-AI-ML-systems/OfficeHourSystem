/**
 * Run: pnpm dlx tsx src/lib/tests/locationLink.test.ts
 */

import assert from "node:assert/strict";

import { locationContainsLink, splitLocationText } from "@/lib/locationLink";

assert.deepEqual(splitLocationText("DH 2034"), [
  { kind: "text", value: "DH 2034" },
]);

assert.deepEqual(splitLocationText("https://utoronto.zoom.us/j/12345678901"), [
  {
    kind: "link",
    href: "https://utoronto.zoom.us/j/12345678901",
    label: "https://utoronto.zoom.us/j/12345678901",
  },
]);

assert.deepEqual(splitLocationText("Join at https://zoom.us/j/abc?pwd=xyz."), [
  { kind: "text", value: "Join at " },
  {
    kind: "link",
    href: "https://zoom.us/j/abc?pwd=xyz",
    label: "https://zoom.us/j/abc?pwd=xyz",
  },
  { kind: "text", value: "." },
]);

assert.equal(locationContainsLink("Room 402"), false);
assert.equal(locationContainsLink("http://example.com"), true);

console.log("locationLink.test.ts: ok");
