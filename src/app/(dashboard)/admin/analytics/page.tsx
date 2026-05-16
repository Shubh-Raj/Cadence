import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Role, GoalStatus } from "@prisma/client";
import { Download } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) redirect("/login");

  const cycleYear = new Date().getFullYear();

  const [totalEmployees, sheets, checkIns] = await Promise.all([
    db.user.count({ where: { role: Role.EMPLOYEE } }),
    db.goalSheet.findMany({
      where: { cycleYear },
      include: {
        goals: { include: { checkIns: { where: { cycleYear } } } },
        user: { select: { department: true, name: true } },
      },
    }),
    db.checkIn.findMany({
      where: { cycleYear },
      include: {
        goal: { select: { weightage: true, uomType: true } },
      },
    }),
  ]);

  // Submission stats
  const submitted = sheets.filter((s) =>
    ([
      GoalStatus.PENDING_APPROVAL,
      GoalStatus.APPROVED,
      GoalStatus.REJECTED,
      GoalStatus.LOCKED,
    ] as GoalStatus[]).includes(s.status)
  ).length;
  const approved = sheets.filter((s) =>
    ([GoalStatus.APPROVED, GoalStatus.LOCKED] as GoalStatus[]).includes(s.status)
  ).length;
  const notStarted = totalEmployees - sheets.length;

  const submissionRate = totalEmployees > 0 ? Math.round((submitted / totalEmployees) * 100) : 0;
  const approvalRate = submitted > 0 ? Math.round((approved / submitted) * 100) : 0;

  // Department breakdown
  const deptMap: Record<string, { submitted: number; approved: number; total: number }> = {};
  for (const s of sheets) {
    const dept = s.user.department ?? "Unassigned";
    if (!deptMap[dept]) deptMap[dept] = { submitted: 0, approved: 0, total: 0 };
    deptMap[dept].total++;
    if (
      (
        [
          GoalStatus.PENDING_APPROVAL,
          GoalStatus.APPROVED,
          GoalStatus.LOCKED,
        ] as GoalStatus[]
      ).includes(s.status)
    )
      deptMap[dept].submitted++;
    if (([GoalStatus.APPROVED, GoalStatus.LOCKED] as GoalStatus[]).includes(s.status))
      deptMap[dept].approved++;
  }

  // Average score from check-ins
  const scored = checkIns.filter((c) => c.computedScore !== null);
  const avgScore =
    scored.length > 0
      ? Math.round((scored.reduce((s, c) => s + (c.computedScore ?? 0), 0) / scored.length) * 100)
      : null;

  const stats = [
    { label: "Total Employees", value: totalEmployees },
    { label: "Sheets Submitted", value: submitted },
    { label: "Sheets Approved", value: approved },
    { label: "Not Started", value: notStarted },
    { label: "Submission Rate", value: `${submissionRate}%` },
    { label: "Approval Rate", value: `${approvalRate}%` },
    { label: "Avg Progress Score", value: avgScore !== null ? `${avgScore}%` : "—" },
    { label: "Check-ins Logged", value: checkIns.length },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">{cycleYear} cycle overview</p>
        </div>
        <a href={`/api/export?year=${cycleYear}`} download>
          <button
            id="export-csv-btn"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </a>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
            <p className="text-3xl font-heading font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Submission rate bar */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <p className="font-semibold text-foreground text-sm">Submission Rate — {cycleYear}</p>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full gradient-brand rounded-full transition-all duration-700"
              style={{ width: `${submissionRate}%` }}
            />
          </div>
          <span className="font-bold font-heading text-foreground tabular-nums w-12 text-right">
            {submissionRate}%
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${approvalRate}%` }}
            />
          </div>
          <span className="font-bold font-heading text-emerald-600 tabular-nums w-12 text-right">
            {approvalRate}%
          </span>
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full gradient-brand inline-block" /> Submitted</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Approved</span>
        </div>
      </div>

      {/* Department breakdown */}
      {Object.keys(deptMap).length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/40">
            <p className="text-sm font-semibold text-foreground">Department Breakdown</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground">Department</th>
                <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground text-center">Sheets</th>
                <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground text-center">Submitted</th>
                <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground text-center">Approved</th>
                <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground">Rate</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(deptMap).map(([dept, data]) => (
                <tr key={dept} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{dept}</td>
                  <td className="px-5 py-3 text-center text-muted-foreground">{data.total}</td>
                  <td className="px-5 py-3 text-center text-muted-foreground">{data.submitted}</td>
                  <td className="px-5 py-3 text-center text-emerald-600 font-semibold">{data.approved}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[80px] h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full gradient-brand rounded-full"
                          style={{ width: `${data.total > 0 ? Math.round((data.submitted / data.total) * 100) : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {data.total > 0 ? Math.round((data.submitted / data.total) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
