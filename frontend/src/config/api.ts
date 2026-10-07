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

const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
if (!base) throw new Error("NEXT_PUBLIC_API_URL is not set");

const api = axios.create({
  baseURL: `${base}/api/v1`,
  withCredentials: true,
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (res) => res,
  async (
    error: AxiosError<{
      error?: { message?: string; fields?: Record<string, string[]> };
    }>,
  ) => {
    const status = error.response?.status ?? 500;
    const data = error.response?.data?.error;
    const config = error.config as RetryConfig | undefined;

    // Access expired → refresh once, then retry the same call
    if (
      status === 401 &&
      config &&
      !config._retry &&
      !config.url?.includes("/auth/refresh")
    ) {
      config._retry = true;
      try {
        await api.post("/auth/refresh");
        return api(config);
      } catch {
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/login")
        ) {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(
      new ApiError(
        status,
        data?.message ?? error.message ?? "Something went wrong.",
        data?.fields,
      ),
    );
  },
);

export default api;
