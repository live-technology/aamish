import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LoginForm } from "./login-form";

describe("LoginForm accessibility contract", () => {
  test("renders one focused sign-in task with required credentials", () => {
    const html = renderToStaticMarkup(createElement(LoginForm));

    expect(html.match(/<h1/g)?.length).toBe(1);
    expect(html).toContain("Sign in to Aamish");
    expect(html).toContain('autoComplete="username"');
    expect(html).toContain('autoComplete="current-password"');
    expect(html.match(/required=""/g)?.length).toBe(2);
    expect(html).toContain("correct workspace automatically");
  });

  test("explains an ended session without changing the sign-in task", () => {
    const html = renderToStaticMarkup(
      createElement(LoginForm, { sessionEnded: true }),
    );

    expect(html).toContain("Your session ended");
    expect(html).toContain("Sign in again to continue where you left off.");
    expect(html).toContain('role="status"');
  });
});
