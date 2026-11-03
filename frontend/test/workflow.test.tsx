import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import axios, { type InternalAxiosRequestConfig } from "axios";
import React from "react";
import { renderToString } from "react-dom/server";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import auth, {
  loginThunk,
  logout,
  refreshUserThunk,
  sessionUpdated,
} from "@/store/slices/authSlice";
import { api, cancelSessionRefresh, refreshSession, setSessionHandlers } from "@/services/api";
import { clearSession, getStoredToken, getStoredUser, saveSession } from "@/services/authStorage";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AttendanceButton } from "@/components/common/AttendanceButton";
import { checkoutAvailableAt, currentAttendance } from "@/lib/attendance";
import type { User, AttendanceRecord } from "@/types";

const user = { id: "employee-1", name: "Employee One", role: "employee", companyId: "c1" } as User;
const makeStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, String(value)),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  };
};
const response = (config: InternalAxiosRequestConfig, data: unknown) => ({
  config,
  data,
  status: 200,
  statusText: "OK",
  headers: {},
});
const unauthorized = (config: InternalAxiosRequestConfig) =>
  new axios.AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, undefined, {
    ...response(config, {}),
    status: 401,
  });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function signedInStore() {
  const store = configureStore({ reducer: { auth } });
  store.dispatch(sessionUpdated({ user, token: "old-token" }));
  setSessionHandlers({
    updated: (session) => store.dispatch(sessionUpdated(session)),
    expired: () => store.dispatch(logout()),
  });
  return store;
}

beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", { value: makeStorage(), configurable: true });
  Object.defineProperty(globalThis, "sessionStorage", { value: makeStorage(), configurable: true });
  cancelSessionRefresh();
  saveSession(user, "old-token", true);
});

test("background checks preserve an open form and login on network failure", async () => {
  const store = signedInStore();
  const gate = deferred<void>();
  api.defaults.adapter = async () => {
    await gate.promise;
    throw new Error("Network unavailable");
  };
  const check = store.dispatch(refreshUserThunk());
  assert.equal(store.getState().auth.status, "idle");
  const html = renderToString(
    <Provider store={store}>
      <MemoryRouter>
        <ProtectedRoute allow="employee">
          <input name="reason" defaultValue="Partly completed leave request" />
        </ProtectedRoute>
      </MemoryRouter>
    </Provider>,
  );
  assert.match(html, /Partly completed leave request/);
  assert.doesNotMatch(html, /Restoring session/);
  gate.resolve();
  await check;
  assert.equal(store.getState().auth.user?.id, user.id);
  assert.equal(getStoredToken(), "old-token");
});

test("parallel expired submissions renew once and preserve each request body", async () => {
  const store = signedInStore();
  let renewals = 0;
  const retried: string[] = [];
  const refreshGate = deferred<void>();
  api.defaults.adapter = async (config) => {
    if (config.url === "/auth/refresh") {
      renewals++;
      await refreshGate.promise;
      return response(config, { data: { user, token: "new-token" } });
    }
    if (config.headers.Authorization === "Bearer old-token") throw unauthorized(config);
    retried.push(config.data);
    return response(config, { saved: true });
  };
  const first = api.post("/workspace/leaves", { reason: "Draft text" });
  const second = api.patch("/workspace/attendance/record-1", { checkOut: true });
  await new Promise((done) => setTimeout(done, 0));
  refreshGate.resolve();
  await Promise.all([first, second]);
  assert.equal(renewals, 1);
  assert.deepEqual(
    retried.map((body) => JSON.parse(body)),
    [{ reason: "Draft text" }, { checkOut: true }],
  );
  assert.equal(store.getState().auth.token, "new-token");
});

test("temporary renewal failures retain credentials and a later retry succeeds", async () => {
  const store = signedInStore();
  api.defaults.adapter = async () => {
    throw new Error("Offline");
  };
  await assert.rejects(refreshSession(), /Offline/);
  assert.equal(getStoredToken(), "old-token");
  assert.equal(store.getState().auth.user?.id, user.id);
  api.defaults.adapter = async (config) => response(config, { data: { user, token: "recovered" } });
  await refreshSession();
  assert.equal(getStoredToken(), "recovered");
});

test("an expired refresh cookie signs out, without a recursive retry", async () => {
  const store = signedInStore();
  let requests = 0;
  api.defaults.adapter = async (config) => {
    requests++;
    throw unauthorized(config);
  };
  await assert.rejects(api.get("/auth/me"));
  assert.equal(requests, 2);
  assert.equal(store.getState().auth.user, null);
  assert.equal(getStoredToken(), null);
});

