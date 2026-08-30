"use client";

import { Building2, MapPin, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { AdminNav } from "@/components/admin-nav";
import { clientErrorMessage } from "@/lib/client-errors";

type Location = { name: string; code: string; address: string };
export type Enterprise = { id: string; name: string; slug: string; status: string; poc_name: string; poc_email: string; location_count: number; admin_count: number };
const emptyLocation = (): Location => ({ name: "", code: "", address: "" });

export function AdminOnboarding({ fullName, initialEnterprises }: { fullName: string; initialEnterprises: Enterprise[] }) {
  const [enterprises, setEnterprises] = useState<Enterprise[]>(initialEnterprises);
  const [locations, setLocations] = useState<Location[]>([emptyLocation()]);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadEnterprises() {
    setLoading(true);
    const response = await fetch("/api/admin/enterprises");
    const data = await response.json();
    setEnterprises(response.ok ? data.enterprises : []);
    if (!response.ok) setStatus("Could not load enterprises. Check the server logs.");
    setLoading(false);
  }
  function changeLocation(index: number, field: keyof Location, value: string) { setLocations((current) => current.map((location, itemIndex) => itemIndex === index ? { ...location, [field]: value } : location)); }
  function addLocation() { setLocations((current) => [...current, emptyLocation()]); }
  function removeLocation(index: number) { setLocations((current) => current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)); }
  function closeForm() { setShowForm(false); setLocations([emptyLocation()]); setStatus(""); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setStatus("");
    const form = new FormData(event.currentTarget);
    const payload = { name: form.get("name"), slug: form.get("slug"), pocName: form.get("pocName"), pocPhone: form.get("pocPhone"), pocEmail: form.get("pocEmail"), locations, admin: { fullName: form.get("adminFullName"), username: form.get("adminUsername"), password: form.get("adminPassword") } };
    const response = await fetch("/api/admin/enterprises", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json(); setSaving(false);
    if (!response.ok) return setStatus(clientErrorMessage(data.error, "The enterprise could not be created."));
    closeForm(); await loadEnterprises();
  }

  return <div className="admin-portal">
    <AdminNav active="enterprises" />
    <main className="admin-main"><header className="admin-header"><div><p className="eyebrow">AAMISH ADMIN</p><h1>Enterprises</h1><span>Welcome, {fullName}. Manage client companies, locations, and administrator access.</span></div><button className="primary" onClick={() => setShowForm(true)}><Plus size={17} /> Add enterprise</button></header>
      {status && !showForm && <p className="form-error">{status}</p>}
      {loading ? <div className="empty-dashboard"><span>Loading enterprises…</span></div> : enterprises.length === 0 ? <section className="empty-dashboard" id="enterprises"><div className="empty-icon"><Building2 size={28} /></div><h2>No enterprises yet</h2><p>Add your first enterprise to configure its delivery locations and create an administrator login.</p><button className="primary" onClick={() => setShowForm(true)}><Plus size={17} /> Add first enterprise</button></section> : <section className="enterprise-list" id="enterprises"><div className="enterprise-summary"><article><strong>{enterprises.length}</strong><span>Enterprises</span></article><article><strong>{enterprises.reduce((total, enterprise) => total + enterprise.location_count, 0)}</strong><span>Delivery locations</span></article><article><strong>{enterprises.reduce((total, enterprise) => total + enterprise.admin_count, 0)}</strong><span>Enterprise admins</span></article></div><div className="enterprise-table"><div className="enterprise-row enterprise-row-head"><span>Enterprise</span><span>Contact</span><span>Locations</span><span>Admins</span><span>Status</span></div>{enterprises.map((enterprise) => <div className="enterprise-row" key={enterprise.id}><div><b>{enterprise.name}</b><small>/{enterprise.slug}</small></div><div><b>{enterprise.poc_name}</b><small>{enterprise.poc_email}</small></div><span>{enterprise.location_count}</span><span>{enterprise.admin_count}</span><em>{enterprise.status}</em></div>)}</div></section>}
    </main>
    {showForm && <div className="form-overlay" role="dialog" aria-modal="true" aria-label="Add enterprise"><form className="enterprise-form" onSubmit={submit}><header><div><p className="eyebrow">NEW ENTERPRISE</p><h2>Add enterprise</h2><span>Fields marked * are required. Configure the company, locations, and first admin.</span></div><button type="button" onClick={closeForm} aria-label="Close"><X size={20} /></button></header><section><p className="eyebrow">COMPANY DETAILS</p><div className="field-grid"><label className="required">Enterprise name<input name="name" placeholder="e.g. Live Technologies" required /></label><label className="required">URL slug<input name="slug" placeholder="e.g. live-technologies" required /></label><label className="required">Primary contact<input name="pocName" placeholder="Full name" required /></label><label className="required">Contact phone<input name="pocPhone" placeholder="+880…" required /></label><label className="wide required">Contact email<input name="pocEmail" placeholder="admin@company.com" type="email" required /></label></div></section><section><div className="form-section-title"><div><p className="eyebrow">DELIVERY LOCATIONS</p><span>Minimum one location is required.</span></div><button type="button" onClick={addLocation}><Plus size={15} /> Add location</button></div>{locations.map((location, index) => <div className="dynamic-location" key={index}><span><MapPin size={17} /></span><div><label className="required">Location name<input value={location.name} onChange={(event) => changeLocation(index, "name", event.target.value)} placeholder="Office or branch name" required /></label><label className="required">Code<input value={location.code} onChange={(event) => changeLocation(index, "code", event.target.value)} placeholder="NB-01" required /></label><label className="required">Address<input value={location.address} onChange={(event) => changeLocation(index, "address", event.target.value)} placeholder="Delivery address" required /></label></div><button type="button" onClick={() => removeLocation(index)} disabled={locations.length === 1} aria-label={`Remove location ${index + 1}`}><Trash2 size={16} /></button></div>)}</section><section><p className="eyebrow">FIRST ENTERPRISE ADMIN</p><div className="field-grid"><label className="required">Admin name<input name="adminFullName" placeholder="Full name" required /></label><label className="required">Username<input name="adminUsername" placeholder="e.g. live.admin" required /></label><label className="wide required">Temporary password<input name="adminPassword" type="password" required /></label></div></section>{status && <p className="form-error form-error-inline">{status}</p>}<footer><button type="button" className="cancel-button" onClick={closeForm}>Cancel</button><button className="primary" disabled={saving}>{saving ? "Creating…" : "Create enterprise"}</button></footer></form></div>}
  </div>;
}
