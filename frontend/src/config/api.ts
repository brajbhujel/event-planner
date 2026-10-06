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

type TokenBundle = {
  token: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
};

export type ApiResponse = {
  data: any;
  status: number;
  ok: boolean;
};

type RequestOptions = {
  token?: string | null;
};

type TokenGetter = () => Promise<string | null | undefined>;

let accessTokenGetter: TokenGetter | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;

export function bindApiAuth(options: {
  getAccessToken: TokenGetter;
  refreshAccessToken: () => Promise<string | null>;
}) {
  accessTokenGetter = options.getAccessToken;
  refreshHandler = options.refreshAccessToken;
}

function apiBaseUrl() {
  const url = process.env.API_URL;
  if (!url) throw new Error("API_URL is not set");
  return url.replace(/\/$/, "");
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

  if (response.status === 204) {
    return { data: undefined, status: 204, ok: true };
  }

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      json?.error?.message ?? "Something went wrong. Please try again.",
      json?.error?.fields,
    );
  }

  return { data: json, status: response.status, ok: true };
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

export type { TokenBundle };
export default api;
