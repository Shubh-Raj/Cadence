import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Role, GoalStatus } from "@prisma/client";
import { ManagerEffectivenessChart } from "@/components/admin/analytics-charts";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manager Effectiveness" };

export default async function ManagerEffectivenessPage() {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) redirect("/login");

  const cycleYear = new Date().getFullYear();

  const managers = await db.user.findMany({
    where: { role: Role.MANAGER },
    select: {
      id: true,
      name: true,
      department: true,
      directReports: {
        select: {
          id: true,
          goalSheets: {
            where: { cycleYear },
            select: {
              id: true,
              status: true,
              submittedAt: true,
              approvedAt: true,
              goals: {
                select: {
                  id: true,
                  checkIns: {
                    where: { cycleYear },
                    select: { id: true, reviewerComment: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const SUBMITTED_STATUSES: GoalStatus[] = [
    GoalStatus.PENDING_APPROVAL,
    GoalStatus.APPROVED,
    GoalStatus.LOCKED,
    GoalStatus.REJECTED,
  ];
  const APPROVED_STATUSES: GoalStatus[] = [GoalStatus.APPROVED, GoalStatus.LOCKED];

  const managerData = managers.map((mgr) => {
    const team = mgr.directReports;
    const total = team.length;

    const submitted = team.filter(
      (e) => e.goalSheets[0] && SUBMITTED_STATUSES.includes(e.goalSheets[0].status)
    ).length;

    const approved = team.filter(
      (e) => e.goalSheets[0] && APPROVED_STATUSES.includes(e.goalSheets[0].status)
    ).length;

    const approvalTimes: number[] = [];
    for (const emp of team) {
      const sheet = emp.goalSheets[0];
      if (sheet?.submittedAt && sheet?.approvedAt) {
        const days = Math.round(
          (sheet.approvedAt.getTime() - sheet.submittedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        approvalTimes.push(days);
      }
    }
    const avgApprovalDays =
      approvalTimes.length > 0
        ? Math.round(approvalTimes.reduce((s, d) => s + d, 0) / approvalTimes.length)
        : null;

    const allCheckIns = team.flatMap(
      (e) => e.goalSheets[0]?.goals.flatMap((g) => g.checkIns) ?? []
    );
    const commentedCheckIns = allCheckIns.filter((c) => c.reviewerComment).length;
    const commentRate =
      allCheckIns.length > 0
        ? Math.round((commentedCheckIns / allCheckIns.length) * 100)
        : null;

    return {
      name: mgr.name,
      dept: mgr.department ?? "—",
      total,
      submitted,
      approved,
      submissionRate: total > 0 ? Math.round((submitted / total) * 100) : 0,
      approvalRate: submitted > 0 ? Math.round((approved / submitted) * 100) : 0,
      avgApprovalDays,
      commentRate,
      checkInCount: allCheckIns.length,
    };
  });

  const chartData = managerData.map((m) => ({
    name: m.name.split(" ")[0],
    "Submission %": m.submissionRate,
    "Approval %": m.approvalRate,
    "Comment Rate %": m.commentRate ?? 0,
  }));

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Manager Effectiveness</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Comparison of approval and check-in performance across L1 managers
        </p>
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="font-semibold text-foreground text-sm mb-4">
          Team Completion Rates by Manager
        </p>
        {chartData.length > 0 ? (
          <ManagerEffectivenessChart data={chartData} />
        ) : (
          <p className="text-muted-foreground text-sm text-center py-10">No managers yet</p>
        )}
      </div>

      {/* Manager table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/40">
          <p className="text-sm font-semibold text-foreground">Manager Detail</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground">Manager</th>
              <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground text-center">Team</th>
              <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground text-center">Submitted</th>
              <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground text-center">Approved</th>
              <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground text-center">Avg Approval</th>
              <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground text-center">Comment Rate</th>
            </tr>
          </thead>
          <tbody>
            {managerData.map((m) => (
              <tr key={m.name} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3">
                  <p className="font-medium text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.dept}</p>
                </td>
                <td className="px-5 py-3 text-center text-muted-foreground">{m.total}</td>
                <td className="px-5 py-3 text-center">
                  <span className={m.submissionRate === 100 ? "text-emerald-600 font-semibold" : "text-muted-foreground"}>
                    {m.submitted}/{m.total} ({m.submissionRate}%)
                  </span>
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={m.approvalRate >= 80 ? "text-emerald-600 font-semibold" : "text-amber-600"}>
                    {m.approved}/{m.submitted} ({m.approvalRate}%)
                  </span>
                </td>
                <td className="px-5 py-3 text-center text-muted-foreground">
                  {m.avgApprovalDays !== null ? `${m.avgApprovalDays}d` : "—"}
                </td>
                <td className="px-5 py-3 text-center">
                  {m.commentRate !== null ? (
                    <Badge
                      className={`text-[11px] px-2 py-0.5 rounded-full border-0 ${
                        m.commentRate >= 80
                          ? "bg-emerald-100 text-emerald-700"
                          : m.commentRate >= 50
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {m.commentRate}%
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
