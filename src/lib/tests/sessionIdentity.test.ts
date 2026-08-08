import assert from "node:assert/strict";

import {
  resolveAuthIdentity,
  shouldRefreshSessionIdentity,
} from "@/lib/auth/sessionIdentity";

const syntheticShibbolethIdentity = {
  utorid: "teststaff1",
  firstName: "Test",
  lastName: "Staff",
  email: "teststaff1@example.test",
};

const syntheticDevelopmentIdentity = {
  utorid: "teststudent1",
  firstName: "Test",
  lastName: "Student",
  email: null,
};

assert.deepEqual(
  resolveAuthIdentity({
    isProduction: true,
    shibboleth: syntheticShibbolethIdentity,
    development: syntheticDevelopmentIdentity,
  }),
  syntheticShibbolethIdentity,
  "production should use the Shibboleth identity",
);

assert.equal(
  resolveAuthIdentity({
    isProduction: true,
    shibboleth: {
      utorid: null,
      firstName: null,
      lastName: null,
      email: null,
    },
    development: syntheticDevelopmentIdentity,
  }).utorid,
  null,
  "production must not fall back to DEV_UTORID",
);

assert.deepEqual(
  resolveAuthIdentity({
    isProduction: false,
    shibboleth: syntheticShibbolethIdentity,
    development: syntheticDevelopmentIdentity,
  }),
  {
    ...syntheticDevelopmentIdentity,
    email: "teststudent1@mail.utoronto.ca",
  },
  "development should use DEV_* identity values",
);

assert.equal(
  shouldRefreshSessionIdentity(true, "teststaff1", "teststudent1"),
  true,
  "a changed production identity should refresh the app session",
);
assert.equal(
  shouldRefreshSessionIdentity(true, "TestStaff1", "teststaff1"),
  false,
  "UTORid comparison should be case-insensitive",
);
assert.equal(
  shouldRefreshSessionIdentity(true, null, "teststudent1"),
  false,
  "a missing optional Shibboleth header should not cause a redirect loop",
);
assert.equal(
  shouldRefreshSessionIdentity(false, "teststaff1", "teststudent1"),
  false,
  "development identity switching remains controlled by DEV_UTORID",
);

console.log("Results: 7 passed, 0 failed");
