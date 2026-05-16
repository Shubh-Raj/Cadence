import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { GoalStatus } from "@prisma/client";
import { WeightageBar } from "@/components/goals/weightage-bar";
import { submitGoalSheetAction, deleteGoalAction, MAX_GOALS, MIN_WEIGHTAGE } from "@/lib/actions/goal.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Lock, Send, AlertCircle, RotateCcw } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Goals" };

const UOM_LABEL: Record<string, string> = {
  MIN: "Min (↑ better)",
  MAX: "Max (↓ better)",
  TIMELINE: "Timeline",
  ZERO: "Zero-based",
};

export default async function EmployeeGoalsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const cycleYear = new Date().getFullYear();

  const goalSheet = await db.goalSheet.findUnique({
    where: { userId_cycleYear: { userId: session.userId, cycleYear } },
    include: { goals: { orderBy: { createdAt: "asc" } } },
  });

  const goals = goalSheet?.goals ?? [];
  const status = goalSheet?.status ?? GoalStatus.DRAFT;
  const total = goals.reduce((s, g) => s + g.weightage, 0);
  const canEdit = status === GoalStatus.DRAFT || status === GoalStatus.REJECTED;
  const canSubmit =
    canEdit &&
    goals.length > 0 &&
    goals.length <= MAX_GOALS &&
    goals.every((g) => g.weightage >= MIN_WEIGHTAGE) &&
    Math.round(total) === 100;

  const STATUS_MAP: Record<GoalStatus, { label: string; cls: string }> = {
    DRAFT: { label: "Draft", cls: "status-draft" },
    PENDING_APPROVAL: { label: "Pending Approval", cls: "status-pending" },
    APPROVED: { label: "Approved", cls: "status-approved" },
    REJECTED: { label: "Rejected", cls: "status-rejected" },
    LOCKED: { label: "Locked", cls: "status-locked" },
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            My Goals — {cycleYear}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`text-xs px-2 py-0.5 rounded-full border-0 ${STATUS_MAP[status].cls}`}>
              {STATUS_MAP[status].label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {goals.length} / {MAX_GOALS} goals
            </span>
          </div>
        </div>
        {canEdit && goals.length < MAX_GOALS && (
          <Link href="/employee/goals/new">
            <Button id="add-goal-btn" className="gradient-brand text-white rounded-xl shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </Link>
        )}
      </div>

      {/* Rejection note */}
      {status === GoalStatus.REJECTED && goalSheet?.rejectionNote && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              Returned for rework
            </p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
              {goalSheet.rejectionNote}
            </p>
          </div>
        </div>
      )}

      {/* Weightage bar */}
      {goals.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <WeightageBar goals={goals} />
        </div>
      )}

      {/* Goal list */}
      {goals.length === 0 ? (
        <div className="flex flex-col items-center py-16 rounded-2xl border-2 border-dashed border-border bg-muted/30">
          <p className="font-heading font-semibold text-foreground">No goals yet</p>
          <p className="text-muted-foreground text-sm mt-1 mb-5">
            Add up to {MAX_GOALS} goals. Each must have at least {MIN_WEIGHTAGE}% weightage.
          </p>
          {canEdit && (
            <Link href="/employee/goals/new">
              <Button id="add-first-goal-btn" className="gradient-brand text-white rounded-xl">
                <Plus className="w-4 h-4 mr-2" /> Add First Goal
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground">{goal.title}</p>
                    {goal.isShared && (
                      <Badge variant="outline" className="text-[11px]">Shared</Badge>
                    )}
                    {goal.isLocked && (
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {goal.thrustArea} · {UOM_LABEL[goal.uomType]} · Target: {goal.targetValue}
                  </p>
                  {goal.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {goal.description}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-heading font-bold text-foreground">
                    {goal.weightage}%
                  </p>
                  <p className="text-xs text-muted-foreground">weight</p>
                </div>
              </div>

              {canEdit && !goal.isLocked && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Link href={`/employee/goals/${goal.id}/edit`}>
                    <Button id={`edit-goal-${goal.id}`} variant="outline" size="sm" className="rounded-lg gap-1.5 text-xs">
                      <Pencil className="w-3 h-3" /> Edit
                    </Button>
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await deleteGoalAction(goal.id);
                    }}
                  >
                    <Button
                      id={`delete-goal-${goal.id}`}
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="rounded-lg gap-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </Button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submit / Resubmit */}
      {goalSheet && canSubmit && (
        <div className="bg-card border border-primary/30 rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-heading font-semibold text-foreground">Ready to submit</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {goals.length} goals · 100% weightage · send to manager for approval
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await submitGoalSheetAction(goalSheet.id);
            }}
          >
            <Button
              id="submit-goals-btn"
              type="submit"
              className="gradient-brand text-white rounded-xl shadow-lg shadow-primary/20 gap-2"
            >
              {status === GoalStatus.REJECTED ? (
                <><RotateCcw className="w-4 h-4" /> Resubmit</>
              ) : (
                <><Send className="w-4 h-4" /> Submit for Approval</>
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
