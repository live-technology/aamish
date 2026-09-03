const MENU_CATEGORIES = new Set(["REGULAR_LUNCH", "PREMIUM", "VEGETARIAN"]);

export type ValidMenuPackage = { title: string; description: string; category: string; price: number; status: "ACTIVE" | "DRAFT"; imageUrl: string | null };

export function validateMenuPackage(input: unknown, requireImage: boolean): { ok: true; value: ValidMenuPackage } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "MISSING_REQUIRED_FIELDS" };
  const body = input as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const category = typeof body.category === "string" ? body.category : "";
  const price = Number(body.price);
  const imageUrl = typeof body.imageUrl === "string" && body.imageUrl.startsWith("https://res.cloudinary.com/") ? body.imageUrl : null;
  if (!title || !description || !MENU_CATEGORIES.has(category) || body.price === "" || !Number.isFinite(price) || price < 0 || (requireImage && !imageUrl)) return { ok: false, error: "MISSING_REQUIRED_FIELDS" };
  return { ok: true, value: { title, description, category, price, status: body.status === "ACTIVE" ? "ACTIVE" : "DRAFT", imageUrl } };
}
