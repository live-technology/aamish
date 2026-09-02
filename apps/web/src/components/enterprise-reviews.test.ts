import { describe, expect, test } from "bun:test";
import { buildQuery } from "./enterprise-reviews";

describe("enterprise reviews query building", () => {
  test("omits empty filters and offset", () => {
    expect(buildQuery({ query: "", location: "", date: "", rating: "" }, 0)).toBe("");
  });

  test("combines context and low-rating filters", () => {
    const params = new URLSearchParams(buildQuery({ query: "cold", location: "Gulshan", date: "2026-09-01", rating: "LOW" }, 0));
    expect(params.get("search")).toBe("cold");
    expect(params.get("location")).toBe("Gulshan");
    expect(params.get("date")).toBe("2026-09-01");
    expect(params.get("rating")).toBe("LOW");
    expect(params.has("offset")).toBe(false);
  });

  test("includes offset only when paginating", () => {
    const params = new URLSearchParams(buildQuery({ query: "", location: "", date: "", rating: "5" }, 30));
    expect(params.get("rating")).toBe("5");
    expect(params.get("offset")).toBe("30");
  });
});
