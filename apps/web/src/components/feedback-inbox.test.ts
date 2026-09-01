import { describe, expect, test } from "bun:test";
import { filterFeedback, type FeedbackRow } from "./feedback-inbox";

const base: FeedbackRow = { id:"f-1",category:"BUG",message:"Calendar button is hidden",audio_url:null,audio_duration_seconds:null,page_path:"/admin/calendar",status:"NEW",submitter_role:"EMPLOYEE",submitter_name:"QA User",username:"qa.user",enterprise_name:"QA Enterprise",created_at:"2026-09-01T00:00:00Z",transcript:null,transcript_english:null,transcription_summary:null,transcription_confidence:null,transcription_model:null,transcribed_at:null,quality_category:null };

describe("product feedback queue", () => {
  test("combines type, status, and full-context search", () => {
    const items = [base,{...base,id:"f-2",category:"IDEA" as const,status:"PLANNED",message:null,transcript:"Please show tomorrow's menu"}];
    expect(filterFeedback(items,"BUG","NEW","calendar").map((item)=>item.id)).toEqual(["f-1"]);
    expect(filterFeedback(items,"ALL","ALL","tomorrow").map((item)=>item.id)).toEqual(["f-2"]);
    expect(filterFeedback(items,"IDEA","NEW","")).toHaveLength(0);
  });
});
