export interface McsAdminClientConfig {
  baseUrl: string;
  apiKey: string;
  email: string;
  password: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  tokenTtlMs?: number;
  tokenRefreshSkewMs?: number;
  now?: () => number;
}

export type McsAdminApiPhase = "validation" | "authentication" | "lookup";

export class McsAdminApiError extends Error {
  constructor(
    message: string,
    readonly phase: McsAdminApiPhase = "lookup",
    readonly status?: number,
  ) {
    super(message);
    this.name = "McsAdminApiError";
  }
}

type CachedAccessToken = {
  value: string;
  refreshAt: number;
};

const DEFAULT_TOKEN_TTL_MS = 45 * 60 * 1_000;
const DEFAULT_TOKEN_REFRESH_SKEW_MS = 60 * 1_000;

function getJwtExpiryMs(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) return null;

  try {
    const payload: unknown = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    );
    const exp =
      typeof payload === "object" && payload !== null && "exp" in payload
        ? (payload as { exp?: unknown }).exp
        : null;

    return typeof exp === "number" && Number.isFinite(exp) ? exp * 1_000 : null;
  } catch {
    return null;
  }
}

export class McsAdminClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly tokenTtlMs: number;
  private readonly tokenRefreshSkewMs: number;
  private readonly now: () => number;
  private accessToken: CachedAccessToken | null = null;
  private loginPromise: Promise<string> | null = null;

  constructor(private readonly config: McsAdminClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.timeoutMs = config.timeoutMs ?? 5_000;
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.tokenTtlMs = config.tokenTtlMs ?? DEFAULT_TOKEN_TTL_MS;
    this.tokenRefreshSkewMs =
      config.tokenRefreshSkewMs ?? DEFAULT_TOKEN_REFRESH_SKEW_MS;
    this.now = config.now ?? Date.now;
  }

  async lookupUtoridByCsn(csn: string): Promise<string | null> {
    if (!/^\d+$/.test(csn)) {
      throw new McsAdminApiError("Invalid CSN", "validation");
    }

    let token = await this.getAccessToken();
    let response = await this.lookupCsn(csn, token);

    if (response.status === 401 || response.status === 403) {
      this.clearAccessTokenIfCurrent(token);
      token = await this.getAccessToken();
      response = await this.lookupCsn(csn, token);
    }

    if (response.status === 404) return null;
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this.clearAccessTokenIfCurrent(token);
      }
      throw new McsAdminApiError(
        "MCS CSN lookup failed",
        "lookup",
        response.status,
      );
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new McsAdminApiError(
        "MCS CSN lookup returned an invalid response",
        "lookup",
        response.status,
      );
    }
    const utorid =
      typeof data === "object" && data !== null && "utorid" in data
        ? (data as { utorid?: unknown }).utorid
        : null;

    if (typeof utorid !== "string" || !utorid.trim()) {
      throw new McsAdminApiError(
        "MCS CSN lookup returned an invalid response",
        "lookup",
        response.status,
      );
    }

    return utorid.trim().toLowerCase();
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.now() < this.accessToken.refreshAt) {
      return this.accessToken.value;
    }

    if (!this.loginPromise) {
      this.loginPromise = this.authenticate().finally(() => {
        this.loginPromise = null;
      });
    }

    return this.loginPromise;
  }

  private async authenticate(): Promise<string> {
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
      "authentication",
    );

    if (!response.ok) {
      throw new McsAdminApiError(
        "MCS authentication failed",
        "authentication",
        response.status,
      );
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new McsAdminApiError(
        "MCS authentication returned an invalid response",
        "authentication",
        response.status,
      );
    }
    const token =
      typeof data === "object" && data !== null && "access_token" in data
        ? (data as { access_token?: { access_token?: unknown } }).access_token
            ?.access_token
        : null;

    if (typeof token !== "string" || !token) {
      throw new McsAdminApiError(
        "MCS authentication returned an invalid response",
        "authentication",
        response.status,
      );
    }

    const now = this.now();
    const jwtExpiry = getJwtExpiryMs(token);
    const expiresAt = Math.min(
      jwtExpiry ?? Number.POSITIVE_INFINITY,
      now + this.tokenTtlMs,
    );
    const refreshSkew = Math.min(
      this.tokenRefreshSkewMs,
      Math.max(0, (expiresAt - now) / 2),
    );

    this.accessToken = {
      value: token,
      refreshAt: expiresAt - refreshSkew,
    };
    return token;
  }

  private clearAccessTokenIfCurrent(token: string): void {
    if (this.accessToken?.value === token) {
      this.accessToken = null;
    }
  }

  private lookupCsn(csn: string, token: string): Promise<Response> {
    return this.fetchWithSingleRetry(
      `${this.baseUrl}/api/external/barcodes/${encodeURIComponent(csn)}`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
      "lookup",
    );
  }

  private async fetchWithSingleRetry(
    url: string,
    init: RequestInit,
    phase: McsAdminApiPhase,
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
            phase,
          );
        }
      }
    }

    if (response) return response;
    throw new McsAdminApiError("MCS request failed", phase);
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
