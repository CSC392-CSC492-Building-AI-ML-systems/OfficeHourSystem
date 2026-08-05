import "server-only";

import { McsAdminClient } from "@/lib/mcs/mcs-admin-client";

let client: McsAdminClient | null = null;

export function getMcsAdminClient(): McsAdminClient {
  if (client) return client;

  const baseUrl = process.env.MCS_ADMIN_API_BASE_URL;
  const apiKey = process.env.MCS_ADMIN_API_KEY;
  const email = process.env.MCS_ADMIN_EMAIL;
  const password = process.env.MCS_ADMIN_PASSWORD;

  if (!baseUrl || !apiKey || !email || !password) {
    throw new Error("MCS Admin API environment variables are not configured");
  }

  client = new McsAdminClient({ baseUrl, apiKey, email, password });
  return client;
}
