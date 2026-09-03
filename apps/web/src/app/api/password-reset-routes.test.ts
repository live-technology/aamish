import { describe, expect, test } from "bun:test";

describe("password reset route authorization contracts", () => {
  test("employee reset is role- and tenant-scoped and never logs the password", async () => {
    const source = await Bun.file(new URL("./enterprise/employees/[id]/password/route.ts", import.meta.url)).text();
    expect(source).toContain('session?.role !== "ENTERPRISE_ADMIN"');
    expect(source).toContain("ep.enterprise_id=${session.enterpriseId}");
    expect(source).toContain("au.enterprise_id=${session.enterpriseId}");
    expect(source).toContain("must_change_password=TRUE");
    expect(source).not.toMatch(/log(?:Error)?\([^\n]+[, ]password[, }]/);
  });

  test("enterprise administrator reset requires Aamish admin and targets the enterprise", async () => {
    const source = await Bun.file(new URL("./admin/enterprises/[id]/admin-password/route.ts", import.meta.url)).text();
    expect(source).toContain('session?.role !== "SUPER_ADMIN"');
    expect(source).toContain("ea.enterprise_id=${enterpriseId}");
    expect(source).toContain("au.enterprise_id=${enterpriseId}");
    expect(source).toContain("au.role='ENTERPRISE_ADMIN'");
    expect(source).toContain("must_change_password=TRUE");
    expect(source).not.toMatch(/log(?:Error)?\([^\n]+[, ]password[, }]/);
  });
});
