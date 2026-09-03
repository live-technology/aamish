import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EnterpriseEditor } from "./enterprise-editor-access";
import { EmployeeEditor } from "./enterprise-people";

describe("administrator password reset controls", () => {
  test("enterprise admins can set an employee temporary password", () => {
    const html = renderToStaticMarkup(createElement(EmployeeEditor, {
      employee: { id: "employee-1", employee_code: "EMP-1", full_name: "Employee", email: "employee@example.com", phone: null, location_id: "location-1", location_name: "Gulshan", username: "employee.1", is_active: true },
      locations: [{ id: "location-1", name: "Gulshan", code: "GULSHAN" }],
      onClose: () => undefined,
      onSaved: () => undefined,
    }));
    expect(html).toContain("Reset sign-in password");
    expect(html).toContain("must replace it at their next sign-in");
    expect(html).toContain('minLength="8"');
  });

  test("Aamish admins can set the enterprise administrator temporary password", () => {
    const html = renderToStaticMarkup(createElement(EnterpriseEditor, {
      enterprise: { id: "enterprise-1", name: "Enterprise", slug: "enterprise", status: "ACTIVE", poc_name: "Contact", poc_phone: "012345678", poc_email: "contact@example.com", location_count: 1, admin_count: 1, admin_username: "enterprise.admin", locations: [{ id: "location-1", name: "Gulshan", code: "GULSHAN", address: "Dhaka", is_active: true }] },
      onClose: () => undefined,
      onSaved: async () => undefined,
    }));
    expect(html).toContain("Reset administrator password");
    expect(html).toContain("@enterprise.admin");
    expect(html).toContain('minLength="8"');
  });
});
