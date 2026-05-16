"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Menu, X, Zap } from "lucide-react";

type SidebarProps = { role: "EMPLOYEE" | "MANAGER" | "ADMIN"; userName: string; userEmail: string; };

export function MobileSidebarWrapper({ sidebarProps }: { sidebarProps: SidebarProps }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", background: "#0C0C12",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 40,
        fontFamily: "'Space Grotesk', sans-serif",
      }} className="lg:hidden">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "#FAFF00", clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={15} strokeWidth={3} color="#06060A" />
          </div>
          <span style={{ fontWeight: 700, color: "#fff", fontSize: 16, letterSpacing: "-0.5px" }}>Cadence</span>
        </div>
        <button
          id="mobile-menu-btn"
          onClick={() => setOpen(true)}
          style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: 4 }}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Spacer */}
      <div className="lg:hidden" style={{ height: 52 }} />

      {/* Drawer */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}
          className="lg:hidden"
          onClick={() => setOpen(false)}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)" }} />
          <div style={{ position: "relative", zIndex: 10, width: 240, height: "100%" }} onClick={e => e.stopPropagation()}>
            <Sidebar {...sidebarProps} />
            <button
              id="mobile-close-btn"
              onClick={() => setOpen(false)}
              style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
