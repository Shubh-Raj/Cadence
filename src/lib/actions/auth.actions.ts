"use server";

import { db } from "@/lib/db";
import { createSession, deleteSession, getSession } from "@/lib/session";
import { roleRedirect } from "@/lib/role-utils";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }).trim().toLowerCase(),
  password: z.string().min(1, { error: "Password is required." }),
});

// ─── Login ────────────────────────────────────────────────────────────────────

export type LoginState =
  | { errors?: { email?: string[]; password?: string[] }; message?: string }
  | undefined;

export async function loginAction(
  _state: LoginState,
  formData: FormData
): Promise<LoginState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validated = LoginSchema.safeParse(raw);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { email, password } = validated.data;

  let role: string;

  try {
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return { message: "Invalid email or password." };
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return { message: "Invalid email or password." };
    }

    await createSession({
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    });

    role = user.role;
  } catch {
    return { message: "Something went wrong. Please try again." };
  }

  // Redirect must be outside try/catch
  redirect(roleRedirect(role as Parameters<typeof roleRedirect>[0]));
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
