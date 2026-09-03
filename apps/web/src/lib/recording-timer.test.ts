import { describe, expect, test } from "bun:test";
import { formatRecordingTime, recordingTime } from "./recording-timer";

describe("recording timer", () => {
  test("counts remaining time down", () => {
    expect(recordingTime(0, 120)).toEqual({ elapsed: 0, remaining: 120, complete: false });
    expect(recordingTime(31.1, 120)).toEqual({ elapsed: 32, remaining: 88, complete: false });
  });
  test("stops at zero", () => expect(recordingTime(121, 120)).toEqual({ elapsed: 120, remaining: 0, complete: true }));
  test("formats minutes and seconds", () => expect(formatRecordingTime(8)).toBe("0:08"));
});
