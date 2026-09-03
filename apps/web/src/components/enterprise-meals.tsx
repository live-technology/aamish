"use client";

import Link from "next/link";
import { CalendarDays, MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { ResilientImage } from "@/components/ui/resilient-image";
import { enterpriseNavigation } from "@/lib/enterprise-navigation";
import { orderSummary } from "@/lib/enterprise-orders";
import styles from "./enterprise-experience.module.css";

export type EnterpriseMealRow = { schedule_id: string; schedule_date: string; cutoff_time: string; status: string; location_name: string; option_label: string; menu_title: string; menu_description: string; menu_price: number; image_url: string | null; order_count: number; opted_out_count: number };

export function filterEnterpriseMeals(rows: EnterpriseMealRow[], filters: { location: string; from: string; to: string; query: string }) {
  const query = filters.query.trim().toLowerCase();
  return rows.filter((row) => (!filters.location || row.location_name === filters.location) && (!filters.from || row.schedule_date >= filters.from) && (!filters.to || row.schedule_date <= filters.to) && (!query || `${row.location_name} ${row.menu_title} ${row.option_label}`.toLowerCase().includes(query)));
}

export function EnterpriseMeals({ enterpriseName, fullName, rows }: { enterpriseName: string; fullName: string; rows: EnterpriseMealRow[] }) {
  const [location, setLocation] = useState("");
  const [today] = useState(dhakaToday);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => filterEnterpriseMeals(rows, { location, from, to, query }), [rows, location, from, to, query]);
  const summary = orderSummary(filtered);
  const locations = [...new Set(rows.map((row) => row.location_name))].sort();
  const grouped = groupMeals(filtered);

  return <AppShell workspace={enterpriseName} fullName={fullName} roleLabel="Enterprise administrator" currentPath="/enterprise/meals" navigation={enterpriseNavigation}>
    <PageHeader eyebrow="Meals" title="Meal plan and confirmed counts" description="Start with today, then inspect a week or custom range by location and pictured menu." actions={<Link className={styles.secondaryLink} href="/enterprise">Back to overview</Link>} />

    <section className={styles.mealSummary} aria-label="Filtered meal summary"><article><strong>{summary.todayOrders}</strong><span>Today</span></article><article><strong>{summary.upcomingDates}</strong><span>Upcoming days</span></article><article><strong>{summary.totalOrders}</strong><span>Confirmed meals</span></article></section>

    {rows.length > 0 && <><div className={styles.quickRanges} aria-label="Meal date range"><button type="button" aria-pressed={from === today && to === today} onClick={() => setRange(0, 0)}>Today</button><button type="button" aria-pressed={from === today && to === addDays(today, 6)} onClick={() => setRange(0, 6)}>Next 7 days</button><button type="button" aria-pressed={from === addDays(today, -7) && to === addDays(today, -1)} onClick={() => setRange(-7, -1)}>Previous 7 days</button></div><div className={styles.filters}><label className={styles.search}><Search size={16} aria-hidden="true" /><span className="sr-only">Search meals</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search menu or location" /></label><label><span>Location</span><select value={location} onChange={(event) => setLocation(event.target.value)}><option value="">All locations</option>{locations.map((name) => <option key={name}>{name}</option>)}</select></label><DateRangePicker value={{ from, to }} onChange={(range) => { setFrom(range.from); setTo(range.to); }} label="Meal date range" />{(query || location) && <button type="button" onClick={() => { setQuery(""); setLocation(""); }}>Clear filters</button>}</div></>}

    {rows.length === 0 ? <EmptyState icon={<CalendarDays size={25} aria-hidden="true" />} title="No meal services" description="Aamish has not published a menu for this organization in the available date window." /> : grouped.length === 0 ? <EmptyState icon={<Search size={25} aria-hidden="true" />} title="No meals match these filters" description="Choose another date range or clear the location and search filters." /> : <section className={styles.mealGroups} aria-label="Meal services">{grouped.map((group) => <article className={styles.mealGroup} key={group.scheduleId}><header><time dateTime={group.date}><strong>{formatDate(group.date)}</strong><span>{formatWeekday(group.date)}</span></time><div><StatusBadge tone={group.status === "PUBLISHED" ? "success" : "neutral"}>{group.status}</StatusBadge><small>Cutoff {formatCutoff(group.cutoff)}</small></div></header><div className={styles.locationGroups}>{group.locations.map((destination) => <section className={styles.locationGroup} key={destination.name}><div className={styles.locationHeading}><span><MapPin size={17} aria-hidden="true" /></span><div><h2>{destination.name}</h2><p>{destination.orders} confirmed · {destination.optedOut} skipped</p></div></div><div className={styles.options}>{destination.options.map((option) => <div key={`${option.label}-${option.menu}`}><span className={styles.optionImage}><ResilientImage src={option.imageUrl} surface="enterprise-meal" fallbackLabel="Meal image unavailable" alt={`${option.menu} meal`} fill sizes="72px" /></span><b>{option.label}</b><span className={styles.optionDetails}><strong>{option.menu}</strong><small>{option.description}</small><em>{formatPrice(option.price)}</em></span><strong aria-label={`${option.orders} confirmed meals`}>{option.orders}</strong></div>)}</div></section>)}</div></article>)}</section>}
  </AppShell>;

  function setRange(fromOffset: number, toOffset: number) { setFrom(addDays(today, fromOffset)); setTo(addDays(today, toOffset)); }
}

export function groupMeals(rows: EnterpriseMealRow[]) {
  const schedules = new Map<string, { scheduleId: string; date: string; cutoff: string; status: string; locations: Map<string, { name: string; orders: number; optedOut: number; options: Array<{ label: string; menu: string; description: string; price: number; imageUrl: string | null; orders: number }> }> }>();
  for (const row of rows) {
    let schedule = schedules.get(row.schedule_id);
    if (!schedule) { schedule = { scheduleId: row.schedule_id, date: row.schedule_date, cutoff: row.cutoff_time, status: row.status, locations: new Map() }; schedules.set(row.schedule_id, schedule); }
    let destination = schedule.locations.get(row.location_name);
    if (!destination) { destination = { name: row.location_name, orders: 0, optedOut: row.opted_out_count, options: [] }; schedule.locations.set(row.location_name, destination); }
    destination.orders += row.order_count;
    destination.options.push({ label: row.option_label, menu: row.menu_title, description: row.menu_description, price: row.menu_price, imageUrl: row.image_url, orders: row.order_count });
  }
  return [...schedules.values()].map((schedule) => ({ ...schedule, locations: [...schedule.locations.values()] }));
}
function dhakaToday() { return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" }); }
function addDays(value: string, days: number) { const date = new Date(`${value}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); }
function parseDate(value: string) { return new Date(`${value}T00:00:00`); }
function formatDate(value: string) { return parseDate(value).toLocaleDateString("en-BD", { day: "numeric", month: "long", year: "numeric" }); }
function formatWeekday(value: string) { return parseDate(value).toLocaleDateString("en-BD", { weekday: "long" }); }
function formatCutoff(value: string) { return new Date(value).toLocaleString("en-BD", { timeZone: "Asia/Dhaka", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); }
function formatPrice(value: number) { return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: Number.isInteger(value) ? 0 : 2 }).format(value); }
