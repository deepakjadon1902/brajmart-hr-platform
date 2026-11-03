import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import auth, { logout, sessionUpdated } from "./slices/authSlice";
import { setSessionHandlers } from "@/services/api";
import theme from "./slices/themeSlice";
import company from "./slices/companySlice";
import ui from "./slices/uiSlice";
import workspace from "./slices/workspaceSlice";
import teams from "./slices/teamsSlice";

export const store = configureStore({
  reducer: { auth, theme, company, ui, workspace, teams },
});

setSessionHandlers({
  updated: (session) => store.dispatch(sessionUpdated(session)),
  expired: () => store.dispatch(logout()),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
