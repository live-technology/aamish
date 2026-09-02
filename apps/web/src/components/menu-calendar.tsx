"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import { type FormEvent, useMemo, useState, type ReactNode } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { Alert, Button, EmptyState, IconButton, PageHeader, SelectField, StatusBadge, TextField } from "@/components/ui/primitives";
import type { MenuPackage } from "@/components/package-manager";
import { clientErrorMessage } from "@/lib/client-errors";
import { cutoffIsoForDate } from "@/lib/platform-cutoff";
import { superAdminNavigation } from "@/lib/super-admin-navigation";
import { useModalDialog } from "@/lib/use-modal-dialog";
import styles from "./service-calendar.module.css";

export type EnterpriseChoice = { id: string; name: string; active_employee_count: number };
export type Schedule = { id: string; schedule_date: string; cutoff_time: string; status: string; enterprise_name: string; options: { label: string; title: string }[] };
type Draft = { enterpriseId: string; scheduleDate: string; menuIds: string[] };
type Failure = { message: string; requestId?: string };

const emptyDraft = (): Draft => ({ enterpriseId: "", scheduleDate: "", menuIds: [""] });

export function scheduleStepError(step: number, draft: Draft) {
  if (step === 1 && (!draft.enterpriseId || !draft.scheduleDate)) return "Complete the organization and service date.";
  if (step === 2 && draft.menuIds.some((id) => !id)) return "Choose a menu for every option.";
  if (step === 2 && new Set(draft.menuIds).size !== draft.menuIds.length) return clientErrorMessage("DUPLICATE_PACKAGE_OPTION");
  return "";
}

