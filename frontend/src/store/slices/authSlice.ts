import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "@/services/auth.service";
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  saveSession,
  saveToken,
  saveUser,
} from "@/services/authStorage";
import type { Role, User } from "@/types";
import { cancelSessionRefresh } from "@/services/api";

interface AuthState {
  user: User | null;
  token: string | null;
  status: "idle" | "loading" | "error";
  sessionChecked: boolean;
  refreshRequestId: string | null;
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
  sessionChecked: Boolean(persisted?.token && persisted?.user),
  refreshRequestId: null,
};

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (p: { role: Role; email: string; password: string; remember?: boolean }) => {
    cancelSessionRefresh();
    const remember = p.remember ?? true;
    const res = await authService.login(p.role, p.email, p.password, remember);
    saveSession(res.user, res.token, remember);
    return res;
  },
);

export const googleLoginThunk = createAsyncThunk(
  "auth/googleLogin",
  async (p: { role: Role; credential: string; remember?: boolean }) => {
    cancelSessionRefresh();
    const remember = p.remember ?? true;
    const res = await authService.googleLogin(p.role, p.credential, remember);
    saveSession(res.user, res.token, remember);
    return res;
  },
);

export const refreshUserThunk = createAsyncThunk(
  "auth/me",
  async (_, { rejectWithValue }) => {
    try {
      if (!getStoredToken()) return await authService.refresh();
      const token = getStoredToken();
      const user = await authService.me();
      if (getStoredToken() !== token) {
        // Silent renewal updates the store itself; use its current token.
        return { user, token: getStoredToken() };
      }
      saveUser(user);
      return { user, token };
    } catch (error) {
      return rejectWithValue({
        expired: (error as { response?: { status?: number } })?.response?.status === 401,
      });
    }
  },
  {
    condition: (_, { getState }) => !(getState() as { auth: AuthState }).auth.refreshRequestId,
  },
);

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
      cancelSessionRefresh();
      state.user = null;
      state.token = null;
      state.sessionChecked = true;
      state.refreshRequestId = null;
      state.status = "idle";
      clearSession();
    },
    sessionUpdated(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.sessionChecked = true;
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        saveUser(state.user);
      }
    },
    setToken(state, action: PayloadAction<string>) {
      cancelSessionRefresh();
      state.token = action.payload;
      state.user = null;
      state.refreshRequestId = null;
      state.sessionChecked = false;
      saveToken(action.payload, true);
    },
  },
  extraReducers: (b) => {
    b.addCase(loginThunk.pending, (s) => {
      s.status = "loading";
      s.refreshRequestId = null;
      s.error = undefined;
    })
      .addCase(loginThunk.fulfilled, (s, a) => {
        s.status = "idle";
        s.user = a.payload.user;
        s.token = a.payload.token;
        s.sessionChecked = true;
        s.refreshRequestId = null;
      })
      .addCase(loginThunk.rejected, (s, a) => {
        s.status = "error";
        s.error = a.error.message;
      })
      .addCase(googleLoginThunk.pending, (s) => {
        s.status = "loading";
        s.refreshRequestId = null;
        s.error = undefined;
      })
      .addCase(googleLoginThunk.fulfilled, (s, a) => {
        s.status = "idle";
        s.user = a.payload.user;
        s.token = a.payload.token;
        s.sessionChecked = true;
        s.refreshRequestId = null;
      })
      .addCase(googleLoginThunk.rejected, (s, a) => {
        s.status = "error";
        s.error = a.error.message;
      })
      .addCase(refreshUserThunk.pending, (s, a) => {
        s.refreshRequestId = a.meta.requestId;
      })
      .addCase(refreshUserThunk.fulfilled, (s, a) => {
        if (s.refreshRequestId !== a.meta.requestId) return;
        s.refreshRequestId = null;
        s.user = a.payload.user;
        s.token = a.payload.token ?? s.token;
        s.sessionChecked = true;
      })
      .addCase(refreshUserThunk.rejected, (s, a) => {
        if (s.refreshRequestId !== a.meta.requestId) return;
        s.refreshRequestId = null;
        s.sessionChecked = true;
        if ((a.payload as { expired?: boolean } | undefined)?.expired) {
          s.user = null;
          s.token = null;
          clearSession();
        }
      })
      .addCase(updateProfileThunk.fulfilled, (s, a) => {
        s.user = a.payload;
      });
  },
});

export const { logout, sessionUpdated, setToken, updateUser } = slice.actions;
export default slice.reducer;
