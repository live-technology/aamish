import { CalendarDays, LayoutDashboard, Star, Users } from "lucide-react";
import type { ShellNavigationItem } from "@/components/ui/app-shell";

export const enterpriseNavigation: ShellNavigationItem[] = [
  { href: "/enterprise", label: "Overview", icon: LayoutDashboard },
  { href: "/enterprise/meals", label: "Meals", icon: CalendarDays },
  { href: "/enterprise/people", label: "People", icon: Users },
  { href: "/enterprise/reviews", label: "Reviews", icon: Star },
];
