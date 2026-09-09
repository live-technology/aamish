import { describe, expect, test } from "bun:test";
import { MAX_REQUEST_BYTES, MAX_VOICE_BYTES, isRequestId, isRequestStatus, normalizeContact, readLimitedForm, requireSameOrigin, validateRequirement, validateVoiceBytes } from "./meal-requests";

describe("meal enquiry validation", () => {
  test("requires contact even for audio-only enquiries", () => {
    expect(validateRequirement("", true)).toBeNull();
    for (const contact of [null, undefined, "", "  ", "call me", "example@", "12345"]) expect(() => normalizeContact(contact)).toThrow();
  });
  test("normalizes Bangladesh numbers and supports email or international contact", () => {
    for (const value of ["01335-114515", "০১৩৩৫ ১১৪৫১৫", "+880 (1335) 114515", "8801335114515", "008801335114515"]) expect(normalizeContact(value)).toEqual({ contact: "+8801335114515", contactType: "phone" });
    expect(normalizeContact(" PERSON+meals@Example.com ")).toEqual({ contact: "person+meals@example.com", contactType: "email" });
    expect(normalizeContact("+44 7700 900123").contactType).toBe("phone");
    for (const invalid of ["+8801335", "+88001234567890", "01abcdefgh9", "user@host", "a@-host.com", "\nfoo\n@example.com", "javascript:alert(1)", "+1+23456789"]) expect(() => normalizeContact(invalid)).toThrow();
  });
  test("accepts text, audio, or both while rejecting blank and oversized requirements", () => {
    expect(validateRequirement("  Office lunch  ", false)).toBe("Office lunch");
    expect(validateRequirement("অফিসের খাবার", true)).toBe("অফিসের খাবার");
    expect(() => validateRequirement("  ", false)).toThrow();
    expect(() => validateRequirement("a".repeat(4001), true)).toThrow();
  });
  test("does not trust a file extension or declared MIME type alone", () => {
    expect(() => validateVoiceBytes(new Uint8Array([0x1a,0x45,0xdf,0xa3,0]), "audio/webm;codecs=opus")).not.toThrow();
    expect(() => validateVoiceBytes(new TextEncoder().encode("OggS1234"), "audio/ogg")).not.toThrow();
    expect(() => validateVoiceBytes(new Uint8Array([0,0,0,24,102,116,121,112]), "audio/mp4")).not.toThrow();
    expect(() => validateVoiceBytes(new TextEncoder().encode("<svg>bad</svg>"), "audio/webm")).toThrow();
    expect(() => validateVoiceBytes(new Uint8Array([0x1a,0x45,0xdf,0xa3]), "image/png")).toThrow();
    expect(() => validateVoiceBytes(new Uint8Array([0x1a,0x45,0xdf,0xa3]), "video/webm")).not.toThrow();
    expect(() => validateVoiceBytes(new Uint8Array(MAX_VOICE_BYTES + 1), "audio/webm")).toThrow();
    expect(() => validateVoiceBytes(new Uint8Array(), "audio/webm")).toThrow();
  });
  test("constrains request identifiers and statuses", () => {
    expect(isRequestId(crypto.randomUUID())).toBe(true);
    expect(isRequestId("' OR TRUE --")).toBe(false);
    expect(isRequestStatus("contacted")).toBe(true);
    expect(isRequestStatus("approved")).toBe(false);
  });
  test("rejects cross-site submission and absent origins", () => {
    expect(() => requireSameOrigin(new Request("https://aamish.test/api", { headers: { origin: "https://aamish.test" } }))).not.toThrow();
    for (const headers of [{}, { origin: "https://other.test" }, { origin: "https://aamish.test", "sec-fetch-site": "cross-site" }]) expect(() => requireSameOrigin(new Request("https://aamish.test/api", { headers }))).toThrow();
    expect(() => requireSameOrigin(new Request("http://0.0.0.0:3000/api", { headers: { host: "127.0.0.1:53060", origin: "http://127.0.0.1:53060" } }))).not.toThrow();
    expect(() => requireSameOrigin(new Request("http://0.0.0.0:3000/api", { headers: { host: "aamish.test", origin: "https://untrusted.test", "x-forwarded-host": "untrusted.test" } }))).toThrow();
  });
  test("parses multipart forms within a hard body limit, even without Content-Length", async () => {
    const form = new FormData(); form.set("requirement", "Synthetic enquiry");
    const parsed = await readLimitedForm(new Request("https://aamish.test/api", { method: "POST", body: form }));
    expect(parsed.get("requirement")).toBe("Synthetic enquiry");
    const tooLarge = new Request("https://aamish.test/api", { method: "POST", headers: { "content-type": "multipart/form-data; boundary=x" }, body: new Uint8Array(MAX_REQUEST_BYTES + 1) });
    await expect(readLimitedForm(tooLarge)).rejects.toThrow("too large");
    await expect(readLimitedForm(new Request("https://aamish.test/api", { method: "POST", body: "{}" }))).rejects.toThrow("enquiry form");
  });
});
