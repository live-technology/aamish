export const FEEDBACK_TRANSCRIPTION_MODEL = "gemini-3.7-flash";

export type FeedbackTranscription = {
  transcript: string;
  englishTranslation: string;
  issueSummary: string;
  confidence: "high" | "medium" | "low";
  usage: {
    inputTokens: number;
    outputTokens: number;
    reasoningTokens: number;
    totalTokens: number;
  };
};

type Fetch = typeof fetch;

function requiredText(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`GEMINI_INVALID_${field.toUpperCase()}`);
  return value.trim();
}

export function parseGeminiTranscription(value: unknown, usage: Record<string, unknown> = {}): FeedbackTranscription {
  if (!value || typeof value !== "object") throw new Error("GEMINI_INVALID_TRANSCRIPTION");
  const result = value as Record<string, unknown>;
  const confidence = result.confidence;
  if (confidence !== "high" && confidence !== "medium" && confidence !== "low") throw new Error("GEMINI_INVALID_CONFIDENCE");

  return {
    transcript: requiredText(result.transcript, "transcript"),
    englishTranslation: requiredText(result.english_translation, "english_translation"),
    issueSummary: requiredText(result.issue_summary, "issue_summary"),
    confidence,
    usage: {
      inputTokens: Number(usage.promptTokenCount) || 0,
      outputTokens: Number(usage.candidatesTokenCount) || 0,
      reasoningTokens: Number(usage.thoughtsTokenCount) || 0,
      totalTokens: Number(usage.totalTokenCount) || 0,
    },
  };
}

function parseJsonResponse(text: string) {
  const normalized = text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(normalized) as unknown;
  } catch {
    throw new Error("GEMINI_INVALID_JSON");
  }
}

export async function transcribeFeedbackAudio(
  audio: ArrayBuffer,
  options: { apiKey?: string; fetchImpl?: Fetch; mimeType?: string } = {},
): Promise<FeedbackTranscription> {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is required");
  const fetchImpl = options.fetchImpl ?? fetch;
  const prompt = "Transcribe this Aamish platform voice feedback accurately. The speaker may use Bengali, English, or both. Return only JSON with these keys: transcript (verbatim in the original language), english_translation (faithful English translation; if already English, repeat it), issue_summary (one concise actionable sentence), confidence (high, medium, or low). Do not invent inaudible words.";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${FEEDBACK_TRANSCRIPTION_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const requestBody = {
    contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: options.mimeType ?? "audio/webm", data: Buffer.from(audio).toString("base64") } }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
  };

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetchImpl(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(requestBody) });
    if (!response.ok) {
      if ((response.status === 429 || response.status === 503) && attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 250));
        continue;
      }
      throw new Error(`GEMINI_REQUEST_FAILED_${response.status}`);
    }

    const body = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: Record<string, unknown>;
    };
    const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    return parseGeminiTranscription(parseJsonResponse(text), body.usageMetadata);
  }

  throw new Error("GEMINI_REQUEST_FAILED");
}
