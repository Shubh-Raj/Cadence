import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Role, EscalationLevel } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { ResolveEscalationButton } from "@/components/admin/resolve-escalation-button";
import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Escalations" };

const LEVEL_CLS: Record<EscalationLevel, string> = {
  EMPLOYEE: "bg-zinc-100 text-zinc-700",
  MANAGER: "bg-amber-100 text-amber-700",
  HR: "bg-red-100 text-red-700",
};

const TYPE_LABEL: Record<string, string> = {
  NO_SUBMISSION: "Goals not submitted",
  APPROVAL_OVERDUE: "Approval overdue",
  CHECKIN_MISSING: "Check-in missing",
};

export default async function EscalationsPage() {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) redirect("/login");

  const escalations = await db.escalationLog.findMany({
    orderBy: [{ isResolved: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { employee: { select: { name: true, email: true, department: true } } },
  });

  const open = escalations.filter((e) => !e.isResolved);
  const resolved = escalations.filter((e) => e.isResolved);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Escalations</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {open.length} open · {resolved.length} resolved
        </p>
      </div>

      {/* Open */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          Open ({open.length})
        </h2>
        {open.length === 0 ? (
          <div className="flex flex-col items-center py-10 rounded-2xl border-2 border-dashed border-border bg-muted/30">
            <AlertTriangle className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="font-medium text-foreground">No open escalations</p>
          </div>
        ) : (
          open.map((esc) => {
            const meta = esc.metadata as Record<string, unknown> | null;
            const type = meta?.type as string | undefined;
            return (
              <div
                key={esc.id}
                className="bg-card border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-start gap-4"
              >
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground text-sm">
                      {esc.employee.name}
                    </p>
                    <Badge className={`text-[11px] px-2 py-0.5 rounded-full border-0 ${LEVEL_CLS[esc.level]}`}>
                      {esc.level}
                    </Badge>
                    {type && (
                      <Badge className="text-[11px] px-2 py-0.5 rounded-full border-0 bg-zinc-100 text-zinc-600">
                        {TYPE_LABEL[type] ?? type}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{esc.employee.email} · {esc.employee.department ?? "—"}</p>
                  <p className="text-sm text-foreground">{esc.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    Raised: {esc.createdAt.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <ResolveEscalationButton escalationId={esc.id} />
              </div>
            );
          })
        )}
      </section>

      {/* Resolved */}
      {resolved.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Resolved ({resolved.length})
          </h2>
          {resolved.map((esc) => (
            <div
              key={esc.id}
              className="bg-card border border-border rounded-2xl p-4 opacity-60 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">{esc.employee.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{esc.reason}</p>
              </div>
              <Badge className="text-[11px] px-2 py-0.5 rounded-full border-0 bg-emerald-100 text-emerald-700 shrink-0">
                Resolved
              </Badge>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
