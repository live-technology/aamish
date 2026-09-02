"use client";

import Image from "next/image";
import { CalendarDays, Clock3, ImageIcon, MapPin, Star } from "lucide-react";
import { useState } from "react";
import { EmployeeReviewWorkspace } from "@/components/employee-review-workspace";
import { AppShell } from "@/components/ui/app-shell";
import { Alert, Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { clientErrorMessage } from "@/lib/client-errors";
import { employeeNavigation } from "@/lib/employee-navigation";
import type { ReviewPhoto } from "@/lib/reviews";
import styles from "./employee-experience.module.css";

type Option = { id: string; label: string; title: string; description: string; image_url: string | null };
export type EmployeeSchedule = {
  id: string; schedule_date: string; cutoff_time: string; status: string; is_opted_in: boolean;
  selected_option_id: string | null; location_name: string; can_review: boolean; options: Option[];
  review_id: string | null; review_rating: number | null; review_comment: string | null;
  review_created_at: string | null; review_updated_at: string | null; review_photos: ReviewPhoto[];
  review_voice_public_id: string | null; review_voice_url: string | null; review_voice_duration_seconds: number | null;
};

export function EmployeePortal({ fullName, enterpriseName, schedules: initialSchedules, view }: { fullName: string; enterpriseName: string; schedules: EmployeeSchedule[]; view: "today" | "schedule" | "reviews" }) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [message, setMessage] = useState("");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const upcoming = schedules.filter((schedule) => schedule.schedule_date >= today).sort((a, b) => a.schedule_date.localeCompare(b.schedule_date));
  const active = upcoming[0];

  async function updatePreference(schedule: EmployeeSchedule, optedIn: boolean, selectedOptionId?: string) {
    const response = await fetch("/api/preferences", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ scheduleId: schedule.id, optedIn, selectedOptionId }) });
    const data = await response.json();
    if (!response.ok) return setMessage(clientErrorMessage(data.error, "The meal preference could not be updated."));
    setSchedules((current) => current.map((item) => item.id === schedule.id ? { ...item, is_opted_in: optedIn, selected_option_id: selectedOptionId || item.selected_option_id } : item));
    setMessage(`Meal preference updated for ${formatDate(schedule.schedule_date)}.`);
  }

  const path = view === "today" ? "/employee" : view === "schedule" ? "/employee/schedule" : "/employee/reviews";
  return <AppShell workspace={enterpriseName} fullName={fullName} roleLabel="Employee" currentPath={path} navigation={employeeNavigation}>
    {view === "today" && <TodayMeal schedule={active} today={today} updatePreference={updatePreference} />}
    {view === "schedule" && <MealCalendar schedules={schedules} today={today} updatePreference={updatePreference} />}
    {view === "reviews" && <EmployeeReviewWorkspace schedules={schedules} onSaved={(scheduleId, review) => setSchedules((current) => current.map((item) => item.id === scheduleId ? { ...item, ...review } : item))} />}
    {message && view !== "reviews" && <div className={styles.message}><Alert tone="info" title="Meal preference">{message}</Alert></div>}
  </AppShell>;
}

