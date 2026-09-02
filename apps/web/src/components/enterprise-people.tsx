"use client";

import { Download, FileUp, MapPin, Pencil, Plus, Search, Trash2, Users, X } from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { Alert, Button, EmptyState, IconButton, PageHeader, SelectField, StatusBadge, TextField } from "@/components/ui/primitives";
import { clientErrorMessage } from "@/lib/client-errors";
import { enterpriseNavigation } from "@/lib/enterprise-navigation";
import { useModalDialog } from "@/lib/use-modal-dialog";
import styles from "./enterprise-people.module.css";

export type EnterpriseLocation = { id: string; name: string; code: string };
export type EnterpriseEmployee = { id: string; employee_code: string; full_name: string; email: string; phone: string | null; location_id: string; location_name: string; username: string; is_active: boolean };
type ImportResult = { totalRows: number; inserted: number; errors: Array<{ row: number; error: string }>; requestId?: string };

export function filterEmployees(rows: EnterpriseEmployee[], location: string, query: string) {
  const needle = query.trim().toLowerCase();
  return rows.filter((row) => (!location || row.location_name === location) && (!needle || `${row.full_name} ${row.employee_code} ${row.email} ${row.username} ${row.location_name}`.toLowerCase().includes(needle)));
}

export function parseEmployeeCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const headers = lines.shift()?.split(",").map((value) => value.trim()) || [];
  return lines.map((line) => Object.fromEntries(line.split(",").map((value, index) => [headers[index], value.trim()])));
}

