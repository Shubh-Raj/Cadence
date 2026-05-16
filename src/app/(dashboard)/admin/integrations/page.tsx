import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { CheckCircle2, XCircle, AlertCircle, Zap, Mail, MessageSquare, ShieldCheck, Users, RefreshCw } from "lucide-react";
import { TriggerCronButton } from "@/components/admin/trigger-cron-button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Integration Status" };

// Server-side check of which integrations are configured
function getIntegrationStatus() {
  return {
    sso: {
      label: "Microsoft Entra ID (Azure AD) SSO",
      description: "Single Sign-On for employees and managers via OAuth 2.0 / OIDC.",
      configured: !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_TENANT_ID && process.env.AZURE_AD_CLIENT_SECRET),
      details: [
        { label: "Client ID",     ok: !!process.env.AZURE_AD_CLIENT_ID },
        { label: "Client Secret", ok: !!process.env.AZURE_AD_CLIENT_SECRET },
        { label: "Tenant ID",     ok: !!process.env.AZURE_AD_TENANT_ID },
      ],
      features: [
        "Single Sign-On via Microsoft accounts",
        "Auto-provision new users on first SSO login",
        "Role mapping from Entra ID Group membership",
        "Org hierarchy sync from manager attributes",
      ],
    },
    email: {
      label: "Email Notifications (Resend)",
      description: "Automated transactional emails for goal events and check-in reminders.",
      configured: !!process.env.RESEND_API_KEY,
      details: [
        { label: "Resend API Key", ok: !!process.env.RESEND_API_KEY },
        { label: "Sender Domain",  ok: !!process.env.RESEND_API_KEY },
      ],
      features: [
        "Goal sheet submitted → Manager notified",
        "Goal approved → Employee notified",
        "Goal rejected with reason → Employee notified",
        "Quarterly check-in reminders (via cron)",
        "Manager check-in comment → Employee notified",
      ],
    },
    teams: {
      label: "Microsoft Teams Notifications",
      description: "Adaptive Card notifications via Incoming Webhook with deep-link support.",
      configured: !!process.env.TEAMS_WEBHOOK_URL,
      details: [
        { label: "Incoming Webhook URL", ok: !!process.env.TEAMS_WEBHOOK_URL },
      ],
      features: [
        "Goal submitted → Manager card with direct review link",
        "Goal approved → Employee card with check-in deep-link",
        "Goal rejected → Employee card with goals editor link",
        "Check-in reminder → Employee card with check-in deep-link",
        "Manager comment → Employee card with specific check-in link",
        "Escalation alerts → Admin/HR channel",
      ],
    },
    groupSync: {
      label: "Azure AD Group → Role Mapping",
      description: "Automatically maps Entra ID group membership to Employee / Manager / Admin roles.",
      configured: !!(process.env.AZURE_AD_GROUP_EMPLOYEE || process.env.AZURE_AD_GROUP_MANAGER || process.env.AZURE_AD_GROUP_ADMIN),
      details: [
        { label: "Employee Group ID", ok: !!process.env.AZURE_AD_GROUP_EMPLOYEE },
        { label: "Manager Group ID",  ok: !!process.env.AZURE_AD_GROUP_MANAGER },
        { label: "Admin Group ID",    ok: !!process.env.AZURE_AD_GROUP_ADMIN },
      ],
      features: [
        "Employee role from AZURE_AD_GROUP_EMPLOYEE",
        "Manager role from AZURE_AD_GROUP_MANAGER",
        "Admin role from AZURE_AD_GROUP_ADMIN",
        "Auto-synced on every SSO login",
      ],
    },
  };
}

const STATUS_ICON = {
  ok:      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
  warn:    <AlertCircle  className="w-5 h-5 text-yellow-500 shrink-0" />,
  missing: <XCircle      className="w-5 h-5 text-red-500 shrink-0" />,
};

