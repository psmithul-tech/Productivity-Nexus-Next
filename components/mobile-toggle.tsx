"use client";

import { Menu, X } from "lucide-react";
import { useSidebar } from "./sidebar-context";

export function MobileToggle() {
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <button
      className="md:hidden p-2 -ml-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-on-surface/10 transition-colors"
      onClick={() => setMobileOpen(!mobileOpen)}
      aria-label="Toggle menu"
    >
      {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  );
}
