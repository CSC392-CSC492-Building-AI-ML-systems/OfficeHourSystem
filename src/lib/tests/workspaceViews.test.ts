import assert from "node:assert/strict";

import {
  buildAvailableWorkspaceViews,
  resolveDefaultWorkspacePath,
} from "@/lib/auth/workspaceViews";

const cases = [
  {
    name: "student-only users stay in the student view",
    input: { viewerIsAdmin: false, isInstructor: false, roles: ["STUDENT"] },
    views: ["student"],
    home: "/student",
  },
  {
    name: "TA users use the instructor view",
    input: { viewerIsAdmin: false, isInstructor: false, roles: ["TA"] },
    views: ["instructor"],
    home: "/course",
  },
  {
    name: "student and TA users can switch and default to instructor",
    input: {
      viewerIsAdmin: false,
      isInstructor: false,
      roles: ["STUDENT", "TA"],
    },
    views: ["student", "instructor"],
    home: "/course",
  },
  {
    name: "platform instructors default to the instructor view",
    input: { viewerIsAdmin: false, isInstructor: true, roles: [] },
    views: ["instructor"],
    home: "/course",
  },
  {
    name: "admins can switch to instructor and default to admin",
    input: { viewerIsAdmin: true, isInstructor: false, roles: [] },
    views: ["instructor", "admin"],
    home: "/admin",
  },
  {
    name: "admin students can access all three views",
    input: {
      viewerIsAdmin: true,
      isInstructor: false,
      roles: ["STUDENT"],
    },
    views: ["student", "instructor", "admin"],
    home: "/admin",
  },
] as const;

for (const testCase of cases) {
  const views = buildAvailableWorkspaceViews(testCase.input);
  assert.deepEqual(views, testCase.views, testCase.name);
  assert.equal(
    resolveDefaultWorkspacePath(views),
    testCase.home,
    `${testCase.name}: default path`,
  );
  console.log(`PASS ${testCase.name}`);
}

console.log(`\nResults: ${cases.length} passed, 0 failed`);
