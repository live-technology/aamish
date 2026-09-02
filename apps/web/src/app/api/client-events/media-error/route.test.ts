import { describe, expect, test } from "bun:test";
import { validMediaErrorSurface } from "@/lib/media-events";

describe("media error diagnostics", () => {
  test("accepts only known non-sensitive surface names", () => {
    expect(validMediaErrorSurface("employee-meal")).toBe(true);
    expect(validMediaErrorSurface("admin-menu-preview")).toBe(true);
    expect(validMediaErrorSurface("https://signed.example/image?secret=value")).toBe(false);
    expect(validMediaErrorSurface({ surface: "employee-meal" })).toBe(false);
  });
});
