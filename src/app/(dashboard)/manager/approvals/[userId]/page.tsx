import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { GoalStatus } from "@prisma/client";
import { approveGoalSheetAction } from "@/lib/actions/approval.actions";
import { RejectForm } from "@/components/goals/reject-form";
import { ManagerGoalRow } from "@/components/goals/manager-goal-row";
import { WeightageBar } from "@/components/goals/weightage-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Review Goal Sheet" };

const UOM_LABEL: Record<string, string> = {
  MIN: "Min (↑ better)",
  MAX: "Max (↓ better)",
  TIMELINE: "Timeline",
  ZERO: "Zero-based",
};

export default async function ReviewGoalSheetPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { userId } = await params;

  const employee = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, department: true, managerId: true },
  });

  if (!employee || employee.managerId !== session.userId) notFound();

  const cycleYear = new Date().getFullYear();
  const sheet = await db.goalSheet.findUnique({
    where: { userId_cycleYear: { userId, cycleYear } },
    include: { goals: { orderBy: { createdAt: "asc" } } },
  });

  if (!sheet) notFound();

  const canAct = sheet.status === GoalStatus.PENDING_APPROVAL;
  const total = sheet.goals.reduce((s, g) => s + g.weightage, 0);

  const STATUS_MAP: Record<GoalStatus, { label: string; cls: string }> = {
    DRAFT: { label: "Draft", cls: "status-draft" },
    PENDING_APPROVAL: { label: "Pending Approval", cls: "status-pending" },
    APPROVED: { label: "Approved", cls: "status-approved" },
    REJECTED: { label: "Rejected", cls: "status-rejected" },
    LOCKED: { label: "Locked", cls: "status-locked" },
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl space-y-6">
      {/* Back */}
      <Link href="/manager/approvals" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Approvals
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">{employee.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {employee.email} · {employee.department ?? "—"} · {cycleYear} cycle
          </p>
        </div>
        <Badge className={`text-sm px-3 py-1 rounded-full border-0 ${STATUS_MAP[sheet.status].cls}`}>
          {STATUS_MAP[sheet.status].label}
        </Badge>
      </div>

      {/* Weightage summary */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <WeightageBar goals={sheet.goals} />
      </div>

      {/* Goals table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/40">
          <p className="text-sm font-semibold text-foreground">{sheet.goals.length} Goals</p>
        </div>
        <div className="divide-y divide-border">
          {sheet.goals.map((goal) => (
            <ManagerGoalRow
              key={goal.id}
              goal={goal}
              sheetId={sheet.id}
              canEdit={canAct}
              uomLabel={UOM_LABEL[goal.uomType]}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      {canAct && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Approve */}
          <div className="bg-card border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5">
            <p className="font-semibold text-foreground mb-1">Approve Goal Sheet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Goals will be locked and the employee notified.
            </p>
            <form
              action={async () => {
                "use server";
                await approveGoalSheetAction(sheet.id);
                redirect("/manager/approvals");
              }}
            >
              <Button
                id={`approve-sheet-${sheet.id}`}
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 w-full"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </Button>
            </form>
          </div>

          {/* Reject */}
          <div className="bg-card border border-red-200 dark:border-red-800 rounded-2xl p-5">
            <p className="font-semibold text-foreground mb-1">Return for Rework</p>
            <p className="text-sm text-muted-foreground mb-4">
              Provide a note explaining what needs to change.
            </p>
            <RejectForm sheetId={sheet.id} />
          </div>
        </div>
      )}

      {sheet.status === GoalStatus.REJECTED && sheet.rejectionNote && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">Rejection reason</p>
          <p className="text-sm text-red-700 dark:text-red-400">{sheet.rejectionNote}</p>
        </div>
      )}
    </div>
  );
}
