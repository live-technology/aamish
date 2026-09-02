import { describe, expect, test } from "bun:test";
import { parseUpcomingOptions } from "./seed-upcoming-meals";

describe("upcoming meal seed safety", () => {
  test("requires the exact host and append confirmation", () => {
    expect(() => parseUpcomingOptions([])).toThrow();
    expect(() => parseUpcomingOptions(["--expected-host", "stage.example", "--execute"])).toThrow();
    expect(parseUpcomingOptions(["--expected-host", "stage.example", "--execute", "--confirm=SEED-UPCOMING-MEALS"]).execute).toBe(true);
  });
});
