import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CompanyStep, SuccessHandoff } from "./admin-onboarding";
import { emptyEnterpriseDraft } from "@/lib/enterprise-onboarding";

describe("Super Admin onboarding contract", () => {
  test("marks company requirements without asking for a slug", () => {
    const html = renderToStaticMarkup(createElement(CompanyStep, {
      draft: emptyEnterpriseDraft(),
      errors: {},
      update: () => undefined,
      updateName: () => undefined,
    }));

    expect(html).toContain("Company details");
    expect(html.match(/required=""/g)?.length).toBe(4);
    expect(html).not.toContain('name="slug"');
    expect(html).toContain("URL is generated automatically");
  });

  test("hands off the username without rendering the password value", () => {
    const html = renderToStaticMarkup(createElement(SuccessHandoff, {
      created: { enterpriseId: "enterprise-1", enterpriseAdminUsername: "live.admin" },
      copyUsername: () => undefined,
      close: () => undefined,
    }));

    expect(html).toContain("Enterprise created");
    expect(html).toContain("live.admin");
    expect(html).toContain("temporary password is not displayed again");
    expect(html).not.toContain("Aamish-Journey-2026!");
  });
});
