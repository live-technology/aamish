import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ResilientImage } from "./resilient-image";

describe("resilient meal images", () => {
  test("renders remote media when a source is available", () => {
    const html = renderToStaticMarkup(createElement(ResilientImage, { src: "https://res.cloudinary.com/demo/image/upload/sample.jpg", surface: "employee-meal", alt: "", width: 100, height: 75 }));
    expect(html).toContain("sample.jpg");
    expect(html).toContain('alt=""');
  });

  test("renders an accessible fallback when informative media is missing", () => {
    const html = renderToStaticMarkup(createElement(ResilientImage, { src: null, surface: "admin-menu-preview", alt: "Current menu image", fallbackLabel: "Current menu image unavailable", width: 100, height: 75 }));
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Current menu image unavailable"');
  });

  test("keeps fallback media decorative beside an existing meal title", () => {
    const html = renderToStaticMarkup(createElement(ResilientImage, { src: null, surface: "enterprise-meal", alt: "", width: 40, height: 40, compactFallback: true }));
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
    expect(html).not.toContain("Meal image unavailable");
  });
});
