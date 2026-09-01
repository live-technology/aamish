"use client";

import Image from "next/image";
import Link from "next/link";
import { ImagePlus, PackageOpen, Pencil, Plus, Search, UploadCloud, X } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { Alert, Button, EmptyState, IconButton, PageHeader, SelectField, StatusBadge, TextAreaField, TextField } from "@/components/ui/primitives";
import { clientErrorMessage, validateImage } from "@/lib/client-errors";
import { superAdminNavigation } from "@/lib/super-admin-navigation";
import { useModalDialog } from "@/lib/use-modal-dialog";
import styles from "./menu-library.module.css";

export type MenuPackage = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  status: string;
  image_mobile_url: string | null;
};

type MenuDraft = { title: string; description: string; category: string; price: string; status: string };
type RequestFailure = { message: string; requestId?: string };
type SaveStage = "idle" | "uploading" | "saving";

class MenuActionError extends Error {
  requestId?: string;
  constructor(code: string, requestId?: string) { super(code); this.requestId = requestId; }
}

const emptyDraft = (): MenuDraft => ({ title: "", description: "", category: "REGULAR_LUNCH", price: "", status: "DRAFT" });

async function uploadMenuImage(file: File) {
  const signatureResponse = await fetch("/api/uploads/signature", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "menu" }) });
  const signed = await signatureResponse.json().catch(() => ({}));
  if (!signatureResponse.ok) throw new MenuActionError(signed.error || "UPLOAD_FAILED", signed.requestId);
  const form = new FormData();
  form.set("file", file);
  form.set("api_key", signed.apiKey);
  form.set("timestamp", String(signed.timestamp));
  form.set("signature", signed.signature);
  form.set("folder", signed.folder);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, { method: "POST", body: form });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new MenuActionError(data.error?.message || "IMAGE_UPLOAD_FAILED", signed.requestId);
  return data.secure_url as string;
}