function TodayMeal({ schedule, today, updatePreference }: { schedule: EmployeeSchedule | undefined; today: string; updatePreference: (schedule: EmployeeSchedule, optedIn: boolean, selectedOptionId?: string) => Promise<void> }) {
  if (!schedule) return <><PageHeader eyebrow="Today" title="Your meal" description="Confirm the meal you are receiving before the cutoff."/><EmptyState icon={<CalendarDays size={25}/>} title="No upcoming meal" description="Your company’s next published meal will appear here."/></>;
  const locked = new Date(schedule.cutoff_time) <= new Date();
  return <><PageHeader eyebrow="Today" title="Your meal" description="Confirm the meal you are receiving before the cutoff."/><Card className={styles.today} padded={false}><header><div><time>{formatDate(schedule.schedule_date)}</time><h2>{schedule.schedule_date === today ? "Today’s meal" : "Your next meal"}</h2><span><MapPin size={14}/>{schedule.location_name}</span></div><StatusBadge tone={locked ? "neutral" : "success"}><Clock3 size={12}/>{locked ? "Cutoff passed" : `Cutoff ${formatCutoff(schedule.cutoff_time)}`}</StatusBadge></header><div className={styles.options}>{schedule.options.map((option) => <button type="button" key={option.id} disabled={locked || !schedule.is_opted_in} onClick={() => updatePreference(schedule, true, option.id)} className={schedule.selected_option_id === option.id ? styles.selected : ""}><OptionImage option={option}/><span className={styles.optionCopy}><b>Option {option.label}</b><strong>{option.title}</strong><small>{option.description}</small></span>{schedule.selected_option_id === option.id && <em>Selected</em>}</button>)}</div><footer><div><strong>{schedule.is_opted_in ? "Meal reserved" : "Meal skipped"}</strong><span>{locked ? "The cutoff passed; contact your office administrator if this is incorrect." : schedule.is_opted_in ? "You are included in the kitchen count." : "Reserve again before cutoff if plans change."}</span></div><Button variant={schedule.is_opted_in ? "secondary" : "primary"} disabled={locked} onClick={() => updatePreference(schedule, !schedule.is_opted_in)}>{schedule.is_opted_in ? "Skip this meal" : "Reserve meal"}</Button></footer></Card></>;
}

export function MealCalendar({ schedules, today, updatePreference }: { schedules: EmployeeSchedule[]; today: string; updatePreference: (schedule: EmployeeSchedule, optedIn: boolean, selectedOptionId?: string) => Promise<void> }) {
  return <><PageHeader eyebrow="Calendar" title="Meals and reviews" description="See historical meals and reviews, today’s service, and every planned meal."/>{schedules.length === 0 ? <EmptyState icon={<CalendarDays size={25}/>} title="No meal history or plans" description="Published meals will appear here."/> : <section className={styles.calendar} aria-label="Historical, current, and planned meals">{schedules.map((item) => {
    const phase = item.schedule_date < today ? "Past" : item.schedule_date === today ? "Today" : "Planned";
    const locked = new Date(item.cutoff_time) <= new Date();
    const selected = item.options.find((option) => option.id === item.selected_option_id) || item.options[0];
    return <Card className={styles.calendarRow} key={item.id}><header><div><span>{phase}</span><time>{formatDate(item.schedule_date)}</time></div><StatusBadge tone={phase === "Today" ? "info" : phase === "Planned" ? "success" : "neutral"}>{item.is_opted_in ? phase === "Past" ? "Received" : "Receiving" : "Skipped"}</StatusBadge></header><div className={styles.calendarMeal}><strong>{selected?.title || "Meal service"}</strong><span>{item.location_name} · {item.options.length} {item.options.length === 1 ? "option" : "options"}</span></div>{phase === "Past" ? <footer><span className={styles.reviewState}><Star size={14} fill={item.review_id ? "currentColor" : "none"}/>{item.review_id ? `Reviewed ${item.review_rating}/5` : item.is_opted_in ? "Awaiting review" : "Not reviewable"}</span></footer> : <footer><label><span>Meal option</span><select aria-label={`Meal option for ${formatDate(item.schedule_date)}`} value={item.selected_option_id || ""} disabled={locked || !item.is_opted_in} onChange={(event) => void updatePreference(item, true, event.target.value)}>{item.options.map((option) => <option value={option.id} key={option.id}>{option.label} · {option.title}</option>)}</select></label><div><small>{locked ? "Cutoff passed" : `Cutoff ${formatCutoff(item.cutoff_time)}`}</small><Button size="small" variant={item.is_opted_in ? "secondary" : "primary"} disabled={locked} onClick={() => updatePreference(item, !item.is_opted_in)}>{item.is_opted_in ? "Skip" : "Reserve"}</Button></div></footer>}</Card>;
  })}</section>}</>;
}

function OptionImage({ option }: { option: Option }) { return <span className={styles.optionImage}>{option.image_url ? <Image src={option.image_url} alt="" fill sizes="(max-width: 600px) 90vw, 260px"/> : <ImageIcon size={24}/>}</span>; }
function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-BD", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
function formatCutoff(value: string) { return new Date(value).toLocaleTimeString("en-BD", { timeZone: "Asia/Dhaka", hour: "numeric", minute: "2-digit" }); }
