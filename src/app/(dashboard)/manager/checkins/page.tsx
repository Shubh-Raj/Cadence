import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getCurrentPeriod } from "@/lib/actions/checkin.actions";
import { CheckInPeriod } from "@prisma/client";
import { ManagerCommentForm } from "@/components/goals/manager-comment-form";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Team Check-ins" };

const PERIOD_LABEL: Record<CheckInPeriod, string> = {
  Q1: "Q1 — July",
  Q2: "Q2 — October",
  Q3: "Q3 — January",
  Q4: "Q4 / Annual",
};

const STATUS_COLOUR: Record<string, string> = {
  NOT_STARTED: "bg-zinc-100 text-zinc-600",
  ON_TRACK: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

export default async function ManagerCheckInsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const cycleYear = new Date().getFullYear();
  const period = getCurrentPeriod();

  const team = await db.user.findMany({
    where: { managerId: session.userId },
    include: {
      goalSheets: {
        where: { cycleYear },
        include: {
          goals: {
            where: { isLocked: true },
            include: {
              checkIns: {
                where: { period: period ?? undefined, cycleYear },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Team Check-ins</h1>
        <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
          <Users className="w-4 h-4" />
          {period ? `Active: ${PERIOD_LABEL[period]} · ${cycleYear}` : "No active check-in window"}
        </p>
      </div>

      {team.length === 0 ? (
        <div className="flex flex-col items-center py-12 rounded-2xl border-2 border-dashed border-border bg-muted/30">
          <Users className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-foreground">No direct reports</p>
        </div>
      ) : (
        <div className="space-y-6">
          {team.map((emp) => {
            const goals = emp.goalSheets[0]?.goals ?? [];
            return (
              <div key={emp.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Employee header */}
                <div className="px-5 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
                  <p className="font-semibold text-foreground text-sm">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">{emp.department ?? "—"} · {goals.length} goals</p>
                </div>

                {goals.length === 0 ? (
                  <div className="px-5 py-4 text-sm text-muted-foreground">
                    No approved goals yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {goals.map((goal) => {
                      const checkIn = goal.checkIns[0];
                      const score = checkIn?.computedScore;
                      return (
                        <div key={goal.id} className="px-5 py-4 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm">{goal.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Target: {goal.targetValue} · {goal.weightage}% weight
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {checkIn && (
                                <Badge className={`text-[11px] px-2 py-0.5 rounded-full border-0 ${STATUS_COLOUR[checkIn.status]}`}>
                                  {checkIn.status.replace("_", " ")}
                                </Badge>
                              )}
                              <div className="text-right">
                                <p className="text-sm font-semibold text-foreground">
                                  {checkIn?.actualValue ?? "—"}
                                </p>
                                <p className="text-xs text-muted-foreground">actual</p>
                              </div>
                              {score !== null && score !== undefined && (
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-primary">
                                    {Math.round(score * 100)}%
                                  </p>
                                  <p className="text-xs text-muted-foreground">score</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Employee note */}
                          {checkIn?.employeeNote && (
                            <p className="text-xs text-muted-foreground italic px-3 py-2 bg-muted/50 rounded-lg">
                              "{checkIn.employeeNote}"
                            </p>
                          )}

                          {/* Manager comment */}
                          {checkIn && (
                            <ManagerCommentForm
                              checkInId={checkIn.id}
                              existingComment={checkIn.reviewerComment ?? undefined}
                            />
                          )}

                          {!checkIn && (
                            <p className="text-xs text-muted-foreground italic">
                              Employee has not submitted a check-in for this period yet.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
