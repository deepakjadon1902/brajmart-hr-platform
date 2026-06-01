import { createSlice, PayloadAction } from "@reduxjs/toolkit";
interface State { sidebarCollapsed: boolean; commandOpen: boolean; }
const slice = createSlice({
  name: "ui",
  initialState: { sidebarCollapsed: false, commandOpen: false } as State,
  reducers: {
    toggleSidebar(s) { s.sidebarCollapsed = !s.sidebarCollapsed; },
    setCommandOpen(s, a: PayloadAction<boolean>) { s.commandOpen = a.payload; },
  },
});
export const { toggleSidebar, setCommandOpen } = slice.actions;
export default slice.reducer;
