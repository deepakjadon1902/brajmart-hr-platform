import type { Role, User } from "@/types";
import { api } from "./api";

function getApiMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
}

export const authService = {
  async login(role: Role, email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const { data } = await api.post("/auth/login", { role, email, password });
      return data.data;
    } catch (error) {
      throw new Error(
        getApiMessage(error, "Unable to sign in. Check your email, password, and portal."),
      );
    }
  },
  async googleLogin(role: Role, credential: string): Promise<{ user: User; token: string }> {
    try {
      const { data } = await api.post("/auth/google", { role, credential });
      return data.data;
    } catch (error) {
      throw new Error(getApiMessage(error, "Unable to continue with Google."));
    }
  },
  async getGoogleClientId(): Promise<string> {
    const { data } = await api.get("/auth/google/config");
    return data.data.clientId;
  },
  async me(): Promise<User> {
    const { data } = await api.get("/auth/me");
    return data.data.user;
  },
  async updateProfile(userId: string, profile: Partial<User>): Promise<User> {
    try {
      const { data } = await api.patch(`/users/${userId}`, profile);
      return data.data;
    } catch (error) {
      throw new Error(getApiMessage(error, "Unable to update profile."));
    }
  },
  async requestPasswordReset(email: string) {
    try {
      const { data } = await api.post("/auth/password-reset/request", { email });
      return data.data;
    } catch (error) {
      throw new Error(getApiMessage(error, "Unable to send password reset OTP."));
    }
  },
  async verifyPasswordReset(email: string, otp: string) {
    try {
      const { data } = await api.post("/auth/password-reset/verify", { email, otp });
      return data.data;
    } catch (error) {
      throw new Error(getApiMessage(error, "Invalid or expired OTP."));
    }
  },
  async completePasswordReset(email: string, otp: string, password: string) {
    try {
      const { data } = await api.post("/auth/password-reset/complete", { email, otp, password });
      return data.data;
    } catch (error) {
      throw new Error(getApiMessage(error, "Unable to reset password."));
    }
  },
  async logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      await new Promise((r) => setTimeout(r, 150));
    }
  },
};
