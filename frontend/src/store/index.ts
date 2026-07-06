import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import auth from "./slices/authSlice";
import theme from "./slices/themeSlice";
import company from "./slices/companySlice";
import ui from "./slices/uiSlice";
import workspace from "./slices/workspaceSlice";

export const store = configureStore({
  reducer: { auth, theme, company, ui, workspace },
});

store.subscribe(() => {
  try {
    localStorage.setItem("workspace_state", JSON.stringify(store.getState().workspace));
  } catch {
    // Storage can be unavailable in private windows; the app still works in memory.
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
