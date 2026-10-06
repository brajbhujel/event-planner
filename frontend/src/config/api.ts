export const SESSION_COOKIE = "event_planner_session";
export const REFRESH_COOKIE = "event_planner_refresh";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export type TokenBundle = {
  token: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
};

export type ApiResponse = {
  data: any;
  status: number;
  ok: boolean;
  tokens: TokenBundle | null;
};

type RequestOptions = {
  token?: string | null;
  cookie?: string | null;
};

type TokenGetter = () => Promise<string | null | undefined>;
type CookieApplier = (tokens: TokenBundle) => Promise<void>;

let accessTokenGetter: TokenGetter | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;
let cookieApplier: CookieApplier | null = null;

export function bindApiAuth(options: {
  getAccessToken: TokenGetter;
  refreshAccessToken: () => Promise<string | null>;
  applyAuthCookies?: CookieApplier;
}) {
  accessTokenGetter = options.getAccessToken;
  refreshHandler = options.refreshAccessToken;
  cookieApplier = options.applyAuthCookies ?? null;
}

function apiBaseUrl() {
  const url = process.env.API_URL;
  if (!url) throw new Error("API_URL is not set");
  return url.replace(/\/$/, "");
}

export function tokensFromSetCookie(headers: Headers): TokenBundle | null {
  const lines =
    typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
  if (!lines.length) return null;

  let token: string | undefined;
  let refreshToken: string | undefined;
  let expiresIn = 900;
  let refreshExpiresIn = 604800;

  for (const header of lines) {
    const parts = header.split(";");
    const [pair] = parts;
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    const maxAgeAttr = parts.find((part) =>
      part.trim().toLowerCase().startsWith("max-age="),
    );
    const maxAge = maxAgeAttr
      ? Number(maxAgeAttr.trim().slice("max-age=".length))
      : undefined;

    if (name === SESSION_COOKIE) {
      token = value;
      if (Number.isFinite(maxAge)) expiresIn = maxAge!;
    }
    if (name === REFRESH_COOKIE) {
      refreshToken = value;
      if (Number.isFinite(maxAge)) refreshExpiresIn = maxAge!;
    }
  }

  if (!token || !refreshToken) return null;
  return { token, refreshToken, expiresIn, refreshExpiresIn };
}

async function request(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
  retried = false,
): Promise<ApiResponse> {
  const headersInit: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) headersInit["Content-Type"] = "application/json";
  if (options?.cookie) headersInit.Cookie = options.cookie;

  let token: string | null | undefined = options?.token;
  if (token === undefined && accessTokenGetter) {
    token = await accessTokenGetter();
  }
  if (token) headersInit.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}/api/v1${path}`, {
      method,
      headers: headersInit,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      503,
      "We couldn’t reach the server. Please try again in a moment.",
    );
  }

  if (
    response.status === 401 &&
    !retried &&
    path !== "/auth/refresh" &&
    refreshHandler
  ) {
    const nextAccess = await refreshHandler();
    if (nextAccess) {
      return request(method, path, body, { token: nextAccess }, true);
    }
  }

  const tokens = tokensFromSetCookie(response.headers);
  if (tokens && cookieApplier) {
    try {
      await cookieApplier(tokens);
    } catch {
      // RSC cannot always set cookies; middleware covers navigations.
    }
  }

  if (response.status === 204) {
    return { data: undefined, status: 204, ok: true, tokens };
  }

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      json?.error?.message ?? "Something went wrong. Please try again.",
      json?.error?.fields,
    );
  }

  return { data: json, status: response.status, ok: true, tokens };
}

const api = {
  get(path: string, options?: RequestOptions) {
    return request("GET", path, undefined, options);
  },
  post(path: string, body?: unknown, options?: RequestOptions) {
    return request("POST", path, body, options);
  },
  put(path: string, body?: unknown, options?: RequestOptions) {
    return request("PUT", path, body, options);
  },
  patch(path: string, body?: unknown, options?: RequestOptions) {
    return request("PATCH", path, body, options);
  },
  delete(path: string, options?: RequestOptions) {
    return request("DELETE", path, undefined, options);
  },
};

export default api;
