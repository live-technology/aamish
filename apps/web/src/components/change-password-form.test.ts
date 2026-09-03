import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChangePasswordForm } from "./change-password-form";

describe("first-login password change", () => {
  test("requires a new password and confirmation before workspace access", () => {
    const html = renderToStaticMarkup(createElement(ChangePasswordForm));
    expect(html).toContain("First sign-in");
    expect(html).toContain("Create your password");
    expect(html.match(/minLength="8"/g)?.length).toBe(2);
    expect(html).toContain("Continue to Aamish");
  });
});
