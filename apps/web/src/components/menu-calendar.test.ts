import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PrerequisiteState, scheduleStepError } from "./menu-calendar";

describe("service calendar contracts", () => {
  test("validates service details and distinct menu options by step", () => {
    expect(scheduleStepError(1, { enterpriseId: "", scheduleDate: "", menuIds: [""] })).toContain("organization");
    expect(scheduleStepError(2, { enterpriseId: "e-1", scheduleDate: "2026-09-02", menuIds: ["m-1", "m-1"] })).toContain("different package");
    expect(scheduleStepError(2, { enterpriseId: "e-1", scheduleDate: "2026-09-02", menuIds: ["m-1", "m-2"] })).toBe("");
  });

  test("explains the missing organization prerequisite with a direct action", () => {
    const html = renderToStaticMarkup(createElement(PrerequisiteState, { enterprises: [] }));
    expect(html).toContain("Complete setup before scheduling");
    expect(html).toContain('href="/admin/organizations"');
    expect(html).toContain("Add organization");
  });
});
