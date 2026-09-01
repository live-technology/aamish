import { describe, expect, test } from "bun:test";
import { filterEmployees, parseEmployeeCsv, type EnterpriseEmployee } from "./enterprise-people";

const employee: EnterpriseEmployee = { id: "1", employee_code: "EMP-1", full_name: "Mina Ahmed", email: "mina@example.com", phone: null, location_name: "Gulshan", username: "mina", is_active: true };

describe("enterprise people", () => {
  test("searches identity and scopes by location", () => { expect(filterEmployees([employee], "Gulshan", "EMP-1")).toEqual([employee]); expect(filterEmployees([employee], "Banani", "")).toEqual([]); });
  test("preserves the documented CSV contract", () => { expect(parseEmployeeCsv("employeeCode,fullName,email,locationCode\nE-1,Mina,m@example.com,GUL\n")).toEqual([{ employeeCode: "E-1", fullName: "Mina", email: "m@example.com", locationCode: "GUL" }]); });
});
