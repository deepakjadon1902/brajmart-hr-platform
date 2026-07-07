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
    return token ? { user: raw ? (JSON.parse(raw) as User) : null, token } : null;
  } catch {
    return null;
  }
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
  },
);

export const googleLoginThunk = createAsyncThunk(
  "auth/googleLogin",
  async (p: { role: Role; credential: string }) => {
    const res = await authService.googleLogin(p.role, p.credential);
    localStorage.setItem("auth_token", res.token);
    localStorage.setItem("auth_user", JSON.stringify(res.user));
    return res;
  },
);

export const refreshUserThunk = createAsyncThunk("auth/me", async () => {
  const user = await authService.me();
  localStorage.setItem("auth_user", JSON.stringify(user));
  return user;
});

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem("auth_user", JSON.stringify(state.user));
      }
    },
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      localStorage.setItem("auth_token", action.payload);
    },
  },
  extraReducers: (b) => {
    b.addCase(loginThunk.pending, (s) => {
      s.status = "loading";
      s.error = undefined;
    })
      .addCase(loginThunk.fulfilled, (s, a) => {
        s.status = "idle";
        s.user = a.payload.user;
        s.token = a.payload.token;
      })
      .addCase(loginThunk.rejected, (s, a) => {
        s.status = "error";
        s.error = a.error.message;
      })
      .addCase(googleLoginThunk.pending, (s) => {
        s.status = "loading";
        s.error = undefined;
      })
      .addCase(googleLoginThunk.fulfilled, (s, a) => {
        s.status = "idle";
        s.user = a.payload.user;
        s.token = a.payload.token;
      })
      .addCase(googleLoginThunk.rejected, (s, a) => {
        s.status = "error";
        s.error = a.error.message;
      })
      .addCase(refreshUserThunk.fulfilled, (s, a) => {
        s.user = a.payload;
      });
  },
});

export const { logout, setToken, updateUser } = slice.actions;
export default slice.reducer;
