import { describe, expect, test } from "bun:test";
import { cutoffIsoForDate, DEFAULT_CUTOFF_TIME, readCutoffTime, validateCutoffTime } from "./platform-cutoff";

describe("platform cutoff", () => {
  test("accepts a precise 24-hour local time", () => {
    expect(validateCutoffTime("00:05")).toBe(true);
    expect(validateCutoffTime("23:59")).toBe(true);
    expect(validateCutoffTime("24:00")).toBe(false);
    expect(validateCutoffTime("9:30")).toBe(false);
  });

  test("falls back to the approved master default", () => {
    expect(readCutoffTime("invalid")).toBe(DEFAULT_CUTOFF_TIME);
    expect(readCutoffTime("12:30")).toBe("12:30");
  });

  test("derives a Dhaka timestamp from service date and setting", () => {
    expect(cutoffIsoForDate("2026-09-02", "00:05")).toBe("2026-09-01T18:05:00.000Z");
  });
});
