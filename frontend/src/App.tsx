import { useCallback, useEffect, useRef } from "react";
import { AppRoutes } from "@/routes/AppRoutes";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchEmployees,
  fetchWorkspace,
  hydrateWorkspaceCache,
} from "@/store/slices/workspaceSlice";
import { refreshUserThunk, setToken } from "@/store/slices/authSlice";
import { fetchCompanies } from "@/store/slices/companySlice";

export default function App() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const activeCompanyId = useAppSelector((state) => state.company.activeId);
  const userId = user?.id;
  const companyId = activeCompanyId || user?.companyId;
  const attemptedSessionRestore = useRef(false);

  const refreshPortalData = useCallback(async () => {
    try {
      const refreshedUser = await dispatch(refreshUserThunk()).unwrap();
      const refreshedCanLoadEmployees =
        refreshedUser.role === "super-admin" ||
        refreshedUser.role === "hr" ||
        refreshedUser.role === "team-manager" ||
        (refreshedUser.role === "employee" &&
          /\bmanager\b/i.test(refreshedUser.designation || ""));

      if (refreshedUser.role === "super-admin") dispatch(fetchCompanies());
      if (refreshedCanLoadEmployees) dispatch(fetchEmployees());
      dispatch(fetchWorkspace());
    } catch {
      // The auth slice clears stale credentials; route guards handle navigation.
    }
  }, [dispatch]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackToken = params.get("token");
    if (!callbackToken) return;
    dispatch(setToken(callbackToken));
    params.delete("token");
    params.delete("role");
    const nextQuery = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`,
    );
    dispatch(refreshUserThunk());
  }, [dispatch]);

  useEffect(() => {
    if (!token && !attemptedSessionRestore.current) {
      attemptedSessionRestore.current = true;
      void refreshPortalData();
      return;
    }
    if (!token) return;
    if (!userId) {
      void refreshPortalData();
      return;
    }
    dispatch(hydrateWorkspaceCache({ userId, companyId }));
    void refreshPortalData();

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshPortalData();
    };
    const refreshInterval = window.setInterval(() => void refreshPortalData(), 60000);

    window.addEventListener("focus", refreshPortalData);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshPortalData);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [companyId, dispatch, refreshPortalData, token, userId]);

  return <AppRoutes />;
}
