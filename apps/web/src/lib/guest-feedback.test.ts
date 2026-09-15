import { describe, expect, test } from "bun:test";
import { guestFeedbackScope, validateGuestFeedback } from "./guest-feedback";

function form(values: Record<string, string>) {
  const result = new FormData();
  for (const [key, value] of Object.entries(values)) result.set(key, value);
  return result;
}

describe("guest feedback", () => {
  test("allows a rating without text, voice or identity", () => {
    expect(validateGuestFeedback(form({ rating: "5", anonymous: "true" }))).toEqual({ rating: 5, review: null, anonymous: true, name: null, phone: null });
  });
  test("requires name and phone unless anonymous", () => {
    for (const fields of [{}, { name: "Guest" }, { phone: "01712345678" }]) expect(() => validateGuestFeedback(form({ rating: "5", ...fields }))).toThrow();
  });
  test("requires a single integer rating in range", () => {
    for (const rating of ["", "0", "6", "1.5", "NaN", " 5", "5e0"]) expect(() => validateGuestFeedback(form({ rating }))).toThrow();
  });
  test("discards supplied identity when anonymous, including invalid values", () => {
    expect(validateGuestFeedback(form({ rating: "4", anonymous: "true", name: "Discard this name", phone: "invalid", review: " Good meal " }))).toEqual({ rating: 4, anonymous: true, name: null, phone: null, review: "Good meal" });
  });
  test("normalizes contact details and bounds content", () => {
    expect(validateGuestFeedback(form({ rating: "3", name: " Test guest ", phone: "০১৭১২৩৪৫৬৭৮" }))).toMatchObject({ name: "Test guest", phone: "+8801712345678" });
    for (const input of [{ phone: "bad" }, { phone: "test@example.com" }, { name: "x".repeat(101) }, { review: "x".repeat(4001) }]) expect(() => validateGuestFeedback(form({ rating: "4", name: "Synthetic Guest", phone: "01712345678", ...input }))).toThrow();
  });
  test("only administrators can read, and enterprise scope cannot be unbounded", () => {
    expect(guestFeedbackScope(null)).toBeNull();
    expect(guestFeedbackScope({ role: "EMPLOYEE", enterpriseId: "a" })).toBeNull();
    expect(guestFeedbackScope({ role: "ENTERPRISE_ADMIN", enterpriseId: null })).toBeNull();
    expect(guestFeedbackScope({ role: "ENTERPRISE_ADMIN", enterpriseId: "a" })).toEqual({ enterpriseId: "a" });
    expect(guestFeedbackScope({ role: "SUPER_ADMIN", enterpriseId: null })).toEqual({ enterpriseId: null });
  });
});
