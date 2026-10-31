import { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchTasks, fetchTeamActivity } from "@/store/slices/workspaceSlice";
import { fetchTeams } from "@/store/slices/teamsSlice";

export function useTeamActivityRefresh() {
  const dispatch = useAppDispatch();
  const companyId = useAppSelector((state) => state.company.activeId);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchTeams()).unwrap(),
        dispatch(fetchTeamActivity()).unwrap(),
        dispatch(fetchTasks()).unwrap(),
      ]);
      setError("");
    } catch {
      setError("Unable to refresh team activity. Please try again.");
    }
  }, [dispatch]);
  useEffect(() => {
    let pending = false;
    const visibleRefresh = async () => {
      if (pending || document.visibilityState !== "visible") return;
      pending = true;
      try {
        await refresh();
      } finally {
        pending = false;
      }
    };
    void visibleRefresh();
    const timer = window.setInterval(() => void visibleRefresh(), 10000);
    window.addEventListener("focus", visibleRefresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", visibleRefresh);
    };
  }, [companyId, refresh]);
  return { refresh, error };
}
