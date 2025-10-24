import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  Flag,
  LayoutDashboard,
  SlidersHorizontal,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  external?: boolean;
  disabled?: boolean;
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export const navigationGroups: NavigationGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", href: "/", icon: LayoutDashboard, exact: true },
      { label: "Orders", href: "/orders", icon: ClipboardList },
      { label: "Feature Flags", href: "/flags", icon: Flag },
      { label: "Audit Logs", href: "/audit", icon: Activity },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Observability",
        href: "http://localhost:3001",
        icon: Activity,
        external: true,
      },
      { label: "Demo Controls", href: "/demo", icon: SlidersHorizontal },
      { label: "Incidents", href: "/incidents", icon: AlertTriangle },
    ],
  },
];

export function isItemActive(pathname: string, item: NavigationItem): boolean {
  if (item.external || item.disabled) {
    return false;
  }

  if (item.exact) {
    return pathname === item.href;
  }

  if (item.href === "/") {
    return pathname === "/";
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function getPageTitle(pathname: string): string {
  for (const group of navigationGroups) {
    for (const item of group.items) {
      if (isItemActive(pathname, item)) {
        return item.label;
      }
    }
  }

  if (pathname.startsWith("/login")) {
    return "Login";
  }

  if (pathname.startsWith("/register")) {
    return "Register";
  }

  return "RudikCloud";
}
