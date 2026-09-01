import { describe, expect, test } from "bun:test";
import {
  emptyEnterpriseDraft,
  nextAvailableEnterpriseSlug,
  slugifyEnterpriseName,
  suggestEnterpriseAdminUsername,
  validateEnterpriseStep,
} from "./enterprise-onboarding";

describe("enterprise onboarding", () => {
  test("generates a URL slug without asking the administrator", () => {
    expect(slugifyEnterpriseName(" Live Technologies Ltd. ")).toBe("live-technologies-ltd");
    expect(suggestEnterpriseAdminUsername("Live Technologies")).toBe("live.technologies.admin");
  });

  test("keeps generated slugs unique", () => {
    expect(nextAvailableEnterpriseSlug("Live", ["live", "live-2"])).toBe("live-3");
  });

  test("requires one complete location before review", () => {
    const draft = emptyEnterpriseDraft();
    const errors = validateEnterpriseStep("locations", draft);
    expect(errors["location-0-name"]).toBeTruthy();
    expect(errors["location-0-code"]).toBeTruthy();
    expect(errors["location-0-address"]).toBeTruthy();
  });

  test("validates all steps at review", () => {
    const errors = validateEnterpriseStep("review", emptyEnterpriseDraft());
    expect(errors.name).toBeTruthy();
    expect(errors.pocEmail).toBeTruthy();
    expect(errors.adminUsername).toBeTruthy();
  });
});
