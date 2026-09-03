import { describe, expect, test } from "bun:test";
import { mobileNavigationGroups } from "@/components/ui/mobile-navigation";
import { employeeNavigation } from "./employee-navigation";
import { enterpriseNavigation } from "./enterprise-navigation";
import { superAdminNavigation } from "./super-admin-navigation";

describe("integrated role navigation", () => {
  test("keeps each role on durable, unique routes", () => {
    expect(superAdminNavigation.map((item) => item.href)).toEqual(["/admin", "/admin/organizations", "/admin/menus", "/admin/calendar", "/admin/fulfillment", "/admin/quality", "/admin/feedback"]);
    expect(enterpriseNavigation.map((item) => item.href)).toEqual(["/enterprise", "/enterprise/meals", "/enterprise/people", "/enterprise/reviews"]);
    expect(employeeNavigation.map((item) => item.href)).toEqual(["/employee", "/employee/schedule", "/employee/reviews"]);
    expect(employeeNavigation.find((item) => item.href === "/employee/reviews")?.label).toBe("Meal Reviews");
    const all = [...superAdminNavigation, ...enterpriseNavigation, ...employeeNavigation].map((item) => item.href);
    expect(new Set(all).size).toBe(all.length);
  });

  test("keeps four high-frequency admin destinations beside a More control", () => {
    const groups = mobileNavigationGroups(superAdminNavigation, "/admin");
    expect(groups.direct.map((item) => item.href)).toEqual(["/admin", "/admin/calendar", "/admin/fulfillment", "/admin/quality"]);
    expect(groups.overflow.map((item) => item.href)).toEqual(["/admin/organizations", "/admin/menus", "/admin/feedback"]);
  });

  test("promotes the active admin destination so its state is always visible", () => {
    const groups = mobileNavigationGroups(superAdminNavigation, "/admin/feedback");
    expect(groups.direct.map((item) => item.href)).toEqual(["/admin", "/admin/calendar", "/admin/fulfillment", "/admin/feedback"]);
    expect(groups.overflow.map((item) => item.href)).toContain("/admin/quality");
    expect(new Set([...groups.direct, ...groups.overflow].map((item) => item.href)).size).toBe(superAdminNavigation.length);
  });

  test("leaves enterprise and employee mobile destinations unchanged", () => {
    expect(mobileNavigationGroups(enterpriseNavigation, "/enterprise")).toEqual({ direct: enterpriseNavigation, overflow: [] });
    expect(mobileNavigationGroups(employeeNavigation, "/employee")).toEqual({ direct: employeeNavigation, overflow: [] });
  });
});
