import { describe, expect, test } from "bun:test";
import { eligibleReviewSchedule, reviewIsEditable, validateReview } from "./reviews";

describe("eligibleReviewSchedule", () => {
  test("selects the latest eligible received meal", () => {
    const schedules = [
      { id: "old", schedule_date: "2026-08-29", can_review: true },
      { id: "skipped", schedule_date: "2026-08-30", can_review: false },
      { id: "future", schedule_date: "2026-09-02", can_review: true },
      { id: "today", schedule_date: "2026-09-01", can_review: true },
    ];
    expect(eligibleReviewSchedule(schedules, "2026-09-01")?.id).toBe("old");
  });

  test("returns undefined when no meal is reviewable", () => {
    expect(eligibleReviewSchedule([{ id: "skipped", schedule_date: "2026-09-01", can_review: false }], "2026-09-01")).toBeUndefined();
  });

  test("keeps an old received meal eligible without a submission expiry", () => {
    expect(eligibleReviewSchedule([{ id: "old", schedule_date: "2020-01-01", can_review: true }], "2026-09-01")?.id).toBe("old");
  });
});

describe("review edit window", () => {
  test("is open through the exact 24-hour boundary and never restarts", () => {
    const createdAt = "2026-09-01T06:00:00.000Z";
    expect(reviewIsEditable(createdAt, new Date("2026-09-02T06:00:00.000Z"))).toBe(true);
    expect(reviewIsEditable(createdAt, new Date("2026-09-02T06:00:00.001Z"))).toBe(false);
  });
});

describe("review voice", () => {
  const base = { scheduleId: "schedule", rating: 5, comment: "Good", tags: [], photos: [] };
  test("accepts a one-minute Cloudinary recording", () => {
    expect(validateReview({ ...base, voice: { publicId: "aamish/reviews/voice", url: "https://res.cloudinary.com/demo/video/upload/voice.webm", durationSeconds: 60 } }).ok).toBe(true);
  });
  test("rejects a recording beyond one minute", () => {
    expect(validateReview({ ...base, voice: { publicId: "aamish/reviews/voice", url: "https://res.cloudinary.com/demo/video/upload/voice.webm", durationSeconds: 61 } })).toEqual({ ok: false, error: "INVALID_REVIEW_VOICE_DURATION" });
  });
});
