import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { GoalStatus, Role } from "@prisma/client";
import { Users, BarChart3, ClipboardList, CheckCircle2, ChevronRight, Shield, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) redirect("/login");

  const cycleYear = new Date().getFullYear();

  const [totalUsers, totalGoalSheets, pendingCount, approvedCount, auditCount] =
    await Promise.all([
      db.user.count(),
      db.goalSheet.count({ where: { cycleYear } }),
      db.goalSheet.count({ where: { cycleYear, status: GoalStatus.PENDING_APPROVAL } }),
      db.goalSheet.count({ where: { cycleYear, status: { in: [GoalStatus.APPROVED, GoalStatus.LOCKED] } } }),
      db.auditLog.count(),
    ]);

  const recentGoalSheets = await db.goalSheet.findMany({
    where: { cycleYear },
    include: {
      user: { select: { name: true, email: true, department: true, role: true } },
      goals: { select: { id: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  const STATUS_CONFIG: Record<GoalStatus, { label: string; className: string }> = {
    DRAFT: { label: "Draft", className: "status-draft" },
    PENDING_APPROVAL: { label: "Pending", className: "status-pending" },
    APPROVED: { label: "Approved", className: "status-approved" },
    REJECTED: { label: "Rejected", className: "status-rejected" },
    LOCKED: { label: "Locked", className: "status-locked" },
  };

  const completionPct = totalUsers > 0 ? Math.round((totalGoalSheets / totalUsers) * 100) : 0;

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users, colour: "text-violet-600 bg-violet-100" },
    { label: "Goal Sheets (This Cycle)", value: totalGoalSheets, icon: ClipboardList, colour: "text-blue-600 bg-blue-100" },
    { label: "Pending Approvals", value: pendingCount, icon: TrendingUp, colour: pendingCount > 0 ? "text-amber-600 bg-amber-100" : "text-emerald-600 bg-emerald-100" },
    { label: "Audit Events", value: auditCount, icon: Shield, colour: "text-slate-600 bg-slate-100" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">{cycleYear} Cycle · Organisation Overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, colour }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colour}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Org completion bar */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-foreground">Goal Submission Rate</h3>
          <span className="text-2xl font-heading font-bold text-primary">{completionPct}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full gradient-brand rounded-full transition-all" style={{ width: `${completionPct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{totalGoalSheets} sheets submitted</span>
          <span>{totalUsers} total employees</span>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-lg font-heading font-bold text-amber-600">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-heading font-bold text-emerald-600">{approvedCount}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-heading font-bold text-muted-foreground">{totalUsers - totalGoalSheets}</p>
            <p className="text-xs text-muted-foreground">Not started</p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: "/admin/employees", label: "Manage Employees", icon: Users, desc: "View org hierarchy and roles" },
          { href: "/admin/analytics", label: "Analytics", icon: BarChart3, desc: "QoQ trends and heatmaps" },
          { href: "/admin/audit", label: "Audit Log", icon: Shield, desc: "All goal change history" },
        ].map(({ href, label, icon: Icon, desc }) => (
          <Link key={href} href={href}>
            <div className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl gradient-brand-soft flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground mt-3 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent goal sheets */}
      <div className="space-y-3">
        <h2 className="text-lg font-heading font-semibold text-foreground">Recent Activity</h2>
        {recentGoalSheets.length === 0 ? (
          <p className="text-muted-foreground text-sm">No goal sheets this cycle yet.</p>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Employee</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Department</th>
                  <th className="text-center px-5 py-3 font-semibold text-muted-foreground">Goals</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentGoalSheets.map((sheet) => (
                  <tr key={sheet.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{sheet.user.name}</p>
                      <p className="text-xs text-muted-foreground">{sheet.user.email}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{sheet.user.department ?? "—"}</td>
                    <td className="px-5 py-3 text-center font-semibold text-foreground">{sheet.goals.length}</td>
                    <td className="px-5 py-3">
                      <Badge className={`text-[11px] px-2 py-0.5 rounded-full border-0 ${STATUS_CONFIG[sheet.status].className}`}>
                        {STATUS_CONFIG[sheet.status].label}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
