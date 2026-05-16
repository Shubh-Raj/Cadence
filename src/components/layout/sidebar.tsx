"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Target,
  LayoutDashboard,
  CheckSquare,
  Users,
  BarChart3,
  TrendingUp,
  LogOut,
  ClipboardList,
  Bell,
  ChevronRight,
} from "lucide-react";
import { logoutAction } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
};

type SidebarProps = {
  role: "EMPLOYEE" | "MANAGER" | "ADMIN";
  userName: string;
  userEmail: string;
};

const NAV_EMPLOYEE: NavItem[] = [
  { label: "Dashboard", href: "/employee", icon: LayoutDashboard },
  { label: "My Goals", href: "/employee/goals", icon: Target },
  { label: "Check-ins", href: "/employee/checkins", icon: CheckSquare },
];

const NAV_MANAGER: NavItem[] = [
  { label: "Dashboard", href: "/manager", icon: LayoutDashboard },
  { label: "Team Goals", href: "/manager/team", icon: Users },
  { label: "Approvals", href: "/manager/approvals", icon: ClipboardList },
  { label: "Check-ins", href: "/manager/checkins", icon: CheckSquare },
];

const NAV_ADMIN: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Employees", href: "/admin/employees", icon: Users },
  { label: "Push Goal", href: "/admin/goals", icon: Target },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Mgr Effectiveness", href: "/admin/analytics/manager-effectiveness", icon: TrendingUp },
  { label: "Escalations", href: "/admin/escalations", icon: Bell },
  { label: "Audit Log", href: "/admin/audit", icon: ClipboardList },
];

const NAV_MAP = {
  EMPLOYEE: NAV_EMPLOYEE,
  MANAGER: NAV_MANAGER,
  ADMIN: NAV_ADMIN,
};

const ROLE_LABEL = {
  EMPLOYEE: "Employee",
  MANAGER: "Manager",
  ADMIN: "Admin / HR",
};

const ROLE_COLOUR = {
  EMPLOYEE: "bg-emerald-500",
  MANAGER: "bg-violet-500",
  ADMIN: "bg-amber-500",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const nav = NAV_MAP[role];

  return (
    <aside className="flex flex-col w-64 h-screen sticky top-0 overflow-y-auto bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shrink-0 shadow-lg">
          <Target className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <span className="font-heading font-bold text-white text-base leading-none">
            Cadence
          </span>
          <p className="text-sidebar-foreground/50 text-[10px] mt-0.5 leading-none">
            Goal Portal
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-sidebar-foreground/40 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
          Menu
        </p>
        {nav.map(({ label, href, icon: Icon, badge }) => {
          const active = pathname === href || (href !== "/employee" && href !== "/manager" && href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && (
                <Badge className="text-[10px] h-4 px-1.5 rounded-full bg-red-500 text-white border-0">
                  {badge}
                </Badge>
              )}
              {active && (
                <ChevronRight className="w-3 h-3 opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Notifications */}
      <div className="px-3 pb-2">
        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all">
          <Bell className="w-4 h-4" />
          Notifications
        </button>
      </div>

      {/* User info + logout */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-sidebar-accent transition-all">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback
              className={cn(
                "text-white text-xs font-bold",
                ROLE_COLOUR[role]
              )}
            >
              {initials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sidebar-foreground text-sm font-semibold truncate">
              {userName}
            </p>
            <p className="text-sidebar-foreground/50 text-[10px] truncate">
              {ROLE_LABEL[role]}
            </p>
          </div>
        </div>

        <form action={logoutAction} className="mt-1">
          <Button
            id="logout-btn"
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-xl"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
