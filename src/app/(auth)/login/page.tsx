"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Target,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  TrendingUp,
  Users,
  BarChart3,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Goal Alignment",
    desc: "Align employee goals with organizational KPIs",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    desc: "Quarterly check-ins with real-time progress scores",
  },
  {
    icon: Users,
    title: "Team Visibility",
    desc: "Manager dashboards with full team oversight",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "QoQ trends and performance heatmaps",
  },
];

const demoAccounts = [
  { role: "Employee", email: "employee@atomquest.dev", pass: "Employee@123" },
  { role: "Manager", email: "manager@atomquest.dev", pass: "Manager@123" },
  { role: "Admin / HR", email: "admin@atomquest.dev", pass: "Admin@123" },
];

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    undefined
  );

  return (
    <div className="flex w-full min-h-screen">
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-[55%] gradient-brand flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(circle, oklch(0.85 0.10 280), transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full opacity-15"
            style={{
              background:
                "radial-gradient(circle, oklch(0.90 0.08 250), transparent 70%)",
            }}
          />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(oklch(1 0 0 / 0.3) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.3) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-heading font-bold text-xl">
            AtomQuest
          </span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl xl:text-5xl font-heading font-bold text-white leading-tight mb-4">
              Drive Performance
              <br />
              <span className="text-white/75">with Purpose</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-md">
              Set meaningful goals, track quarterly progress, and align your
              team around what truly matters, all in one place.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="glass rounded-2xl p-4 space-y-2 hover:bg-white/15 transition-colors"
                style={{
                  background: "oklch(1 0 0 / 0.1)",
                  border: "1px solid oklch(1 0 0 / 0.2)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-white/60 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="relative z-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs text-white/70"
            style={{ background: "oklch(1 0 0 / 0.1)", border: "1px solid oklch(1 0 0 / 0.2)" }}
          >
            <Shield className="w-3 h-3" />
            AtomQuest Hackathon 2026
          </div>
        </div>
      </div>

      {/* ── Right Panel — Login Form ── */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">
              AtomQuest
            </span>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-3xl font-heading font-bold text-foreground">
              Welcome back
            </h2>
            <p className="text-muted-foreground mt-2">
              Sign in to access your goal portal
            </p>
          </div>

          {/* Form */}
          <form action={action} className="space-y-5">
            {/* Global error */}
            {state?.message && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <Shield className="w-4 h-4 shrink-0" />
                {state.message}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Work Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="pl-10 h-11 bg-background border-border focus:border-primary transition-colors"
                  aria-describedby="email-error"
                />
              </div>
              {state?.errors?.email && (
                <p id="email-error" className="text-destructive text-xs">
                  {state.errors.email[0]}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-10 h-11 bg-background border-border focus:border-primary transition-colors"
                  aria-describedby="password-error"
                />
              </div>
              {state?.errors?.password && (
                <p id="password-error" className="text-destructive text-xs">
                  {state.errors.password[0]}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              id="login-submit"
              type="submit"
              disabled={pending}
              className="w-full h-11 gradient-brand text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">
                Demo accounts
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-2">
              {demoAccounts.map(({ role, email, pass }) => (
                <div
                  key={role}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted/70 transition-colors text-sm"
                >
                  <div>
                    <span className="font-medium text-foreground">{role}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {email}
                    </p>
                  </div>
                  <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded-md">
                    {pass}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
