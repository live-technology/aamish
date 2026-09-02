import { describe, expect, test } from "bun:test";
import { buildQuery, parseEmployeeCsv } from "./enterprise-people";

describe("enterprise people", () => {
  test("builds the roster query from search and location filters", () => {
    expect(buildQuery({ query: "", location: "" }, 0)).toBe("");
    const params = new URLSearchParams(buildQuery({ query: "EMP-1", location: "Gulshan" }, 0));
    expect(params.get("search")).toBe("EMP-1");
    expect(params.get("location")).toBe("Gulshan");
    expect(params.has("offset")).toBe(false);
  });

  test("includes offset only when paginating", () => {
    const params = new URLSearchParams(buildQuery({ query: "", location: "" }, 50));
    expect(params.get("offset")).toBe("50");
  });

  test("preserves the documented CSV contract", () => {
    expect(parseEmployeeCsv("employeeCode,fullName,email,locationCode\nE-1,Mina,m@example.com,GUL\n")).toEqual([{ employeeCode: "E-1", fullName: "Mina", email: "m@example.com", locationCode: "GUL" }]);
  });
});
