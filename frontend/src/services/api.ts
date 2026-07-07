import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  timeout: 15000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const activeCompany = localStorage.getItem("active_company");
  if (activeCompany) config.headers["X-Company-Id"] = activeCompany;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      // Don't auto-redirect from here; let route guards handle it.
    }
    return Promise.reject(err);
  },
);
