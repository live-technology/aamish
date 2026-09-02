export type ValidFoodQualityReport = { scheduleId: string; message: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateFoodQualityReport(input: unknown): { ok: true; value: ValidFoodQualityReport } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "INVALID_FOOD_QUALITY_REPORT" };
  const body = input as Record<string, unknown>;
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const scheduleId = typeof body.scheduleId === "string" ? body.scheduleId.trim() : "";
  if (!UUID_PATTERN.test(scheduleId) || message.length < 3 || message.length > 2000) return { ok: false, error: "INVALID_FOOD_QUALITY_REPORT" };
  return { ok: true, value: { scheduleId: scheduleId.toLowerCase(), message } };
}
