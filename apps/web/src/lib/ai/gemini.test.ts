import { describe, expect, test } from "bun:test";
import { parseGeminiTranscription } from "./gemini";

describe("parseGeminiTranscription", () => {
  test("maps transcript and token usage", () => {
    expect(parseGeminiTranscription({
      transcript: "খাবারে চুল পেয়েছি।",
      english_translation: "I found hair in the food.",
      issue_summary: "A customer reported hair in the food.",
      confidence: "high",
    }, { promptTokenCount: 100, candidatesTokenCount: 20, thoughtsTokenCount: 5, totalTokenCount: 125 })).toEqual({
      transcript: "খাবারে চুল পেয়েছি।",
      englishTranslation: "I found hair in the food.",
      issueSummary: "A customer reported hair in the food.",
      confidence: "high",
      usage: { inputTokens: 100, outputTokens: 20, reasoningTokens: 5, totalTokens: 125 },
    });
  });

  test("rejects incomplete model output", () => {
    expect(() => parseGeminiTranscription({ transcript: "Something", confidence: "high" })).toThrow();
  });
});
