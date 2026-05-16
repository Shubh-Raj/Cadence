import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

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
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--background)" }}>
      {/* Sidebar — always visible, scrolls independently */}
      <Sidebar {...sidebarProps} />

      {/* Main content */}
      <main style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
