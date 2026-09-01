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
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/packages", label: "Menus", icon: PackageOpen },
  { href: "/admin/calendar", label: "Service calendar", icon: CalendarDays },
  { href: "/admin/operations", label: "Fulfillment", icon: ChartNoAxesColumn },
  { href: "/admin/quality", label: "Quality", icon: ShieldCheck },
  { href: "/admin/feedback", label: "Product feedback", icon: MessageSquareText },
];