test("an invalid password is reported directly without refreshing the session", async () => {
  signedInStore();
  const urls: string[] = [];
  api.defaults.adapter = async (config) => {
    urls.push(config.url!);
    throw unauthorized(config);
  };
  await assert.rejects(api.post("/auth/login", { password: "wrong" }));
  assert.deepEqual(urls, ["/auth/login"]);
});

test("logout prevents a pending refresh from signing the employee back in", async () => {
  const store = signedInStore();
  const gate = deferred<void>();
  api.defaults.adapter = async (config) => {
    await gate.promise;
    return response(config, { data: { user, token: "late-token" } });
  };
  const check = refreshSession();
  store.dispatch(logout());
  gate.resolve();
  await assert.rejects(check, /Session changed/);
  assert.equal(getStoredToken(), null);
  assert.equal(store.getState().auth.user, null);
});

test("a slow user check cannot restore a logged-out session", async () => {
  const store = signedInStore();
  const gate = deferred<void>();
  api.defaults.adapter = async (config) => {
    await gate.promise;
    return response(config, { data: { user } });
  };
  const check = store.dispatch(refreshUserThunk());
  await new Promise((done) => setTimeout(done, 0));
  store.dispatch(logout());
  gate.resolve();
  await check;
  assert.equal(store.getState().auth.user, null);
  assert.equal(getStoredUser(), null);
});

test("session-only sign-in stays session-only through renewal", async () => {
  signedInStore();
  saveSession(user, "old-token", false);
  api.defaults.adapter = async (config) =>
    response(config, { data: { user, token: "session-token" } });
  await refreshSession();
  assert.equal(localStorage.getItem("auth_token"), null);
  assert.equal(sessionStorage.getItem("auth_token"), "session-token");
  assert.equal(getStoredUser()?.id, user.id);
});

test("sign-in remembers the device by default and completes the initial session check", async () => {
  const store = signedInStore();
  clearSession();
  api.defaults.adapter = async (config) =>
    response(config, { data: { user, token: "login-token" } });
  await store.dispatch(
    loginThunk({ role: "employee", email: "employee@example.test", password: "password" }),
  );
  assert.equal(localStorage.getItem("auth_token"), "login-token");
  assert.equal(store.getState().auth.sessionChecked, true);
});

test("attendance buttons show the countdown, enable checkout after 30 minutes, and show completion", () => {
  const store = signedInStore();
  const base = {
    id: "record",
    date: "2026-11-03",
    checkIn: "09:00",
    status: "present",
  } as AttendanceRecord;
  const render = (record: AttendanceRecord) =>
    renderToString(
      <Provider store={store}>
        <AttendanceButton employee={user} record={record} onLocation={() => {}} />
      </Provider>,
    );
  const waiting = render({ ...base, checkInAt: new Date(Date.now() - 20 * 60000).toISOString() });
  assert.match(waiting, /disabled=""/);
  assert.match(waiting, /Check out in/);
  const ready = render({ ...base, checkInAt: new Date(Date.now() - 31 * 60000).toISOString() });
  assert.doesNotMatch(ready, /disabled=""/);
  assert.match(ready, /You can check out now/);
  const completed = render({ ...base, checkOut: "18:00" });
  assert.match(completed, /disabled=""/);
  assert.match(completed, /Attendance complete/);
});

test("checkout uses exact timestamps, supports historical IST times, and keeps overnight shifts", () => {
  const exact = {
    id: "1",
    date: "2026-11-03",
    checkIn: "09:00",
    checkInAt: "2026-11-03T03:30:45Z",
    status: "present",
  } as AttendanceRecord;
  assert.equal(checkoutAvailableAt(exact), Date.parse("2026-11-03T04:00:45Z"));
  const legacy = { ...exact, checkInAt: undefined };
  assert.equal(checkoutAvailableAt(legacy), Date.parse("2026-11-03T04:00:00Z"));
  assert.equal(currentAttendance([exact], Date.parse("2026-11-03T04:00:00Z")), exact);
  assert.equal(checkoutAvailableAt({ ...exact, checkOut: "18:00" }), 0);
  const overnight = {
    ...exact,
    date: "2026-11-02",
    checkIn: "23:50",
    checkInAt: "2026-11-02T18:20:00Z",
  };
  assert.equal(currentAttendance([overnight], Date.parse("2026-11-02T18:40:00Z")), overnight);
  assert.equal(currentAttendance([overnight], Date.parse("2026-11-04T04:00:00Z")), undefined);
});
