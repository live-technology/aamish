export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export function validEnterpriseLogoUrl(value: unknown, cloudName: string) {
  if (typeof value !== "string" || !cloudName) return false;
  const prefix = `https://res.cloudinary.com/${cloudName}/image/upload/`;
  return value.startsWith(prefix) && /^(?:v\d+\/)?aamish\/enterprise-logos\/[0-9a-f-]{36}\.png$/.test(value.slice(prefix.length));
}

export function validLogoBytes(bytes: Uint8Array, mime: string) {
  if (!bytes.length || bytes.length > MAX_LOGO_BYTES) return false;
  if (mime === "image/png") return [137,80,78,71,13,10,26,10].every((byte, i) => bytes[i] === byte);
  if (mime === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (mime === "image/webp") return new TextDecoder().decode(bytes.slice(0,4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8,12)) === "WEBP";
  return false;
}
