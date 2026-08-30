import { describe, expect, test } from "bun:test";
import { clientErrorMessage, validateImage } from "./client-errors";

describe("clientErrorMessage", () => {
  test("maps known API codes", () => {
    expect(clientErrorMessage("DUPLICATE_PACKAGE_OPTION")).toBe("Each meal option must use a different package.");
  });

  test("does not expose unknown internal codes", () => {
    expect(clientErrorMessage("UNEXPECTED_DATABASE_FAILURE")).toBe("Something went wrong. Try again.");
  });
});

describe("validateImage", () => {
  test("rejects unsupported formats", () => {
    expect(validateImage(new File(["data"], "meal.gif", { type: "image/gif" }))).toContain("JPG");
  });

  test("accepts a supported small image", () => {
    expect(validateImage(new File(["data"], "meal.webp", { type: "image/webp" }))).toBeNull();
  });
});
