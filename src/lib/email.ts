import "server-only";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "Cadence Portal <noreply@cadence.dev>";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: EmailPayload) {
  if (!RESEND_API_KEY) {
    console.log(`[email] RESEND_API_KEY not set — skipping email to ${to}: ${subject}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[email] Failed to send to ${to}: ${error}`);
  }
}

// ── Typed email senders ────────────────────────────────────────────────────────

export async function sendGoalSubmittedEmail({
  managerEmail,
  managerName,
  employeeName,
  goalCount,
}: {
  managerEmail: string;
  managerName: string;
  employeeName: string;
  goalCount: number;
}) {
  await sendEmail({
    to: managerEmail,
    subject: `${employeeName} submitted goals for your review`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#3b0764;margin-bottom:8px">Goal Sheet Submitted</h2>
        <p>Hi ${managerName},</p>
        <p><strong>${employeeName}</strong> has submitted their ${new Date().getFullYear()} goal sheet
        with <strong>${goalCount} goal(s)</strong> for your review and approval.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/manager/approvals"
           style="display:inline-block;margin-top:20px;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Review Goals →
        </a>
        <p style="margin-top:32px;font-size:12px;color:#9ca3af">Cadence Portal · ${new Date().getFullYear()}</p>
      </div>
    `,
  });
}

export async function sendGoalApprovedEmail({
  employeeEmail,
  employeeName,
}: {
  employeeEmail: string;
  employeeName: string;
}) {
  await sendEmail({
    to: employeeEmail,
    subject: "Your goals have been approved",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#047857;margin-bottom:8px">Goals Approved</h2>
        <p>Hi ${employeeName},</p>
        <p>Your ${new Date().getFullYear()} goal sheet has been <strong>approved</strong> by your manager.
        Your goals are now locked and you can start logging check-in progress in the quarterly windows.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/employee/checkins"
           style="display:inline-block;margin-top:20px;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          View Check-ins →
        </a>
        <p style="margin-top:32px;font-size:12px;color:#9ca3af">Cadence Portal · ${new Date().getFullYear()}</p>
      </div>
    `,
  });
}

export async function sendGoalRejectedEmail({
  employeeEmail,
  employeeName,
  rejectionNote,
}: {
  employeeEmail: string;
  employeeName: string;
  rejectionNote: string;
}) {
  await sendEmail({
    to: employeeEmail,
    subject: "Your goals need revision",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#b91c1c;margin-bottom:8px">Goals Returned for Revision</h2>
        <p>Hi ${employeeName},</p>
        <p>Your ${new Date().getFullYear()} goal sheet has been returned by your manager for rework.</p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin:16px 0">
          <p style="margin:0;color:#b91c1c;font-size:14px"><strong>Manager's note:</strong> ${rejectionNote}</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/employee/goals"
           style="display:inline-block;margin-top:20px;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Update Goals →
        </a>
        <p style="margin-top:32px;font-size:12px;color:#9ca3af">Cadence Portal · ${new Date().getFullYear()}</p>
      </div>
    `,
  });
}
