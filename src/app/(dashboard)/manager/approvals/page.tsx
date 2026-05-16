import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { GoalStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, ChevronRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Approvals" };

export default async function ApprovalsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const cycleYear = new Date().getFullYear();

  const pendingSheets = await db.goalSheet.findMany({
    where: {
      cycleYear,
      status: GoalStatus.PENDING_APPROVAL,
      user: { managerId: session.userId },
    },
    include: {
      user: { select: { id: true, name: true, email: true, department: true } },
      goals: { select: { id: true, weightage: true } },
    },
    orderBy: { submittedAt: "asc" },
  });

  const approvedSheets = await db.goalSheet.findMany({
    where: {
      cycleYear,
      status: { in: [GoalStatus.APPROVED, GoalStatus.LOCKED] },
      user: { managerId: session.userId },
    },
    include: {
      user: { select: { id: true, name: true, email: true, department: true } },
      goals: { select: { id: true } },
    },
    orderBy: { approvedAt: "desc" },
    take: 10,
  });

  return (
    <div className="p-6 lg:p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Goal Approvals</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {cycleYear} cycle · Review and approve your team's goal sheets
        </p>
      </div>

      {/* Pending */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          Awaiting Review ({pendingSheets.length})
        </h2>
        {pendingSheets.length === 0 ? (
          <div className="flex flex-col items-center py-10 rounded-2xl border-2 border-dashed border-border bg-muted/30">
            <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
            <p className="font-medium text-foreground">All caught up!</p>
            <p className="text-muted-foreground text-sm mt-0.5">No pending submissions from your team.</p>
          </div>
        ) : (
          pendingSheets.map((sheet) => (
            <Link key={sheet.id} href={`/manager/approvals/${sheet.user.id}`}>
              <div className="group bg-card border border-amber-200 dark:border-amber-800 rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl gradient-brand-soft flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {sheet.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {sheet.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sheet.user.email} · {sheet.user.department ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{sheet.goals.length} goals</p>
                      <p className="text-xs text-muted-foreground">
                        {sheet.goals.reduce((s, g) => s + g.weightage, 0)}% weight
                      </p>
                    </div>
                    <Badge className="status-pending text-xs px-2 py-0.5 rounded-full border-0">
                      Pending
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </section>

      {/* Recently approved */}
      {approvedSheets.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Recently Approved
          </h2>
          {approvedSheets.map((sheet) => (
            <Link key={sheet.id} href={`/manager/approvals/${sheet.user.id}`}>
              <div className="group bg-card border border-border rounded-2xl p-4 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <p className="flex-1 font-medium text-foreground group-hover:text-primary transition-colors">
                    {sheet.user.name}
                  </p>
                  <span className="text-xs text-muted-foreground">{sheet.goals.length} goals</span>
                  <Badge className="status-approved text-xs px-2 py-0.5 rounded-full border-0">
                    Approved
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
