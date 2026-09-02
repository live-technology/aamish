import { describe, expect, test } from "bun:test";
import { defaultInsightRange, insightPreset, insightQuery, meaningfulDecline, previousEquivalentRange, qualityFiltersFrom, qualityInsightScope, validInsightRange, type QualityInsightFilters } from "./quality-insights";

describe("meal quality insights", () => {
  test("builds useful recent and equivalent comparison ranges", () => {
    expect(defaultInsightRange("2026-09-03")).toEqual({ from: "2026-08-05", to: "2026-09-03" });
    expect(insightPreset("LAST_7", "2026-09-03")).toEqual({ from: "2026-08-28", to: "2026-09-03" });
    expect(insightPreset("PREVIOUS_30", "2026-09-03")).toEqual({ from: "2026-07-06", to: "2026-08-04" });
    expect(previousEquivalentRange("2026-08-28", "2026-09-03")).toEqual({ from: "2026-08-21", to: "2026-08-27" });
  });

  test("accepts real ordered dates and rejects ambiguous ranges", () => {
    expect(validInsightRange("2026-08-01", "2026-08-31")).toEqual({ from: "2026-08-01", to: "2026-08-31" });
    expect(validInsightRange("2026-08-31", "2026-08-01")).toBeUndefined();
    expect(validInsightRange("2026-02-30", "2026-03-01")).toBeUndefined();
    expect(validInsightRange("2025-01-01", "2026-09-03")).toBeUndefined();
  });

  test("flags declines only with enough current and previous evidence", () => {
    expect(meaningfulDecline(20, 18, -0.5)).toBe(true);
    expect(meaningfulDecline(4, 18, -1.2)).toBe(false);
    expect(meaningfulDecline(20, 4, -1.2)).toBe(false);
    expect(meaningfulDecline(20, 18, -0.49)).toBe(false);
  });

  test("preserves every role-safe filter when requesting details", () => {
    const filters: QualityInsightFilters = { from: "2026-08-05", to: "2026-09-03", enterprise: "10000000-0000-4000-8000-000000000001", location: "20000000-0000-4000-8000-000000000001", menu: "30000000-0000-4000-8000-000000000001", rating: "LOW" };
    const params = new URLSearchParams(insightQuery(filters, 30));
    expect(Object.fromEntries(params)).toEqual({ ...filters, offset: "30" });
    expect(qualityFiltersFrom({ from: "bad", to: "2026-09-03", rating: "9", menu: "not-an-id" }, "2026-09-03")).toEqual({ from: "2026-08-05", to: "2026-09-03", enterprise: "", location: "", menu: "", rating: "" });
  });

  test("enforces role scope before any quality data query", () => {
    const enterpriseId = "10000000-0000-4000-8000-000000000001";
    expect(qualityInsightScope("SUPER_ADMIN", enterpriseId)).toEqual({ enterpriseId: null });
    expect(qualityInsightScope("ENTERPRISE_ADMIN", enterpriseId)).toEqual({ enterpriseId });
    expect(qualityInsightScope("ENTERPRISE_ADMIN", null)).toBeNull();
    expect(qualityInsightScope("EMPLOYEE", enterpriseId)).toBeNull();
  });
});
