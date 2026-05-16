import "server-only";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL     = "Cadence Portal <noreply@cadence.dev>";
const APP_URL        = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type EmailPayload = { to: string; subject: string; html: string; };

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

// ── Typed email senders ───────────────────────────────────────────────────────

const btnStyle =
  "display:inline-block;margin-top:20px;padding:12px 28px;background:#FAFF00;color:#06060A;border-radius:6px;text-decoration:none;font-weight:700;font-family:Inter,sans-serif;font-size:14px;";

function baseLayout(title: string, body: string): string {
  return `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#06060A;padding:0;border-radius:12px;overflow:hidden;">
      <div style="background:#06060A;padding:24px 32px;border-bottom:1px solid #1a1a2e;">
        <span style="font-size:22px;font-weight:800;color:#FAFF00;letter-spacing:-0.5px;">⚡ Cadence</span>
        <span style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-left:10px;">Goal Portal</span>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 16px;letter-spacing:-0.3px;">${title}</h2>
        ${body}
      </div>
      <div style="padding:16px 32px;border-top:1px solid #1a1a2e;">
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);">Cadence Goal Portal · AtomQuest 2026 · This is an automated message.</p>
      </div>
    </div>
  `;
}

// 1. Goal Submitted → Manager
export async function sendGoalSubmittedEmail({
  managerEmail, managerName, employeeName, goalCount,
}: { managerEmail: string; managerName: string; employeeName: string; goalCount: number; }) {
  await sendEmail({
    to: managerEmail,
    subject: `Action Required: ${employeeName} submitted their goal sheet`,
    html: baseLayout(
      "Goal Sheet Awaiting Your Review",
      `<p style="color:rgba(255,255,255,0.75);margin:0 0 12px;">Hi <strong style="color:#fff;">${managerName}</strong>,</p>
       <p style="color:rgba(255,255,255,0.75);margin:0 0 20px;">
         <strong style="color:#FAFF00;">${employeeName}</strong> has submitted their ${new Date().getFullYear()} goal sheet
         with <strong style="color:#fff;">${goalCount} goal(s)</strong> and is waiting for your approval.
       </p>
       <a href="${APP_URL}/manager/approvals" style="${btnStyle}">Review Goals →</a>`
    ),
  });
}

// 2. Goal Approved → Employee
export async function sendGoalApprovedEmail({
  employeeEmail, employeeName,
}: { employeeEmail: string; employeeName: string; }) {
  await sendEmail({
    to: employeeEmail,
    subject: "Your goals have been approved ✅",
    html: baseLayout(
      "Goals Approved — You're All Set!",
      `<p style="color:rgba(255,255,255,0.75);margin:0 0 12px;">Hi <strong style="color:#fff;">${employeeName}</strong>,</p>
       <p style="color:rgba(255,255,255,0.75);margin:0 0 20px;">
         Your <strong style="color:#00F5FF;">${new Date().getFullYear()} goal sheet</strong> has been
         <strong style="color:#00F5FF;">approved</strong> by your manager.
         Goals are now locked — start logging your quarterly achievements!
       </p>
       <a href="${APP_URL}/employee/checkins" style="${btnStyle}">Log Check-in →</a>`
    ),
  });
}

// 3. Goal Rejected → Employee (with deep-link to goal sheet)
export async function sendGoalRejectedEmail({
  employeeEmail, employeeName, rejectionNote,
}: { employeeEmail: string; employeeName: string; rejectionNote: string; }) {
  await sendEmail({
    to: employeeEmail,
    subject: "Your goals need revision",
    html: baseLayout(
      "Goals Returned for Revision",
      `<p style="color:rgba(255,255,255,0.75);margin:0 0 12px;">Hi <strong style="color:#fff;">${employeeName}</strong>,</p>
       <p style="color:rgba(255,255,255,0.75);margin:0 0 16px;">
         Your manager has returned your goal sheet for rework.
       </p>
       <div style="background:#1a0a0a;border:1px solid #FF2D78;border-radius:8px;padding:14px 18px;margin:0 0 20px;">
         <p style="margin:0;color:#FF2D78;font-size:13px;font-weight:700;">Manager's Note:</p>
         <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">${rejectionNote}</p>
       </div>
       <a href="${APP_URL}/employee/goals" style="${btnStyle}">Update Goals →</a>`
    ),
  });
}

// 4. Check-in Reminder → Employee (batch send per user)
export async function sendCheckInReminderEmail({
  employeeEmail, employeeName, period, dueDate,
}: { employeeEmail: string; employeeName: string; period: string; dueDate: string; }) {
  await sendEmail({
    to: employeeEmail,
    subject: `Reminder: ${period} check-in is due by ${dueDate}`,
    html: baseLayout(
      `${period} Check-in Reminder`,
      `<p style="color:rgba(255,255,255,0.75);margin:0 0 12px;">Hi <strong style="color:#fff;">${employeeName}</strong>,</p>
       <p style="color:rgba(255,255,255,0.75);margin:0 0 20px;">
         Your <strong style="color:#FAFF00;">${period}</strong> quarterly check-in is due by
         <strong style="color:#fff;">${dueDate}</strong>.
         Please log your actual achievements against your goals before the window closes.
       </p>
       <a href="${APP_URL}/employee/checkins" style="${btnStyle}">Submit Check-in →</a>`
    ),
  });
}

// 5. Check-in reviewed / manager comment → Employee (deep-link to specific check-in)
export async function sendCheckInCommentEmail({
  employeeEmail, employeeName, managerName, goalTitle, comment, checkInPath,
}: {
  employeeEmail: string; employeeName: string; managerName: string;
  goalTitle: string; comment: string; checkInPath: string;
}) {
  await sendEmail({
    to: employeeEmail,
    subject: `${managerName} reviewed your check-in for "${goalTitle}"`,
    html: baseLayout(
      "Manager Reviewed Your Check-in",
      `<p style="color:rgba(255,255,255,0.75);margin:0 0 12px;">Hi <strong style="color:#fff;">${employeeName}</strong>,</p>
       <p style="color:rgba(255,255,255,0.75);margin:0 0 16px;">
         <strong style="color:#fff;">${managerName}</strong> has reviewed your check-in for goal:
         <em style="color:#FAFF00;">${goalTitle}</em>
       </p>
       <div style="background:#0d1a0d;border:1px solid #00F5FF;border-radius:8px;padding:14px 18px;margin:0 0 20px;">
         <p style="margin:0;color:#00F5FF;font-size:13px;font-weight:700;">Manager's Comment:</p>
         <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">${comment}</p>
       </div>
       <a href="${APP_URL}${checkInPath}" style="${btnStyle}">View Check-in →</a>`
    ),
  });
}
