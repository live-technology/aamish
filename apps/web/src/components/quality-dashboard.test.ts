import { describe, expect, test } from "bun:test";
import { filterQualityIssues, type QualityIssue } from "./quality-dashboard";

const issue = (overrides: Partial<QualityIssue>): QualityIssue => ({ id:"q-1",message:"Hair found in lunch",transcript:null,transcript_english:null,created_at:"2026-09-01T00:00:00Z",meal_service_date:null,quality_category:null,quality_severity:null,quality_status:"NEW",quality_classification_source:null,enterprise_name:"QA Enterprise",location_name:"Banani",...overrides });

describe("quality queue", () => {
  test("does not present unclassified product bugs as confirmed food issues", () => {
    const items = [issue({}),issue({id:"q-2",quality_category:"HYGIENE_SAFETY",quality_severity:"HIGH",quality_classification_source:"HUMAN"})];
    expect(filterQualityIssues(items,"CONFIRMED","ALL","ALL","").map((item)=>item.id)).toEqual(["q-2"]);
    expect(filterQualityIssues(items,"UNCLASSIFIED","ALL","ALL","").map((item)=>item.id)).toEqual(["q-1"]);
  });

  test("filters confirmed incidents by status, severity, and context", () => {
    const items = [issue({quality_category:"FRESHNESS_SPOILAGE",quality_severity:"HIGH",quality_status:"INVESTIGATING",message:"Fish was spoiled"})];
    expect(filterQualityIssues(items,"CONFIRMED","INVESTIGATING","HIGH","fish")).toHaveLength(1);
    expect(filterQualityIssues(items,"CONFIRMED","RESOLVED","HIGH","")).toHaveLength(0);
  });
});
