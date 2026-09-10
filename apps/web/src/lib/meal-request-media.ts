import { createHash } from "crypto";
import { cloudinaryConfig } from "./cloudinary";
import { MAX_VOICE_BYTES, MAX_VOICE_SECONDS, MealRequestError } from "./meal-requests";

type Audio = { publicId: string; format: string; bytes: number; duration: number };

export function signMediaParameters(params: Record<string, string>, secret: string) {
  return createHash("sha1").update(Object.keys(params).sort().map(key => `${key}=${params[key]}`).join("&") + secret).digest("hex");
}

async function mediaAction(action: "upload" | "destroy", parameters: Record<string, string>, file?: File) {
  const config = cloudinaryConfig();
  if (!config) throw new MealRequestError("Voice messages aren’t available right now. Please send a written requirement or call us.", 503);
  const params = { ...parameters, timestamp: String(Math.floor(Date.now() / 1000)) };
  const body = new FormData();
  for (const [key, value] of Object.entries(params)) body.set(key, value);
  body.set("api_key", config.apiKey);
  body.set("signature", signMediaParameters(params, config.apiSecret));
  if (file) body.set("file", file);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/video/${action}`, { method: "POST", body, signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new MealRequestError("We couldn’t save your voice message. Please try again.", 502);
  return response.json();
}

export async function uploadRequestAudio(file: File, publicId: string): Promise<Audio> {
  const result = await mediaAction("upload", { public_id: publicId, type: "authenticated", overwrite: "false", allowed_formats: "webm,mp4,ogg,m4a" }, file);
  // Provider-inspected duration and tracks, never a client-declared duration.
  if (result.public_id !== publicId || result.type !== "authenticated" || !["webm", "mp4", "ogg", "m4a"].includes(result.format)
    || !Number.isFinite(result.duration) || result.duration <= 0 || result.duration > MAX_VOICE_SECONDS + 1
    || !Number.isInteger(result.bytes) || result.bytes <= 0 || result.bytes > MAX_VOICE_BYTES || !result.audio || result.video?.codec) {
    throw new MealRequestError("Please send an audio-only recording of up to 2 minutes and 3 MB.");
  }
  return { publicId, format: result.format, bytes: result.bytes, duration: result.duration };
}

export async function deleteRequestAudio(publicId: string) {
  await mediaAction("destroy", { public_id: publicId, type: "authenticated", invalidate: "true" });
}

// This URL stays server-side; the authorized app route proxies the media.
export function requestAudioUrl(publicId: string, format: string) {
  const config = cloudinaryConfig();
  if (!config) throw new MealRequestError("Voice playback is temporarily unavailable.", 503);
  if (!/^aamish\/meal-requests\/[0-9a-f-]{36}$/.test(publicId) || !["webm", "mp4", "ogg", "m4a"].includes(format)) throw new MealRequestError("Invalid recording.");
  const path = `${publicId}.${format}`;
  const signature = createHash("sha1").update(path + config.apiSecret).digest("base64url").slice(0, 8);
  return `https://res.cloudinary.com/${encodeURIComponent(config.cloudName)}/video/authenticated/s--${signature}--/${path}`;
}
