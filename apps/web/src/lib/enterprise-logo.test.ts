import { expect, test } from "bun:test";
import { MAX_LOGO_BYTES, validEnterpriseLogoUrl, validLogoBytes } from "./enterprise-logo";

test("logo upload rejects oversized, mismatched and active image formats", () => {
  const png = new Uint8Array([137,80,78,71,13,10,26,10]);
  expect(validLogoBytes(png, "image/png")).toBe(true);
  expect(validLogoBytes(png, "image/jpeg")).toBe(false);
  expect(validLogoBytes(new TextEncoder().encode('<svg onload="alert(1)"/>'), "image/svg+xml")).toBe(false);
  expect(validLogoBytes(new Uint8Array(MAX_LOGO_BYTES + 1), "image/png")).toBe(false);
  expect(validLogoBytes(new Uint8Array(), "image/png")).toBe(false);
});

test("only canonical enterprise logos in the configured cloud can be saved", () => {
  const url = "https://res.cloudinary.com/test/image/upload/v123/aamish/enterprise-logos/12345678-1234-1234-1234-123456789abc.png";
  expect(validEnterpriseLogoUrl(url, "test")).toBe(true);
  for (const value of [url.replace('/test/', '/foreign/'), url + '?x=1', url.replace('.png', '.svg'), url.replace('enterprise-logos', 'reviews'), url.replace('https:', 'http:'), 'javascript:alert(1)', null]) expect(validEnterpriseLogoUrl(value, "test")).toBe(false);
});
