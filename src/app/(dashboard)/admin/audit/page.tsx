import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Role, GoalStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Audit Log" };

const ACTION_LABEL: Record<string, string> = {
  GOAL_CREATED: "Goal created",
  GOAL_SUBMITTED: "Sheet submitted",
  GOAL_APPROVED: "Sheet approved",
  GOAL_REJECTED: "Sheet rejected",
  GOAL_EDITED_BY_MANAGER: "Goal edited by manager",
  GOAL_UNLOCKED_BY_ADMIN: "Goal unlocked by admin",
  CHECKIN_SUBMITTED: "Check-in submitted",
  CHECKIN_COMMENTED: "Manager comment added",
  SHARED_GOAL_PUSHED: "Shared goal pushed",
};

const ACTION_CLS: Record<string, string> = {
  GOAL_CREATED: "bg-blue-100 text-blue-700",
  GOAL_SUBMITTED: "bg-amber-100 text-amber-700",
  GOAL_APPROVED: "bg-emerald-100 text-emerald-700",
  GOAL_REJECTED: "bg-red-100 text-red-700",
  GOAL_EDITED_BY_MANAGER: "bg-violet-100 text-violet-700",
  GOAL_UNLOCKED_BY_ADMIN: "bg-orange-100 text-orange-700",
  CHECKIN_SUBMITTED: "bg-cyan-100 text-cyan-700",
  CHECKIN_COMMENTED: "bg-teal-100 text-teal-700",
  SHARED_GOAL_PUSHED: "bg-indigo-100 text-indigo-700",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) redirect("/login");

  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1"));
  const pageSize = 25;

  const [total, logs] = await Promise.all([
    db.auditLog.count(),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
        changedBy: { select: { name: true, email: true, role: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Audit Log</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {total.toLocaleString()} events · Page {page} of {totalPages}
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-5 py-3 font-semibold text-muted-foreground">Time</th>
              <th className="px-5 py-3 font-semibold text-muted-foreground">Action</th>
              <th className="px-5 py-3 font-semibold text-muted-foreground">By</th>
              <th className="px-5 py-3 font-semibold text-muted-foreground">Entity</th>
              <th className="px-5 py-3 font-semibold text-muted-foreground">Note</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                  {log.createdAt.toLocaleString("en-IN", {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </td>
                <td className="px-5 py-3">
                  <Badge className={`text-[11px] px-2 py-0.5 rounded-full border-0 ${ACTION_CLS[log.action] ?? "bg-zinc-100 text-zinc-600"}`}>
                    {ACTION_LABEL[log.action] ?? log.action}
                  </Badge>
                </td>
                <td className="px-5 py-3">
                  <p className="font-medium text-foreground">{log.changedBy.name}</p>
                  <p className="text-xs text-muted-foreground">{log.changedBy.role}</p>
                </td>
                <td className="px-5 py-3">
                  <p className="text-xs font-mono text-muted-foreground">{log.entityType}</p>
                  <p className="text-xs font-mono text-muted-foreground/60 truncate max-w-[120px]">
                    {log.entityId}
                  </p>
                </td>
                <td className="px-5 py-3 text-muted-foreground text-xs max-w-[200px] truncate">
                  {log.note ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <a href={`/admin/audit?page=${page - 1}`}>
              <button className="px-4 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors">
                Previous
              </button>
            </a>
          )}
          <span className="px-4 py-1.5 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <a href={`/admin/audit?page=${page + 1}`}>
              <button className="px-4 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors">
                Next
              </button>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
