import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileSidebarWrapper } from "@/components/layout/mobile-sidebar-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sidebarProps = {
    role: session.role as "EMPLOYEE" | "MANAGER" | "ADMIN",
    userName: session.name,
    userEmail: session.email,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden lg:flex">
        <Sidebar {...sidebarProps} />
      </div>

      {/* Mobile: top bar + drawer */}
      <MobileSidebarWrapper sidebarProps={sidebarProps} />

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
