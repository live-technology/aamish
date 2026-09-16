import { MealRequestError, normalizeContact } from "./meal-requests";

export function validateGuestFeedback(form: FormData) {
  const rawRating = form.get("rating");
  if (typeof rawRating !== "string" || !/^[1-5]$/.test(rawRating)) throw new MealRequestError("Please choose a rating from 1 to 5.");
  const anonymous = form.get("anonymous") === "true";
  const text = (key: string, max: number) => {
    const value = form.get(key);
    if (value !== null && typeof value !== "string") throw new MealRequestError("Please check your feedback fields.");
    const result = (value || "").trim();
    if (result.length > max) throw new MealRequestError(`Please keep ${key} within ${max.toLocaleString("en-US")} characters.`);
    return result || null;
  };
  const review = text("review", 4000);
  // Deliberately discard identity fields, even if a crafted request sends them.
  const name = anonymous ? null : text("name", 100);
  const rawPhone = anonymous ? null : text("phone", 50);
  if (!anonymous && !name) throw new MealRequestError("Please enter your name or choose Stay anonymous.");
  if (!anonymous && !rawPhone) throw new MealRequestError("Please enter your phone number or choose Stay anonymous.");
  let phone: string | null = null;
  if (rawPhone) {
    try {
      const normalized = normalizeContact(rawPhone);
      if (normalized.contactType !== "phone") throw new Error();
      phone = normalized.contact;
    } catch { throw new MealRequestError("Please enter a valid phone number, including the country code outside Bangladesh."); }
  }
  return { rating: Number(rawRating), review, anonymous, name, phone };
}

export function guestFeedbackScope(session: { role: string; enterpriseId: string | null } | null): { enterpriseId: string | null } | null {
  if (session?.role === "SUPER_ADMIN") return { enterpriseId: null };
  if (session?.role === "ENTERPRISE_ADMIN" && session.enterpriseId) return { enterpriseId: session.enterpriseId };
  return null;
}
