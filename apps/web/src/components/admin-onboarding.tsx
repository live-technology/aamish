"use client";

import { Building2, Check, ChevronLeft, ChevronRight, Copy, MapPin, Plus, Trash2, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { Alert, Button, EmptyState, IconButton, PageHeader, StatusBadge, TextField } from "@/components/ui/primitives";
import { clientErrorMessage } from "@/lib/client-errors";
import {
  emptyEnterpriseDraft,
  enterpriseSteps,
  suggestEnterpriseAdminUsername,
  type EnterpriseDraft,
  validateEnterpriseStep,
} from "@/lib/enterprise-onboarding";
import { superAdminNavigation } from "@/lib/super-admin-navigation";
import { useModalDialog } from "@/lib/use-modal-dialog";
import styles from "./admin-experience.module.css";

export type Enterprise = {
  id: string;
  name: string;
  slug: string;
  status: string;
  poc_name: string;
  poc_email: string;
  location_count: number;
  admin_count: number;
};

type RequestFailure = { message: string; requestId?: string };
type CreatedEnterprise = { enterpriseId: string; enterpriseAdminUsername: string };

export function AdminOnboarding({ fullName, initialEnterprises, startOpen = false }: { fullName: string; initialEnterprises: Enterprise[]; startOpen?: boolean }) {
  const [enterprises, setEnterprises] = useState(initialEnterprises);
  const [open, setOpen] = useState(startOpen);
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<EnterpriseDraft>(emptyEnterpriseDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<RequestFailure | null>(null);
  const [created, setCreated] = useState<CreatedEnterprise | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameEdited, setUsernameEdited] = useState(false);
  const currentStep = enterpriseSteps[stepIndex];

  const dialogRef = useModalDialog<HTMLElement>(open, closeDialog, saving);

  function openDialog() {
    setOpen(true);
    setStepIndex(0);
    setDraft(emptyEnterpriseDraft());
    setErrors({});
    setFailure(null);
    setCreated(null);
    setUsernameEdited(false);
  }

  function closeDialog() {
    setOpen(false);
    setCreated(null);
    setFailure(null);
  }

  function update<K extends keyof EnterpriseDraft>(field: K, value: EnterpriseDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => { const next = { ...current }; delete next[field]; return next; });
  }

  function updateName(name: string) {
    setDraft((current) => ({ ...current, name, adminUsername: usernameEdited ? current.adminUsername : suggestEnterpriseAdminUsername(name) }));
    setErrors((current) => { const next = { ...current }; delete next.name; return next; });
  }

  function updateLocation(index: number, field: "name" | "code" | "address", value: string) {
    setDraft((current) => ({ ...current, locations: current.locations.map((location, itemIndex) => itemIndex === index ? { ...location, [field]: value } : location) }));
    setErrors((current) => { const next = { ...current }; delete next[`location-${index}-${field}`]; return next; });
  }

  function addLocation() {
    setDraft((current) => ({ ...current, locations: [...current.locations, { name: "", code: "", address: "" }] }));
  }

  function removeLocation(index: number) {
    setDraft((current) => current.locations.length === 1 ? current : ({ ...current, locations: current.locations.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function advance() {
    const validation = validateEnterpriseStep(currentStep.id, draft);
    setErrors(validation);
    if (Object.keys(validation).length === 0) setStepIndex((current) => Math.min(current + 1, enterpriseSteps.length - 1));
  }

  async function loadEnterprises() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/enterprises");
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFailure({ message: clientErrorMessage(data.error, "The organizations could not be refreshed."), requestId: data.requestId });
        return;
      }
      setEnterprises(data.enterprises);
    } catch {
      setFailure({ message: "The organizations could not be refreshed. Check your connection and try again." });
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (currentStep.id !== "review") { advance(); return; }
    const validation = validateEnterpriseStep("review", draft);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      const invalidStep = enterpriseSteps.findIndex(({ id }) => id !== "review" && Object.keys(validateEnterpriseStep(id, draft)).length > 0);
      setStepIndex(invalidStep < 0 ? 0 : invalidStep);
      return;
    }

    setSaving(true);
    setFailure(null);
    try {
      const response = await fetch("/api/admin/enterprises", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          pocName: draft.pocName,
          pocPhone: draft.pocPhone,
          pocEmail: draft.pocEmail,
          locations: draft.locations,
          admin: { fullName: draft.adminFullName, username: draft.adminUsername, password: draft.adminPassword },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFailure({ message: clientErrorMessage(data.error, "The enterprise could not be created."), requestId: data.requestId });
        return;
      }
      setCreated({ enterpriseId: data.enterpriseId, enterpriseAdminUsername: data.enterpriseAdminUsername });
      setDraft((current) => ({ ...current, adminPassword: "" }));
      await loadEnterprises();
    } catch {
      setFailure({ message: "The enterprise could not be created. Check your connection and try again." });
    } finally {
      setSaving(false);
    }
  }

  async function copyUsername() {
    if (created) await navigator.clipboard.writeText(created.enterpriseAdminUsername);
  }

  return <AppShell workspace="Aamish operations" fullName={fullName} roleLabel="Aamish administrator" currentPath="/admin/organizations" navigation={superAdminNavigation}>
    <PageHeader eyebrow="Organization setup" title="Organizations" description="Manage enterprise access, delivery locations, and the first administrator for each client." actions={<Button onClick={openDialog}><Plus size={17} aria-hidden="true" />Add enterprise</Button>} />

    {failure && !open && <div className={styles.pageAlert}><Alert tone="danger" title="Organizations could not be loaded">{failure.message}{failure.requestId && <code>Request ID: {failure.requestId}</code>}</Alert></div>}

    {enterprises.length === 0 ? <EmptyState icon={<Building2 size={25} aria-hidden="true" />} title="No enterprises yet" description="Create the first enterprise with at least one delivery location and an administrator login." action={<Button onClick={openDialog}><Plus size={17} aria-hidden="true" />Add first enterprise</Button>} /> : <>
      <section className={styles.organizationSummary} aria-label="Organization totals">
        <Summary value={enterprises.length} label="Active enterprises" />
        <Summary value={enterprises.reduce((total, item) => total + item.location_count, 0)} label="Delivery locations" />
        <Summary value={enterprises.reduce((total, item) => total + item.admin_count, 0)} label="Enterprise administrators" />
      </section>
      <section className={styles.organizationTable} aria-label="Organizations">
        <div className={styles.organizationHead}><span>Organization</span><span>Primary contact</span><span>Locations</span><span>Administrators</span><span>Status</span></div>
        {enterprises.map((enterprise) => <article className={styles.organizationRow} key={enterprise.id}><div><strong>{enterprise.name}</strong><small>/{enterprise.slug}</small></div><div><strong>{enterprise.poc_name}</strong><small>{enterprise.poc_email}</small></div><span>{enterprise.location_count}</span><span>{enterprise.admin_count}</span><StatusBadge tone={enterprise.status === "ACTIVE" ? "success" : "neutral"}>{enterprise.status}</StatusBadge></article>)}
      </section>
    </>}

    {open && <div className={styles.dialogBackdrop} style={{ zIndex: 80 }}><section ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="enterprise-dialog-title" tabIndex={-1}>
      <header className={styles.dialogHeader}><div><p>New enterprise</p><h2 id="enterprise-dialog-title">Set up an enterprise</h2><span>Required fields are marked with <b>*</b>.</span></div><IconButton type="button" aria-label="Close enterprise setup" onClick={closeDialog} disabled={saving}><X size={19} /></IconButton></header>

      {created ? <SuccessHandoff created={created} copyUsername={copyUsername} close={closeDialog} /> : <form className={styles.dialogForm} onSubmit={submit}>
        <ol className={styles.stepper} aria-label="Enterprise setup progress">{enterpriseSteps.map((step, index) => <li className={index === stepIndex ? styles.stepActive : index < stepIndex ? styles.stepComplete : ""} aria-current={index === stepIndex ? "step" : undefined} key={step.id}><span>{index < stepIndex ? <Check size={14} /> : index + 1}</span><b>{step.label}</b></li>)}</ol>
        <div className={styles.dialogBody}>{currentStep.id === "company" ? <CompanyStep draft={draft} errors={errors} update={update} updateName={updateName} /> : currentStep.id === "locations" ? <LocationsStep draft={draft} errors={errors} updateLocation={updateLocation} addLocation={addLocation} removeLocation={removeLocation} /> : currentStep.id === "administrator" ? <AdministratorStep draft={draft} errors={errors} update={update} setUsernameEdited={setUsernameEdited} /> : <ReviewStep draft={draft} />}{failure && <Alert tone="danger" title="Enterprise was not created">{failure.message}{failure.requestId && <code>Request ID: {failure.requestId}</code>}</Alert>}</div>
        <footer className={styles.dialogFooter}><Button type="button" variant="secondary" onClick={stepIndex === 0 ? closeDialog : () => { setFailure(null); setStepIndex((current) => current - 1); }} disabled={saving}>{stepIndex === 0 ? "Cancel" : <><ChevronLeft size={16} />Back</>}</Button><Button type="submit" loading={saving} loadingLabel="Creating enterprise…">{currentStep.id === "review" ? "Create enterprise" : <>Continue<ChevronRight size={16} /></>}</Button></footer>
      </form>}
    </section></div>}
    {loading && <span className="sr-only" role="status">Refreshing organizations…</span>}
  </AppShell>;
}

export function CompanyStep({ draft, errors, update, updateName }: { draft: EnterpriseDraft; errors: Record<string, string>; update: <K extends keyof EnterpriseDraft>(field: K, value: EnterpriseDraft[K]) => void; updateName: (name: string) => void }) {
  return <section className={styles.stepContent}><div className={styles.stepHeading}><span>1 of 4</span><h3>Company details</h3><p>Who should Aamish contact about this enterprise?</p></div><div className={styles.fieldGrid}><TextField autoFocus label="Enterprise name" name="name" value={draft.name} onChange={(event) => updateName(event.target.value)} placeholder="e.g. Live Technologies" error={errors.name} required /><TextField label="Primary contact" name="pocName" value={draft.pocName} onChange={(event) => update("pocName", event.target.value)} placeholder="Full name" error={errors.pocName} required /><TextField label="Contact phone" name="pocPhone" value={draft.pocPhone} onChange={(event) => update("pocPhone", event.target.value)} placeholder="+880…" error={errors.pocPhone} required /><TextField label="Contact email" name="pocEmail" type="email" value={draft.pocEmail} onChange={(event) => update("pocEmail", event.target.value)} placeholder="admin@company.com" error={errors.pocEmail} required /></div><p className={styles.generatedNote}>The enterprise URL is generated automatically from its name.</p></section>;
}

function LocationsStep({ draft, errors, updateLocation, addLocation, removeLocation }: { draft: EnterpriseDraft; errors: Record<string, string>; updateLocation: (index: number, field: "name" | "code" | "address", value: string) => void; addLocation: () => void; removeLocation: (index: number) => void }) {
  return <section className={styles.stepContent}><div className={styles.stepHeadingRow}><div className={styles.stepHeading}><span>2 of 4</span><h3>Delivery locations</h3><p>At least one destination is required. Add as many offices or branches as needed.</p></div><Button type="button" variant="secondary" onClick={addLocation}><Plus size={16} />Add location</Button></div><div className={styles.locationList}>{draft.locations.map((location, index) => <article className={styles.locationCard} key={index}><header><span><MapPin size={17} /></span><strong>Location {index + 1}</strong><IconButton type="button" aria-label={`Remove location ${index + 1}`} disabled={draft.locations.length === 1} onClick={() => removeLocation(index)}><Trash2 size={16} /></IconButton></header><div className={styles.locationFields}><TextField label="Location name" name={`location-${index}-name`} value={location.name} onChange={(event) => updateLocation(index, "name", event.target.value)} placeholder="Office or branch" error={errors[`location-${index}-name`]} required /><TextField label="Code" name={`location-${index}-code`} value={location.code} onChange={(event) => updateLocation(index, "code", event.target.value)} placeholder="NB-01" error={errors[`location-${index}-code`]} required /><TextField label="Delivery address" name={`location-${index}-address`} value={location.address} onChange={(event) => updateLocation(index, "address", event.target.value)} placeholder="Full delivery address" error={errors[`location-${index}-address`]} required /></div></article>)}</div></section>;
}

function AdministratorStep({ draft, errors, update, setUsernameEdited }: { draft: EnterpriseDraft; errors: Record<string, string>; update: <K extends keyof EnterpriseDraft>(field: K, value: EnterpriseDraft[K]) => void; setUsernameEdited: (value: boolean) => void }) {
  return <section className={styles.stepContent}><div className={styles.stepHeading}><span>3 of 4</span><h3>First administrator</h3><p>Create the person who will manage employees and view meal activity for this enterprise.</p></div><div className={styles.fieldGrid}><TextField autoFocus label="Administrator name" name="adminFullName" value={draft.adminFullName} onChange={(event) => update("adminFullName", event.target.value)} placeholder="Full name" error={errors.adminFullName} required /><TextField label="Username" name="adminUsername" value={draft.adminUsername} onChange={(event) => { setUsernameEdited(true); update("adminUsername", event.target.value); }} description="Suggested from the enterprise name; edit if needed." error={errors.adminUsername} required /><TextField className={styles.wideField} label="Temporary password" name="adminPassword" type="password" autoComplete="new-password" value={draft.adminPassword} onChange={(event) => update("adminPassword", event.target.value)} description="Share it securely. Aamish will not display it after creation." error={errors.adminPassword} required /></div></section>;
}

function ReviewStep({ draft }: { draft: EnterpriseDraft }) {
  return <section className={styles.stepContent}><div className={styles.stepHeading}><span>4 of 4</span><h3>Review and create</h3><p>Confirm the enterprise, delivery locations, and first administrator.</p></div><div className={styles.reviewGrid}><ReviewCard title="Company"><strong>{draft.name}</strong><span>{draft.pocName}</span><span>{draft.pocPhone} · {draft.pocEmail}</span></ReviewCard><ReviewCard title={`Delivery locations · ${draft.locations.length}`}>{draft.locations.map((location) => <div className={styles.reviewLocation} key={location.code}><strong>{location.name} · {location.code}</strong><span>{location.address}</span></div>)}</ReviewCard><ReviewCard title="First administrator"><strong>{draft.adminFullName}</strong><span>@{draft.adminUsername}</span><span>Temporary password ready to share securely</span></ReviewCard></div><Alert tone="info" title="Creation is atomic">The enterprise, locations, and administrator are saved together. If one part fails, none of them are created.</Alert></section>;
}

function ReviewCard({ title, children }: { title: string; children: React.ReactNode }) { return <article className={styles.reviewCard}><p>{title}</p>{children}</article>; }
export function SuccessHandoff({ created, copyUsername, close }: { created: CreatedEnterprise; copyUsername: () => void; close: () => void }) { return <div className={styles.successState}><span><Check size={27} /></span><h3>Enterprise created</h3><p>The organization, its delivery locations, and first administrator are ready.</p><div className={styles.credentialHandoff}><small>Administrator username</small><strong>{created.enterpriseAdminUsername}</strong><Button type="button" variant="secondary" onClick={copyUsername}><Copy size={16} />Copy username</Button></div><Alert tone="warning" title="Share the password securely">For safety, the temporary password is not displayed again. Send the username and the password you created through a secure channel.</Alert><Button type="button" onClick={close}>Done</Button></div>; }
function Summary({ value, label }: { value: number; label: string }) { return <article><strong>{value}</strong><span>{label}</span></article>; }
