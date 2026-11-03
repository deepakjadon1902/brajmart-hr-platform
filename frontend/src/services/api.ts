import axios, { type InternalAxiosRequestConfig } from "axios";
import { clearSession, getStoredToken, isRememberedSession, saveSession } from "./authStorage";
import type { User } from "@/types";

const apiBaseURL = import.meta.env.DEV ? import.meta.env.VITE_API_BASE_URL || "/api/v1" : "/api/v1";

export const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 15000,
  withCredentials: true,
});

type Session = { user: User; token: string };
type RetryConfig = InternalAxiosRequestConfig & {
  sessionRetried?: boolean;
  sessionVersion?: number;
};
let refreshPromise: Promise<Session> | null = null;
let sessionVersion = 0;
let sessionHandlers: { updated: (session: Session) => void; expired: () => void } | undefined;

export function setSessionHandlers(handlers: NonNullable<typeof sessionHandlers>) {
  sessionHandlers = handlers;
}

export function cancelSessionRefresh() {
  sessionVersion += 1;
  refreshPromise = null;
}

// All expired requests share one refresh, then retry with their original body.
export function refreshSession(): Promise<Session> {
  if (refreshPromise) return refreshPromise;
  const version = sessionVersion;
  const previousToken = getStoredToken();
  const remember = isRememberedSession() || !previousToken;
  const isCurrentSession = () => version === sessionVersion && getStoredToken() === previousToken;
  const pending = api
    .post("/auth/refresh", { remember })
    .then(({ data }) => {
      if (!isCurrentSession()) throw new axios.CanceledError("Session changed during refresh");
      const session = data.data as Session;
      saveSession(session.user, session.token, remember);
      sessionHandlers?.updated(session);
      return session;
    })
    .catch((error) => {
      if (error?.response?.status === 401 && isCurrentSession()) {
        clearSession();
        sessionHandlers?.expired();
      }
      throw error;
    })
    .finally(() => {
      if (refreshPromise === pending) refreshPromise = null;
    });
  refreshPromise = pending;
  return pending;
}

api.interceptors.request.use((config) => {
  (config as RetryConfig).sessionVersion ??= sessionVersion;
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const activeCompany = localStorage.getItem("active_company");
  if (activeCompany) config.headers["X-Company-Id"] = activeCompany;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const config = error.config as RetryConfig | undefined;
    const publicAuthRequest = config?.url?.startsWith("/auth/") && config.url !== "/auth/me";
    if (
      error.response?.status !== 401 ||
      !config ||
      config.sessionRetried ||
      publicAuthRequest ||
      config.sessionVersion !== sessionVersion
    ) {
      return Promise.reject(error);
    }
    config.sessionRetried = true;
    const currentToken = getStoredToken();
    if (!currentToken && config.headers.Authorization) return Promise.reject(error);
    // A parallel request may already have renewed the token.
    if (currentToken && config.headers.Authorization !== `Bearer ${currentToken}`) {
      return api.request(config);
    }
    await refreshSession();
    return api.request(config);
  },
);
