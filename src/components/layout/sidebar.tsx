"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, CheckSquare, Users, BarChart3, TrendingUp,
  LogOut, ClipboardList, Bell, Zap, Target, Moon, Sun, Plug
} from "lucide-react";
import { logoutAction } from "@/lib/actions/auth.actions";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";

type NavItem = { label: string; href: string; icon: React.ElementType; badge?: string; };
type SidebarProps = { role: "EMPLOYEE" | "MANAGER" | "ADMIN"; userName: string; userEmail: string; };

const NAV_EMPLOYEE: NavItem[] = [
  { label: "Dashboard",  href: "/employee",          icon: LayoutDashboard },
  { label: "My Goals",   href: "/employee/goals",    icon: Target },
  { label: "Check-ins",  href: "/employee/checkins", icon: CheckSquare },
];
const NAV_MANAGER: NavItem[] = [
  { label: "Dashboard",  href: "/manager",            icon: LayoutDashboard },
  { label: "Approvals",  href: "/manager/approvals",  icon: ClipboardList },
  { label: "Check-ins",  href: "/manager/checkins",   icon: CheckSquare },
];
const NAV_ADMIN: NavItem[] = [
  { label: "Dashboard",        href: "/admin",                                icon: LayoutDashboard },
  { label: "Employees",        href: "/admin/employees",                      icon: Users },
  { label: "Push Goal",        href: "/admin/goals",                          icon: Target },
  { label: "Analytics",        href: "/admin/analytics",                      icon: BarChart3 },
  { label: "Mgr Effectiveness",href: "/admin/analytics/manager-effectiveness",icon: TrendingUp },
  { label: "Escalations",      href: "/admin/escalations",                    icon: Bell },
  { label: "Audit Log",        href: "/admin/audit",                          icon: ClipboardList },
  { label: "Integrations",     href: "/admin/integrations",                   icon: Plug },
];
const NAV_MAP = { EMPLOYEE: NAV_EMPLOYEE, MANAGER: NAV_MANAGER, ADMIN: NAV_ADMIN };
const ROLE_LABEL = { EMPLOYEE: "Employee", MANAGER: "Manager", ADMIN: "Admin / HR" };
const ROLE_DOT = { EMPLOYEE: "var(--brand-cyan)", MANAGER: "var(--brand-pink)", ADMIN: "var(--brand-yellow)" };

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const nav = NAV_MAP[role];

  return (
    <aside style={{
      display: "flex", flexDirection: "column", width: 240, height: "100vh",
      position: "sticky", top: 0, overflowY: "auto",
      background: "var(--sidebar)", borderRight: "1px solid var(--sidebar-border)",
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 18px", borderBottom: "1px solid var(--sidebar-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, background: "var(--brand-yellow)", clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Zap size={18} strokeWidth={3} color="#06060A" />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "var(--sidebar-foreground)", fontSize: 16, letterSpacing: "-0.5px", lineHeight: 1 }}>Cadence</div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "var(--brand-yellow)", marginTop: 3 }}>Goal Portal</div>
          </div>
        </div>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--sidebar-foreground)", opacity: 0.7 }}
          title="Toggle Theme"
        >
          <Sun size={16} className="hidden dark:block" />
          <Moon size={16} className="block dark:hidden" />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "var(--sidebar-foreground)", opacity: 0.5, padding: "0 8px", marginBottom: 8 }}>
          Navigation
        </p>
        {nav.map(({ label, href, icon: Icon, badge }) => {
          const active = pathname === href || (href !== "/employee" && href !== "/manager" && href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", fontSize: 13, fontWeight: active ? 700 : 500,
                textDecoration: "none", transition: "all 0.18s",
                borderLeft: active ? "2px solid var(--sidebar-primary)" : "2px solid transparent",
                background: active ? "var(--sidebar-accent)" : "transparent",
                color: active ? "var(--sidebar-primary)" : "var(--sidebar-foreground)",
                opacity: active ? 1 : 0.7,
              }}
              className={cn("sidebar-link", active && "active")}
            >
              <Icon size={15} style={{ flexShrink: 0, color: active ? "var(--sidebar-primary)" : "inherit" }} />
              <span style={{ flex: 1 }}>{label}</span>
              {badge && (
                <Badge style={{ fontSize: 10, height: 16, padding: "0 6px", background: "#FF2D78", color: "#fff", border: "none", borderRadius: 2 }}>
                  {badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div style={{ padding: "12px", borderTop: "1px solid var(--sidebar-border)" }}>
        {/* User row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 4 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 0,
            background: "var(--sidebar-accent)",
            border: "1px solid var(--sidebar-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: ROLE_DOT[role], flexShrink: 0,
            clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
          }}>
            {initials(userName)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--sidebar-foreground)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</p>
            <p style={{ fontSize: 10, color: ROLE_DOT[role], margin: 0, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>{ROLE_LABEL[role]}</p>
          </div>
        </div>

        {/* Logout */}
        <form action={logoutAction}>
          <button
            id="logout-btn"
            type="submit"
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", background: "transparent", border: "none",
              fontSize: 12, fontWeight: 600, color: "var(--sidebar-foreground)", opacity: 0.6,
              cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif",
              transition: "all 0.18s", letterSpacing: "0.5px",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--destructive)"; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--sidebar-foreground)"; (e.currentTarget as HTMLElement).style.opacity = "0.6"; }}
          >
            <LogOut size={13} />
            Sign out
          </button>
        </form>
      </div>

      <style>{`
        .sidebar-link:hover { background: var(--sidebar-accent) !important; opacity: 1 !important; }
        .sidebar-link.active:hover { opacity: 1 !important; }
      `}</style>
    </aside>
  );
}
