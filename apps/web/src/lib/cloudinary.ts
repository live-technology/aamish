type CloudinaryEnvironment = {
  CLOUDINARY_URL?: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
};

export type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

export function cloudinaryConfig(environment?: CloudinaryEnvironment): CloudinaryConfig | null {
  const values = environment ?? {
    CLOUDINARY_URL: process.env.CLOUDINARY_URL,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  };
  if (values.CLOUDINARY_URL) {
    try {
      const parsed = new URL(values.CLOUDINARY_URL);
      if (parsed.protocol !== "cloudinary:" || !parsed.hostname || !parsed.username || !parsed.password) return null;
      return {
        cloudName: parsed.hostname,
        apiKey: decodeURIComponent(parsed.username),
        apiSecret: decodeURIComponent(parsed.password),
      };
    } catch {
      return null;
    }
  }

  // Temporary transition support for existing local environments.
  if (values.CLOUDINARY_CLOUD_NAME && values.CLOUDINARY_API_KEY && values.CLOUDINARY_API_SECRET) {
    return {
      cloudName: values.CLOUDINARY_CLOUD_NAME,
      apiKey: values.CLOUDINARY_API_KEY,
      apiSecret: values.CLOUDINARY_API_SECRET,
    };
  }

  return null;
}
