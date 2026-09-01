import { CalendarDays, Star, Utensils } from "lucide-react";
import type { ShellNavigationItem } from "@/components/ui/app-shell";
export const employeeNavigation:ShellNavigationItem[]=[{href:"/employee",label:"Today",icon:Utensils},{href:"/employee/schedule",label:"Schedule",icon:CalendarDays},{href:"/employee/reviews",label:"Review",icon:Star}];
