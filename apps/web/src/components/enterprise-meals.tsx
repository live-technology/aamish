"use client";

import Link from "next/link";
import { CalendarDays, ImageIcon, MapPin, Search, Utensils } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { enterpriseNavigation } from "@/lib/enterprise-navigation";
import { orderSummary } from "@/lib/enterprise-orders";
import styles from "./enterprise-experience.module.css";

export type EnterpriseMealRow = { schedule_id: string; schedule_date: string; cutoff_time: string; status: string; location_name: string; option_label: string; menu_title: string; image_url: string | null; order_count: number };

export function filterEnterpriseMeals(rows: EnterpriseMealRow[], filters: { location: string; date: string; query: string }) {
  const query = filters.query.trim().toLowerCase();
  return rows.filter((row) => (!filters.location || row.location_name === filters.location) && (!filters.date || row.schedule_date === filters.date) && (!query || `${row.location_name} ${row.menu_title} ${row.option_label}`.toLowerCase().includes(query)));
}

export function EnterpriseMeals({ enterpriseName, fullName, rows }: { enterpriseName: string; fullName: string; rows: EnterpriseMealRow[] }) {
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => filterEnterpriseMeals(rows, { location, date, query }), [rows, location, date, query]);
  const summary = orderSummary(filtered);
  const locations = [...new Set(rows.map((row) => row.location_name))].sort();
  const grouped = groupMeals(filtered);

  return <AppShell workspace={enterpriseName} fullName={fullName} roleLabel="Enterprise administrator" currentPath="/enterprise/meals" navigation={enterpriseNavigation}>
    <PageHeader eyebrow="Meals" title="Meal plan and confirmed counts" description="Review the next 14 days by service date, delivery location, and menu option." actions={<Link className={styles.secondaryLink} href="/enterprise">Back to overview</Link>} />

    <section className={styles.mealSummary} aria-label="Filtered meal summary"><article><strong>{summary.todayOrders}</strong><span>Today</span></article><article><strong>{summary.upcomingDates}</strong><span>Upcoming days</span></article><article><strong>{summary.totalOrders}</strong><span>Confirmed meals</span></article></section>

    {rows.length > 0 && <div className={styles.filters}><label className={styles.search}><Search size={16} aria-hidden="true" /><span className="sr-only">Search meals</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search menu or location" /></label><label><span>Location</span><select value={location} onChange={(event) => setLocation(event.target.value)}><option value="">All locations</option>{locations.map((name) => <option key={name}>{name}</option>)}</select></label><label><span>Service date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>{(query || location || date) && <button type="button" onClick={() => { setQuery(""); setLocation(""); setDate(""); }}>Clear filters</button>}</div>}

    {rows.length === 0 ? <EmptyState icon={<CalendarDays size={25} aria-hidden="true" />} title="No upcoming meal service" description="Aamish has not published a menu for your organization in the next 14 days." /> : grouped.length === 0 ? <EmptyState icon={<Search size={25} aria-hidden="true" />} title="No meals match these filters" description="Clear a filter or choose another service date or location." /> : <section className={styles.mealGroups} aria-label="Meal services">{grouped.map((group) => <article className={styles.mealGroup} key={group.scheduleId}><header><time dateTime={group.date}><strong>{formatDate(group.date)}</strong><span>{formatWeekday(group.date)}</span></time><div><StatusBadge tone={group.status === "PUBLISHED" ? "success" : "neutral"}>{group.status}</StatusBadge><small>Cutoff {formatCutoff(group.cutoff)}</small></div></header><div className={styles.locationGroups}>{group.locations.map((destination) => <section className={styles.locationGroup} key={destination.name}><div className={styles.locationHeading}><span><MapPin size={17} aria-hidden="true" /></span><div><h2>{destination.name}</h2><p>{destination.orders} confirmed {destination.orders === 1 ? "meal" : "meals"}</p></div></div><div className={styles.options}>{destination.options.map((option) => <div key={`${option.label}-${option.menu}`}><span className={styles.optionImage}>{option.imageUrl ? <Image src={option.imageUrl} alt="" fill sizes="40px" /> : <ImageIcon size={18} aria-hidden="true" />}</span><b>{option.label}</b><span><Utensils size={14} aria-hidden="true" />{option.menu}</span><strong>{option.orders}</strong></div>)}</div></section>)}</div></article>)}</section>}
  </AppShell>;
}

function groupMeals(rows: EnterpriseMealRow[]) {
  const schedules = new Map<string, { scheduleId: string; date: string; cutoff: string; status: string; locations: Map<string, { name: string; orders: number; options: Array<{ label: string; menu: string; imageUrl: string | null; orders: number }> }> }>();
  for (const row of rows) {
    let schedule = schedules.get(row.schedule_id);
    if (!schedule) { schedule = { scheduleId: row.schedule_id, date: row.schedule_date, cutoff: row.cutoff_time, status: row.status, locations: new Map() }; schedules.set(row.schedule_id, schedule); }
    let destination = schedule.locations.get(row.location_name);
    if (!destination) { destination = { name: row.location_name, orders: 0, options: [] }; schedule.locations.set(row.location_name, destination); }
    destination.orders += row.order_count;
    destination.options.push({ label: row.option_label, menu: row.menu_title, imageUrl: row.image_url, orders: row.order_count });
  }
  return [...schedules.values()].map((schedule) => ({ ...schedule, locations: [...schedule.locations.values()] }));
}
function parseDate(value: string) { return new Date(`${value}T00:00:00`); }
function formatDate(value: string) { return parseDate(value).toLocaleDateString("en-BD", { day: "numeric", month: "long", year: "numeric" }); }
function formatWeekday(value: string) { return parseDate(value).toLocaleDateString("en-BD", { weekday: "long" }); }
function formatCutoff(value: string) { return new Date(value).toLocaleString("en-BD", { timeZone: "Asia/Dhaka", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); }
