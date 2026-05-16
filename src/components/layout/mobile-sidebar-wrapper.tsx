"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Menu, X } from "lucide-react";

type SidebarProps = {
  role: "EMPLOYEE" | "MANAGER" | "ADMIN";
  userName: string;
  userEmail: string;
};

export function MobileSidebarWrapper({
  sidebarProps,
}: {
  sidebarProps: SidebarProps;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
            <span className="text-white text-xs font-bold">AQ</span>
          </div>
          <span className="font-heading font-bold text-white text-sm">AtomQuest</span>
        </div>
        <button
          id="mobile-menu-btn"
          onClick={() => setOpen(true)}
          className="text-sidebar-foreground/70 hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Spacer for fixed top bar */}
      <div className="lg:hidden h-[52px] w-full" />

      {/* Drawer overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Drawer panel */}
          <div
            className="relative z-10 w-64 h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar {...sidebarProps} />
            <button
              id="mobile-close-btn"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-sidebar-foreground/60 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
