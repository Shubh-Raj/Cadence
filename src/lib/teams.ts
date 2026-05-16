import "server-only";

const WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;

type TeamsCard = {
  title: string;
  text: string;
  facts?: { name: string; value: string }[];
  actionUrl?: string;
  actionLabel?: string;
  themeColor?: string; // hex like "0078D4"
};

/**
 * Sends an Adaptive Card (MessageCard format) to a Teams channel via Incoming Webhook.
 * Silently no-ops if TEAMS_WEBHOOK_URL is not configured.
 */
export async function sendTeamsNotification({
  title,
  text,
  facts = [],
  actionUrl,
  actionLabel = "Open Portal",
  themeColor = "6D28D9",
}: TeamsCard) {
  if (!WEBHOOK_URL) {
    console.log(`[teams] TEAMS_WEBHOOK_URL not set — skipping: ${title}`);
    return;
  }

  const card: Record<string, unknown> = {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    themeColor,
    summary: title,
    sections: [
      {
        activityTitle: `**${title}**`,
        activityText: text,
        facts,
      },
    ],
  };

  if (actionUrl) {
    card.potentialAction = [
      {
        "@type": "OpenUri",
        name: actionLabel,
        targets: [{ os: "default", uri: actionUrl }],
      },
    ];
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card),
    });
    if (!res.ok) {
      console.error(`[teams] Webhook failed: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    console.error("[teams] Webhook error:", err);
  }
}

// ── Typed senders ──────────────────────────────────────────────────────────────

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function notifyGoalSubmitted({
  employeeName,
  managerId,
  goalCount,
  sheetUserId,
}: {
  employeeName: string;
  managerId: string;
  goalCount: number;
  sheetUserId: string;
}) {
  await sendTeamsNotification({
    title: "Goal Sheet Submitted",
    text: `**${employeeName}** has submitted their goal sheet with **${goalCount} goal(s)** and is awaiting your approval.`,
    facts: [
      { name: "Employee", value: employeeName },
      { name: "Goals", value: String(goalCount) },
      { name: "Action Required", value: "Review and Approve / Reject" },
    ],
    actionUrl: `${BASE}/manager/approvals/${sheetUserId}`,
    actionLabel: "Review Goals",
    themeColor: "7C3AED",
  });
}

export async function notifyGoalApproved({
  employeeName,
  managerName,
}: {
  employeeName: string;
  managerName: string;
}) {
  await sendTeamsNotification({
    title: "Goal Sheet Approved",
    text: `**${managerName}** has approved **${employeeName}'s** goal sheet. Goals are now locked for the cycle.`,
    facts: [
      { name: "Employee", value: employeeName },
      { name: "Approved By", value: managerName },
      { name: "Status", value: "Goals Locked" },
    ],
    actionUrl: `${BASE}/employee`,
    actionLabel: "View Dashboard",
    themeColor: "059669",
  });
}

export async function notifyGoalRejected({
  employeeName,
  managerName,
  reason,
  sheetUserId,
}: {
  employeeName: string;
  managerName: string;
  reason: string;
  sheetUserId: string;
}) {
  await sendTeamsNotification({
    title: "Goal Sheet Returned for Revision",
    text: `**${managerName}** has returned **${employeeName}'s** goal sheet for rework.`,
    facts: [
      { name: "Employee", value: employeeName },
      { name: "Returned By", value: managerName },
      { name: "Reason", value: reason },
    ],
    actionUrl: `${BASE}/employee/goals`,
    actionLabel: "Update Goals",
    themeColor: "DC2626",
  });
}

export async function notifyEscalation({
  employeeName,
  reason,
  level,
}: {
  employeeName: string;
  reason: string;
  level: string;
}) {
  await sendTeamsNotification({
    title: `Escalation: ${level}`,
    text: `An escalation has been raised for **${employeeName}**.`,
    facts: [
      { name: "Employee", value: employeeName },
      { name: "Level", value: level },
      { name: "Reason", value: reason },
    ],
    actionUrl: `${BASE}/admin/escalations`,
    actionLabel: "View Escalations",
    themeColor: "D97706",
  });
}
