import { describe, expect, test } from "bun:test";
import { cloudinaryConfig } from "@/lib/cloudinary";

describe("cloudinaryConfig", () => {
  test("parses the standard Cloudinary URL", () => {
    expect(cloudinaryConfig({ CLOUDINARY_URL: "cloudinary://key:secret@demo-cloud" })).toEqual({
      cloudName: "demo-cloud",
      apiKey: "key",
      apiSecret: "secret",
    });
  });

  test("supports encoded credentials", () => {
    expect(cloudinaryConfig({ CLOUDINARY_URL: "cloudinary://key%2Fone:secret%40two@demo-cloud" })).toEqual({
      cloudName: "demo-cloud",
      apiKey: "key/one",
      apiSecret: "secret@two",
    });
  });

  test("rejects incomplete or malformed configuration", () => {
    expect(cloudinaryConfig({ CLOUDINARY_URL: "https://example.com" })).toBeNull();
    expect(cloudinaryConfig({ CLOUDINARY_URL: "cloudinary://key@demo-cloud" })).toBeNull();
  });
});
