"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, ChefHat, Clock3, MapPin, Search, UtensilsCrossed, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { Button, EmptyState, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { superAdminNavigation } from "@/lib/super-admin-navigation";
import styles from "./fulfillment-dashboard.module.css";

export type OperationRow = { schedule_id: string; schedule_date: string; cutoff_time: string; enterprise_name: string; location_name: string; option_label: string; menu_title: string; meal_count: number };
export type FulfillmentScope = "TODAY" | "UPCOMING" | "RECENT" | "ALL";

export function filterOperationRows(rows: OperationRow[], scope: FulfillmentScope, exactDate: string, search: string, today: string) {
  const normalized = search.trim().toLowerCase();
  const todayDate = new Date(`${today}T00:00:00`);
  const nextWeek = new Date(todayDate); nextWeek.setDate(nextWeek.getDate() + 7);
  const previousWeek = new Date(todayDate); previousWeek.setDate(previousWeek.getDate() - 7);
  return rows.filter((row) => {
    if (exactDate && row.schedule_date !== exactDate) return false;
    const date = new Date(`${row.schedule_date}T00:00:00`);
    if (!exactDate && scope === "TODAY" && row.schedule_date !== today) return false;
    if (!exactDate && scope === "UPCOMING" && (date < todayDate || date > nextWeek)) return false;
    if (!exactDate && scope === "RECENT" && (date >= todayDate || date < previousWeek)) return false;
    return !normalized || `${row.enterprise_name} ${row.location_name} ${row.menu_title} ${row.option_label}`.toLowerCase().includes(normalized);
  });
}

export function fulfillmentTotals(rows: OperationRow[]) {
  return { meals: rows.reduce((sum, row) => sum + row.meal_count, 0), services: new Set(rows.map((row) => row.schedule_id)).size, locations: new Set(rows.map((row) => `${row.schedule_id}:${row.location_name}`)).size, menus: new Set(rows.map((row) => row.menu_title)).size };
}

export function OperationsDashboard({ fullName, initialRows }: { fullName: string; initialRows: OperationRow[] }) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const [scope, setScope] = useState<FulfillmentScope>("UPCOMING");
  const [exactDate, setExactDate] = useState("");
  const [search, setSearch] = useState("");
  const rows = useMemo(() => filterOperationRows(initialRows, scope, exactDate, search, today), [initialRows, scope, exactDate, search, today]);
  const totals = fulfillmentTotals(rows);
  const groups = useMemo(() => groupRows(rows), [rows]);
  const hasFilters = Boolean(exactDate || search || scope !== "UPCOMING");

  function clearFilters() { setScope("UPCOMING"); setExactDate(""); setSearch(""); }

  return <AppShell workspace="Aamish operations" fullName={fullName} roleLabel="Aamish administrator" currentPath="/admin/fulfillment" navigation={superAdminNavigation}>
    <PageHeader eyebrow="Kitchen and dispatch" title="Fulfillment" description="See opted-in meal counts by service, destination, and menu. Counts remain live until each choice cutoff." actions={<Link className={styles.calendarLink} href="/admin/calendar"><CalendarDays size={17} aria-hidden="true" />Service calendar</Link>} />
    <section className={styles.summary} aria-label="Visible fulfillment totals"><Summary icon={<ChefHat />} value={totals.meals} label="Meals to prepare" /><Summary icon={<CalendarDays />} value={totals.services} label="Meal services" /><Summary icon={<MapPin />} value={totals.locations} label="Dispatch stops" /><Summary icon={<UtensilsCrossed />} value={totals.menus} label="Distinct menus" /></section>

    {initialRows.length === 0 ? <EmptyState icon={<ChefHat size={25} aria-hidden="true" />} title="No meal allocations yet" description="Publish a service and add active employees before kitchen and dispatch counts can be compiled." action={<Link className={styles.emptyLink} href="/admin/calendar">Open service calendar <ArrowRight size={16} aria-hidden="true" /></Link>} /> : <>
      <section className={styles.filters} aria-label="Fulfillment filters"><label className={styles.search}><Search size={16} aria-hidden="true" /><span className="sr-only">Search fulfillment</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search organization, location, or menu" /></label><label><span>Service period</span><select value={scope} onChange={(event) => { setScope(event.target.value as FulfillmentScope); setExactDate(""); }}><option value="TODAY">Today</option><option value="UPCOMING">Next 7 days</option><option value="RECENT">Previous 7 days</option><option value="ALL">All loaded dates</option></select></label><label><span>Exact date</span><input type="date" value={exactDate} onChange={(event) => setExactDate(event.target.value)} /></label>{hasFilters && <Button type="button" variant="quiet" size="small" onClick={clearFilters}><X size={14} aria-hidden="true" />Reset</Button>}</section>
      <div className={styles.resultHeading}><div><p>Dispatch plan</p><h2>{groups.length} {groups.length === 1 ? "destination" : "destinations"}</h2></div><span>{totals.meals} opted-in {totals.meals === 1 ? "meal" : "meals"}</span></div>
      {groups.length === 0 ? <EmptyState title="No allocations match" description="Change the service period, exact date, or search to see other kitchen counts." action={<Button type="button" variant="secondary" onClick={clearFilters}>Reset filters</Button>} /> : <section className={styles.groups} aria-label="Fulfillment dispatch plan">{groups.map((group) => <DispatchGroup group={group} key={group.key} />)}</section>}
    </>}
  </AppShell>;
}

type Dispatch = { key: string; scheduleId: string; date: string; cutoff: string; enterprise: string; location: string; rows: OperationRow[]; total: number };
function groupRows(rows: OperationRow[]) { const groups = new Map<string, Dispatch>(); for (const row of rows) { const key = `${row.schedule_id}:${row.location_name}`; const current = groups.get(key) || { key, scheduleId: row.schedule_id, date: row.schedule_date, cutoff: row.cutoff_time, enterprise: row.enterprise_name, location: row.location_name, rows: [], total: 0 }; current.rows.push(row); current.total += row.meal_count; groups.set(key, current); } return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date) || a.enterprise.localeCompare(b.enterprise) || a.location.localeCompare(b.location)); }
function DispatchGroup({ group }: { group: Dispatch }) { const locked = new Date(group.cutoff) <= new Date(); return <article className={styles.group}><header><time dateTime={group.date}><strong>{formatDate(group.date)}</strong><span><Clock3 size={13} aria-hidden="true" />Cutoff {formatTime(group.cutoff)}</span></time><StatusBadge tone={locked ? "success" : "warning"}>{locked ? "COUNT LOCKED" : "CHOICES OPEN"}</StatusBadge></header><div className={styles.destination}><span><MapPin size={17} aria-hidden="true" /></span><div><h3>{group.location}</h3><p>{group.enterprise}</p></div><strong>{group.total}<small>meals</small></strong></div><div className={styles.menuRows}>{group.rows.map((row) => <div key={`${row.option_label}:${row.menu_title}`}><b>{row.option_label}</b><span>{row.menu_title}</span><strong>{row.meal_count}</strong></div>)}</div></article>; }
function Summary({ icon, value, label }: { icon: ReactNode; value: number; label: string }) { return <article><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article>; }
function formatDate(date: string) { return new Date(`${date}T00:00:00`).toLocaleDateString("en-BD", { weekday: "short", day: "numeric", month: "short" }); }
function formatTime(value: string) { return new Date(value).toLocaleTimeString("en-BD", { timeZone: "Asia/Dhaka", hour: "numeric", minute: "2-digit" }); }
