import { describe, expect, test } from "bun:test";
import {
  destinationForRole,
  isRoleDestination,
  SESSION_ENDED_LOGIN_PATH,
} from "./auth-navigation";

describe("authentication navigation", () => {
  test("preserves the destination for every role", () => {
    expect(destinationForRole("SUPER_ADMIN")).toBe("/admin");
    expect(destinationForRole("ENTERPRISE_ADMIN")).toBe("/enterprise");
    expect(destinationForRole("EMPLOYEE")).toBe("/employee");
  });

  test("accepts only known post-login destinations", () => {
    expect(isRoleDestination("/admin")).toBe(true);
    expect(isRoleDestination("https://example.com")).toBe(false);
    expect(isRoleDestination("/admin/quality")).toBe(false);
  });

  test("keeps the session-ended reason explicit", () => {
    expect(SESSION_ENDED_LOGIN_PATH).toBe("/login?reason=session-ended");
  });
});
