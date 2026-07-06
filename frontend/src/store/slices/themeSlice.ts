import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BRAND } from "@/constants/brand";

export interface Branding {
  companyName: string;
  primaryColor: string;
  logoUrl?: string;
}
export type Language = "en" | "hi";

interface ThemeState {
  mode: "light" | "dark";
  language: Language;
  branding: Branding;
}

const initial: ThemeState = {
  mode: "light",
  language: (localStorage.getItem("lang") as Language) || "en",
  branding: {
    companyName: BRAND.companyName,
    primaryColor: BRAND.primaryColor,
    logoUrl: BRAND.logoUrl,
  },
};

const slice = createSlice({
  name: "theme",
  initialState: initial,
  reducers: {
    enforceLightMode(s) {
      s.mode = "light";
      localStorage.setItem("theme", "light");
      document.documentElement.classList.remove("dark");
    },
    setLanguage(s, a: PayloadAction<Language>) {
      s.language = a.payload;
      localStorage.setItem("lang", a.payload);
    },
    setBranding(s, a: PayloadAction<Partial<Branding>>) {
      s.branding = {
        ...s.branding,
        ...a.payload,
        companyName: BRAND.companyName,
        logoUrl: BRAND.logoUrl,
      };
      localStorage.setItem("branding", JSON.stringify(s.branding));
    },
  },
});

export const { enforceLightMode, setLanguage, setBranding } = slice.actions;
export default slice.reducer;
