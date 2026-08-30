"use client";

import Image from "next/image";
import { PackageOpen, Plus, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { AdminNav } from "@/components/admin-nav";

export type MenuPackage = { id: string; title: string; description: string; category: string; price: number; status: string; image_mobile_url: string | null };

async function uploadMenuImage(file: File) {
  const signatureResponse = await fetch("/api/uploads/signature", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "menu" }) });
  const signed = await signatureResponse.json();
  if (!signatureResponse.ok) throw new Error(signed.error);
  const form = new FormData();
  form.set("file", file); form.set("api_key", signed.apiKey); form.set("timestamp", String(signed.timestamp)); form.set("signature", signed.signature); form.set("folder", signed.folder);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, { method: "POST", body: form });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "IMAGE_UPLOAD_FAILED");
  return data.secure_url as string;
}

export function PackageManager({ initialMenus }: { initialMenus: MenuPackage[] }) {
  const [menus, setMenus] = useState(initialMenus); const [open, setOpen] = useState(false); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [imageFile, setImageFile] = useState<File | null>(null);
  async function reload() { const response = await fetch("/api/admin/menus"); const data = await response.json(); if (response.ok) setMenus(data.menus); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      if (!imageFile) throw new Error("PACKAGE_IMAGE_REQUIRED");
      const form = new FormData(event.currentTarget); const imageUrl = await uploadMenuImage(imageFile);
      const response = await fetch("/api/admin/menus", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...Object.fromEntries(form), imageUrl }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setOpen(false); setImageFile(null); await reload();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "PACKAGE_CREATION_FAILED"); }
    finally { setSaving(false); }
  }
  return <div className="admin-portal"><AdminNav active="packages" /><main className="admin-main"><header className="admin-header"><div><p className="eyebrow">AAMISH ADMIN</p><h1>Meal packages</h1><span>Create reusable food packages before publishing them on the menu calendar.</span></div><button className="primary" onClick={() => setOpen(true)}><Plus size={17} /> New package</button></header>{menus.length === 0 ? <section className="empty-dashboard"><div className="empty-icon"><PackageOpen size={28} /></div><h2>No packages yet</h2><p>Create a package with its menu description, price, and publishing status.</p><button className="primary" onClick={() => setOpen(true)}><Plus size={17} /> Create first package</button></section> : <section className="package-grid">{menus.map((menu) => <article className="package-card" key={menu.id}><div className="package-visual">{menu.image_mobile_url ? <Image src={menu.image_mobile_url} alt={menu.title} width={440} height={220} /> : <PackageOpen size={26} />}</div><div><span>{menu.category.replaceAll("_", " ")}</span><h2>{menu.title}</h2><p>{menu.description}</p><footer><strong>৳{menu.price.toFixed(2)}</strong><em>{menu.status}</em></footer></div></article>)}</section>}</main>{open && <div className="form-overlay"><form className="enterprise-form package-form" onSubmit={submit}><header><div><p className="eyebrow">NEW PACKAGE</p><h2>Create meal package</h2><span>Fields marked <b className="required-mark">*</b> are required.</span></div><button type="button" onClick={() => setOpen(false)}><X size={20} /></button></header><section><div className="field-grid"><label className="required">Package title<input name="title" required /></label><label className="required">Category<select name="category" required defaultValue="REGULAR_LUNCH"><option value="REGULAR_LUNCH">Regular lunch</option><option value="PREMIUM">Premium</option><option value="VEGETARIAN">Vegetarian</option></select></label><label className="wide required">Description<textarea name="description" rows={5} required /></label><label className="required">Price (BDT)<input name="price" type="number" min="0" step="0.01" required /></label><label className="required">Package image<input name="image" type="file" accept="image/png,image/jpeg,image/webp" required onChange={(event) => setImageFile(event.target.files?.[0] || null)} /></label><label className="wide required">Initial status<select name="status" defaultValue="DRAFT" required><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option></select></label></div></section>{error && <p className="form-error form-error-inline">{error.replaceAll("_", " ")}</p>}<footer><button type="button" className="cancel-button" onClick={() => setOpen(false)}>Cancel</button><button className="primary" disabled={saving}>{saving ? "Uploading & saving…" : "Create package"}</button></footer></form></div>}</div>;
}
