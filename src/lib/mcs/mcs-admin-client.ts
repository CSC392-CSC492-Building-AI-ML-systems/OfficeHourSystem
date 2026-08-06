export interface McsAdminClientConfig {
  baseUrl: string;
  apiKey: string;
  email: string;
  password: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export class McsAdminApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "McsAdminApiError";
  }
}

export class McsAdminClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private accessToken: string | null = null;

  constructor(private readonly config: McsAdminClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.timeoutMs = config.timeoutMs ?? 5_000;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async lookupUtoridByCsn(csn: string): Promise<string | null> {
    if (!/^\d+$/.test(csn)) {
      throw new McsAdminApiError("Invalid CSN");
    }

    let token = await this.getAccessToken();
    let response = await this.fetchWithSingleRetry(
      `${this.baseUrl}/api/external/barcodes/${encodeURIComponent(csn)}`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.status === 401) {
      this.accessToken = null;
      token = await this.getAccessToken();
      response = await this.fetchOnce(
        `${this.baseUrl}/api/external/barcodes/${encodeURIComponent(csn)}`,
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
    }

    if (response.status === 404) return null;
    if (!response.ok) throw new McsAdminApiError("MCS CSN lookup failed");

    const data: unknown = await response.json();
    const utorid =
      typeof data === "object" && data !== null && "utorid" in data
        ? (data as { utorid?: unknown }).utorid
        : null;

    if (typeof utorid !== "string" || !utorid.trim()) {
      throw new McsAdminApiError("MCS CSN lookup returned an invalid response");
    }

    return utorid.trim().toLowerCase();
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    const response = await this.fetchWithSingleRetry(
      `${this.baseUrl}/api/authentication/login`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": this.config.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: this.config.email,
          password: this.config.password,
        }),
      },
    );

    if (!response.ok) throw new McsAdminApiError("MCS authentication failed");

    const data: unknown = await response.json();
    const token =
      typeof data === "object" && data !== null && "access_token" in data
        ? (data as { access_token?: { access_token?: unknown } }).access_token
            ?.access_token
        : null;

    if (typeof token !== "string" || !token) {
      throw new McsAdminApiError(
        "MCS authentication returned an invalid response",
      );
    }

    this.accessToken = token;
    return token;
  }

  private async fetchWithSingleRetry(
    url: string,
    init: RequestInit,
  ): Promise<Response> {
    let response: Response | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await this.fetchOnce(url, init);
        if (response.status < 500) return response;
      } catch (error) {
        if (attempt === 1) {
          throw new McsAdminApiError(
            error instanceof Error && error.name === "AbortError"
              ? "MCS request timed out"
              : "MCS request failed",
          );
        }
      }
    }

    if (response) return response;
    throw new McsAdminApiError("MCS request failed");
  }

  private async fetchOnce(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await this.fetchImpl(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }
}
