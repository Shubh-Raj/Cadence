import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Role, GoalStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { UnlockGoalButton } from "@/components/admin/unlock-goal-button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Employees" };

const ROLE_LABEL: Record<Role, string> = {
  EMPLOYEE: "Employee",
  MANAGER: "Manager",
  ADMIN: "Admin",
};
const ROLE_CLS: Record<Role, string> = {
  EMPLOYEE: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  MANAGER: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  ADMIN: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};
const STATUS_CLS: Partial<Record<GoalStatus, string>> = {
  DRAFT: "status-draft",
  PENDING_APPROVAL: "status-pending",
  APPROVED: "status-approved",
  REJECTED: "status-rejected",
  LOCKED: "status-locked",
};

export default async function AdminEmployeesPage() {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) redirect("/login");

  const cycleYear = new Date().getFullYear();

  const users = await db.user.findMany({
    include: {
      manager: { select: { name: true } },
      goalSheets: {
        where: { cycleYear },
        include: { goals: { select: { id: true, title: true, isLocked: true, weightage: true } } },
      },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Employees</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {users.length} users · {cycleYear} cycle
        </p>
      </div>

      <div className="space-y-4">
        {users.map((user) => {
          const sheet = user.goalSheets[0];
          const lockedGoals = sheet?.goals.filter((g) => g.isLocked) ?? [];

          return (
            <div key={user.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* User row */}
              <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground">{user.name}</p>
                    <Badge className={`text-[11px] px-2 py-0.5 rounded-full border-0 ${ROLE_CLS[user.role]}`}>
                      {ROLE_LABEL[user.role]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {user.email} · {user.department ?? "—"} · Manager: {user.manager?.name ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm text-muted-foreground">{sheet?.goals.length ?? 0} goals</span>
                  {sheet ? (
                    <Badge className={`text-[11px] px-2 py-0.5 rounded-full border-0 ${STATUS_CLS[sheet.status]}`}>
                      {sheet.status.replace("_", " ")}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not started</span>
                  )}
                </div>
              </div>

              {/* Locked goals with unlock button */}
              {lockedGoals.length > 0 && (
                <div className="border-t border-border bg-muted/20 px-5 py-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                    Locked Goals
                  </p>
                  {sheet!.goals.map((goal) => (
                    <div key={goal.id} className="flex items-center justify-between gap-4 py-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{goal.title}</p>
                        <p className="text-xs text-muted-foreground">{goal.weightage}% weight</p>
                      </div>
                      {goal.isLocked && (
                        <UnlockGoalButton goalId={goal.id} goalTitle={goal.title} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
