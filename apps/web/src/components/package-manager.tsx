"use client";

import Image from "next/image";
import { PackageOpen, Pencil, Plus, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { AdminNav } from "@/components/admin-nav";
import { clientErrorMessage, validateImage } from "@/lib/client-errors";

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
  const [menus, setMenus] = useState(initialMenus);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MenuPackage | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  function openCreate() { setEditing(null); setImageFile(null); setError(""); setOpen(true); }
  function openEdit(menu: MenuPackage) { setEditing(menu); setImageFile(null); setError(""); setOpen(true); }
  function closeForm() { setOpen(false); setEditing(null); setImageFile(null); setError(""); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      if (!editing && !imageFile) throw new Error("PACKAGE_IMAGE_REQUIRED");
      if (imageFile) { const imageError = validateImage(imageFile); if (imageError) throw new Error(imageError); }
      const form = new FormData(event.currentTarget);
      const imageUrl = imageFile ? await uploadMenuImage(imageFile) : null;
      const response = await fetch("/api/admin/menus", { method: editing ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...Object.fromEntries(form), id: editing?.id, imageUrl }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (editing) setMenus((current) => current.map((menu) => menu.id === editing.id ? data.menu : menu));
      else { const refreshed = await fetch("/api/admin/menus"); const refreshedData = await refreshed.json(); if (refreshed.ok) setMenus(refreshedData.menus); }
      closeForm();
    } catch (caught) {
      setError(clientErrorMessage(caught instanceof Error ? caught.message : editing ? "PACKAGE_UPDATE_FAILED" : "PACKAGE_CREATION_FAILED", editing ? "The package could not be updated." : "The package could not be created."));
    } finally { setSaving(false); }
  }

  return <div className="admin-portal"><AdminNav active="packages" /><main className="admin-main"><header className="admin-header"><div><p className="eyebrow">AAMISH ADMIN</p><h1>Meal packages</h1><span>Create and maintain reusable packages before publishing the menu calendar.</span></div><button className="primary" onClick={openCreate}><Plus size={17} /> New package</button></header>{menus.length === 0 ? <section className="empty-dashboard"><div className="empty-icon"><PackageOpen size={28} /></div><h2>No packages yet</h2><p>Create a package with its menu description, price, and publishing status.</p><button className="primary" onClick={openCreate}><Plus size={17} /> Create first package</button></section> : <section className="package-grid">{menus.map((menu) => <article className="package-card" key={menu.id}><div className="package-visual">{menu.image_mobile_url ? <Image src={menu.image_mobile_url} alt={menu.title} width={440} height={220} /> : <PackageOpen size={26} />}</div><div><span>{menu.category.replaceAll("_", " ")}</span><h2>{menu.title}</h2><p>{menu.description}</p><footer><strong>৳{menu.price.toFixed(2)}</strong><em>{menu.status}</em></footer><button className="package-edit-button" type="button" onClick={() => openEdit(menu)}><Pencil size={14} /> Edit package</button></div></article>)}</section>}</main>{open && <div className="form-overlay"><form className="enterprise-form package-form" onSubmit={submit}><header><div><p className="eyebrow">{editing ? "EDIT PACKAGE" : "NEW PACKAGE"}</p><h2>{editing ? "Update meal package" : "Create meal package"}</h2><span>Fields marked <b className="required-mark">*</b> are required.</span></div><button type="button" onClick={closeForm} aria-label="Close"><X size={20} /></button></header><section><div className="field-grid"><label className="required">Package title<input name="title" defaultValue={editing?.title} required /></label><label className="required">Category<select name="category" required defaultValue={editing?.category || "REGULAR_LUNCH"}><option value="REGULAR_LUNCH">Regular lunch</option><option value="PREMIUM">Premium</option><option value="VEGETARIAN">Vegetarian</option></select></label><label className="wide required">Description<textarea name="description" rows={5} defaultValue={editing?.description} required /></label><label className="required">Price (BDT)<input name="price" type="number" min="0" step="0.01" defaultValue={editing?.price} required /></label><label className={editing ? "" : "required"}>Package image <small>{editing ? "Optional · choose only to replace" : "JPG, PNG, or WebP · max 8 MB"}</small><input name="image" type="file" accept="image/png,image/jpeg,image/webp" required={!editing} onChange={(event) => setImageFile(event.target.files?.[0] || null)} /></label><label className="wide required">Status<select name="status" defaultValue={editing?.status || "DRAFT"} required><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option></select></label></div></section>{error && <p className="form-error form-error-inline">{error}</p>}<footer><button type="button" className="cancel-button" onClick={closeForm}>Cancel</button><button className="primary" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create package"}</button></footer></form></div>}</div>;
}
