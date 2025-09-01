
export type NavItem = { id: string; label: string; admin?: boolean };

export const defaultNav: NavItem[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "members", label: "Members" },
  { id: "families", label: "Families" },
  { id: "payments", label: "Payments" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings", admin: true },
];
