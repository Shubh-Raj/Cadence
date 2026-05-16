import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const db = new PrismaClient({ adapter });

async function main() {
  console.log("🌱  Seeding database...");

  const hash = (pw: string) => bcrypt.hash(pw, 12);

  // ── Admin ────────────────────────────────────────────────────────────────
  const admin = await db.user.upsert({
    where: { email: "admin@atomquest.dev" },
    update: {},
    create: {
      email: "admin@atomquest.dev",
      name: "Admin User",
      role: Role.ADMIN,
      department: "HR",
      passwordHash: await hash("Admin@123"),
    },
  });

  // ── Manager ──────────────────────────────────────────────────────────────
  const manager = await db.user.upsert({
    where: { email: "manager@atomquest.dev" },
    update: {},
    create: {
      email: "manager@atomquest.dev",
      name: "Manager User",
      role: Role.MANAGER,
      department: "Engineering",
      passwordHash: await hash("Manager@123"),
    },
  });

  // ── Employee ─────────────────────────────────────────────────────────────
  const employee = await db.user.upsert({
    where: { email: "employee@atomquest.dev" },
    update: {},
    create: {
      email: "employee@atomquest.dev",
      name: "Employee User",
      role: Role.EMPLOYEE,
      department: "Engineering",
      managerId: manager.id,
      passwordHash: await hash("Employee@123"),
    },
  });

  console.log("✅  Seeded users:");
  console.log(`   Admin    → admin@atomquest.dev    / Admin@123`);
  console.log(`   Manager  → manager@atomquest.dev  / Manager@123`);
  console.log(`   Employee → employee@atomquest.dev / Employee@123`);
  console.log(
    `\n   IDs: admin=${admin.id}, manager=${manager.id}, employee=${employee.id}`
  );
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
