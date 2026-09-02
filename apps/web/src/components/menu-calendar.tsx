"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, MapPin, Pencil, Plus, Trash2, Users, UtensilsCrossed, X } from "lucide-react";
import { type FormEvent, useMemo, useState, type ReactNode } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { Alert, Button, EmptyState, IconButton, PageHeader, SelectField, StatusBadge, TextField } from "@/components/ui/primitives";
import type { MenuPackage } from "@/components/package-manager";
import { clientErrorMessage } from "@/lib/client-errors";
import { cutoffIsoForDate } from "@/lib/platform-cutoff";
import { addDays, schedulesInWeek, weekDates, weekRangeLabel, type PlannedSchedule } from "@/lib/service-planning";
import { superAdminNavigation } from "@/lib/super-admin-navigation";
import { useModalDialog } from "@/lib/use-modal-dialog";
import styles from "./service-calendar.module.css";

export type EnterpriseChoice = { id: string; name: string; active_employee_count: number };
export type Schedule = PlannedSchedule;
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
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [listFailure, setListFailure] = useState<Failure | null>(null);
  const [loadingWeek, setLoadingWeek] = useState(false);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const [weekStart, setWeekStart] = useState(today);
  const ready = enterprises.length > 0 && menus.length > 0;
  const selectedEnterprise = enterprises.find((enterprise) => enterprise.id === draft.enterpriseId);
  const selectedMenus = draft.menuIds.map((id) => menus.find((menu) => menu.id === id)).filter(Boolean) as MenuPackage[];
  const visibleSchedules = useMemo(() => schedulesInWeek(schedules, weekStart), [schedules, weekStart]);
  const visibleDates = useMemo(() => weekDates(weekStart), [weekStart]);
  const weekEnd = visibleDates[6];
  const visibleMealCount = visibleSchedules.reduce((sum, schedule) => sum + schedule.meal_count, 0);
  const visibleOrganizations = new Set(visibleSchedules.map(({ enterprise_name }) => enterprise_name)).size;
  const schedulesByDate = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    for (const schedule of visibleSchedules) map.set(schedule.schedule_date, [...(map.get(schedule.schedule_date) || []), schedule]);
    return map;
  }, [visibleSchedules]);
  const dialogRef = useModalDialog<HTMLElement>(open, close, saving);

  function shiftWeek(days: number) { void changeWeek(addDays(weekStart, days)); }
  function goToToday() { void changeWeek(today); }
  function startPublish(scheduleDate = "") { setDraft({ ...emptyDraft(), scheduleDate }); setStep(1); setFailure(null); setNotice(""); setOpen(true); }
  function close() { if (!saving) setOpen(false); }
  function next() { const message = scheduleStepError(step, draft); if (message) return setFailure({ message }); setFailure(null); setStep((current) => Math.min(3, current + 1)); }
  function update(field: "enterpriseId" | "scheduleDate", value: string) { setDraft((current) => ({ ...current, [field]: value })); setFailure(null); }
  function updateMenu(index: number, menuId: string) { setDraft((current) => ({ ...current, menuIds: current.menuIds.map((value, itemIndex) => itemIndex === index ? menuId : value) })); setFailure(null); }
  function addOption() { setDraft((current) => ({ ...current, menuIds: [...current.menuIds, ""] })); }
  function removeOption(index: number) { setDraft((current) => ({ ...current, menuIds: current.menuIds.filter((_, itemIndex) => itemIndex !== index) })); }

  async function reload(start = weekStart) {
    const response = await fetch(`/api/admin/schedules?from=${start}&to=${addDays(start, 6)}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw { code: data.error || "SCHEDULE_LIST_FAILED", requestId: data.requestId };
    setSchedules(data.schedules);
  }

  async function changeWeek(start: string) {
    setLoadingWeek(true); setListFailure(null);
    try {
      await reload(start);
      setWeekStart(start);
    } catch (caught) {
      const error = caught as { code?: string; requestId?: string };
      setListFailure({ message: clientErrorMessage(error.code || "SCHEDULE_LIST_FAILED", "The selected week could not be loaded."), requestId: error.requestId });
    } finally { setLoadingWeek(false); }
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
      const targetWeek = draft.scheduleDate && (draft.scheduleDate < weekStart || draft.scheduleDate > weekEnd) ? draft.scheduleDate : weekStart;
      try {
        await reload(targetWeek);
      } catch (caught) {
        const error = caught as { requestId?: string };
        setListFailure({ message: "The service was published, but the selected week could not be refreshed. Change weeks or reload to try again.", requestId: error.requestId });
      }
      setOpen(false);
      if (targetWeek !== weekStart) setWeekStart(targetWeek);
      setNotice(`${selectedEnterprise?.name || "The organization"} is scheduled for ${formatDate(draft.scheduleDate)}.`);
    } catch (caught) {
      const error = caught as { code?: string; requestId?: string };
      setFailure({ message: clientErrorMessage(error.code || "SCHEDULE_PUBLISH_FAILED", "The service could not be published."), requestId: error.requestId });
    } finally { setSaving(false); }
  }

  return <AppShell workspace="Aamish operations" fullName={fullName} roleLabel="Aamish administrator" currentPath="/admin/calendar" navigation={superAdminNavigation}>
    <PageHeader eyebrow="Seven-day operations" title="Service planning" description="Compare the coming week’s organizations, destinations, menus, and projected quantities before choices lock." actions={<div className={styles.headerActions}><Link className={styles.fulfillmentLink} href={`/admin/fulfillment?from=${weekStart}&to=${weekEnd}`}>Production &amp; dispatch<ArrowRight size={16} aria-hidden="true" /></Link><Button onClick={() => startPublish()} disabled={!ready}><Plus size={17} aria-hidden="true" />Schedule service</Button></div>} />
    {notice && <div className={styles.notice}><Alert tone="success" title="Service updated">{notice}</Alert></div>}
    {listFailure && <div className={styles.notice}><Alert tone="danger" title="Action failed">{listFailure.message}{listFailure.requestId && <code>Request ID: {listFailure.requestId}</code>}</Alert></div>}
    <section className={styles.summary} aria-label="Selected week totals"><Summary value={visibleSchedules.length} label="Meal services" icon={<CalendarDays />} /><Summary value={visibleMealCount} label="Meals in week" icon={<Users />} /><Summary value={visibleOrganizations} label="Organizations" icon={<Check />} /></section>

    {!ready ? <PrerequisiteState enterprises={enterprises} /> : <>
      <div className={styles.weekNav}>
        <div className={styles.weekNavControls}><IconButton type="button" aria-label="Previous week" onClick={() => shiftWeek(-7)} disabled={loadingWeek}><ChevronLeft size={18} /></IconButton><div><span>Selected week</span><h2>{weekRangeLabel(weekStart)}</h2></div><IconButton type="button" aria-label="Next week" onClick={() => shiftWeek(7)} disabled={loadingWeek}><ChevronRight size={18} /></IconButton></div>
        <Button type="button" variant="secondary" size="small" onClick={goToToday} disabled={loadingWeek || weekStart === today}>Today</Button>
      </div>
      {loadingWeek ? <div className={styles.weekLoading} role="status"><Clock3 size={20} aria-hidden="true" />Loading selected week…</div> : <section className={styles.weekPlan} aria-label={`Service plan ${weekRangeLabel(weekStart)}`}>{visibleDates.map((date) => <DayPlan date={date} schedules={schedulesByDate.get(date) || []} today={today} onSchedule={() => startPublish(date)} onEdit={setEditingSchedule} onCancel={cancelSchedule} cancellingId={cancellingId} key={date} />)}</section>}
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
export function DayPlan({ date, schedules, today, onSchedule, onEdit, onCancel, cancellingId }: { date: string; schedules: Schedule[]; today: string; onSchedule: () => void; onEdit: (schedule: Schedule) => void; onCancel: (schedule: Schedule) => void; cancellingId: string | null }) {
  const total = schedules.reduce((sum, schedule) => sum + schedule.meal_count, 0);
  const isToday = date === today;
  const allCancelled = schedules.length > 0 && schedules.every(({ status }) => status === "CANCELLED");
  const hasOpenCount = schedules.some((schedule) => schedule.status === "PUBLISHED" && new Date(schedule.cutoff_time) > new Date());
  const countState = allCancelled ? "cancelled" : hasOpenCount ? "projected" : "locked";
  const countLabel = schedules.length === 0 ? "no meals planned" : `${countState} ${total === 1 ? "meal" : "meals"}`;
  return <section className={`${styles.dayPlan} ${isToday ? styles.todayPlan : ""}`} aria-labelledby={`day-${date}`}>
    <header className={styles.dayHeader}><time dateTime={date}><span>{new Date(`${date}T00:00:00Z`).toLocaleDateString("en-BD", { timeZone: "UTC", weekday: "long" })}{isToday && <b>Today</b>}</span><strong id={`day-${date}`}>{new Date(`${date}T00:00:00Z`).toLocaleDateString("en-BD", { timeZone: "UTC", month: "short", day: "numeric" })}</strong></time><div><strong>{total}</strong><span>{countLabel}</span><small>{schedules.length} {schedules.length === 1 ? "organization" : "organizations"}</small></div></header>
    {schedules.length === 0 ? <div className={styles.emptyDay}><span>No service planned</span>{date >= today && <Button type="button" variant="quiet" size="small" onClick={onSchedule}><Plus size={14} aria-hidden="true" />Schedule</Button>}</div> : <div className={styles.organizationRows}>{schedules.map((schedule, index) => <ScheduleRow schedule={schedule} today={today} defaultOpen={isToday && index === 0} onEdit={() => onEdit(schedule)} onCancel={() => onCancel(schedule)} cancelling={cancellingId === schedule.id} key={schedule.id} />)}</div>}
  </section>;
}

function ScheduleRow({ schedule, today, defaultOpen, onEdit, onCancel, cancelling }: { schedule: Schedule; today: string; defaultOpen: boolean; onEdit: () => void; onCancel: () => void; cancelling: boolean }) {
  const locked = schedule.status === "PUBLISHED" && new Date(schedule.cutoff_time) <= new Date();
  const cancelled = schedule.status === "CANCELLED";
  const editable = !cancelled && schedule.schedule_date >= today;
  const menuSummary = schedule.options.map(({ title }) => title).join(" · ");
  const locationSummary = schedule.locations.map(({ name }) => name).join(", ");
  return <details className={styles.schedule} open={defaultOpen}>
    <summary><div className={styles.scheduleIdentity}><strong>{schedule.enterprise_name}</strong><span>{locationSummary || "No active delivery location"}</span><small>{menuSummary || "No menu options"}</small></div><div className={styles.scheduleState}><strong>{schedule.meal_count}<span>meals</span></strong><StatusBadge tone={cancelled ? "neutral" : locked ? "success" : "warning"}>{cancelled ? "CANCELLED" : locked ? "LOCKED" : "OPEN"}</StatusBadge><ChevronDown size={18} aria-hidden="true" /></div></summary>
    <div className={styles.scheduleBody}>
      <div className={styles.cutoffState}><Clock3 size={17} aria-hidden="true" /><div><strong>{cancelled ? "Service cancelled" : locked ? "Final quantity" : "Live projection"}</strong><span>{cancelled ? "No meals will be fulfilled." : `${locked ? "Choices closed" : "Choices close"} ${formatCutoff(schedule.cutoff_time)} Dhaka time.`}</span></div></div>
      <div className={styles.breakdowns}><section aria-label={`${schedule.enterprise_name} delivery locations`}><h3><MapPin size={15} aria-hidden="true" />Delivery locations</h3>{schedule.locations.length ? <ul>{schedule.locations.map((location) => <li key={location.name}><span>{location.name}</span><strong>{location.count}</strong></li>)}</ul> : <p>No active locations.</p>}</section><section aria-label={`${schedule.enterprise_name} menu quantities`}><h3><UtensilsCrossed size={15} aria-hidden="true" />Menu options</h3>{schedule.options.length ? <ul>{schedule.options.map((option) => <li key={option.label}><b>{option.label}</b><span>{option.title}</span><strong>{option.count}</strong></li>)}</ul> : <p>No menu options.</p>}</section></div>
      {editable && <div className={styles.scheduleActions}><Button type="button" variant="secondary" size="small" onClick={onEdit}><Pencil size={15} aria-hidden="true" />Override cutoff</Button><Button type="button" variant="quiet" size="small" disabled={cancelling} onClick={onCancel}><Trash2 size={15} aria-hidden="true" />{cancelling ? "Cancelling…" : "Cancel service"}</Button></div>}
    </div>
  </details>;
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
