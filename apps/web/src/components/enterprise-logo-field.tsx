"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { MAX_LOGO_BYTES } from "@/lib/enterprise-logo";
import { Button } from "@/components/ui/primitives";

export function EnterpriseLogoField({ value, onChange, onBusyChange, disabled = false }: { value?: string | null; onChange: (value: string | null) => void; onBusyChange?: (busy: boolean) => void; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const uploading = useRef(false);
  async function upload(file?: File) {
    if (!file || uploading.current) return;
    setError("");
    if (file.size > MAX_LOGO_BYTES || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setError("Choose a PNG, JPEG or WebP image under 2 MB."); return; }
    uploading.current = true; setBusy(true); onBusyChange?.(true);
    try {
      const form = new FormData(); form.set("file", file);
      const response = await fetch("/api/admin/enterprise-logo", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Logo upload failed.");
      onChange(data.logoUrl);
    } catch (error) { setError(error instanceof Error ? error.message : "Logo upload failed. Please try again."); }
    finally { uploading.current = false; setBusy(false); onBusyChange?.(false); }
  }
  return <div style={{ display: "grid", gap: 10, marginBlock: 20 }}>
    <label htmlFor="enterprise-logo"><strong>Enterprise logo</strong> <span>(optional)</span></label>
    <p style={{ margin: 0, fontSize: 13 }}>Shown on feedback forms. PNG, JPEG or WebP, up to 2 MB. You can change it later.</p>
    {value && <Image src={value} alt="Enterprise logo preview" width={72} height={72} style={{ objectFit: "contain" }} />}
    <input id="enterprise-logo" type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled || busy} style={{ maxWidth: "100%" }} onChange={event => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
    {value && <Button type="button" variant="secondary" size="small" disabled={disabled || busy} onClick={() => { onChange(null); setError(""); }}>Remove logo</Button>}
    {busy && <p role="status">Uploading logo…</p>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
