import { describe, expect, test } from "bun:test";
import { validateEnterpriseEdit, type EnterpriseEditPayload } from "./enterprise-edit";

const valid: EnterpriseEditPayload = { id:"e1",name:"Apex",pocName:"Mina",pocPhone:"01",pocEmail:"m@example.com",status:"ACTIVE",locations:[{id:"l1",name:"HQ",code:"HQ",address:"Dhaka",isActive:true}] };

describe("enterprise editing", () => {
  test("requires one active complete location", () => {
    expect(validateEnterpriseEdit(valid)).toBe("");
    expect(validateEnterpriseEdit({ ...valid, locations:[{ ...valid.locations[0], isActive:false }] })).toBe("ACTIVE_LOCATION_REQUIRED");
  });

  test("does not require a user-entered code for a new location", () => {
    expect(validateEnterpriseEdit({ ...valid, locations:[valid.locations[0],{name:"Other",code:"",address:"Dhaka",isActive:true}] })).toBe("");
  });
});
