import { useEffect } from "react";
import { AppRoutes } from "@/routes/AppRoutes";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchEmployees, fetchWorkspace } from "@/store/slices/workspaceSlice";
import { refreshUserThunk, setToken } from "@/store/slices/authSlice";
import { fetchCompanies } from "@/store/slices/companySlice";

export default function App() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const activeCompanyId = useAppSelector((state) => state.company.activeId);
  const role = user?.role;
  const designation = user?.designation;
  const canLoadEmployees =
    role === "super-admin" ||
    role === "hr" ||
    role === "team-manager" ||
    (role === "employee" && /\bmanager\b/i.test(designation || ""));

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
    if (!token) return;
    dispatch(refreshUserThunk());
    if (role === "super-admin") dispatch(fetchCompanies());
    if (canLoadEmployees) {
      dispatch(fetchEmployees());
    }
    dispatch(fetchWorkspace());
  }, [activeCompanyId, canLoadEmployees, dispatch, role, token]);

  return <AppRoutes />;
}
