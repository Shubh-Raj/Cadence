import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Role, GoalStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
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
        select: { status: true, goals: { select: { id: true } } },
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

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-5 py-3 font-semibold text-muted-foreground">Name</th>
              <th className="px-5 py-3 font-semibold text-muted-foreground">Role</th>
              <th className="px-5 py-3 font-semibold text-muted-foreground">Department</th>
              <th className="px-5 py-3 font-semibold text-muted-foreground">Manager</th>
              <th className="px-5 py-3 font-semibold text-muted-foreground text-center">Goals</th>
              <th className="px-5 py-3 font-semibold text-muted-foreground">Sheet Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const sheet = user.goalSheets[0];
              return (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <Badge className={`text-[11px] px-2 py-0.5 rounded-full border-0 ${ROLE_CLS[user.role]}`}>
                      {ROLE_LABEL[user.role]}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{user.department ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{user.manager?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-center font-semibold text-foreground">
                    {sheet?.goals.length ?? 0}
                  </td>
                  <td className="px-5 py-3">
                    {sheet ? (
                      <Badge className={`text-[11px] px-2 py-0.5 rounded-full border-0 ${STATUS_CLS[sheet.status]}`}>
                        {sheet.status.replace("_", " ")}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not started</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
