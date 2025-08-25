
"use client";
import * as React from "react";
import MobileTabs from "./MobileTabs";
import PageContainer from "./PageContainer";
import { defaultNav, type NavItem } from "@/config/nav";

type Props = React.PropsWithChildren<{
  nav?: NavItem[];
  hideTabsOn?: string[]; // e.g. ['/subscribe','/auth','/onboarding']
  header?: React.ReactNode; // optional top header area
}>;

/**
 * AppShellLite is SAFE by design:
 * - No providers, no external UI libs, no icon deps.
 * - Only handles layout padding and optional mobile tabs.
 * - Does not require changing your root layout.
 */
export default function AppShellLite({
  nav = defaultNav,
  hideTabsOn = ["/subscribe", "/auth", "/onboarding", "/app/profile"],
  header,
  children,
}: Props) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Optional simple header (desktop/tablet only) */}
      {header ? (
        <div className="sticky top-0 z-30 hidden md:block border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto max-w-7xl px-6 py-3">{header}</div>
        </div>
      ) : null}

      {/* Main content with safe bottom padding already handled by PageContainer */}
      <main className="mx-auto w-full">
        <PageContainer>{children}</PageContainer>
      </main>

      {/* Bottom tabs on mobile only */}
      <MobileTabs nav={nav} hiddenOn={hideTabsOn} />
    </div>
  );
}