export default async function IntegrationStatusPage() {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) redirect("/login");

  const integrations = getIntegrationStatus();

  return (
    <div className="p-6 lg:p-8 max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          Integration Status
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Live status of all external service integrations. Configure via environment variables.
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-5">

        {/* SSO Card */}
        <IntegrationCard
          icon={<ShieldCheck className="w-5 h-5 text-blue-400" />}
          data={integrations.sso}
          setupGuide={{
            title: "How to set up Azure AD SSO",
            steps: [
              "Go to portal.azure.com → App Registrations → New Registration",
              "Set Redirect URI to: {APP_URL}/api/auth/callback/microsoft-entra-id",
              "Under Certificates & Secrets → create a new Client Secret",
              "Set AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, AZURE_AD_TENANT_ID in .env",
              "Enable groupMembershipClaims: \"SecurityGroup\" in the app manifest",
              "Set AZURE_AD_GROUP_EMPLOYEE / MANAGER / ADMIN to Group Object IDs",
            ],
          }}
        />

        {/* Group Sync Card */}
        <IntegrationCard
          icon={<Users className="w-5 h-5 text-purple-400" />}
          data={integrations.groupSync}
          setupGuide={{
            title: "How to find Entra ID Group Object IDs",
            steps: [
              "Go to portal.azure.com → Microsoft Entra ID → Groups",
              "Find or create groups: Cadence-Employees, Cadence-Managers, Cadence-Admins",
              "Click each group → Overview → copy the Object ID",
              "Set AZURE_AD_GROUP_EMPLOYEE, AZURE_AD_GROUP_MANAGER, AZURE_AD_GROUP_ADMIN in .env",
            ],
          }}
        />

        {/* Email Card */}
        <IntegrationCard
          icon={<Mail className="w-5 h-5 text-yellow-400" />}
          data={integrations.email}
          setupGuide={{
            title: "How to set up Resend email",
            steps: [
              "Create a free account at resend.com (3,000 emails/month free)",
              "Add and verify your domain (e.g. cadence.dev) in Resend dashboard",
              "Create an API Key → copy to RESEND_API_KEY in .env",
              "Update FROM_EMAIL in src/lib/email.ts to match your verified domain",
            ],
          }}
        />

        {/* Teams Card */}
        <IntegrationCard
          icon={<MessageSquare className="w-5 h-5 text-indigo-400" />}
          data={integrations.teams}
          setupGuide={{
            title: "How to set up Teams webhook",
            steps: [
              "Open Microsoft Teams → go to the target channel",
              "Click ··· (More options) → Connectors → Incoming Webhook → Configure",
              "Give it a name (e.g. Cadence Alerts) → Create",
              "Copy the Webhook URL → set as TEAMS_WEBHOOK_URL in .env",
            ],
          }}
        />

      </div>

      {/* Cron Status */}
      <div className="border border-border rounded-2xl p-5 bg-card">
        <div className="flex items-center gap-3 mb-4">
          <RefreshCw className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold text-foreground">Scheduled Cron Jobs</h3>
        </div>
        <div className="space-y-2">
          {[
            { name: "Escalation Engine",       path: "/api/cron/escalation",       schedule: "0 9 * * 1" },
            { name: "Check-in Reminder",       path: "/api/cron/checkin-reminder", schedule: "0 8 1 7,10,1,4 *" },
          ].map(({ name, path, schedule }) => (
            <div key={path} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="flex-1">
                <span className="font-medium text-foreground">{name}</span>
                <span className="text-muted-foreground ml-2 text-xs">→ {path}</span>
              </div>
              <code className="text-xs bg-background border border-border rounded px-2 py-0.5 text-muted-foreground mr-4 hidden sm:block">{schedule}</code>
              <TriggerCronButton name={name} path={path} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function IntegrationCard({
  icon, data, setupGuide,
}: {
  icon: React.ReactNode;
  data: {
    label: string; description: string; configured: boolean;
    details: { label: string; ok: boolean }[];
    features: string[];
  };
  setupGuide: { title: string; steps: string[] };
}) {
  return (
    <div className={`border rounded-2xl p-5 bg-card ${data.configured ? "border-emerald-500/30" : "border-border"}`}>
      <div className="flex items-start gap-3 mb-4">
        {icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{data.label}</h3>
            {data.configured
              ? <span className="text-xs bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full font-semibold">Active</span>
              : <span className="text-xs bg-red-500/15 text-red-500 px-2 py-0.5 rounded-full font-semibold">Not Configured</span>
            }
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{data.description}</p>
        </div>
      </div>

      {/* Env var status */}
      <div className="flex flex-wrap gap-2 mb-4">
        {data.details.map(({ label, ok }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-border bg-muted/30">
            {ok ? STATUS_ICON.ok : STATUS_ICON.missing}
            <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-4">
        {data.features.map((f) => (
          <div key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            {f}
          </div>
        ))}
      </div>

      {/* Setup guide (shown only when not configured) */}
      {!data.configured && (
        <details className="mt-3">
          <summary className="text-xs font-semibold text-blue-400 cursor-pointer hover:text-blue-300 transition-colors">
            📖 {setupGuide.title}
          </summary>
          <ol className="mt-3 space-y-1.5 list-decimal list-inside">
            {setupGuide.steps.map((step, i) => (
              <li key={i} className="text-xs text-muted-foreground">{step}</li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
