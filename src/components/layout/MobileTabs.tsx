
"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/config/nav";
import { Home, Users, Settings, DollarSign } from 'lucide-react';
import Link from "next/link";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    Dashboard: Home,
    Members: Users,
    Families: Home,
    Payments: DollarSign,
    Settings,
};


type Props = { 
    nav?: NavItem[]; 
    hiddenOn?: string[];
    activeTab?: string;
    onTabChange?: (tabId: string) => void;
};

export default function MobileTabs({ nav = [], hiddenOn = [], activeTab, onTabChange }: Props) {
  const pathname = usePathname();

  // Hide on specific routes (auth, subscribe, onboarding, etc.)
  if (hiddenOn.some((p) => pathname.startsWith(p))) return null;

  // Only show on small screens
  return (
    <div
      className="
        fixed inset-x-0 bottom-0 z-50 md:hidden
        border-t bg-background/80 backdrop-blur
        supports-[backdrop-filter]:bg-background/60
      "
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      role="navigation"
      aria-label="Bottom Navigation"
    >
      <ul className="grid grid-cols-5">
        {(nav.length ? nav : []).slice(0, 5).map((item) => {
          const isActive = activeTab === item.id;
          const Icon = ICONS[item.label];
          return (
            <li key={item.id} className="contents">
              <button
                onClick={() => onTabChange?.(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-xs",
                  isActive ? "font-semibold text-primary" : "text-muted-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {Icon ? <Icon className="h-5 w-5" /> : null}
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
