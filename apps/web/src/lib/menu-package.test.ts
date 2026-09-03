import { describe, expect, test } from "bun:test";
import { validateMenuPackage } from "./menu-package";

describe("validateMenuPackage", () => {
  const input = { title: "Lunch", description: "Rice and curry", category: "REGULAR_LUNCH", price: "120", status: "ACTIVE", imageUrl: "https://res.cloudinary.com/demo/image/upload/lunch.webp" };
  test("validates package creation", () => expect(validateMenuPackage(input, true).ok).toBe(true));
  test("allows an edit without replacing the image", () => expect(validateMenuPackage({ ...input, imageUrl: undefined }, false).ok).toBe(true));
  test("rejects invalid price and category", () => {
    expect(validateMenuPackage({ ...input, price: -1 }, true).ok).toBe(false);
    expect(validateMenuPackage({ ...input, category: "UNKNOWN" }, true).ok).toBe(false);
  });
});
