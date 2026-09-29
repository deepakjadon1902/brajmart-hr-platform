import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "@/services/auth.service";
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  isRememberedSession,
  saveSession,
  saveToken,
  saveUser,
} from "@/services/authStorage";
import type { Role, User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  status: "idle" | "loading" | "error";
  error?: string;
}

const persisted = (() => {
  try {
    const token = getStoredToken();
    return token ? { user: getStoredUser(), token } : null;
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
  async (p: { role: Role; email: string; password: string; remember?: boolean }) => {
    const res = await authService.login(p.role, p.email, p.password, p.remember);
    saveSession(res.user, res.token, p.remember);
    return res;
  },
);

export const googleLoginThunk = createAsyncThunk(
  "auth/googleLogin",
  async (p: { role: Role; credential: string; remember?: boolean }) => {
    const res = await authService.googleLogin(p.role, p.credential, p.remember);
    saveSession(res.user, res.token, p.remember);
    return res;
  },
);

export const refreshUserThunk = createAsyncThunk("auth/me", async () => {
  try {
    const user = await authService.me();
    saveUser(user);
    return { user, token: getStoredToken() };
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status !== 401) throw error;

    const remember = isRememberedSession();
    const res = await authService.refresh(remember);
    saveSession(res.user, res.token, remember);
    return res;
  }
});

export const updateProfileThunk = createAsyncThunk(
  "auth/updateProfile",
  async ({ userId, profile }: { userId: string; profile: Partial<User> }) => {
    const user = await authService.updateProfile(userId, profile);
    saveUser(user);
    return user;
  },
);

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      clearSession();
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        saveUser(state.user);
      }
    },
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      saveToken(action.payload, true);
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
        s.user = a.payload.user;
        s.token = a.payload.token ?? s.token;
      })
      .addCase(refreshUserThunk.rejected, (s) => {
        s.user = null;
        s.token = null;
        clearSession();
      })
      .addCase(updateProfileThunk.fulfilled, (s, a) => {
        s.user = a.payload;
      });
  },
});

export const { logout, setToken, updateUser } = slice.actions;
export default slice.reducer;
