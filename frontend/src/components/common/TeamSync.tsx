import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchTeams } from "@/store/slices/teamsSlice";

export function TeamSync() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const activeCompany = useAppSelector((state) => state.company.activeId);
  const companyId = user?.role === "super-admin" ? activeCompany : user?.companyId;
  useEffect(() => {
    if (!user?.id) return;
    let pending = false;
    const refresh = async () => {
      if (pending || document.visibilityState !== "visible") return;
      pending = true;
      try {
        await dispatch(fetchTeams());
      } finally {
        pending = false;
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [companyId, dispatch, user?.id]);
  return null;
}
