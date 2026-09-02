"use client";

import Link from "next/link";
import { CalendarDays, ChefHat, ChevronDown, Clock3, Download, MapPin, Search, Truck, UtensilsCrossed, Warehouse } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { Button, EmptyState, ErrorState, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { countState, filterOperationRows, fulfillmentCsv, fulfillmentTotals, groupByEnterprise, groupForDispatch, presetRange, procurementTotals, type FulfillmentRange, type OperationRow } from "@/lib/fulfillment";
import { superAdminNavigation } from "@/lib/super-admin-navigation";
import styles from "./fulfillment-dashboard.module.css";

type View = "ENTERPRISE" | "PROCUREMENT" | "DISPATCH";

export function OperationsDashboard({ fullName, initialRows, initialRange }: { fullName: string; initialRows: OperationRow[]; initialRange: FulfillmentRange }) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const [rows, setRows] = useState(initialRows);
  const [range, setRange] = useState(initialRange);
  const [draftRange, setDraftRange] = useState(initialRange);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("ENTERPRISE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ requestId?: string }>();
  const visibleRows = useMemo(() => filterOperationRows(rows, search), [rows, search]);
  const totals = fulfillmentTotals(visibleRows);
  const enterpriseGroups = useMemo(() => groupByEnterprise(visibleRows), [visibleRows]);
  const procurement = useMemo(() => procurementTotals(visibleRows), [visibleRows]);
  const dispatch = useMemo(() => groupForDispatch(visibleRows), [visibleRows]);
  const invalidDraft = !draftRange.from || !draftRange.to || draftRange.from > draftRange.to;

  async function loadRange(next: FulfillmentRange) {
    setDraftRange(next); setLoading(true); setError(undefined);
    try {
      const response = await fetch(`/api/admin/fulfillment?from=${encodeURIComponent(next.from)}&to=${encodeURIComponent(next.to)}`);
      const body = await response.json() as { rows?: OperationRow[]; requestId?: string };
      if (!response.ok || !body.rows) throw Object.assign(new Error(), { requestId: body.requestId });
      setRows(body.rows); setRange(next);
      window.history.replaceState(null, "", `/admin/fulfillment?from=${encodeURIComponent(next.from)}&to=${encodeURIComponent(next.to)}`);
    } catch (cause) { setError({ requestId: (cause as { requestId?: string }).requestId }); }
    finally { setLoading(false); }
  }

  function exportCsv() {
    const url = URL.createObjectURL(new Blob([fulfillmentCsv(visibleRows)], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `aamish-fulfillment-${range.from}-to-${range.to}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <AppShell workspace="Aamish operations" fullName={fullName} roleLabel="Aamish administrator" currentPath="/admin/fulfillment" navigation={superAdminNavigation}>
    <PageHeader eyebrow="Kitchen and dispatch" title="Fulfillment workspace" description="Turn live meal choices into clear kitchen quantities and destination-ready dispatch counts." actions={<Link className={styles.calendarLink} href={`/admin/calendar?start=${range.from}`}><CalendarDays size={17} aria-hidden="true" />Service planning</Link>} />
    <section className={styles.rangePanel} aria-label="Fulfillment date range"><div className={styles.quickRanges} aria-label="Quick date ranges"><Button type="button" size="small" variant={range.from === today && range.to === today ? "primary" : "secondary"} onClick={() => void loadRange(presetRange("TODAY", today))} disabled={loading}>Today</Button><Button type="button" size="small" variant="secondary" onClick={() => void loadRange(presetRange("NEXT_7", today))} disabled={loading}>Next 7 days</Button><Button type="button" size="small" variant="secondary" onClick={() => void loadRange(presetRange("PREVIOUS_7", today))} disabled={loading}>Previous 7 days</Button></div><div className={styles.dateFields}><label><span>From date</span><input type="date" value={draftRange.from} onChange={(event) => setDraftRange((current) => ({ ...current, from: event.target.value }))} /></label><label><span>To date</span><input type="date" value={draftRange.to} onChange={(event) => setDraftRange((current) => ({ ...current, to: event.target.value }))} /></label><Button type="button" size="small" loading={loading} loadingLabel="Loading…" disabled={invalidDraft} onClick={() => void loadRange(draftRange)}>Apply range</Button></div></section>
    {error && <ErrorState title="Fulfillment counts could not be loaded" description="Try applying the date range again." requestId={error.requestId} action={<Button type="button" variant="secondary" onClick={() => void loadRange(range)}>Try again</Button>} />}
    <section className={styles.summary} aria-label="Visible fulfillment totals"><Summary icon={<ChefHat />} value={totals.meals} label="Meals to prepare" /><Summary icon={<CalendarDays />} value={totals.services} label="Meal services" /><Summary icon={<MapPin />} value={totals.locations} label="Delivery locations" /><Summary icon={<UtensilsCrossed />} value={totals.menus} label="Menu variations" /></section>
    <section className={styles.toolbar} aria-label="Fulfillment tools"><label className={styles.search}><Search size={16} aria-hidden="true" /><span className="sr-only">Search fulfillment</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search enterprise, location, or menu" /></label><Button type="button" variant="secondary" size="small" onClick={exportCsv} disabled={visibleRows.length === 0}><Download size={15} aria-hidden="true" />Export visible CSV</Button></section>
    <div className={styles.viewTabs} role="tablist" aria-label="Fulfillment views"><button role="tab" aria-selected={view === "ENTERPRISE"} onClick={() => setView("ENTERPRISE")}><Warehouse size={16} aria-hidden="true" />Enterprise plan</button><button role="tab" aria-selected={view === "PROCUREMENT"} onClick={() => setView("PROCUREMENT")}><UtensilsCrossed size={16} aria-hidden="true" />Procurement</button><button role="tab" aria-selected={view === "DISPATCH"} onClick={() => setView("DISPATCH")}><Truck size={16} aria-hidden="true" />Dispatch</button></div>
    <div className={styles.resultHeading}><div><p>{formatRange(range)}</p><h2>{view === "ENTERPRISE" ? `${enterpriseGroups.length} enterprises` : view === "PROCUREMENT" ? `${procurement.length} menu requirements` : `${dispatch.length} dispatch stops`}</h2></div><span>{totals.meals} opted-in {totals.meals === 1 ? "meal" : "meals"}{search && " after search"}</span></div>
    {visibleRows.length === 0 ? <EmptyState icon={<ChefHat size={25} aria-hidden="true" />} title="No meal requirements found" description={search ? "No enterprise, location, or menu matches this search." : "No employees have opted in for a published service in this date range."} action={search ? <Button type="button" variant="secondary" onClick={() => setSearch("")}>Clear search</Button> : <Link className={styles.emptyLink} href="/admin/calendar">Open service planning</Link>} /> : <>{view === "ENTERPRISE" && <EnterprisePlan groups={enterpriseGroups} />}{view === "PROCUREMENT" && <ProcurementTable rows={procurement} />}{view === "DISPATCH" && <DispatchPlan groups={dispatch} />}</>}
  </AppShell>;
}

function EnterprisePlan({ groups }: { groups: ReturnType<typeof groupByEnterprise> }) { return <section className={styles.enterprisePlan} aria-label="Requirements by enterprise">{groups.map((enterprise, index) => <details className={styles.enterprise} key={enterprise.name} open={index === 0}><summary><span className={styles.chevron}><ChevronDown aria-hidden="true" /></span><span><strong>{enterprise.name}</strong><small>{enterprise.locations.length} {enterprise.locations.length === 1 ? "location" : "locations"}</small></span><CountSplit total={enterprise.total} open={enterprise.open} locked={enterprise.locked} /></summary><div className={styles.locations}>{enterprise.locations.map((location) => <section className={styles.location} key={location.name}><header><div><MapPin size={16} aria-hidden="true" /><strong>{location.name}</strong></div><b>{location.total} meals</b></header><MenuTable rows={location.rows} /></section>)}</div></details>)}</section>; }
function ProcurementTable({ rows }: { rows: ReturnType<typeof procurementTotals> }) { return <div className={styles.tableWrap}><table className={styles.dataTable}><caption className="sr-only">Procurement quantities by menu</caption><thead><tr><th>Menu</th><th>Enterprises</th><th>Locations</th><th>Open</th><th>Locked</th><th>Total quantity</th></tr></thead><tbody>{rows.map((row) => <tr key={row.menu}><th scope="row">{row.menu}</th><td data-label="Enterprises">{row.enterprises}</td><td data-label="Locations">{row.locations}</td><td data-label="Open">{row.open}</td><td data-label="Locked">{row.locked}</td><td data-label="Total quantity"><strong>{row.total}</strong></td></tr>)}</tbody></table></div>; }
function DispatchPlan({ groups }: { groups: ReturnType<typeof groupForDispatch> }) { return <section className={styles.dispatchGrid} aria-label="Dispatch requirements">{groups.map((group) => <article className={styles.dispatchCard} key={group.key}><header><div><time dateTime={group.date}>{formatDate(group.date)}</time><span><Clock3 size={13} aria-hidden="true" />Cutoff {formatTime(group.cutoff)}</span></div><StatusBadge tone={countState(group.cutoff) === "LOCKED" ? "success" : "warning"}>{countState(group.cutoff) === "LOCKED" ? "COUNT LOCKED" : "CHOICES OPEN"}</StatusBadge></header><div className={styles.dispatchDestination}><MapPin aria-hidden="true" /><div><strong>{group.location}</strong><span>{group.enterprise}</span></div><b>{group.total}<small>meals</small></b></div><MenuTable rows={group.rows} compact /></article>)}</section>; }
function MenuTable({ rows, compact = false }: { rows: OperationRow[]; compact?: boolean }) { return <div className={compact ? styles.compactTable : styles.tableWrap}><table className={styles.menuTable}><caption className="sr-only">Menu quantities</caption><thead><tr><th>Date</th><th>Option</th><th>Menu</th><th>Count state</th><th>Quantity</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.schedule_id}:${row.location_name}:${row.option_label}:${row.menu_title}`}><td data-label="Date">{formatDate(row.schedule_date)}</td><td data-label="Option"><b className={styles.option}>{row.option_label}</b></td><th scope="row">{row.menu_title}</th><td data-label="Count state"><StatusBadge tone={countState(row.cutoff_time) === "LOCKED" ? "success" : "warning"}>{countState(row.cutoff_time)}</StatusBadge></td><td data-label="Quantity"><strong>{row.meal_count}</strong></td></tr>)}</tbody></table></div>; }
function CountSplit({ total, open, locked }: { total: number; open: number; locked: number }) { return <span className={styles.countSplit}><small>{open} open · {locked} locked</small><strong>{total}<em>meals</em></strong></span>; }
function Summary({ icon, value, label }: { icon: ReactNode; value: number; label: string }) { return <article><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article>; }
function formatDate(date: string) { return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-BD", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }); }
function formatTime(value: string) { return new Date(value).toLocaleTimeString("en-BD", { timeZone: "Asia/Dhaka", hour: "numeric", minute: "2-digit" }); }
function formatRange(range: FulfillmentRange) { return range.from === range.to ? formatDate(range.from) : `${formatDate(range.from)} – ${formatDate(range.to)}`; }
