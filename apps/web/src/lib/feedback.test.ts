import { describe, expect, test } from "bun:test";
import { validateFeedback } from "./feedback";

describe("validateFeedback", () => {
  test("accepts text feedback", () => {
    const result = validateFeedback({ category: "BUG", message: "The calendar jumps.", pagePath: "/admin/calendar" });
    expect(result.ok).toBe(true);
  });

  test("accepts Cloudinary voice feedback", () => {
    const result = validateFeedback({ category: "IDEA", message: "", pagePath: "/employee", audio: { publicId: "aamish/feedbacks/sample", url: "https://res.cloudinary.com/demo/video/upload/sample.webm", durationSeconds: 12 } });
    expect(result.ok).toBe(true);
  });

  test("requires text or audio", () => {
    expect(validateFeedback({ category: "OTHER", message: " ", pagePath: "/enterprise" })).toEqual({ ok: false, error: "FEEDBACK_CONTENT_REQUIRED" });
  });

  test("rejects untrusted audio URLs", () => {
    expect(validateFeedback({ category: "BUG", message: "", pagePath: "/employee", audio: { publicId: "aamish/feedbacks/sample", url: "https://example.com/sample.webm", durationSeconds: 12 } })).toEqual({ ok: false, error: "INVALID_AUDIO" });
  });

  test("rejects recordings over two minutes", () => {
    expect(validateFeedback({ category: "QUESTION", message: "", pagePath: "/employee", audio: { publicId: "aamish/feedbacks/sample", url: "https://res.cloudinary.com/demo/video/upload/sample.webm", durationSeconds: 121 } })).toEqual({ ok: false, error: "INVALID_AUDIO_DURATION" });
  });
});
