export const MINIMUM_TEMPORARY_PASSWORD_LENGTH = 8;

export function temporaryPasswordFrom(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const password = (value as Record<string, unknown>).password;
  if (typeof password !== "string" || password.length < MINIMUM_TEMPORARY_PASSWORD_LENGTH) return null;
  return password;
}
