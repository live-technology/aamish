import { CalendarDays, LayoutDashboard, Users } from "lucide-react";
import type { ShellNavigationItem } from "@/components/ui/app-shell";

export const enterpriseNavigation: ShellNavigationItem[] = [
  { href: "/enterprise", label: "Overview", icon: LayoutDashboard },
  { href: "/enterprise/meals", label: "Meals", icon: CalendarDays },
  { href: "/enterprise/manage", label: "People & reviews", icon: Users },
];
