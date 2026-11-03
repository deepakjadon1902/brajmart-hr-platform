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
import { TaskNotifications } from "@/components/common/TaskNotifications";
import { Toaster } from "@/components/ui/sonner";
import { TeamSync } from "@/components/common/TeamSync";

export default function App() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const hasToken = Boolean(token);
  const user = useAppSelector((state) => state.auth.user);
  const activeCompanyId = useAppSelector((state) => state.company.activeId);
  const userId = user?.id;
  const companyId = activeCompanyId || user?.companyId;
  const attemptedSessionRestore = useRef(hasToken);
  const refreshingPortal = useRef(false);

  const refreshPortalData = useCallback(async () => {
    if (refreshingPortal.current) return;
    refreshingPortal.current = true;
    try {
      const { user: refreshedUser } = await dispatch(refreshUserThunk()).unwrap();
      const refreshedCanLoadEmployees =
        refreshedUser.role === "super-admin" ||
        refreshedUser.role === "hr" ||
        refreshedUser.role === "team-manager" ||
        (refreshedUser.role === "employee" && /\bmanager\b/i.test(refreshedUser.designation || ""));

      if (refreshedUser.role === "super-admin") dispatch(fetchCompanies());
      if (refreshedCanLoadEmployees) dispatch(fetchEmployees());
      dispatch(fetchWorkspace());
    } catch {
      // Temporary connection failures leave the current portal and forms mounted.
    } finally {
      refreshingPortal.current = false;
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
    if (!hasToken && !attemptedSessionRestore.current) {
      attemptedSessionRestore.current = true;
      void refreshPortalData();
      return;
    }
    if (!hasToken) return;
    if (!userId) {
      void refreshPortalData();
      return;
    }
    dispatch(hydrateWorkspaceCache({ userId, companyId }));
    void refreshPortalData();

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshPortalData();
    };
    const refreshOnFocus = () => void refreshPortalData();
    const refreshInterval = window.setInterval(() => void refreshPortalData(), 60000);

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [companyId, dispatch, refreshPortalData, hasToken, userId]);

  return (
    <>
      <TaskNotifications />
      <TeamSync />
      <AppRoutes />
      <Toaster position="top-right" richColors />
    </>
  );
}