export function EnterprisePeople({ enterpriseName, fullName, locations, initialEmployees }: { enterpriseName: string; fullName: string; locations: EnterpriseLocation[]; initialEmployees: EnterpriseEmployee[] }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<EnterpriseEmployee | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; title: string; detail: string } | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => filterEmployees(employees, location, query), [employees, location, query]);
  const createDialogRef = useModalDialog<HTMLFormElement>(createOpen, () => setCreateOpen(false), saving);
  const importDialogRef = useModalDialog<HTMLElement>(importOpen, () => setImportOpen(false), saving);

  async function reload() { const response = await fetch("/api/enterprise/employees"); const data = await response.json(); if (response.ok) setEmployees(data.employees); }
  async function removeEmployee(employee: EnterpriseEmployee) {
    if (removingId) return;
    setRemovingId(employee.id); setNotice(null);
    const response = await fetch(`/api/enterprise/employees/${employee.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    setRemovingId(null);
    if (!response.ok) { setNotice({ tone: "danger", title: "Employee not removed", detail: `${clientErrorMessage(data.error, "Try again.")}${data.requestId ? ` Request ID: ${data.requestId}.` : ""}` }); return; }
    setNotice({ tone: "success", title: "Employee removed", detail: `${employee.full_name} was deactivated and can no longer sign in or receive meals.` });
    await reload();
  }
  async function createEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setNotice(null);
    const response = await fetch("/api/enterprise/employees", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    const data = await response.json(); setSaving(false);
    if (!response.ok) { setNotice({ tone: "danger", title: "Employee not created", detail: `${clientErrorMessage(data.error, "Check the details and try again.")}${data.requestId ? ` Request ID: ${data.requestId}.` : ""}` }); return; }
    setCreateOpen(false); setNotice({ tone: "success", title: "Employee created", detail: `${data.username} can now sign in with the temporary password you provided.` }); await reload();
  }
  async function importCsv(file: File) {
    setSaving(true); setImportResult(null); setNotice(null);
    const employees = parseEmployeeCsv(await file.text());
    const response = await fetch("/api/enterprise/employees/bulk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ employees }) });
    const data = await response.json(); setSaving(false);
    if (!response.ok) { setNotice({ tone: "danger", title: "Import failed", detail: `${clientErrorMessage(data.error)}${data.requestId ? ` Request ID: ${data.requestId}.` : ""}` }); return; }
    setImportResult(data); await reload();
  }
  function downloadTemplate() {
    const csv = `employeeCode,fullName,email,locationCode,username,password\nEMP-001,Employee Name,employee@company.com,${locations[0]?.code || "LOCATION-CODE"},employee.001,1234\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); const link = document.createElement("a"); link.href = url; link.download = `${enterpriseName.toLowerCase().replaceAll(" ", "-")}-employees.csv`; link.click(); URL.revokeObjectURL(url);
  }

  return <AppShell workspace={enterpriseName} fullName={fullName} roleLabel="Enterprise administrator" currentPath="/enterprise/people" navigation={enterpriseNavigation}>
    <PageHeader eyebrow="People" title="Employee roster" description="See who receives meals and which delivery location they use." actions={<div className={styles.headerActions}><Button variant="secondary" onClick={() => { setImportOpen(true); setImportResult(null); }}><FileUp size={16} aria-hidden="true" /> Import CSV</Button><Button onClick={() => setCreateOpen(true)}><Plus size={16} aria-hidden="true" /> Add employee</Button></div>} />
    {notice && <div className={styles.notice}><Alert tone={notice.tone} title={notice.title}>{notice.detail}</Alert></div>}
    <section className={styles.summary} aria-label="Roster summary"><article><strong>{employees.length}</strong><span>Total employees</span></article><article><strong>{employees.filter((employee) => employee.is_active).length}</strong><span>Active</span></article><article><strong>{locations.length}</strong><span>Delivery locations</span></article></section>
    {employees.length > 0 && <div className={styles.filters}><label className={styles.search}><Search size={16} aria-hidden="true" /><span className="sr-only">Search employees</span><input placeholder="Search name, ID, email or username" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label><span>Location</span><select value={location} onChange={(event) => setLocation(event.target.value)}><option value="">All locations</option>{locations.map((item) => <option key={item.id}>{item.name}</option>)}</select></label></div>}
    {employees.length === 0 ? <EmptyState icon={<Users size={25} aria-hidden="true" />} title="No employees yet" description="Add the first employee individually or import a completed CSV template." action={<Button onClick={() => setCreateOpen(true)}><Plus size={16} aria-hidden="true" /> Add first employee</Button>} /> : filtered.length === 0 ? <EmptyState icon={<Search size={25} aria-hidden="true" />} title="No employees match" description="Try another name, ID, username, or delivery location." /> : <section className={styles.roster} aria-label="Employees"><div className={styles.rosterHead}><span>Employee</span><span>Access</span><span>Delivery location</span><span>Status</span><span>Actions</span></div>{filtered.map((employee) => <article className={styles.rosterRow} key={employee.id}><div><strong>{employee.full_name}</strong><small>{employee.employee_code} · {employee.email}</small></div><div><strong>@{employee.username}</strong><small>{employee.phone || "No phone provided"}</small></div><span><MapPin size={14} aria-hidden="true" />{employee.location_name}</span><StatusBadge tone={employee.is_active ? "success" : "neutral"}>{employee.is_active ? "Active" : "Inactive"}</StatusBadge><div className={styles.rowActions}><IconButton type="button" aria-label={`Edit ${employee.full_name}`} onClick={() => setEditing(employee)}><Pencil size={16} /></IconButton><IconButton type="button" aria-label={`Remove ${employee.full_name}`} disabled={removingId === employee.id || !employee.is_active} onClick={() => { if (window.confirm(`Remove ${employee.full_name}? They will lose sign-in access and stop receiving meals. This can be reversed by editing the employee.`)) void removeEmployee(employee); }}><Trash2 size={16} /></IconButton></div></article>)}</section>}
    {editing && <EmployeeEditor employee={editing} locations={locations} onClose={() => setEditing(null)} onSaved={reload} />}

    {createOpen && <div className={styles.backdrop}><form ref={createDialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="employee-dialog-title" tabIndex={-1} onSubmit={createEmployee}><header><div><p>New employee</p><h2 id="employee-dialog-title">Add one employee</h2><span>Required fields are marked before submission.</span></div><IconButton type="button" aria-label="Close employee form" onClick={() => setCreateOpen(false)}><X size={19} /></IconButton></header><div className={styles.dialogBody}><div className={styles.fieldGrid}><TextField label="Full name" name="fullName" required autoFocus /><TextField label="Employee ID" name="employeeCode" required /><TextField label="Corporate email" name="email" type="email" required /><TextField label="Phone" name="phone" description="Optional" /><SelectField label="Delivery location" name="locationId" required defaultValue=""><option value="" disabled>Select location</option>{locations.map((item) => <option value={item.id} key={item.id}>{item.name} ({item.code})</option>)}</SelectField><TextField label="Username" name="username" required /><TextField label="Temporary password" name="password" type="password" minLength={4} description="Minimum 4 characters for this internal beta." required /></div>{notice?.tone === "danger" && <Alert tone="danger" title={notice.title}>{notice.detail}</Alert>}</div><footer><Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button loading={saving} loadingLabel="Creating…">Create employee</Button></footer></form></div>}

    {importOpen && <div className={styles.backdrop}><section ref={importDialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="import-title" tabIndex={-1}><header><div><p>Bulk import</p><h2 id="import-title">Import employee CSV</h2><span>Up to 500 rows. Valid rows may be created even if other rows fail.</span></div><IconButton aria-label="Close CSV import" onClick={() => setImportOpen(false)}><X size={19} /></IconButton></header><div className={styles.dialogBody}><ol className={styles.importSteps}><li><b>1</b><div><strong>Download the template</strong><span>Keep the column names and use one of your location codes.</span></div><Button variant="secondary" onClick={downloadTemplate}><Download size={15} /> Download CSV</Button></li><li><b>2</b><div><strong>Complete and upload</strong><span>Required: employeeCode, fullName, email, locationCode.</span></div><Button variant="secondary" loading={saving} loadingLabel="Importing…" onClick={() => fileRef.current?.click()}><FileUp size={15} /> Choose CSV</Button><input ref={fileRef} hidden type="file" accept=".csv,text/csv" onChange={(event) => event.target.files?.[0] && void importCsv(event.target.files[0])} /></li></ol>{importResult && <Alert tone={importResult.errors.length ? "warning" : "success"} title={`${importResult.inserted} of ${importResult.totalRows} employees created`}>{importResult.errors.length ? `${importResult.errors.length} rows failed: ${importResult.errors.map((item) => `row ${item.row} (${clientErrorMessage(item.error, item.error)})`).join(", ")}.` : "Every row was imported successfully."}{importResult.requestId ? ` Request ID: ${importResult.requestId}.` : ""}</Alert>}</div><footer><span /><Button type="button" onClick={() => setImportOpen(false)}>Done</Button></footer></section></div>}
  </AppShell>;
}

function EmployeeEditor({ employee, locations, onClose, onSaved }: { employee: EnterpriseEmployee; locations: EnterpriseLocation[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<{ message: string; requestId?: string } | null>(null);
  const dialogRef = useModalDialog<HTMLFormElement>(true, onClose, saving);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setFailure(null);
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch(`/api/enterprise/employees/${employee.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, isActive: payload.isActive === "on" }) });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) { setFailure({ message: clientErrorMessage(data.error, "The employee could not be updated."), requestId: data.requestId }); return; }
    await onSaved(); onClose();
  }

  return <div className={styles.backdrop}><form ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="employee-edit-title" tabIndex={-1} onSubmit={submit}>
    <header><div><p>Edit employee</p><h2 id="employee-edit-title">{employee.full_name}</h2><span>Employee ID {employee.employee_code} and username @{employee.username} cannot be changed here.</span></div><IconButton type="button" aria-label="Close employee editor" onClick={onClose} disabled={saving}><X size={19} /></IconButton></header>
    <div className={styles.dialogBody}>
      <div className={styles.fieldGrid}>
        <TextField label="Full name" name="fullName" defaultValue={employee.full_name} required autoFocus />
        <TextField label="Corporate email" name="email" type="email" defaultValue={employee.email} required />
        <TextField label="Phone" name="phone" defaultValue={employee.phone || ""} description="Optional" />
        <SelectField label="Delivery location" name="locationId" required defaultValue={employee.location_id}>{locations.map((item) => <option value={item.id} key={item.id}>{item.name} ({item.code})</option>)}</SelectField>
      </div>
      <label className={styles.activeToggle}><input type="checkbox" name="isActive" defaultChecked={employee.is_active} /> Active — can sign in and receive meals</label>
      {failure && <Alert tone="danger" title="Employee not updated">{failure.message}{failure.requestId && <code>Request ID: {failure.requestId}</code>}</Alert>}
    </div>
    <footer><Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button><Button loading={saving} loadingLabel="Saving…">Save changes</Button></footer>
  </form></div>;
}
