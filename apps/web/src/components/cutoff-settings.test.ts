import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CutoffSettings } from "./cutoff-settings";

describe("cutoff settings", () => {
  test("explains the global and immediate impact before mutation", () => {
    const html = renderToStaticMarkup(createElement(CutoffSettings, { initialCutoffTime: "00:05" }));
    expect(html).toContain('type="time"');
    expect(html).toContain('value="00:05"');
    expect(html).toContain("every organization");
    expect(html).toContain("reopen a service");
    expect(html).toContain("Historical service dates are unchanged");
  });
});
