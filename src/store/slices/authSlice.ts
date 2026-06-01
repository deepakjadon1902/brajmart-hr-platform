import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "@/services/auth.service";
import type { Role, User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  status: "idle" | "loading" | "error";
  error?: string;
}

const persisted = (() => {
  try {
    const raw = localStorage.getItem("auth_user");
    const token = localStorage.getItem("auth_token");
    return raw && token ? { user: JSON.parse(raw) as User, token } : null;
  } catch { return null; }
})();

const initialState: AuthState = {
  user: persisted?.user ?? null,
  token: persisted?.token ?? null,
  status: "idle",
};

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (p: { role: Role; email: string; password: string }) => {
    const res = await authService.login(p.role, p.email, p.password);
    localStorage.setItem("auth_token", res.token);
    localStorage.setItem("auth_user", JSON.stringify(res.user));
    return res;
  }
);

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null; state.token = null;
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem("auth_user", JSON.stringify(state.user));
      }
    },
  },
  extraReducers: (b) => {
    b.addCase(loginThunk.pending, (s) => { s.status = "loading"; s.error = undefined; })
     .addCase(loginThunk.fulfilled, (s, a) => { s.status = "idle"; s.user = a.payload.user; s.token = a.payload.token; })
     .addCase(loginThunk.rejected, (s, a) => { s.status = "error"; s.error = a.error.message; });
  },
});

export const { logout, updateUser } = slice.actions;
export default slice.reducer;
