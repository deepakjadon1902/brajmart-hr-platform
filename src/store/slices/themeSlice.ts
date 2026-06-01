import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Branding { companyName: string; primaryColor: string; logoUrl?: string; }
interface ThemeState { mode: "light" | "dark"; language: "en" | "hi"; branding: Branding; }

const initial: ThemeState = {
  mode: (localStorage.getItem("theme") as "light" | "dark") || "light",
  language: (localStorage.getItem("lang") as "en" | "hi") || "en",
  branding: JSON.parse(localStorage.getItem("branding") || "null") || {
    companyName: "Pulse HRMS", primaryColor: "#4F46E5",
  },
};

const slice = createSlice({
  name: "theme",
  initialState: initial,
  reducers: {
    toggleTheme(s) {
      s.mode = s.mode === "light" ? "dark" : "light";
      localStorage.setItem("theme", s.mode);
      document.documentElement.classList.toggle("dark", s.mode === "dark");
    },
    setLanguage(s, a: PayloadAction<"en" | "hi">) {
      s.language = a.payload; localStorage.setItem("lang", a.payload);
    },
    setBranding(s, a: PayloadAction<Partial<Branding>>) {
      s.branding = { ...s.branding, ...a.payload };
      localStorage.setItem("branding", JSON.stringify(s.branding));
    },
  },
});

export const { toggleTheme, setLanguage, setBranding } = slice.actions;
export default slice.reducer;
