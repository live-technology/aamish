"use client";

import { Plus, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { Alert, Button, IconButton, SelectField, TextField } from "@/components/ui/primitives";
import { clientErrorMessage } from "@/lib/client-errors";
import type { EditableEnterprise, EnterpriseEditPayload } from "@/lib/enterprise-edit";
import { validateEnterpriseEdit } from "@/lib/enterprise-edit";
import { useModalDialog } from "@/lib/use-modal-dialog";
import styles from "./admin-experience.module.css";

export function EnterpriseEditor({ enterprise, onClose, onSaved }: { enterprise: EditableEnterprise; onClose: () => void; onSaved: () => Promise<void> }) {
  const [draft, setDraft] = useState<EnterpriseEditPayload>({ id: enterprise.id, name: enterprise.name, pocName: enterprise.poc_name, pocPhone: enterprise.poc_phone, pocEmail: enterprise.poc_email, status: enterprise.status, locations: enterprise.locations.map((item) => ({ id: item.id, name: item.name, code: item.code, address: item.address, isActive: item.is_active })) });
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [failure, setFailure] = useState<{ title: string; message: string; requestId?: string } | null>(null);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const dialogRef = useModalDialog<HTMLElement>(true, onClose, saving || resetting);

  function update<K extends keyof Omit<EnterpriseEditPayload, "locations" | "id">>(field: K, value: EnterpriseEditPayload[K]) { setDraft((current) => ({ ...current, [field]: value })); setFailure(null); }
  function updateLocation(index: number, field: "name" | "code" | "address" | "isActive", value: string | boolean) { setDraft((current) => ({ ...current, locations: current.locations.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) })); setFailure(null); }
  function addLocation() { setDraft((current) => ({ ...current, locations: [...current.locations, { name: "", code: "", address: "", isActive: true }] })); }
  function removeLocation(index: number) { if (draft.locations.length > 1) setDraft((current) => ({ ...current, locations: current.locations.filter((_, itemIndex) => itemIndex !== index) })); }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const invalid = validateEnterpriseEdit(draft);
    if (invalid) return setFailure({ title: "Enterprise not updated", message: clientErrorMessage(invalid, "Check every required field.") });
    setSaving(true); setFailure(null);
    try {
      const response = await fetch("/api/admin/enterprises", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return setFailure({ title: "Enterprise not updated", message: clientErrorMessage(data.error, "The enterprise could not be updated."), requestId: data.requestId });
      await onSaved(); onClose();
    } catch { setFailure({ title: "Enterprise not updated", message: "The enterprise could not be updated. Check your connection and try again." }); }
    finally { setSaving(false); }
  }

  async function resetPassword() {
    setResetting(true); setFailure(null); setResetNotice(null);
    try {
      const response = await fetch(`/api/admin/enterprises/${enterprise.id}/admin-password`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: temporaryPassword }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return setFailure({ title: "Password not reset", message: clientErrorMessage(data.error, "The temporary password could not be set."), requestId: data.requestId });
      setTemporaryPassword(""); setResetNotice(`Temporary password set for @${data.username}. They must replace it at their next sign-in.`);
    } catch { setFailure({ title: "Password not reset", message: "The temporary password could not be set. Check your connection and try again." }); }
    finally { setResetting(false); }
  }

  return <div className={styles.dialogBackdrop} style={{ zIndex: 80 }}><section ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="enterprise-edit-title" tabIndex={-1}>
    <header className={styles.dialogHeader}><div><p>Edit enterprise</p><h2 id="enterprise-edit-title">{enterprise.name}</h2><span>The URL slug and administrator username remain unchanged.</span></div><IconButton aria-label="Close enterprise editor" onClick={onClose} disabled={saving || resetting}><X size={19} /></IconButton></header>
    <form className={styles.dialogForm} onSubmit={submit}><div className={styles.dialogBody}>
      <div className={styles.fieldGrid}><TextField label="Enterprise name" name="editName" value={draft.name} onChange={(event) => update("name", event.target.value)} required /><SelectField label="Status" name="editStatus" value={draft.status} onChange={(event) => update("status", event.target.value)} required><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></SelectField><TextField label="Primary contact" name="editPocName" value={draft.pocName} onChange={(event) => update("pocName", event.target.value)} required /><TextField label="Contact phone" name="editPocPhone" value={draft.pocPhone} onChange={(event) => update("pocPhone", event.target.value)} required /><TextField className={styles.wideField} label="Contact email" name="editPocEmail" type="email" value={draft.pocEmail} onChange={(event) => update("pocEmail", event.target.value)} required /></div>
      <div className={styles.stepHeadingRow}><div className={styles.stepHeading}><span>Delivery locations</span><h3>Where meals are delivered</h3><p>Deactivate a location with history. Remove it only when it has never been used.</p></div><Button type="button" variant="secondary" size="small" onClick={addLocation}><Plus size={15} />Add location</Button></div>
      <div className={styles.locationList}>{draft.locations.map((location, index) => <article className={styles.locationCard} key={location.id || `new-${index}`}><header><strong>Location {index + 1}</strong><label className={styles.activeToggle}><input type="checkbox" checked={location.isActive} onChange={(event) => updateLocation(index, "isActive", event.target.checked)} />Active</label><IconButton type="button" aria-label={`Remove location ${index + 1}`} onClick={() => removeLocation(index)} disabled={draft.locations.length === 1}><Trash2 size={16} /></IconButton></header><div className={styles.locationFields}><TextField label="Name" name={`editLocationName${index}`} value={location.name} onChange={(event) => updateLocation(index, "name", event.target.value)} required /><TextField label="Code" name={`editLocationCode${index}`} value={location.code || "Assigned after save"} description="Assigned automatically" disabled /><TextField label="Address" name={`editLocationAddress${index}`} value={location.address} onChange={(event) => updateLocation(index, "address", event.target.value)} required /></div></article>)}</div>
      <section className={styles.locationCard} aria-labelledby="admin-password-reset-title"><div className={styles.stepHeading}><span>Administrator access</span><h3 id="admin-password-reset-title">Reset administrator password</h3><p>{enterprise.admin_username ? `Set a temporary password for @${enterprise.admin_username}.` : "Set a temporary password for this enterprise administrator."} They must replace it at their next sign-in.</p></div><div className={styles.fieldGrid} style={{ marginTop: 16, alignItems: "end" }}><TextField label="Temporary password" name="adminTemporaryPassword" type="password" minLength={8} value={temporaryPassword} onChange={(event) => { setTemporaryPassword(event.target.value); setResetNotice(null); }} /><Button type="button" variant="secondary" disabled={temporaryPassword.length < 8 || saving} loading={resetting} loadingLabel="Resetting…" onClick={() => void resetPassword()}>Reset password</Button></div>{resetNotice && <div style={{ marginTop: 12 }}><Alert tone="success" title="Password reset">{resetNotice}</Alert></div>}</section>
      {failure && <Alert tone="danger" title={failure.title}>{failure.message}{failure.requestId && <code>Request ID: {failure.requestId}</code>}</Alert>}
    </div><footer className={styles.dialogFooter}><Button type="button" variant="secondary" onClick={onClose} disabled={saving || resetting}>Cancel</Button><Button loading={saving} loadingLabel="Saving changes…" disabled={resetting}>Save changes</Button></footer></form>
  </section></div>;
}
