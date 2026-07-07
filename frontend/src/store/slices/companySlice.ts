import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Company } from "@/types";
import { api } from "@/services/api";

interface State {
  list: Company[];
  activeId: string;
}

const companies: Company[] = [
  {
    id: "c1",
    name: "BrajMart EcomTech LLP",
    logo: "/logo.jpeg",
    primaryColor: "#4F46E5",
  },
];

export const fetchCompanies = createAsyncThunk("company/fetchCompanies", async () => {
  const { data } = await api.get("/workspace/companies");
  const rows = data.data as Array<Company & { companyId?: string }>;
  return rows.map((company) => ({
    ...company,
    id: company.companyId || company.id,
  }));
});

export const createCompany = createAsyncThunk(
  "company/createCompany",
  async (company: { name: string; companyId: string; primaryColor?: string; logo?: string }) => {
    const { data } = await api.post("/workspace/companies", company);
    const created = data.data as Company & { companyId?: string };
    return { ...created, id: created.companyId || created.id };
  },
);

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
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        const merged = [...companies];
        action.payload.forEach((company) => {
          const id = company.companyId || company.id;
          const existing = merged.find((item) => item.id === id || item.companyId === id);
          if (existing) Object.assign(existing, { ...company, id });
          else merged.push({ ...company, id });
        });
        state.list = merged;
        if (!state.list.some((company) => company.id === state.activeId)) {
          state.activeId = state.list[0]?.id ?? "c1";
        }
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        const id = action.payload.companyId || action.payload.id;
        const existing = state.list.find((company) => company.id === id);
        if (existing) Object.assign(existing, { ...action.payload, id });
        else state.list.push({ ...action.payload, id });
      });
  },
});
export const { setActive, addCompany } = slice.actions;
export default slice.reducer;
