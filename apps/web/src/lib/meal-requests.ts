export const MAX_REQUIREMENT_LENGTH = 4000;
export const MAX_VOICE_SECONDS = 120;
export const MAX_VOICE_BYTES = 3 * 1024 * 1024;
export const MAX_REQUEST_BYTES = MAX_VOICE_BYTES + 32 * 1024;
export const requestStatuses = ["new", "contacted", "closed"] as const;
export type RequestStatus = typeof requestStatuses[number];

export class MealRequestError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function normalizeContact(input: unknown): { contact: string; contactType: "phone" | "email" } {
  if (typeof input !== "string" || !input.trim()) throw new MealRequestError("Please enter a phone number or email so we can contact you.");
  const value = input.trim().replace(/[০-৯]/g, digit => String("০১২৩৪৫৬৭৮৯".indexOf(digit)));
  if (value.length > 254) throw new MealRequestError("Please enter a valid phone number or email.");
  if (/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(value)) {
    return { contact: value.toLowerCase(), contactType: "email" };
  }
  if (!/^[+\d\s()-]+$/.test(value)) throw new MealRequestError("Please enter a valid phone number or email.");
  let phone = value.replace(/[\s()-]/g, "");
  if (/^01[3-9]\d{8}$/.test(phone)) phone = `+88${phone}`;
  if (/^8801[3-9]\d{8}$/.test(phone)) phone = `+${phone}`;
  if (/^008801[3-9]\d{8}$/.test(phone)) phone = `+${phone.slice(2)}`;
  const bangladesh = /^\+8801[3-9]\d{8}$/.test(phone);
  const international = /^\+[1-9]\d{7,14}$/.test(phone) && !phone.startsWith("+880");
  if (!bangladesh && !international) throw new MealRequestError("Enter a valid phone number (include the country code outside Bangladesh) or email.");
  return { contact: phone, contactType: "phone" };
}

export function validateRequirement(text: unknown, hasAudio: boolean) {
  if (typeof text !== "string") throw new MealRequestError("Please describe your requirement or record a voice message.");
  const requirement = text.trim();
  if (requirement.length > MAX_REQUIREMENT_LENGTH) throw new MealRequestError("Please keep your requirement within 4,000 characters.");
  if (!requirement && !hasAudio) throw new MealRequestError("Please describe your requirement or record a voice message.");
  return requirement || null;
}

export function isRequestId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
export function isRequestStatus(value: unknown): value is RequestStatus { return requestStatuses.includes(value as RequestStatus); }

export function validateVoiceBytes(bytes: Uint8Array, mime: string) {
  if (!bytes.length || bytes.length > MAX_VOICE_BYTES) throw new MealRequestError("The voice message must be smaller than 3 MB.", 413);
  const type = mime.split(";")[0].toLowerCase();
  const webm = [0x1a, 0x45, 0xdf, 0xa3].every((b, i) => bytes[i] === b);
  const mp4 = String.fromCharCode(...bytes.slice(4, 8)) === "ftyp";
  const ogg = String.fromCharCode(...bytes.slice(0, 4)) === "OggS";
  // Bun may infer video/* from .webm/.mp4 filenames while parsing multipart audio.
  // Container signatures are checked here; the provider must confirm audio-only tracks before persistence.
  if (!((["audio/webm", "video/webm"].includes(type) && webm) || (type === "audio/ogg" && ogg) || (["audio/mp4", "audio/x-m4a", "video/mp4"].includes(type) && mp4))) {
    throw new MealRequestError("That recording format isn’t supported. Please record again or send a written requirement.");
  }
}

export function requireSameOrigin(request: Request) {
  // Next standalone reconstructs request.url with the internal container host.
  // The browser's Host is preserved through Docker/Vercel; never use a client-supplied forwarded host.
  const host = request.headers.get("host") || new URL(request.url).host;
  let origin: URL | null = null;
  try { origin = new URL(request.headers.get("origin") || ""); } catch { /* Missing/opaque origins fail closed. */ }
  if (!origin || !["http:", "https:"].includes(origin.protocol) || origin.host !== host || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new MealRequestError("Please send your request from the Aamish website.", 403);
  }
}

export async function readLimitedForm(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;")) throw new MealRequestError("Please use the enquiry form to send your request.", 415);
  if (Number(request.headers.get("content-length")) > MAX_REQUEST_BYTES) throw new MealRequestError("The voice message is too large. Please record a shorter message.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new MealRequestError("Your request was empty.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_REQUEST_BYTES) { await reader.cancel(); throw new MealRequestError("The voice message is too large. Please record a shorter message.", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  try { return await new Response(body, { headers: { "content-type": request.headers.get("content-type")! } }).formData(); }
  catch { throw new MealRequestError("We couldn’t read that request. Please try again."); }
}
