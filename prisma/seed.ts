import "dotenv/config";
import {
  PrismaClient,
  Role,
  GoalStatus,
  UoMType,
  CheckInPeriod,
  AuditAction,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const hash = (pw: string) => bcrypt.hash(pw, 12);
const YEAR = new Date().getFullYear();

async function main() {
  console.log("🌱  Seeding database...\n");

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN
  // ─────────────────────────────────────────────────────────────────────────
  const admin = await db.user.upsert({
    where: { email: "admin@cadence.dev" },
    update: {},
    create: {
      email: "admin@cadence.dev",
      name: "Priya Sharma",
      role: Role.ADMIN,
      department: "HR",
      passwordHash: await hash("Admin@123"),
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // MANAGERS
  // ─────────────────────────────────────────────────────────────────────────
  const mgr1 = await db.user.upsert({
    where: { email: "manager@cadence.dev" },
    update: {},
    create: {
      email: "manager@cadence.dev",
      name: "Arjun Mehta",
      role: Role.MANAGER,
      department: "Engineering",
      passwordHash: await hash("Manager@123"),
    },
  });

  const mgr2 = await db.user.upsert({
    where: { email: "sales.manager@cadence.dev" },
    update: {},
    create: {
      email: "sales.manager@cadence.dev",
      name: "Kavya Nair",
      role: Role.MANAGER,
      department: "Sales",
      passwordHash: await hash("Manager@123"),
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // EMPLOYEES
  // ─────────────────────────────────────────────────────────────────────────
  const empDefs = [
    {
      email: "employee@cadence.dev",
      name: "Rohan Verma",
      department: "Engineering",
      managerId: mgr1.id,
      password: "Employee@123",
    },
    {
      email: "dev2@cadence.dev",
      name: "Sneha Pillai",
      department: "Engineering",
      managerId: mgr1.id,
      password: "Employee@123",
    },
    {
      email: "dev3@cadence.dev",
      name: "Kiran Rao",
      department: "Engineering",
      managerId: mgr1.id,
      password: "Employee@123",
    },
    {
      email: "sales1@cadence.dev",
      name: "Anjali Singh",
      department: "Sales",
      managerId: mgr2.id,
      password: "Employee@123",
    },
    {
      email: "sales2@cadence.dev",
      name: "Deepak Kumar",
      department: "Sales",
      managerId: mgr2.id,
      password: "Employee@123",
    },
  ];

  const employees: Awaited<ReturnType<typeof db.user.upsert>>[] = [];
  for (const e of empDefs) {
    const user = await db.user.upsert({
      where: { email: e.email },
      update: {},
      create: {
        email: e.email,
        name: e.name,
        role: Role.EMPLOYEE,
        department: e.department,
        managerId: e.managerId,
        passwordHash: await hash(e.password),
      },
    });
    employees.push(user);
  }

  const [rohan, sneha, kiran, anjali, deepak] = employees;

  // ─────────────────────────────────────────────────────────────────────────
  // GOAL SHEETS & GOALS
  // ─────────────────────────────────────────────────────────────────────────

  // Rohan — APPROVED sheet (fully locked, has check-ins)
  {
    const sheet = await db.goalSheet.upsert({
      where: { userId_cycleYear: { userId: rohan.id, cycleYear: YEAR } },
      update: {},
      create: {
        userId: rohan.id,
        cycleYear: YEAR,
        status: GoalStatus.APPROVED,
        submittedAt: new Date("2026-05-10"),
        approvedAt: new Date("2026-05-12"),
      },
    });

    const goalDefs = [
      {
        title: "Deliver 3 microservices to production",
        thrustArea: "Operational Efficiency",
        uomType: UoMType.MIN,
        targetValue: 3,
        weightage: 30,
        description: "Migrate legacy monolith modules to independent microservices",
      },
      {
        title: "Reduce API response time below 200ms (p95)",
        thrustArea: "Quality & Compliance",
        uomType: UoMType.MAX,
        targetValue: 200,
        weightage: 25,
        description: "Optimise DB queries and add caching layers",
      },
      {
        title: "Zero critical security vulnerabilities",
        thrustArea: "Safety & ESG",
        uomType: UoMType.ZERO,
        targetValue: 0,
        weightage: 20,
        description: "Monthly penetration testing and dependency audits",
      },
      {
        title: "Complete AWS Solutions Architect certification",
        thrustArea: "People & Culture",
        uomType: UoMType.TIMELINE,
        targetValue: new Date("2026-12-31").getTime(),
        weightage: 25,
        description: "Pass AWS SAA-C03 exam",
      },
    ];

    for (const g of goalDefs) {
      const goal = await db.goal.upsert({
        where: {
          id: (
            await db.goal.findFirst({
              where: { goalSheetId: sheet.id, title: g.title },
              select: { id: true },
            })
          )?.id ?? "__none__",
        },
        update: {},
        create: { ...g, goalSheetId: sheet.id, isLocked: true },
      });

      // Q1 check-in
      await db.checkIn.upsert({
        where: { goalId_period_cycleYear: { goalId: goal.id, period: CheckInPeriod.Q1, cycleYear: YEAR } },
        update: {},
        create: {
          goalId: goal.id,
          period: CheckInPeriod.Q1,
          cycleYear: YEAR,
          employeeId: rohan.id,
          actualValue: g.uomType === UoMType.MIN ? 1 : g.uomType === UoMType.MAX ? 230 : g.uomType === UoMType.ZERO ? 0 : new Date("2026-07-15").getTime(),
          status: "ON_TRACK",
          computedScore: g.uomType === UoMType.MIN ? 1 / 3 : g.uomType === UoMType.MAX ? 200 / 230 : g.uomType === UoMType.ZERO ? 1 : 0,
          employeeNote: "Good progress this quarter, on track.",
          reviewerComment: "Keep it up. Focus on the API latency next sprint.",
          reviewerId: mgr1.id,
          reviewedAt: new Date("2026-08-05"),
        },
      });

      await db.auditLog.create({
        data: {
          action: AuditAction.CHECKIN_SUBMITTED,
          entityType: "CheckIn",
          entityId: goal.id,
          changedById: rohan.id,
          goalSheetId: sheet.id,
        },
      }).catch(() => {}); // ignore dupes
    }

    await db.auditLog.create({
      data: {
        action: AuditAction.GOAL_APPROVED,
        entityType: "GoalSheet",
        entityId: sheet.id,
        changedById: mgr1.id,
        goalSheetId: sheet.id,
      },
    }).catch(() => {});
  }

  // Sneha — PENDING_APPROVAL
  {
    const sheet = await db.goalSheet.upsert({
      where: { userId_cycleYear: { userId: sneha.id, cycleYear: YEAR } },
      update: {},
      create: {
        userId: sneha.id,
        cycleYear: YEAR,
        status: GoalStatus.PENDING_APPROVAL,
        submittedAt: new Date("2026-05-14"),
      },
    });

    const snehaGoals = [
      { title: "Ship mobile app v2.0", thrustArea: "Business Growth", uomType: UoMType.TIMELINE, targetValue: new Date("2026-09-30").getTime(), weightage: 35 },
      { title: "Increase unit test coverage to 80%", thrustArea: "Quality & Compliance", uomType: UoMType.MIN, targetValue: 80, weightage: 30 },
      { title: "Mentor 2 junior developers", thrustArea: "People & Culture", uomType: UoMType.MIN, targetValue: 2, weightage: 20 },
      { title: "Zero production incidents from my code", thrustArea: "Safety & ESG", uomType: UoMType.ZERO, targetValue: 0, weightage: 15 },
    ];

    for (const g of snehaGoals) {
      await db.goal.upsert({
        where: {
          id: (await db.goal.findFirst({ where: { goalSheetId: sheet.id, title: g.title }, select: { id: true } }))?.id ?? "__none__",
        },
        update: {},
        create: { ...g, goalSheetId: sheet.id },
      });
    }
  }

  // Kiran — REJECTED
  {
    const sheet = await db.goalSheet.upsert({
      where: { userId_cycleYear: { userId: kiran.id, cycleYear: YEAR } },
      update: {},
      create: {
        userId: kiran.id,
        cycleYear: YEAR,
        status: GoalStatus.REJECTED,
        submittedAt: new Date("2026-05-09"),
        rejectedAt: new Date("2026-05-11"),
        rejectionNote: "Goal 'Reduce infrastructure cost' needs a specific % target. Please revise weightages — Business Growth goal cannot be less than 20%.",
      },
    });

    const kiranGoals = [
      { title: "Reduce infrastructure cost", thrustArea: "Cost Optimisation", uomType: UoMType.MAX, targetValue: 15000, weightage: 40 },
      { title: "Automate CI/CD pipeline", thrustArea: "Operational Efficiency", uomType: UoMType.TIMELINE, targetValue: new Date("2026-08-31").getTime(), weightage: 30 },
      { title: "Contribute to 2 open-source projects", thrustArea: "Innovation", uomType: UoMType.MIN, targetValue: 2, weightage: 15 },
      { title: "Complete team documentation", thrustArea: "People & Culture", uomType: UoMType.TIMELINE, targetValue: new Date("2026-07-31").getTime(), weightage: 15 },
    ];

    for (const g of kiranGoals) {
      await db.goal.upsert({
        where: {
          id: (await db.goal.findFirst({ where: { goalSheetId: sheet.id, title: g.title }, select: { id: true } }))?.id ?? "__none__",
        },
        update: {},
        create: { ...g, goalSheetId: sheet.id },
      });
    }
  }

  // Anjali (Sales) — APPROVED with check-ins
  {
    const sheet = await db.goalSheet.upsert({
      where: { userId_cycleYear: { userId: anjali.id, cycleYear: YEAR } },
      update: {},
      create: {
        userId: anjali.id,
        cycleYear: YEAR,
        status: GoalStatus.APPROVED,
        submittedAt: new Date("2026-05-08"),
        approvedAt: new Date("2026-05-10"),
      },
    });

    const anjaliGoals = [
      { title: "Achieve ₹50L quarterly revenue target", thrustArea: "Business Growth", uomType: UoMType.MIN, targetValue: 5000000, weightage: 40, actualQ1: 4200000 },
      { title: "Acquire 20 new enterprise clients", thrustArea: "Customer Excellence", uomType: UoMType.MIN, targetValue: 20, weightage: 30, actualQ1: 14 },
      { title: "Maintain NPS score above 75", thrustArea: "Customer Excellence", uomType: UoMType.MIN, targetValue: 75, weightage: 20, actualQ1: 80 },
      { title: "Complete sales training certification", thrustArea: "People & Culture", uomType: UoMType.TIMELINE, targetValue: new Date("2026-08-31").getTime(), weightage: 10, actualQ1: new Date("2026-08-15").getTime() },
    ];

    for (const g of anjaliGoals) {
      const goal = await db.goal.upsert({
        where: {
          id: (await db.goal.findFirst({ where: { goalSheetId: sheet.id, title: g.title }, select: { id: true } }))?.id ?? "__none__",
        },
        update: {},
        create: { title: g.title, thrustArea: g.thrustArea, uomType: g.uomType, targetValue: g.targetValue, weightage: g.weightage, goalSheetId: sheet.id, isLocked: true },
      });

      let score = 0;
      if (g.uomType === UoMType.MIN) score = Math.min(g.actualQ1 / g.targetValue, 1);
      else if (g.uomType === UoMType.TIMELINE) score = g.actualQ1 <= g.targetValue ? 1 : 0;

      await db.checkIn.upsert({
        where: { goalId_period_cycleYear: { goalId: goal.id, period: CheckInPeriod.Q1, cycleYear: YEAR } },
        update: {},
        create: {
          goalId: goal.id, period: CheckInPeriod.Q1, cycleYear: YEAR,
          employeeId: anjali.id,
          actualValue: g.actualQ1, status: "ON_TRACK",
          computedScore: score,
          employeeNote: "Q1 performance on track, strong pipeline for Q2.",
        },
      });
    }
  }

  // Deepak (Sales) — DRAFT (not yet submitted)
  {
    const sheet = await db.goalSheet.upsert({
      where: { userId_cycleYear: { userId: deepak.id, cycleYear: YEAR } },
      update: {},
      create: {
        userId: deepak.id,
        cycleYear: YEAR,
        status: GoalStatus.DRAFT,
      },
    });

    const deepakGoals = [
      { title: "Close ₹1Cr annual deal", thrustArea: "Business Growth", uomType: UoMType.MIN, targetValue: 10000000, weightage: 40 },
      { title: "Reduce churn rate below 5%", thrustArea: "Customer Excellence", uomType: UoMType.MAX, targetValue: 5, weightage: 35 },
      { title: "Upsell to 10 existing clients", thrustArea: "Business Growth", uomType: UoMType.MIN, targetValue: 10, weightage: 25 },
    ];

    for (const g of deepakGoals) {
      await db.goal.upsert({
        where: {
          id: (await db.goal.findFirst({ where: { goalSheetId: sheet.id, title: g.title }, select: { id: true } }))?.id ?? "__none__",
        },
        update: {},
        create: { ...g, goalSheetId: sheet.id },
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n✅  Users seeded:");
  console.log("   Admin    → admin@cadence.dev        / Admin@123");
  console.log("   Manager  → manager@cadence.dev      / Manager@123  (Engineering)");
  console.log("   Manager  → sales.manager@cadence.dev / Manager@123  (Sales)");
  console.log("   Employee → employee@cadence.dev     / Employee@123  [Approved + check-ins]");
  console.log("   Employee → dev2@cadence.dev         / Employee@123  [Pending approval]");
  console.log("   Employee → dev3@cadence.dev         / Employee@123  [Rejected]");
  console.log("   Employee → sales1@cadence.dev       / Employee@123  [Approved + check-ins]");
  console.log("   Employee → sales2@cadence.dev       / Employee@123  [Draft]");
  console.log("\n✅  Goal sheets, goals, and Q1 check-ins seeded.");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
