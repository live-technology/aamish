import { describe, expect, test } from "bun:test";
import { validateFeedbackStatus } from "./feedback-triage";

describe("validateFeedbackStatus", () => {
  test("accepts a tracked triage status", () => expect(validateFeedbackStatus({ id: "feedback-1", status: "PLANNED" })).toEqual({ id: "feedback-1", status: "PLANNED" }));
  test("rejects unknown statuses", () => expect(validateFeedbackStatus({ id: "feedback-1", status: "DELETE" })).toBeNull());
});
