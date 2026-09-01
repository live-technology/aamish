import { describe, expect, test } from "bun:test";
import { parseResetOptions, requiredConfirmation } from "./reset-beta-data";

describe("beta data reset safety", () => {
  test("is a dry run unless execution is explicit", () => {
    expect(parseResetOptions(["--date", "2026-09-01"])).toEqual({
      date: "2026-09-01",
      execute: false,
      confirmation: undefined,
    });
  });

  test("requires a date-bound confirmation for deletion", () => {
    expect(() => parseResetOptions(["--date", "2026-09-01", "--execute"])).toThrow();
    expect(parseResetOptions([
      "--date", "2026-09-01", "--execute", "--confirm", requiredConfirmation("2026-09-01"),
    ]).execute).toBe(true);
  });

  test("rejects missing or ambiguous dates", () => {
    expect(() => parseResetOptions([])).toThrow();
    expect(() => parseResetOptions(["--date", "today"])).toThrow();
  });
});
