import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, ShieldCheck, Briefcase, UserCircle2, Sparkles } from "lucide-react";

const portals = [
  { to: "/employee/login",      title: "Employee",     desc: "Attendance, leaves, payslips & more.",     icon: UserCircle2,  accent: "from-indigo-500 to-violet-500" },
  { to: "/hr/login",            title: "HR",           desc: "Recruit, manage and grow your people.",     icon: Users,        accent: "from-emerald-500 to-teal-500" },
  { to: "/team-manager/login",  title: "Team Manager", desc: "Lead your team with clarity & insight.",    icon: Briefcase,    accent: "from-sky-500 to-cyan-500" },
  { to: "/super-admin/login",   title: "Super Admin",  desc: "Govern multi-company operations.",          icon: ShieldCheck,  accent: "from-rose-500 to-fuchsia-500" },
];

export default function Landing() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 gradient-mesh" />
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-white shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">Pulse HRMS</span>
        </div>
        <a href="#portals" className="text-sm text-muted-foreground hover:text-foreground">Choose portal</a>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-12 pt-8 text-center md:pt-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center rounded-full border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            New · Multi-company, multi-language, dark mode
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
            People operations,{" "}
            <span className="bg-gradient-to-r from-primary via-fuchsia-500 to-emerald-500 bg-clip-text text-transparent">
              beautifully unified.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            A premium HRMS for modern teams — attendance, leaves, payroll, performance, assets and onboarding, in one calm workspace.
          </p>
        </motion.div>
      </section>

      <section id="portals" className="mx-auto grid max-w-7xl gap-5 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {portals.map((p, i) => (
          <motion.div key={p.to} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.5 }}>
            <Link to={p.to} className="group relative block overflow-hidden rounded-3xl border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated">
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-glow ${p.accent}`}>
                <p.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-5 inline-flex items-center text-sm font-medium text-primary">
                Sign in <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </motion.div>
        ))}
      </section>

      <footer className="border-t bg-card/30 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Pulse HRMS. Crafted with care.
      </footer>
    </div>
  );
}
