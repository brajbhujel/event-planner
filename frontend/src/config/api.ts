import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

const baseURL = process.env.NEXT_PUBLIC_API_URL;
if (!baseURL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

const api = axios.create({
  baseURL: `${baseURL.replace(/\/$/, "")}/api/v1`,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

const refreshClient = axios.create({
  baseURL: `${baseURL.replace(/\/$/, "")}/api/v1`,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  try {
    await refreshClient.post("/auth/refresh");
    return true;
  } catch {
    return false;
  }
}

function refreshOnce() {
  if (!refreshInFlight) {
    refreshInFlight = tryRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/login")) return;
  window.location.href = "/login";
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: { message?: string; fields?: Record<string, string[]> } }>) => {
    const status = error.response?.status;
    const original = error.config as RetryConfig | undefined;
    const message =
      error.response?.data?.error?.message ??
      error.message ??
      "Something went wrong. Please try again.";
    const fields = error.response?.data?.error?.fields;

    if (status !== 401 || !original || original.url?.includes("/auth/refresh")) {
      return Promise.reject(new ApiError(status ?? 500, message, fields));
    }

    if (original._retry) {
      redirectToLogin();
      return Promise.reject(new ApiError(401, message, fields));
    }

    const ok = await refreshOnce();
    if (!ok) {
      redirectToLogin();
      return Promise.reject(new ApiError(401, message, fields));
    }

    original._retry = true;
    return api(original);
  },
);

export default api;
