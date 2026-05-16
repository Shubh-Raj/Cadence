import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { GoalStatus } from "@prisma/client";
import { Users, BarChart3, ClipboardList, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manager Dashboard" };

const STATUS_CONFIG: Record<GoalStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "status-draft" },
  PENDING_APPROVAL: { label: "Pending", className: "status-pending" },
  APPROVED: { label: "Approved", className: "status-approved" },
  REJECTED: { label: "Rejected", className: "status-rejected" },
  LOCKED: { label: "Locked", className: "status-locked" },
};

export default async function ManagerDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");

  const cycleYear = new Date().getFullYear();

  const reports = await db.user.findMany({
    where: { managerId: session.userId },
    include: {
      goalSheets: {
        where: { cycleYear },
        include: { goals: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const pending = reports.filter((r) => r.goalSheets[0]?.status === GoalStatus.PENDING_APPROVAL);
  const approved = reports.filter((r) =>
    r.goalSheets[0]?.status === GoalStatus.APPROVED || r.goalSheets[0]?.status === GoalStatus.LOCKED
  );
  const noSheet = reports.filter((r) => r.goalSheets.length === 0);

  const stats = [
    { label: "Team Members", value: reports.length, icon: Users, colour: "text-violet-600 bg-violet-100" },
    { label: "Pending Approval", value: pending.length, icon: ClipboardList, colour: pending.length > 0 ? "text-amber-600 bg-amber-100" : "text-emerald-600 bg-emerald-100" },
    { label: "Goals Approved", value: approved.length, icon: CheckCircle2, colour: "text-emerald-600 bg-emerald-100" },
    { label: "Not Submitted", value: noSheet.length, icon: BarChart3, colour: noSheet.length > 0 ? "text-red-600 bg-red-100" : "text-emerald-600 bg-emerald-100" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-foreground">Manager Dashboard</h1>
        <p className="text-muted-foreground mt-1">{cycleYear} Cycle · {reports.length} direct report{reports.length !== 1 ? "s" : ""}</p>
      </div>

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

      {pending.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="flex-1 text-sm font-medium text-amber-800 dark:text-amber-300">
            {pending.length} goal sheet{pending.length !== 1 ? "s" : ""} awaiting your approval
          </p>
          <Link href="/manager/approvals">
            <Button id="review-pending-btn" size="sm" className="gradient-brand text-white rounded-xl">
              Review <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-heading font-semibold text-foreground">Team Overview</h2>
        {reports.length === 0 ? (
          <div className="flex flex-col items-center py-16 rounded-2xl border-2 border-dashed border-border bg-muted/30">
            <Users className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="font-heading font-semibold text-foreground">No direct reports</p>
            <p className="text-muted-foreground text-sm mt-1">Contact Admin to update the org hierarchy.</p>
          </div>
        ) : (
          reports.map((emp) => {
            const sheet = emp.goalSheets[0];
            const goalCount = sheet?.goals.length ?? 0;
            const totalWeight = sheet?.goals.reduce((s, g) => s + g.weightage, 0) ?? 0;
            const status = sheet?.status ?? null;
            return (
              <Link key={emp.id} href={`/manager/team/${emp.id}`}>
                <div className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl gradient-brand-soft flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{emp.name}</p>
                        <Badge className={`text-[11px] px-2 py-0.5 rounded-full border-0 ${status ? STATUS_CONFIG[status].className : "status-draft"}`}>
                          {status ? STATUS_CONFIG[status].label : "No sheet"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{emp.email} · {emp.department ?? "—"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-foreground">{goalCount} goals</p>
                      <p className="text-xs text-muted-foreground">{totalWeight}% weight</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
