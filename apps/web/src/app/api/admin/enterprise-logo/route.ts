import { currentSession } from "@/lib/auth";
import { cloudinaryConfig } from "@/lib/cloudinary";
import { validEnterpriseLogoUrl, validLogoBytes } from "@/lib/enterprise-logo";
import { signMediaParameters } from "@/lib/meal-request-media";
import { MealRequestError, readLimitedForm, requireSameOrigin } from "@/lib/meal-requests";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    if ((await currentSession())?.role !== "SUPER_ADMIN") throw new MealRequestError("Forbidden", 403);
    requireSameOrigin(request);
    const form = await readLimitedForm(request);
    const file = form.get("file");
    if (!(file instanceof File) || !validLogoBytes(new Uint8Array(await file.arrayBuffer()), file.type)) throw new MealRequestError("Choose a PNG, JPEG or WebP image under 2 MB.");
    const config = cloudinaryConfig();
    if (!config) throw new MealRequestError("Logo upload is unavailable. Please try again later.", 503);
    const publicId = `aamish/enterprise-logos/${crypto.randomUUID()}`;
    const params = { public_id: publicId, timestamp: String(Math.floor(Date.now() / 1000)), overwrite: "false", format: "png", transformation: "c_limit,w_512,h_512" };
    const body = new FormData();
    for (const [key, value] of Object.entries(params)) body.set(key, value);
    body.set("api_key", config.apiKey);
    body.set("signature", signMediaParameters(params, config.apiSecret));
    body.set("file", file);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, { method: "POST", body, signal: AbortSignal.timeout(45000) });
    const data = await response.json();
    if (!response.ok || data.public_id !== publicId || data.format !== "png" || data.resource_type !== "image" || data.type !== "upload" || !validEnterpriseLogoUrl(data.secure_url, config.cloudName)) throw new MealRequestError("The logo could not be uploaded. Please try another image.", 502);
    log("enterprise.logo_uploaded", { requestId });
    return Response.json({ logoUrl: data.secure_url, requestId });
  } catch (error) {
    const status = error instanceof MealRequestError ? error.status : 503;
    log("enterprise.logo_upload_failed", { requestId, status });
    return Response.json({ error: error instanceof MealRequestError ? error.message : "Logo upload failed. Please try again.", requestId }, { status });
  }
}
