const FEEDBACK_STATUSES = new Set(["NEW", "REVIEWED", "PLANNED", "CLOSED"]);

export function validateFeedbackStatus(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const body = input as Record<string, unknown>;
  if (typeof body.id !== "string" || !body.id || typeof body.status !== "string" || !FEEDBACK_STATUSES.has(body.status)) return null;
  return { id: body.id, status: body.status };
}
