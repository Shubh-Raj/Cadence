import "server-only";

const WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;
const BASE        = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type TeamsCard = {
  title: string;
  text: string;
  facts?: { name: string; value: string }[];
  actionUrl?: string;
  actionLabel?: string;
  themeColor?: string;
};

/**
 * Sends an Adaptive MessageCard to a Teams channel via Incoming Webhook.
 * Deep-link URLs are embedded as potentialAction buttons.
 * Silently no-ops if TEAMS_WEBHOOK_URL is not configured.
 */
export async function sendTeamsNotification({
  title, text, facts = [], actionUrl, actionLabel = "Open Portal", themeColor = "6D28D9",
}: TeamsCard) {
  if (!WEBHOOK_URL) {
    console.log(`[teams] TEAMS_WEBHOOK_URL not set — skipping: ${title}`);
    return;
  }

  const card: Record<string, unknown> = {
    "@type":    "MessageCard",
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

// ── Typed senders ─────────────────────────────────────────────────────────────

// 1. Goal Submitted → Manager channel (deep-link directly to review page)
export async function notifyGoalSubmitted({
  employeeName, goalCount, sheetUserId,
}: { employeeName: string; managerId: string; goalCount: number; sheetUserId: string; }) {
  await sendTeamsNotification({
    title: "⚡ Goal Sheet Submitted",
    text: `**${employeeName}** submitted their goal sheet with **${goalCount} goal(s)** and is awaiting your approval.`,
    facts: [
      { name: "Employee",       value: employeeName },
      { name: "Goals",          value: String(goalCount) },
      { name: "Action Required", value: "Review → Approve or Return for Rework" },
    ],
    // Deep-link: takes manager directly to the employee's review page
    actionUrl:   `${BASE}/manager/approvals/${sheetUserId}`,
    actionLabel: "📋 Review Goals Now",
    themeColor:  "FAFF00",
  });
}

// 2. Goal Approved → General / employee channel (deep-link to check-ins)
export async function notifyGoalApproved({
  employeeName, managerName,
}: { employeeName: string; managerName: string; }) {
  await sendTeamsNotification({
    title: "✅ Goal Sheet Approved",
    text: `**${managerName}** approved **${employeeName}'s** goal sheet. Goals are now locked for the cycle.`,
    facts: [
      { name: "Employee",   value: employeeName },
      { name: "Approved By", value: managerName },
      { name: "Next Step",  value: "Log quarterly check-ins via the portal" },
    ],
    // Deep-link: takes employee straight to their check-ins
    actionUrl:   `${BASE}/employee/checkins`,
    actionLabel: "📅 Log Check-in",
    themeColor:  "059669",
  });
}

// 3. Goal Rejected → Employee channel (deep-link to goals page)
export async function notifyGoalRejected({
  employeeName, managerName, reason, sheetUserId,
}: { employeeName: string; managerName: string; reason: string; sheetUserId: string; }) {
  await sendTeamsNotification({
    title: "🔄 Goal Sheet Returned for Revision",
    text: `**${managerName}** returned **${employeeName}'s** goal sheet for rework.`,
    facts: [
      { name: "Employee",   value: employeeName },
      { name: "Returned By", value: managerName },
      { name: "Reason",     value: reason },
    ],
    // Deep-link: takes employee directly to their goals editor
    actionUrl:   `${BASE}/employee/goals`,
    actionLabel: "✏️ Update Goals",
    themeColor:  "DC2626",
  });
}

// 4. Check-in Reminder → Employee channel
export async function notifyCheckInReminder({
  employeeName, period, dueDate,
}: { employeeName: string; period: string; dueDate: string; }) {
  await sendTeamsNotification({
    title: `📅 ${period} Check-in Reminder`,
    text:  `Hi **${employeeName}**, your **${period}** quarterly check-in window is open. Please submit before **${dueDate}**.`,
    facts: [
      { name: "Quarter", value: period },
      { name: "Due",     value: dueDate },
    ],
    // Deep-link: takes employee directly to their check-in list
    actionUrl:   `${BASE}/employee/checkins`,
    actionLabel: "📊 Submit Check-in",
    themeColor:  "0078D4",
  });
}

// 5. Manager commented on check-in → Employee channel (deep-link to specific check-in)
export async function notifyCheckInReviewed({
  employeeName, managerName, goalTitle, checkInPath,
}: { employeeName: string; managerName: string; goalTitle: string; checkInPath: string; }) {
  await sendTeamsNotification({
    title: "💬 Manager Reviewed Your Check-in",
    text:  `**${managerName}** left a comment on **${employeeName}'s** check-in for goal: *${goalTitle}*.`,
    facts: [
      { name: "Employee",  value: employeeName },
      { name: "Reviewer",  value: managerName },
      { name: "Goal",      value: goalTitle },
    ],
    // Deep-link: direct deep-link to the specific check-in goal page
    actionUrl:   `${BASE}${checkInPath}`,
    actionLabel: "💬 View Comment",
    themeColor:  "7C3AED",
  });
}

// 6. Escalation → HR/Admin channel (deep-link to escalations dashboard)
export async function notifyEscalation({
  employeeName, reason, level,
}: { employeeName: string; reason: string; level: string; }) {
  await sendTeamsNotification({
    title: `🚨 Escalation: ${level}`,
    text:  `An SLA escalation has been raised for **${employeeName}**.`,
    facts: [
      { name: "Employee", value: employeeName },
      { name: "Level",    value: level },
      { name: "Reason",   value: reason },
    ],
    actionUrl:   `${BASE}/admin/escalations`,
    actionLabel: "🔍 View Escalations",
    themeColor:  "D97706",
  });
}
