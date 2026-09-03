import {
  Building2,
  CalendarDays,
  ChartNoAxesColumn,
  LayoutDashboard,
  MessageSquareText,
  PackageOpen,
  ShieldCheck,
} from "lucide-react";
import type { ShellNavigationItem } from "@/components/ui/app-shell";

export const superAdminNavigation: ShellNavigationItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, mobilePrimary: true },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/menus", label: "Menus", icon: PackageOpen },
  { href: "/admin/calendar", label: "Service calendar", icon: CalendarDays, mobilePrimary: true },
  { href: "/admin/fulfillment", label: "Fulfillment", icon: ChartNoAxesColumn, mobilePrimary: true },
  { href: "/admin/quality", label: "Quality", icon: ShieldCheck, mobilePrimary: true },
  { href: "/admin/feedback", label: "Product feedback", icon: MessageSquareText },
];
