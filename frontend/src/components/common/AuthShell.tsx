import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ShieldCheck, Sparkles, ArrowLeft } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { loginThunk } from "@/store/slices/authSlice";
import { toast } from "sonner";
import type { Role } from "@/types";
import { ROLE_META } from "@/constants/nav";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(128),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;
type RouteLocationState = { from?: { pathname?: string } };

export function AuthShell({ role }: { role: Role }) {
  const meta = ROLE_META[role];
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as RouteLocationState | null;
  const status = useAppSelector((s) => s.auth.status);
  const [show, setShow] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: `${role.replace("-", "")}@demo.com`, password: "demo1234" },
  });

  const onSubmit = async (v: FormValues) => {
    try {
      await dispatch(loginThunk({ role, email: v.email, password: v.password })).unwrap();
      toast.success(`Welcome to ${meta.title}`);
      navigate(routeState?.from?.pathname || meta.home, { replace: true });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Login failed");
    }
  };

  return (
    <div className="relative grid min-h-dvh w-full md:grid-cols-2">
      <div
        className={`relative hidden overflow-hidden md:flex md:flex-col md:justify-between bg-gradient-to-br p-10 text-white ${meta.accent}`}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(white 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Sparkles className="h-5 w-5" />
          </div>
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
            Sign in to manage your day with a workspace built for clarity, speed and beauty.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {["Secure SSO", "Mobile-first", "Real-time", "Dark mode"].map((f) => (
              <div
                key={f}
                className="flex items-center gap-2 rounded-xl bg-white/10 p-3 text-sm backdrop-blur"
              >
                <ShieldCheck className="h-4 w-4" /> {f}
              </div>
            ))}
          </div>
        </motion.div>
        <p className="relative text-xs text-white/70">
          � {new Date().getFullYear()} BrajMart Portal
        </p>
      </div>

      <div className="relative flex items-center justify-center p-6 md:p-12">
        <div className="absolute inset-0 -z-10 gradient-mesh md:hidden" />
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
          <div className="rounded-3xl border bg-card p-7 shadow-elevated">
            <h1 className="text-2xl font-bold tracking-tight">Sign in to {meta.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Use your demo credentials - they are pre-filled for you.
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
                  <button type="button" className="text-xs text-primary hover:underline">
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
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setValue("email", `${role.replace("-", "")}@demo.com`);
                  setValue("password", "demo1234");
                }}
              >
                Fill demo credentials
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Protected with role-based access control.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