export function MenuCalendar({ fullName, enterprises, menus, initialSchedules, platformCutoffTime }: { fullName: string; enterprises: EnterpriseChoice[]; menus: MenuPackage[]; initialSchedules: Schedule[]; platformCutoffTime: string }) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [notice, setNotice] = useState("");
  const [scope, setScope] = useState<"UPCOMING" | "PAST">("UPCOMING");
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [listFailure, setListFailure] = useState<Failure | null>(null);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const ready = enterprises.length > 0 && menus.length > 0;
  const selectedEnterprise = enterprises.find((enterprise) => enterprise.id === draft.enterpriseId);
  const selectedMenus = draft.menuIds.map((id) => menus.find((menu) => menu.id === id)).filter(Boolean) as MenuPackage[];
  const upcoming = useMemo(() => schedules.filter((schedule) => schedule.schedule_date >= today), [schedules, today]);
  const past = useMemo(() => schedules.filter((schedule) => schedule.schedule_date < today), [schedules, today]);
  const visibleSchedules = scope === "UPCOMING" ? upcoming : past;
  const dialogRef = useModalDialog<HTMLElement>(open, close, saving);

  function startPublish() { setDraft(emptyDraft()); setStep(1); setFailure(null); setNotice(""); setOpen(true); }
  function close() { if (!saving) setOpen(false); }
  function next() { const message = scheduleStepError(step, draft); if (message) return setFailure({ message }); setFailure(null); setStep((current) => Math.min(3, current + 1)); }
  function update(field: "enterpriseId" | "scheduleDate", value: string) { setDraft((current) => ({ ...current, [field]: value })); setFailure(null); }
  function updateMenu(index: number, menuId: string) { setDraft((current) => ({ ...current, menuIds: current.menuIds.map((value, itemIndex) => itemIndex === index ? menuId : value) })); setFailure(null); }
  function addOption() { setDraft((current) => ({ ...current, menuIds: [...current.menuIds, ""] })); }
  function removeOption(index: number) { setDraft((current) => ({ ...current, menuIds: current.menuIds.filter((_, itemIndex) => itemIndex !== index) })); }

  async function reload() {
    const response = await fetch("/api/admin/schedules");
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw { code: data.error || "SCHEDULE_LIST_FAILED", requestId: data.requestId };
    setSchedules(data.schedules);
  }

  async function cancelSchedule(schedule: Schedule) {
    if (!window.confirm(`Cancel the ${formatDate(schedule.schedule_date)} service for ${schedule.enterprise_name}? Employees will no longer be able to change their choice, and this cannot be undone.`)) return;
    setCancellingId(schedule.id); setListFailure(null);
    try {
      const response = await fetch(`/api/admin/schedules/${schedule.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw { code: data.error, requestId: data.requestId };
      setSchedules((current) => current.map((item) => (item.id === schedule.id ? { ...item, status: "CANCELLED" } : item)));
      setNotice(`The ${formatDate(schedule.schedule_date)} service for ${schedule.enterprise_name} was cancelled.`);
    } catch (caught) {
      const error = caught as { code?: string; requestId?: string };
      setListFailure({ message: clientErrorMessage(error.code || "SCHEDULE_CANCEL_FAILED", "The service could not be cancelled."), requestId: error.requestId });
    } finally { setCancellingId(null); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = scheduleStepError(2, draft);
    if (message) return setFailure({ message });
    setSaving(true); setFailure(null);
    try {
      const response = await fetch("/api/admin/schedules", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw { code: data.error || "SCHEDULE_PUBLISH_FAILED", requestId: data.requestId };
      await reload();
      setOpen(false); setScope("UPCOMING");
      setNotice(`${selectedEnterprise?.name || "The organization"} is scheduled for ${formatDate(draft.scheduleDate)}.`);
    } catch (caught) {
      const error = caught as { code?: string; requestId?: string };
      setFailure({ message: clientErrorMessage(error.code || "SCHEDULE_PUBLISH_FAILED", "The service could not be published."), requestId: error.requestId });
    } finally { setSaving(false); }
  }

  return <AppShell workspace="Aamish operations" fullName={fullName} roleLabel="Aamish administrator" currentPath="/admin/calendar" navigation={superAdminNavigation}>
    <PageHeader eyebrow="Published meal service" title="Service calendar" description="Plan what each organization will receive, when choices close, and which menus employees can choose." actions={<Button onClick={startPublish} disabled={!ready}><Plus size={17} aria-hidden="true" />Schedule service</Button>} />
    {notice && <div className={styles.notice}><Alert tone="success" title="Service updated">{notice}</Alert></div>}
    {listFailure && <div className={styles.notice}><Alert tone="danger" title="Action failed">{listFailure.message}{listFailure.requestId && <code>Request ID: {listFailure.requestId}</code>}</Alert></div>}
    <section className={styles.summary} aria-label="Service calendar totals"><Summary value={upcoming.length} label="Upcoming services" icon={<CalendarDays />} /><Summary value={schedules.filter((item) => item.schedule_date === today).length} label="Serving today" icon={<Clock3 />} /><Summary value={past.length} label="Past services" icon={<Check />} /></section>

    {!ready ? <PrerequisiteState enterprises={enterprises} /> : schedules.length === 0 ? <EmptyState icon={<CalendarDays size={25} aria-hidden="true" />} title="No service scheduled" description="Publish the first meal service after choosing an organization, service date, and at least one active menu. The platform cutoff is applied automatically." action={<Button onClick={startPublish}><Plus size={17} aria-hidden="true" />Schedule first service</Button>} /> : <>
      <div className={styles.tabs} role="group" aria-label="Service period"><button type="button" className={scope === "UPCOMING" ? styles.activeTab : ""} onClick={() => setScope("UPCOMING")}>Upcoming <span>{upcoming.length}</span></button><button type="button" className={scope === "PAST" ? styles.activeTab : ""} onClick={() => setScope("PAST")}>Past <span>{past.length}</span></button></div>
      {visibleSchedules.length === 0 ? <EmptyState title={scope === "UPCOMING" ? "No upcoming service" : "No past service"} description={scope === "UPCOMING" ? "Schedule the next service when its menus and organization are ready." : "Completed meal services will appear here."} /> : <section className={styles.timeline} aria-label={`${scope.toLowerCase()} services`}>{visibleSchedules.map((schedule) => <ScheduleCard schedule={schedule} today={today} onEdit={() => setEditingSchedule(schedule)} onCancel={() => cancelSchedule(schedule)} cancelling={cancellingId === schedule.id} key={schedule.id} />)}</section>}
    </>}

    {editingSchedule && <ScheduleCutoffEditor schedule={editingSchedule} onClose={() => setEditingSchedule(null)} onSaved={async (cutoffTime) => { setSchedules((current) => current.map((item) => (item.id === editingSchedule.id ? { ...item, cutoff_time: cutoffIsoForDate(item.schedule_date, cutoffTime) } : item))); setNotice(`Choices for ${editingSchedule.enterprise_name} on ${formatDate(editingSchedule.schedule_date)} now close at ${cutoffTime}.`); }} />}

    {open && <div className={styles.backdrop}><section ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="schedule-dialog-title" tabIndex={-1}>
      <header><div><p>Schedule service · Step {step} of 3</p><h2 id="schedule-dialog-title">{step === 1 ? "When and where?" : step === 2 ? "Choose employee options" : "Review before publishing"}</h2><span>{step < 3 ? <>Required fields are marked with <b>*</b>.</> : "Publishing creates default meal reservations for active employees."}</span></div><IconButton type="button" aria-label="Close schedule form" onClick={close} disabled={saving}><X size={19} /></IconButton></header>
      <ol className={styles.steps} aria-label="Publish progress"><li className={step >= 1 ? styles.currentStep : ""}>1 <span>Service</span></li><li className={step >= 2 ? styles.currentStep : ""}>2 <span>Options</span></li><li className={step >= 3 ? styles.currentStep : ""}>3 <span>Review</span></li></ol>
      <form onSubmit={submit}><div className={styles.formBody}>
        {step === 1 && <div className={styles.formGrid}><SelectField label="Organization" name="enterpriseId" value={draft.enterpriseId} onChange={(event) => update("enterpriseId", event.target.value)} required><option value="" disabled>Select organization</option>{enterprises.map((enterprise) => <option value={enterprise.id} key={enterprise.id}>{enterprise.name}</option>)}</SelectField><TextField label="Service date" name="scheduleDate" type="date" min={today} value={draft.scheduleDate} onChange={(event) => update("scheduleDate", event.target.value)} required /><div className={styles.impact}><Clock3 size={18} aria-hidden="true" /><div><strong>Platform cutoff {formatCutoff(cutoffIsoForDate(draft.scheduleDate || today, platformCutoffTime))}</strong><span>Managed from the Aamish dashboard and applied automatically.</span></div></div>{selectedEnterprise && <div className={styles.impact}><Users size={18} aria-hidden="true" /><div><strong>{selectedEnterprise.active_employee_count} active employees</strong><span>Default reservations will be created for this organization.</span></div></div>}</div>}
        {step === 2 && <div><div className={styles.optionHeader}><div><strong>Meal choices</strong><span>Add distinct active menus in the order employees should see them.</span></div><Button type="button" variant="secondary" size="small" onClick={addOption} disabled={draft.menuIds.length >= menus.length}><Plus size={15} aria-hidden="true" />Add option</Button></div><div className={styles.options}>{draft.menuIds.map((menuId, index) => <div className={styles.option} key={index}><span>{String.fromCharCode(65 + index)}</span><label><span className="sr-only">Option {String.fromCharCode(65 + index)} menu</span><select value={menuId} onChange={(event) => updateMenu(index, event.target.value)} required><option value="" disabled>Select active menu</option>{menus.map((menu) => <option value={menu.id} disabled={draft.menuIds.some((selected, itemIndex) => itemIndex !== index && selected === menu.id)} key={menu.id}>{menu.title} · ৳{menu.price.toFixed(2)}</option>)}</select></label><IconButton type="button" aria-label={`Remove option ${String.fromCharCode(65 + index)}`} onClick={() => removeOption(index)} disabled={draft.menuIds.length === 1}><Trash2 size={16} /></IconButton></div>)}</div></div>}
        {step === 3 && <div className={styles.review}><ReviewRow label="Organization" value={selectedEnterprise?.name || "—"} /><ReviewRow label="Service" value={`${formatDate(draft.scheduleDate)} · choices close ${formatCutoff(cutoffIsoForDate(draft.scheduleDate, platformCutoffTime))}`} /><ReviewRow label="Employee impact" value={`${selectedEnterprise?.active_employee_count || 0} default ${(selectedEnterprise?.active_employee_count || 0) === 1 ? "reservation" : "reservations"}`} /><div><span>Employee options</span><ol>{selectedMenus.map((menu, index) => <li key={menu.id}><b>Option {String.fromCharCode(65 + index)}</b><span>{menu.title}</span><em>৳{menu.price.toFixed(2)}</em></li>)}</ol></div><Alert tone="info" title="Ready to publish">This service becomes immediately visible with the platform cutoff.</Alert></div>}
        {failure && <Alert tone="danger" title="Service was not published">{failure.message}{failure.requestId && <code>Request ID: {failure.requestId}</code>}</Alert>}
      </div><footer>{step > 1 ? <Button type="button" variant="secondary" onClick={() => { setStep((current) => current - 1); setFailure(null); }} disabled={saving}><ArrowLeft size={16} aria-hidden="true" />Back</Button> : <Button type="button" variant="secondary" onClick={close}>Cancel</Button>} {step < 3 ? <Button type="button" onClick={next}>Continue<ArrowRight size={16} aria-hidden="true" /></Button> : <Button type="submit" loading={saving} loadingLabel="Publishing service…"><Check size={16} aria-hidden="true" />Publish service</Button>}</footer></form>
    </section></div>}
  </AppShell>;
}

export function PrerequisiteState({ enterprises }: { enterprises: EnterpriseChoice[] }) { const missingOrganizations = enterprises.length === 0; return <EmptyState icon={<CalendarDays size={25} aria-hidden="true" />} title="Complete setup before scheduling" description={missingOrganizations ? "Add an active organization with at least one delivery location first." : "Activate at least one menu before publishing meal service."} action={<Link className={styles.setupLink} href={missingOrganizations ? "/admin/organizations" : "/admin/menus"}>{missingOrganizations ? "Add organization" : "Open menu library"}<ArrowRight size={16} aria-hidden="true" /></Link>} />; }
function ScheduleCard({ schedule, today, onEdit, onCancel, cancelling }: { schedule: Schedule; today: string; onEdit: () => void; onCancel: () => void; cancelling: boolean }) {
  const isToday = schedule.schedule_date === today;
  const editable = schedule.status === "PUBLISHED" && schedule.schedule_date >= today;
  return <article className={styles.schedule}><time dateTime={schedule.schedule_date}><strong>{new Date(`${schedule.schedule_date}T00:00:00`).toLocaleDateString("en-BD", { day: "2-digit" })}</strong><span>{new Date(`${schedule.schedule_date}T00:00:00`).toLocaleDateString("en-BD", { month: "short", weekday: "short" })}</span></time><div className={styles.scheduleBody}><div className={styles.scheduleTitle}><div><h2>{schedule.enterprise_name}</h2><p>Choices close {formatCutoff(schedule.cutoff_time)}</p></div><div className={styles.scheduleTitleActions}><StatusBadge tone={schedule.status === "CANCELLED" ? "neutral" : isToday ? "info" : schedule.status === "PUBLISHED" ? "success" : "neutral"}>{schedule.status === "CANCELLED" ? "CANCELLED" : isToday ? "TODAY" : schedule.status}</StatusBadge>{editable && <div className={styles.scheduleActions}><IconButton type="button" aria-label={`Edit cutoff for ${schedule.enterprise_name} on ${schedule.schedule_date}`} onClick={onEdit}><Pencil size={15} /></IconButton><IconButton type="button" aria-label={`Cancel service for ${schedule.enterprise_name} on ${schedule.schedule_date}`} disabled={cancelling} onClick={onCancel}><Trash2 size={15} /></IconButton></div>}</div></div><div className={styles.scheduleOptions}>{schedule.options.map((option) => <span key={option.label}><b>{option.label}</b>{option.title}</span>)}</div></div></article>;
}

function ScheduleCutoffEditor({ schedule, onClose, onSaved }: { schedule: Schedule; onClose: () => void; onSaved: (cutoffTime: string) => Promise<void> | void }) {
  const [cutoffTime, setCutoffTime] = useState(new Date(schedule.cutoff_time).toLocaleTimeString("en-GB", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit" }));
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const dialogRef = useModalDialog<HTMLFormElement>(true, onClose, saving);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setFailure(null);
    try {
      const response = await fetch(`/api/admin/schedules/${schedule.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ cutoffTime }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw { code: data.error, requestId: data.requestId };
      await onSaved(cutoffTime); onClose();
    } catch (caught) {
      const error = caught as { code?: string; requestId?: string };
      setFailure({ message: clientErrorMessage(error.code || "SCHEDULE_UPDATE_FAILED", "The cutoff could not be updated."), requestId: error.requestId });
    } finally { setSaving(false); }
  }

  return <div className={styles.backdrop}><form ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="schedule-edit-title" tabIndex={-1} onSubmit={submit}>
    <header><div><p>Edit service</p><h2 id="schedule-edit-title">{schedule.enterprise_name} · {formatDate(schedule.schedule_date)}</h2><span>Only the choice cutoff can be changed here. To change menus, cancel this service and publish a new one.</span></div><IconButton type="button" aria-label="Close cutoff editor" onClick={onClose} disabled={saving}><X size={19} /></IconButton></header>
    <div className={styles.formBody}>
      <TextField label="Choices close at" name="cutoffTime" type="time" value={cutoffTime} onChange={(event) => setCutoffTime(event.target.value)} required autoFocus />
      {failure && <Alert tone="danger" title="Cutoff was not updated">{failure.message}{failure.requestId && <code>Request ID: {failure.requestId}</code>}</Alert>}
    </div>
    <footer><Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button><Button loading={saving} loadingLabel="Saving…">Save cutoff</Button></footer>
  </form></div>;
}
function Summary({ value, label, icon }: { value: number; label: string; icon: ReactNode }) { return <article><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article>; }
function ReviewRow({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function formatDate(date: string) { return new Date(`${date}T00:00:00`).toLocaleDateString("en-BD", { day: "numeric", month: "long", year: "numeric" }); }
function formatCutoff(cutoff: string) { return new Date(cutoff).toLocaleString("en-BD", { timeZone: "Asia/Dhaka", hour: "numeric", minute: "2-digit" }); }
