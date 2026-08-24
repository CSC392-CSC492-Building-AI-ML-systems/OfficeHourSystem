import "dotenv/config";

import assert from "node:assert/strict";
import { sealData } from "iron-session";
import { NextRequest } from "next/server";

import { proxy } from "@/proxy";
import type { SessionData } from "@/lib/session";

const SECRET = "proxy-home-auth-test-secret-at-least-32-characters";

async function main() {
  process.env.SESSION_SECRET = SECRET;
  process.env.DEV_UTORID = "jacky_final_student";

  const noCookie = await proxy(new NextRequest("http://localhost/"));
  assert.equal(noCookie.status, 307);
  assert.equal(
    noCookie.headers.get("location"),
    "http://localhost/api/auth/session?redirect=%2F",
  );

  const publicBootstrap = await proxy(
    new NextRequest("http://localhost/api/auth/session?redirect=/"),
  );
  assert.equal(publicBootstrap.headers.get("x-middleware-next"), "1");

  const session: SessionData = {
    userId: "42",
    utorid: "jacky_final_student",
    firstName: "Jacky",
    lastName: "Student",
    email: "jacky_final_student@example.test",
  };
  const cookie = await sealData(session, { password: SECRET });
  const matchingCookie = await proxy(
    new NextRequest("http://localhost/", {
      headers: { cookie: `ohsystem_session=${cookie}` },
    }),
  );
  assert.equal(matchingCookie.headers.get("x-middleware-next"), "1");

  process.env.DEV_UTORID = "different_user";
  const mismatchedCookie = await proxy(
    new NextRequest("http://localhost/", {
      headers: { cookie: `ohsystem_session=${cookie}` },
    }),
  );
  assert.equal(mismatchedCookie.status, 307);

  console.log("proxy-home-auth.test.ts: all assertions passed");
}

void main();
