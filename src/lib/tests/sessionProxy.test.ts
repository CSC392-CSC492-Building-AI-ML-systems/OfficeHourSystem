import assert from "node:assert/strict";

import { sealData } from "iron-session";
import { NextRequest } from "next/server";

import { proxy } from "@/proxy";
import type { SessionData } from "@/lib/session";

const originalNodeEnv = process.env.NODE_ENV;
const originalSessionSecret = process.env.SESSION_SECRET;
const sessionSecret = "test-only-session-secret-at-least-32-characters";

async function requestWithSession(
  method: string,
  shibbolethUtorid: string | null,
  sessionUtorid: string,
) {
  const sessionData: SessionData = {
    userId: "42",
    utorid: sessionUtorid,
    firstName: "Test",
    lastName: "User",
    email: `${sessionUtorid}@example.test`,
  };
  const session = await sealData(sessionData, { password: sessionSecret });
  const headers = new Headers({
    cookie: `ohsystem_session=${session}`,
  });
  if (shibbolethUtorid) headers.set("utorid", shibbolethUtorid);

  return proxy(
    new NextRequest("https://hourspace.example.test/student", {
      method,
      headers,
    }),
  );
}

async function main() {
  Reflect.set(process.env, "NODE_ENV", "production");
  process.env.SESSION_SECRET = sessionSecret;

  try {
    const matchingIdentity = await requestWithSession(
      "GET",
      "teststudent1",
      "teststudent1",
    );
    assert.equal(matchingIdentity.status, 200);
    assert.equal(matchingIdentity.headers.get("x-middleware-next"), "1");
    assert.match(
      matchingIdentity.headers.get("cache-control") ?? "",
      /no-store/,
    );

    const changedIdentity = await requestWithSession(
      "GET",
      "teststaff1",
      "teststudent1",
    );
    assert.equal(changedIdentity.status, 307);
    assert.match(
      changedIdentity.headers.get("location") ?? "",
      /\/api\/auth\/session\?redirect=%2Fstudent$/,
    );

    const changedIdentityWrite = await requestWithSession(
      "POST",
      "teststaff1",
      "teststudent1",
    );
    assert.equal(changedIdentityWrite.status, 401);

    const missingShibbolethIdentity = await requestWithSession(
      "GET",
      null,
      "teststudent1",
    );
    assert.equal(missingShibbolethIdentity.status, 307);

    console.log("Results: 4 passed, 0 failed");
  } finally {
    if (originalNodeEnv === undefined) {
      Reflect.deleteProperty(process.env, "NODE_ENV");
    } else {
      Reflect.set(process.env, "NODE_ENV", originalNodeEnv);
    }
    if (originalSessionSecret === undefined) {
      delete process.env.SESSION_SECRET;
    } else {
      process.env.SESSION_SECRET = originalSessionSecret;
    }
  }
}

void main();
