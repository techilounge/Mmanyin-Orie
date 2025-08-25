
export type NavItem = { href: string; label: string };

export const defaultNav: NavItem[] = [
  { href: "/dashboard", label: "Home" },
  { href: "/members", label: "Members" },
  { href: "/families", label: "Families" },
  { href: "/payments", label: "Payments" },
  { href: "/settings", label: "Settings" },
];
