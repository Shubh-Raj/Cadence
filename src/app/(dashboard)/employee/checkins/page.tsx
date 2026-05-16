import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CheckInPeriod } from "@prisma/client";
import { getCurrentPeriod } from "@/lib/actions/checkin.actions";
import { CheckInForm } from "@/components/goals/checkin-form";
import { Clock, Lock, AlertCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Check-ins" };

const PERIOD_LABEL: Record<CheckInPeriod, string> = {
  Q1: "Q1 — July Progress Update",
  Q2: "Q2 — October Progress Update",
  Q3: "Q3 — January Progress Update",
  Q4: "Q4 / Annual — Final Achievement",
};

export default async function EmployeeCheckInsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const cycleYear = new Date().getFullYear();
  const period = getCurrentPeriod();

  const goalSheet = await db.goalSheet.findUnique({
    where: { userId_cycleYear: { userId: session.userId, cycleYear } },
    include: {
      goals: {
        where: { isLocked: true },
        include: {
          checkIns: { where: { period: period ?? undefined, cycleYear } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const lockedGoals = goalSheet?.goals ?? [];

  return (
    <div className="p-6 lg:p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Check-ins</h1>
        {period ? (
          <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Active window: <span className="font-medium text-foreground">{PERIOD_LABEL[period]}</span>
          </p>
        ) : (
          <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            No active check-in window right now (Goal Setting: May–June)
          </p>
        )}
      </div>

      {!period && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Check-in windows open in July (Q1), October (Q2), January (Q3), and March/April (Q4).
          </p>
        </div>
      )}

      {lockedGoals.length === 0 ? (
        <div className="flex flex-col items-center py-16 rounded-2xl border-2 border-dashed border-border bg-muted/30">
          <Lock className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="font-heading font-semibold text-foreground">No approved goals yet</p>
          <p className="text-muted-foreground text-sm mt-1 text-center max-w-xs">
            Goals must be approved by your manager before you can log check-in updates.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {lockedGoals.map((goal) => {
            const existing = goal.checkIns[0];
            return (
              <div key={goal.id} className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">{goal.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {goal.thrustArea} · Target: {goal.targetValue} · {goal.weightage}% weight
                    </p>
                  </div>
                  {existing?.computedScore !== undefined && existing.computedScore !== null && (
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-heading font-bold text-primary">
                        {Math.round(existing.computedScore * 100)}%
                      </p>
                      <p className="text-xs text-muted-foreground">score</p>
                    </div>
                  )}
                </div>

                {period ? (
                  <CheckInForm
                    goalId={goal.id}
                    period={period}
                    defaultValues={{
                      actualValue: existing?.actualValue ?? undefined,
                      status: existing?.status ?? "NOT_STARTED",
                      employeeNote: existing?.employeeNote ?? undefined,
                    }}
                    reviewerComment={existing?.reviewerComment ?? undefined}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No active check-in window — come back in July.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
