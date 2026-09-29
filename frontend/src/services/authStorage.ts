import type { User } from "@/types";

const tokenKey = "auth_token";
const userKey = "auth_user";
const rememberKey = "auth_remember";

function preferredStorage(remember?: boolean) {
  if (remember === true) return localStorage;
  if (remember === false) return sessionStorage;
  return localStorage.getItem(rememberKey) === "true" ? localStorage : sessionStorage;
}

export function getStoredToken() {
  return localStorage.getItem(tokenKey) || sessionStorage.getItem(tokenKey);
}

export function getStoredUser() {
  const raw = localStorage.getItem(userKey) || sessionStorage.getItem(userKey);
  if (!raw) return null;
  return JSON.parse(raw) as User;
}

export function isRememberedSession() {
  return localStorage.getItem(rememberKey) === "true";
}

export function saveSession(user: User, token: string, remember?: boolean) {
  clearSession();
  const storage = preferredStorage(remember);
  storage.setItem(tokenKey, token);
  storage.setItem(userKey, JSON.stringify(user));
  if (storage === localStorage) localStorage.setItem(rememberKey, "true");
}

export function saveToken(token: string, remember?: boolean) {
  const storage = preferredStorage(remember);
  localStorage.removeItem(tokenKey);
  sessionStorage.removeItem(tokenKey);
  storage.setItem(tokenKey, token);
  if (storage === localStorage) localStorage.setItem(rememberKey, "true");
}

export function saveUser(user: User) {
  preferredStorage().setItem(userKey, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
  localStorage.removeItem(rememberKey);
  sessionStorage.removeItem(tokenKey);
  sessionStorage.removeItem(userKey);
}
