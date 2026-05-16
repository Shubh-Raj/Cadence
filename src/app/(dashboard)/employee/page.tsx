import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { GoalStatus, CheckInPeriod } from "@prisma/client";
import {
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Dashboard" };

const STATUS_CONFIG: Record<
  GoalStatus,
  { label: string; className: string }
> = {
  DRAFT: { label: "Draft", className: "status-draft" },
  PENDING_APPROVAL: { label: "Pending", className: "status-pending" },
  APPROVED: { label: "Approved", className: "status-approved" },
  REJECTED: { label: "Rejected", className: "status-rejected" },
  LOCKED: { label: "Locked", className: "status-locked" },
};

export default async function EmployeeDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");

  const cycleYear = new Date().getFullYear();

  // Fetch goal sheet + goals + checkins
  const goalSheet = await db.goalSheet.findUnique({
    where: { userId_cycleYear: { userId: session.userId, cycleYear } },
    include: {
      goals: {
        include: {
          checkIns: {
            where: { cycleYear },
            orderBy: { period: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const goals = goalSheet?.goals ?? [];
  const totalWeightage = goals.reduce((s, g) => s + g.weightage, 0);
  const completedGoals = goals.filter((g) =>
    g.checkIns.some((c) => c.status === "COMPLETED")
  ).length;

  const currentPeriod = getCurrentPeriod();

  // Stats
  const stats = [
    {
      label: "Total Goals",
      value: goals.length,
      max: 8,
      icon: Target,
      colour: "text-violet-600 bg-violet-100 dark:bg-violet-900/30",
    },
    {
      label: "Total Weightage",
      value: `${totalWeightage}%`,
      target: "100%",
      icon: TrendingUp,
      colour:
        totalWeightage === 100
          ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30"
          : "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
    },
    {
      label: "Completed",
      value: completedGoals,
      max: goals.length,
      icon: CheckCircle2,
      colour: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      label: "Current Period",
      value: currentPeriod ?? "—",
      icon: Clock,
      colour: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-foreground">
            Welcome back, {session.name.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {cycleYear} Goal Cycle · {goalSheet ? STATUS_CONFIG[goalSheet.status].label : "Not started"}
          </p>
        </div>
        {(!goalSheet || goalSheet.status === "DRAFT") && (
          <Link href="/employee/goals/new">
            <Button
              id="add-goal-btn"
              className="gradient-brand text-white shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, max, target, icon: Icon, colour }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colour}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">
              {value}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {label}
              {max !== undefined && (
                <span className="text-muted-foreground/60"> / {max}</span>
              )}
              {target && (
                <span className="text-muted-foreground/60"> target: {target}</span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Weightage alert */}
      {goals.length > 0 && totalWeightage !== 100 && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Weightage imbalance</p>
            <p className="text-sm opacity-80 mt-0.5">
              Your total weightage is{" "}
              <strong>{totalWeightage}%</strong> — it must equal exactly 100%
              before you can submit.
            </p>
          </div>
        </div>
      )}

      {/* Goals list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-semibold text-foreground">
            My Goals — {cycleYear}
          </h2>
          <Link
            href="/employee/goals"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-border bg-muted/30">
            <div className="w-14 h-14 rounded-2xl gradient-brand-soft flex items-center justify-center mb-4">
              <Target className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-heading font-semibold text-foreground">
              No goals yet
            </h3>
            <p className="text-muted-foreground text-sm mt-1 mb-6 text-center max-w-xs">
              Start by creating your first goal for the {cycleYear} cycle. You
              can add up to 8 goals.
            </p>
            <Link href="/employee/goals/new">
              <Button
                id="add-first-goal-btn"
                className="gradient-brand text-white shadow-lg shadow-primary/25 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Goal
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const latestCheckIn = goal.checkIns.at(-1);
              const progress = latestCheckIn?.computedScore
                ? Math.round(latestCheckIn.computedScore * 100)
                : null;

              return (
                <Link key={goal.id} href={`/employee/goals/${goal.id}`}>
                  <div className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {goal.title}
                          </p>
                          <Badge
                            className={`text-[11px] px-2 py-0.5 rounded-full border-0 ${STATUS_CONFIG[goalSheet!.status].className}`}
                          >
                            {STATUS_CONFIG[goalSheet!.status].label}
                          </Badge>
                          {goal.isShared && (
                            <Badge variant="outline" className="text-[11px]">
                              Shared
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {goal.thrustArea} · {goal.uomType} · Target:{" "}
                          {goal.targetValue}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold font-heading text-foreground">
                          {goal.weightage}%
                        </p>
                        <p className="text-xs text-muted-foreground">weight</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {progress !== null && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-brand rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit CTA */}
      {goalSheet?.status === "DRAFT" && goals.length > 0 && totalWeightage === 100 && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-semibold text-foreground">
              Ready to submit?
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              All {goals.length} goals are set and weightage totals 100%. Submit
              for manager approval.
            </p>
          </div>
          <Link href="/employee/goals">
            <Button
              id="submit-goals-cta"
              className="gradient-brand text-white shadow-lg shadow-primary/20 rounded-xl shrink-0"
            >
              Submit Goals
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function getCurrentPeriod(): string | null {
  const month = new Date().getMonth() + 1; // 1-indexed
  if (month >= 5 && month <= 6) return "Goal Setting";
  if (month === 7 || month === 8) return "Q1 Check-in";
  if (month >= 9 && month <= 11) return "Q2 Check-in";
  if (month >= 12 || month <= 2) return "Q3 Check-in";
  if (month >= 3 && month <= 4) return "Q4 / Annual";
  return null;
}
