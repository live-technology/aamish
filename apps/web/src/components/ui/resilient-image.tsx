"use client";

import Image, { type ImageProps } from "next/image";
import { ImageOff } from "lucide-react";
import { useState } from "react";
import styles from "./resilient-image.module.css";

type ResilientImageProps = Omit<ImageProps, "src" | "onError"> & {
  src: string | null | undefined;
  surface: "employee-meal" | "enterprise-meal" | "admin-menu" | "admin-menu-preview";
  fallbackLabel?: string;
  compactFallback?: boolean;
};

export function ResilientImage({ src, surface, fallbackLabel = "Meal image unavailable", compactFallback = false, alt, ...props }: ResilientImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = Boolean(src && failedSrc === src);

  function handleError() {
    if (src) setFailedSrc(src);
    void fetch("/api/client-events/media-error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ surface }),
      keepalive: true,
    }).catch(() => undefined);
  }

  if (!src || failed) {
    const decorative = alt === "";
    return <span className={`${styles.fallback} ${compactFallback ? styles.compact : ""}`} role={decorative ? undefined : "img"} aria-label={decorative ? undefined : fallbackLabel} aria-hidden={decorative || undefined}>
      <ImageOff size={compactFallback ? 18 : 24} aria-hidden="true" />
      {!compactFallback && <span>{fallbackLabel}</span>}
    </span>;
  }

  return <Image src={src} alt={alt} onError={handleError} {...props} />;
}
