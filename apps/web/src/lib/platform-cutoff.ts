export const DEFAULT_CUTOFF_TIME = "00:05";
export const PLATFORM_TIMEZONE = "Asia/Dhaka";

export function validateCutoffTime(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return false;
  const [hours, minutes] = value.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export function readCutoffTime(value: unknown) {
  return validateCutoffTime(value) ? value : DEFAULT_CUTOFF_TIME;
}

export function cutoffIsoForDate(scheduleDate: string, cutoffTime: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduleDate) || !validateCutoffTime(cutoffTime)) throw new Error("INVALID_CUTOFF");
  return new Date(`${scheduleDate}T${cutoffTime}:00+06:00`).toISOString();
}
