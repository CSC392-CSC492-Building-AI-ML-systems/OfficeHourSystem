import { McsAdminApiError, McsAdminClient } from "@/lib/mcs/mcs-admin-client";

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  PASS ${name}`);
    passed++;
  } catch (error) {
    console.log(`  FAIL ${name}`);
    console.log(`    ${(error as Error).message}`);
    failed++;
  }
}

function expect<T>(actual: T, expected: T, label = "value"): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

function makeClient(fetchImpl: typeof fetch): McsAdminClient {
  return new McsAdminClient({
    baseUrl: "https://mcs.example.test/",
    apiKey: "test-api-key",
    email: "hourspace@example.test",
    password: "test-password",
    timeoutMs: 100,
    fetchImpl,
  });
}

function loginResponse(token: string): Response {
  return Response.json({
    access_token: { access_token: token },
  });
}

async function main(): Promise<void> {
  console.log("=== mcs-admin-client.test.ts ===\n");

  await test("logs in, looks up UTORid, and caches the bearer token", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const responses = [
      loginResponse("token-1"),
      Response.json({ utorid: "TestUser" }),
      Response.json({ utorid: "second01" }),
    ];
    const fetchImpl = (async (
      url: string | URL | Request,
      init?: RequestInit,
    ) => {
      calls.push({ url: String(url), init });
      return responses.shift()!;
    }) as typeof fetch;

    const client = makeClient(fetchImpl);
    expect(await client.lookupUtoridByCsn("57890976857137921"), "testuser");
    expect(await client.lookupUtoridByCsn("12345678901234567"), "second01");
    expect(calls.length, 3, "request count");
    expect(
      calls[0]!.url,
      "https://mcs.example.test/api/authentication/login",
      "login URL",
    );
    expect(
      calls[1]!.url,
      "https://mcs.example.test/api/external/barcodes/57890976857137921",
      "lookup URL",
    );
    expect(
      (calls[1]!.init?.headers as Record<string, string>).Authorization,
      "Bearer token-1",
      "authorization header",
    );
  });

  await test("refreshes the token and retries once after a 401", async () => {
    const responses = [
      loginResponse("expired-token"),
      new Response(null, { status: 401 }),
      loginResponse("fresh-token"),
      Response.json({ utorid: "fresh123" }),
    ];
    const authorizations: Array<string | undefined> = [];
    const fetchImpl = (async (
      _url: string | URL | Request,
      init?: RequestInit,
    ) => {
      authorizations.push(
        (init?.headers as Record<string, string>)?.Authorization,
      );
      return responses.shift()!;
    }) as typeof fetch;

    const result =
      await makeClient(fetchImpl).lookupUtoridByCsn("57890976857137921");
    expect(result, "fresh123");
    expect(authorizations, [
      undefined,
      "Bearer expired-token",
      undefined,
      "Bearer fresh-token",
    ]);
  });

  await test("retries a transient 5xx response once", async () => {
    const responses = [
      loginResponse("token-1"),
      new Response(null, { status: 503 }),
      Response.json({ utorid: "retry123" }),
    ];
    let requestCount = 0;
    const fetchImpl = (async () => {
      requestCount++;
      return responses.shift()!;
    }) as typeof fetch;

    const result =
      await makeClient(fetchImpl).lookupUtoridByCsn("57890976857137921");
    expect(result, "retry123");
    expect(requestCount, 3, "request count");
  });

  await test("returns null for an unknown CSN without retrying", async () => {
    const responses = [
      loginResponse("token-1"),
      new Response(null, { status: 404 }),
    ];
    let requestCount = 0;
    const fetchImpl = (async () => {
      requestCount++;
      return responses.shift()!;
    }) as typeof fetch;

    const result =
      await makeClient(fetchImpl).lookupUtoridByCsn("57890976857137921");
    expect(result, null);
    expect(requestCount, 2, "request count");
  });

  await test("retries a network failure once without exposing the CSN", async () => {
    let requestCount = 0;
    const fetchImpl = (async () => {
      requestCount++;
      throw new Error("network down");
    }) as typeof fetch;

    try {
      await makeClient(fetchImpl).lookupUtoridByCsn("57890976857137921");
      throw new Error("expected lookup to fail");
    } catch (error) {
      if (!(error instanceof McsAdminApiError)) throw error;
      expect(requestCount, 2, "request count");
      expect(error.message.includes("57890976857137921"), false, "CSN leaked");
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
