import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { companies } from "@/services/mock";
import type { Company } from "@/types";

interface State {
  list: Company[];
  activeId: string;
}
const slice = createSlice({
  name: "company",
  initialState: {
    list: companies,
    activeId: localStorage.getItem("active_company") || companies[0].id,
  } as State,
  reducers: {
    setActive(s, a: PayloadAction<string>) {
      s.activeId = a.payload;
      localStorage.setItem("active_company", a.payload);
    },
    addCompany(s, a: PayloadAction<Company>) {
      s.list.push(a.payload);
    },
  },
});
export const { setActive, addCompany } = slice.actions;
export default slice.reducer;
