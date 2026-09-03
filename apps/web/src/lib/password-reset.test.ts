import { describe, expect, test } from "bun:test";
import { MINIMUM_TEMPORARY_PASSWORD_LENGTH, temporaryPasswordFrom } from "./password-reset";

describe("temporary password reset", () => {
  test("requires at least eight characters", () => {
    expect(MINIMUM_TEMPORARY_PASSWORD_LENGTH).toBe(8);
    expect(temporaryPasswordFrom({ password: "1234567" })).toBeNull();
    expect(temporaryPasswordFrom({ password: "12345678" })).toBe("12345678");
  });

  test("rejects missing and non-string passwords", () => {
    expect(temporaryPasswordFrom({})).toBeNull();
    expect(temporaryPasswordFrom({ password: 12345678 })).toBeNull();
  });
});
