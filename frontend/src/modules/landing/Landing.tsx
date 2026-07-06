import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Users, ShieldCheck, Briefcase, UserCircle2, Megaphone } from "lucide-react";
import { BRAND } from "@/constants/brand";
import { BrandLogo } from "@/components/common/BrandLogo";

const portals = [
  {
    to: "/employee/login",
    title: "Employee",
    desc: "Attendance, leaves, payslips & more.",
    icon: UserCircle2,
    accent: "from-blue-600 to-slate-900",
  },
  {
    to: "/hr/login",
    title: "HR",
    desc: "Recruit, manage and grow your people.",
    icon: Users,
    accent: "from-emerald-500 to-blue-600",
  },
  {
    to: "/team-manager/login",
    title: "Team Manager",
    desc: "Lead your team with clarity & insight.",
    icon: Briefcase,
    accent: "from-sky-500 to-blue-700",
  },
  {
    to: "/super-admin/login",
    title: "Super Admin",
    desc: "Govern BrajMart roles, access and audit logs.",
    icon: ShieldCheck,
    accent: "from-slate-900 to-blue-600",
  },
  {
    to: "/digital-marketing/login",
    title: "Digital Marketing",
    desc: "Manage clients, domains and invoices.",
    icon: Megaphone,
    accent: "from-amber-400 to-blue-600",
  },
];

export default function Landing() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[linear-gradient(180deg,#ffffff_0%,#f3f6fb_64%,#ffffff_100%)]" />
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <BrandLogo className="h-12 w-36" />
          <span className="hidden text-sm font-semibold tracking-tight text-muted-foreground sm:block">
            {BRAND.productName}
          </span>
        </div>
        <a href="#portals" className="text-sm text-muted-foreground hover:text-foreground">
          Choose portal
        </a>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-12 pt-8 text-center md:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center rounded-full border border-black/5 bg-white/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
            Internal HRMS for {BRAND.companyName}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
            {BRAND.companyName}
            <br />
            <span className="bg-gradient-to-r from-slate-950 via-primary to-emerald-600 bg-clip-text text-transparent">
              people operations.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Attendance, leaves, payroll, performance, assets and onboarding for one connected
            BrajMart team.
          </p>
        </motion.div>
      </section>

      <section
        id="portals"
        className="mx-auto grid max-w-7xl gap-5 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-5"
      >
        {portals.map((p, i) => (
          <motion.div
            key={p.to}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.5 }}
          >
            <Link
              to={p.to}
              className="group relative block overflow-hidden rounded-2xl border border-black/5 bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated"
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-glow ${p.accent}`}
              >
                <p.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-5 inline-flex items-center text-sm font-medium text-primary">
                Sign in{" "}
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </motion.div>
        ))}
      </section>

      <footer className="border-t border-black/5 bg-white py-6 text-center text-xs text-muted-foreground">
        {new Date().getFullYear()} {BRAND.companyName}. Crafted with care.
      </footer>
    </div>
  );
}
