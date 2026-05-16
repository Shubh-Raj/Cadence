import { NextRequest, NextResponse } from "next/server";
import { runEscalationRules } from "@/lib/escalation";

export async function GET(request: NextRequest) {
  // Protect with a secret so only the cron service can call this
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runEscalationRules();
  return NextResponse.json({ triggered: results.length, results });
}
