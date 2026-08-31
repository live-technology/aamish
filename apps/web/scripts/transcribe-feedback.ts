import postgres from "postgres";
import { FEEDBACK_TRANSCRIPTION_MODEL, transcribeFeedbackAudio } from "../src/lib/ai/gemini";
import { log, logError } from "../src/lib/logger";

type FeedbackAudioRow = {
  id: string;
  audio_url: string;
  page_path: string;
  category: string;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required");

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const feedbackId = option("--id");
const force = process.argv.includes("--force");
const showContent = process.argv.includes("--show-content");
const requestedLimit = Number(option("--limit") ?? 20);
if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 100) throw new Error("--limit must be an integer between 1 and 100");

const sql = postgres(databaseUrl, { max: 1, connect_timeout: 10 });
let failed = 0;
let completed = 0;
let totals = { inputTokens: 0, outputTokens: 0, reasoningTokens: 0, totalTokens: 0 };

try {
  let rows: FeedbackAudioRow[];
  if (feedbackId) {
    rows = force
      ? await sql<FeedbackAudioRow[]>`SELECT id, audio_url, page_path, category FROM platform_feedback WHERE id = ${feedbackId} AND audio_url IS NOT NULL`
      : await sql<FeedbackAudioRow[]>`SELECT id, audio_url, page_path, category FROM platform_feedback WHERE id = ${feedbackId} AND audio_url IS NOT NULL AND transcribed_at IS NULL`;
  } else {
    rows = await sql<FeedbackAudioRow[]>`
      SELECT id, audio_url, page_path, category
      FROM platform_feedback
      WHERE audio_url IS NOT NULL AND transcribed_at IS NULL
      ORDER BY created_at
      LIMIT ${requestedLimit}
    `;
  }

  log("feedback_transcription.batch_started", { selected: rows.length, force, feedbackId: feedbackId ?? null });
  for (const row of rows) {
    try {
      const audioUrl = new URL(row.audio_url);
      if (audioUrl.protocol !== "https:" || audioUrl.hostname !== "res.cloudinary.com") throw new Error("UNTRUSTED_AUDIO_URL");
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error(`AUDIO_DOWNLOAD_FAILED_${response.status}`);
      const audio = await response.arrayBuffer();
      if (audio.byteLength > 10 * 1024 * 1024) throw new Error("AUDIO_TOO_LARGE");

      const result = await transcribeFeedbackAudio(audio, { mimeType: "audio/webm" });
      const updated = await sql.begin(async (transaction) => {
        const saved = force
          ? await transaction<{ id: string }[]>`
              UPDATE platform_feedback SET transcript = ${result.transcript}, transcript_english = ${result.englishTranslation},
                transcription_summary = ${result.issueSummary}, transcription_confidence = ${result.confidence},
                transcription_model = ${FEEDBACK_TRANSCRIPTION_MODEL}, transcribed_at = NOW()
              WHERE id = ${row.id} RETURNING id`
          : await transaction<{ id: string }[]>`
              UPDATE platform_feedback SET transcript = ${result.transcript}, transcript_english = ${result.englishTranslation},
                transcription_summary = ${result.issueSummary}, transcription_confidence = ${result.confidence},
                transcription_model = ${FEEDBACK_TRANSCRIPTION_MODEL}, transcribed_at = NOW()
              WHERE id = ${row.id} AND transcribed_at IS NULL RETURNING id`;
        if (!saved[0]) return false;
        await transaction`
          INSERT INTO ai_usage_events (provider, model, operation, feedback_id, input_tokens, output_tokens, reasoning_tokens, total_tokens)
          VALUES ('google', ${FEEDBACK_TRANSCRIPTION_MODEL}, 'feedback_transcription', ${row.id}, ${result.usage.inputTokens},
            ${result.usage.outputTokens}, ${result.usage.reasoningTokens}, ${result.usage.totalTokens})`;
        return true;
      });

      if (!updated) continue;
      completed += 1;
      totals = {
        inputTokens: totals.inputTokens + result.usage.inputTokens,
        outputTokens: totals.outputTokens + result.usage.outputTokens,
        reasoningTokens: totals.reasoningTokens + result.usage.reasoningTokens,
        totalTokens: totals.totalTokens + result.usage.totalTokens,
      };
      log("feedback_transcription.completed", { feedbackId: row.id, pagePath: row.page_path, category: row.category, model: FEEDBACK_TRANSCRIPTION_MODEL, confidence: result.confidence, ...result.usage });
      if (showContent) console.info(JSON.stringify({ feedbackId: row.id, transcript: result.transcript, englishTranslation: result.englishTranslation, issueSummary: result.issueSummary }));
    } catch (error) {
      failed += 1;
      logError("feedback_transcription.failed", error, { feedbackId: row.id, pagePath: row.page_path });
    }
  }

  log("feedback_transcription.batch_completed", { selected: rows.length, completed, failed, ...totals });
} finally {
  await sql.end();
}

if (failed) process.exitCode = 1;
