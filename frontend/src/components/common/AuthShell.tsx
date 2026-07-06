import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building2, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { googleLoginThunk, loginThunk } from "@/store/slices/authSlice";
import { toast } from "sonner";
import type { Role } from "@/types";
import { ROLE_META } from "@/constants/nav";
import { authService } from "@/services/auth.service";
import { BrandLogo } from "./BrandLogo";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(128),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;
type RouteLocationState = { from?: { pathname?: string } };
type ResetStep = "email" | "otp" | "password";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: (callback?: (notification: { isNotDisplayed?: () => boolean; isSkippedMoment?: () => boolean }) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: "outline" | "filled_blue" | "filled_black"; size?: "large" | "medium" | "small"; width?: number },
          ) => void;
        };
      };
    };
  }
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export function AuthShell({ role }: { role: Role }) {
  const meta = ROLE_META[role];
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as RouteLocationState | null;
  const status = useAppSelector((s) => s.auth.status);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>("email");
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    let active = true;

    const setupGoogle = async () => {
      try {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || (await authService.getGoogleClientId());
        if (!clientId || !active) return;

        const initialize = () => {
          window.google?.accounts.id.initialize({
            client_id: clientId,
            use_fedcm_for_prompt: true,
            callback: async (response) => {
              if (!response.credential) {
                toast.error("Google did not return a credential.");
                return;
              }
              try {
                await dispatch(googleLoginThunk({ role, credential: response.credential })).unwrap();
                toast.success(`Welcome to ${meta.title}`);
                navigate(routeState?.from?.pathname || meta.home, { replace: true });
              } catch (e: unknown) {
                toast.error(e instanceof Error ? e.message : "Google login failed");
              }
            },
          });
          if (googleButtonRef.current) {
            googleButtonRef.current.innerHTML = "";
            window.google?.accounts.id.renderButton(googleButtonRef.current, {
              theme: "outline",
              size: "large",
              width: googleButtonRef.current.offsetWidth || 360,
            });
          }
          setGoogleReady(true);
        };

        if (window.google?.accounts?.id) {
          initialize();
          return;
        }

        const existing = document.querySelector<HTMLScriptElement>(
          "script[src='https://accounts.google.com/gsi/client']",
        );
        const script = existing ?? document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = initialize;
        if (!existing) document.head.appendChild(script);
      } catch {
        setGoogleReady(false);
      }
    };

    setupGoogle();
    return () => {
      active = false;
    };
  }, [dispatch, meta.home, meta.title, navigate, role, routeState?.from?.pathname]);

  const onSubmit = async (v: FormValues) => {
    try {
      await dispatch(loginThunk({ role, email: v.email, password: v.password })).unwrap();
      toast.success(`Welcome to ${meta.title}`);
      navigate(routeState?.from?.pathname || meta.home, { replace: true });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Login failed");
    }
  };

  const submitReset = async () => {
    try {
      setResetBusy(true);
      if (resetStep === "email") {
        await authService.requestPasswordReset(resetEmail);
        setResetStep("otp");
        toast.success("OTP sent to the entered email.");
        return;
      }
      if (resetStep === "otp") {
        await authService.verifyPasswordReset(resetEmail, resetOtp);
        setResetStep("password");
        toast.success("OTP verified.");
        return;
      }
      if (resetPassword !== resetConfirm) {
        toast.error("Passwords do not match.");
        return;
      }
      await authService.completePasswordReset(resetEmail, resetOtp, resetPassword);
      toast.success("Password updated. You can sign in now.");
      setValue("email", resetEmail);
      setResetOpen(false);
      setResetStep("email");
      setResetEmail("");
      setResetOtp("");
      setResetPassword("");
      setResetConfirm("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Password reset failed");
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <div className="relative grid min-h-dvh w-full bg-white md:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-slate-950 p-10 text-white md:flex md:flex-col md:justify-between">
        <div
          className="absolute inset-0 opacity-16"
          style={{
            backgroundImage: "radial-gradient(white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative flex items-center gap-2">
          <BrandLogo compact className="h-11 w-11 rounded-full border-white/20 bg-white p-1" />
          <span className="text-lg font-bold">BrajMart Portal</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <h2 className="text-3xl font-bold leading-tight md:text-4xl">{meta.title}</h2>
          <p className="mt-3 max-w-md text-white/85">
            Sign in to manage your day with a workspace built for clarity, speed and trust.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {["Google SSO", "OTP Recovery", "Role access", "Live database"].map((f) => (
              <div
                key={f}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 p-3 text-sm backdrop-blur"
              >
                <ShieldCheck className="h-4 w-4" /> {f}
              </div>
            ))}
          </div>
        </motion.div>

        <p className="relative text-xs text-white/70">
          (c) {new Date().getFullYear()} BrajMart Portal
        </p>
      </div>

      <div className="relative flex items-center justify-center p-6 md:p-12">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#ffffff_0%,#f4f6fa_100%)] md:hidden" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link
            to="/"
            className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Choose another portal
          </Link>
          <div className="rounded-2xl border border-black/5 bg-card p-7 shadow-elevated">
            <h1 className="text-2xl font-bold tracking-tight">Sign in to {meta.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Use your BrajMart account credentials or continue with Google.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  className="mt-1"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => setResetOpen(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    {...register("password")}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label="Toggle password visibility"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...register("remember")}
                  className="h-4 w-4 rounded border accent-[color:var(--primary)]"
                />
                Remember me on this device
              </label>

              <Button type="submit" className="w-full" disabled={status === "loading"}>
                {status === "loading" ? "Signing in..." : "Sign in"}
              </Button>
              <div ref={googleButtonRef} className="min-h-10 w-full overflow-hidden rounded-md" />
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Protected with role-based access control.
            </p>
          </div>
        </motion.div>
      </div>

      {resetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Reset password</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {resetStep === "email" && "Enter your email to receive a 6-digit OTP."}
                  {resetStep === "otp" && "Verify the OTP sent to your email."}
                  {resetStep === "password" && "Create your new password."}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  disabled={resetStep !== "email"}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              {resetStep !== "email" && (
                <div>
                  <Label htmlFor="reset-otp">OTP</Label>
                  <Input
                    id="reset-otp"
                    inputMode="numeric"
                    maxLength={6}
                    value={resetOtp}
                    disabled={resetStep === "password"}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="mt-1"
                  />
                </div>
              )}
              {resetStep === "password" && (
                <>
                  <div>
                    <Label htmlFor="reset-password">New password</Label>
                    <Input
                      id="reset-password"
                      type="password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reset-confirm">Confirm password</Label>
                    <Input
                      id="reset-confirm"
                      type="password"
                      value={resetConfirm}
                      onChange={(e) => setResetConfirm(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={submitReset} disabled={resetBusy}>
                {resetBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                {resetStep === "email" && "Send OTP"}
                {resetStep === "otp" && "Verify OTP"}
                {resetStep === "password" && "Update password"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