export function PackageManager({ fullName, initialMenus }: { fullName: string; initialMenus: MenuPackage[] }) {
  const [menus, setMenus] = useState(initialMenus);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MenuPackage | null>(null);
  const [draft, setDraft] = useState<MenuDraft>(emptyDraft);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [failure, setFailure] = useState<RequestFailure | null>(null);
  const [notice, setNotice] = useState("");
  const [stage, setStage] = useState<SaveStage>("idle");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const visibleMenus = useMemo(() => menus.filter((menu) => {
    const matchesStatus = statusFilter === "ALL" || menu.status === statusFilter;
    const search = query.trim().toLowerCase();
    return matchesStatus && (!search || `${menu.title} ${menu.description} ${menu.category}`.toLowerCase().includes(search));
  }), [menus, query, statusFilter]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  const dialogRef = useModalDialog<HTMLElement>(open, closeForm, stage !== "idle");

  function resetPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setImageFile(null);
  }

  function openCreate() {
    resetPreview();
    setEditing(null);
    setDraft(emptyDraft());
    setFailure(null);
    setNotice("");
    setOpen(true);
  }

  function openEdit(menu: MenuPackage) {
    resetPreview();
    setEditing(menu);
    setDraft({ title: menu.title, description: menu.description, category: menu.category, price: String(menu.price), status: menu.status });
    setFailure(null);
    setNotice("");
    setOpen(true);
  }

  function closeForm() {
    if (stage !== "idle") return;
    setOpen(false);
    setEditing(null);
    setFailure(null);
    resetPreview();
  }

  function update(field: keyof MenuDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setFailure(null);
  }

  function chooseImage(file: File | null) {
    resetPreview();
    if (!file) return;
    const error = validateImage(file);
    if (error) { setFailure({ message: error }); return; }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFailure(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailure(null);
    if (!editing && !imageFile) { setFailure({ message: clientErrorMessage("PACKAGE_IMAGE_REQUIRED") }); return; }
    if (imageFile) {
      const imageError = validateImage(imageFile);
      if (imageError) { setFailure({ message: imageError }); return; }
    }

    try {
      let imageUrl: string | null = null;
      if (imageFile) { setStage("uploading"); imageUrl = await uploadMenuImage(imageFile); }
      setStage("saving");
      const response = await fetch("/api/admin/menus", {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...draft, id: editing?.id, imageUrl }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new MenuActionError(data.error || (editing ? "PACKAGE_UPDATE_FAILED" : "PACKAGE_CREATION_FAILED"), data.requestId);
      if (editing) setMenus((current) => current.map((menu) => menu.id === editing.id ? data.menu : menu));
      else setMenus((current) => [data.menu, ...current]);
      setNotice(editing ? `${data.menu.title} was updated.` : `${data.menu.title} was added to the menu library.`);
      setOpen(false);
      setEditing(null);
      resetPreview();
    } catch (caught) {
      const error = caught instanceof MenuActionError ? caught : new MenuActionError(caught instanceof Error ? caught.message : "PACKAGE_CREATION_FAILED");
      setFailure({ message: clientErrorMessage(error.message, editing ? "The menu could not be updated." : "The menu could not be created."), requestId: error.requestId });
    } finally {
      setStage("idle");
    }
  }

  const activeCount = menus.filter((menu) => menu.status === "ACTIVE").length;
  const draftCount = menus.filter((menu) => menu.status === "DRAFT").length;

  return <AppShell workspace="Aamish operations" fullName={fullName} roleLabel="Aamish administrator" currentPath="/admin/menus" navigation={superAdminNavigation}>
    <PageHeader eyebrow="Reusable menus" title="Menu library" description="Create and maintain the packages that can be published in the service calendar." actions={<Button onClick={openCreate}><Plus size={17} aria-hidden="true" />New menu</Button>} />

    {notice && <div className={styles.notice}><Alert tone="success" title="Menu saved">{notice}</Alert></div>}
    <section className={styles.summary} aria-label="Menu library totals"><Summary value={menus.length} label="Total menus" /><Summary value={activeCount} label="Active and schedulable" /><Summary value={draftCount} label="Drafts needing review" /></section>

    {menus.length === 0 ? <EmptyState icon={<PackageOpen size={25} aria-hidden="true" />} title="No menus yet" description="Create the first reusable menu with its description, price, image, and publishing status." action={<Button onClick={openCreate}><Plus size={17} aria-hidden="true" />Create first menu</Button>} /> : <>
      <div className={styles.toolbar}><label className={styles.search}><Search size={16} aria-hidden="true" /><span className="sr-only">Search menus</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search menus" /></label><label className={styles.filter}><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">All menus</option><option value="ACTIVE">Active</option><option value="DRAFT">Draft</option></select></label><Link href="/admin/calendar">Open service calendar</Link></div>
      {visibleMenus.length === 0 ? <EmptyState title="No menus match" description="Change the search or status filter to see other menus." /> : <section className={styles.grid} aria-label="Menu packages">{visibleMenus.map((menu) => <MenuCard menu={menu} edit={() => openEdit(menu)} key={menu.id} />)}</section>}
    </>}

    {open && <div className={styles.backdrop}><section ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="menu-dialog-title" tabIndex={-1}>
      <header><div><p>{editing ? "Edit menu" : "New menu"}</p><h2 id="menu-dialog-title">{editing ? "Update menu package" : "Create menu package"}</h2><span>Required fields are marked with <b>*</b>.</span></div><IconButton type="button" aria-label="Close menu form" onClick={closeForm} disabled={stage !== "idle"}><X size={19} /></IconButton></header>
      <form onSubmit={submit}><div className={styles.formBody}><div className={styles.formGrid}><TextField autoFocus label="Menu title" name="title" value={draft.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. Homestyle lunch" required /><SelectField label="Category" name="category" value={draft.category} onChange={(event) => update("category", event.target.value)} required><option value="REGULAR_LUNCH">Regular lunch</option><option value="PREMIUM">Premium</option><option value="VEGETARIAN">Vegetarian</option></SelectField><TextAreaField className={styles.wide} label="Description" name="description" value={draft.description} onChange={(event) => update("description", event.target.value)} placeholder="What is included in this menu?" rows={5} required /><TextField label="Price (BDT)" name="price" type="number" inputMode="decimal" min="0" step="0.01" value={draft.price} onChange={(event) => update("price", event.target.value)} placeholder="0.00" required /><SelectField label="Status" name="status" value={draft.status} onChange={(event) => update("status", event.target.value)} description="Only active menus can be scheduled." required><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option></SelectField></div><MenuImageField editing={editing} previewUrl={previewUrl} imageFile={imageFile} chooseImage={chooseImage} />{failure && <Alert tone="danger" title={editing ? "Menu was not updated" : "Menu was not created"}>{failure.message}{failure.requestId && <code>Request ID: {failure.requestId}</code>}</Alert>}</div><footer><Button type="button" variant="secondary" onClick={closeForm} disabled={stage !== "idle"}>Cancel</Button><Button type="submit" loading={stage !== "idle"} loadingLabel={stage === "uploading" ? "Uploading image…" : "Saving menu…"}>{editing ? "Save changes" : "Create menu"}</Button></footer></form>
    </section></div>}
  </AppShell>;
}

export function MenuCard({ menu, edit }: { menu: MenuPackage; edit: () => void }) {
  return <article className={styles.card}><div className={styles.visual}>{menu.image_mobile_url ? <Image src={menu.image_mobile_url} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" /> : <PackageOpen size={28} aria-hidden="true" />}</div><div className={styles.cardBody}><div className={styles.cardMeta}><span>{menu.category.replaceAll("_", " ")}</span><StatusBadge tone={menu.status === "ACTIVE" ? "success" : "neutral"}>{menu.status}</StatusBadge></div><h2>{menu.title}</h2><p>{menu.description}</p><footer><strong>৳{menu.price.toFixed(2)}</strong><Button type="button" variant="secondary" size="small" onClick={edit} aria-label={`Edit ${menu.title}`}><Pencil size={14} aria-hidden="true" />Edit</Button></footer></div></article>;
}

export function MenuImageField({ editing, previewUrl, imageFile, chooseImage }: { editing: MenuPackage | null; previewUrl: string; imageFile: File | null; chooseImage: (file: File | null) => void }) {
  const imageUrl = previewUrl || editing?.image_mobile_url || "";
  return <section className={styles.imageField}><div><span className={styles.imageLabel}>Menu image{!editing && <b aria-hidden="true"> *</b>}</span><p>{editing ? "Choose a file only when replacing the current image." : "JPG, PNG, or WebP · maximum 8 MB."}</p></div><div className={styles.imageControl}><div className={styles.imagePreview}>{imageUrl ? <Image src={imageUrl} alt={imageFile ? "New menu image preview" : `${editing?.title || "Menu"} current image`} fill unoptimized={imageUrl.startsWith("blob:")} sizes="220px" /> : <ImagePlus size={25} aria-hidden="true" />}</div><label><UploadCloud size={17} aria-hidden="true" /><span>{imageFile ? imageFile.name : editing ? "Replace image" : "Choose image"}</span><input name="image" type="file" accept="image/png,image/jpeg,image/webp" required={!editing} onChange={(event) => chooseImage(event.target.files?.[0] || null)} /></label></div></section>;
}

function Summary({ value, label }: { value: number; label: string }) { return <article><strong>{value}</strong><span>{label}</span></article>; }
