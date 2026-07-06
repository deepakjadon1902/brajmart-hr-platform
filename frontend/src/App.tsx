import { useEffect } from "react";
import { AppRoutes } from "@/routes/AppRoutes";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchEmployees, fetchWorkspace } from "@/store/slices/workspaceSlice";

export default function App() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!token) return;
    if (user?.role !== "employee") dispatch(fetchEmployees());
    dispatch(fetchWorkspace());
  }, [dispatch, token, user?.role]);

  return <AppRoutes />;
}
