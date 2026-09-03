"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import styles from "./date-range-picker.module.css";

export type DateRangeValue = { from: string; to: string };

export function orderedRange(first: string, second: string): DateRangeValue {
  return first <= second ? { from: first, to: second } : { from: second, to: first };
}

export function calendarDays(month: string) {
  const first = parseDate(`${month}-01`);
  const start = new Date(first);
  start.setUTCDate(1 - first.getUTCDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return isoDate(date);
  });
}

export function DateRangePicker({ value, onChange, label = "Date range", min, max, disabled = false }: { value: DateRangeValue; onChange: (value: DateRangeValue) => void; label?: string; min?: string; max?: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [anchor, setAnchor] = useState(value.from);
  const [month, setMonth] = useState((value.from || isoDate(new Date())).slice(0, 7));
  const [focusDate, setFocusDate] = useState(value.from);
  const pickerRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef(new Map<string, HTMLButtonElement>());
  const days = calendarDays(month);

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) { setOpen(false); setSelectingEnd(false); }
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  useEffect(() => {
    if (open) dayRefs.current.get(focusDate)?.focus();
  }, [focusDate, month, open]);

  function toggle() {
    if (open) { setOpen(false); setSelectingEnd(false); return; }
    setMonth((value.from || isoDate(new Date())).slice(0, 7));
    setFocusDate(value.from);
    setOpen(true);
    setSelectingEnd(false);
  }

  function select(date: string) {
    if (!selectingEnd) {
      setAnchor(date);
      onChange({ from: date, to: date });
      setSelectingEnd(true);
      return;
    }
    onChange(orderedRange(anchor, date));
    setSelectingEnd(false);
    setOpen(false);
  }

  function moveFocus(date: string, event: KeyboardEvent<HTMLButtonElement>) {
    const offsets: Partial<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next: string | undefined;
    if (offsets[event.key]) next = addDays(date, offsets[event.key]!);
    if (event.key === "Home") next = addDays(date, -parseDate(date).getUTCDay());
    if (event.key === "End") next = addDays(date, 6 - parseDate(date).getUTCDay());
    if (event.key === "PageUp") next = sameDayOtherMonth(date, -1);
    if (event.key === "PageDown") next = sameDayOtherMonth(date, 1);
    if (!next) return;
    event.preventDefault();
    if ((min && next < min) || (max && next > max)) return;
    setFocusDate(next);
    setMonth(next.slice(0, 7));
  }

  return <div ref={pickerRef} className={styles.picker} onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); setSelectingEnd(false); } }}>
    <span className={styles.label}>{label}</span>
    <button className={styles.trigger} type="button" disabled={disabled} aria-haspopup="dialog" aria-expanded={open} onClick={toggle}>
      <CalendarDays size={16} aria-hidden="true" />
      <span>{formatDate(value.from)} <b aria-hidden="true">→</b> {formatDate(value.to)}</span>
    </button>
    {open && <section className={styles.popover} role="dialog" aria-modal="false" aria-label={`${label} calendar`}>
      <header>
        <button type="button" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft aria-hidden="true" /></button>
        <strong aria-live="polite">{formatMonth(month)}</strong>
        <button type="button" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight aria-hidden="true" /></button>
      </header>
      <p className={styles.instruction}>{selectingEnd ? "Choose the end date" : "Choose the start date"}</p>
      <div className={styles.weekdays} aria-hidden="true">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className={styles.grid} role="grid" aria-label={formatMonth(month)}>
        {days.map((date) => {
          const outside = date.slice(0, 7) !== month;
          const unavailable = Boolean((min && date < min) || (max && date > max));
          const inRange = date >= value.from && date <= value.to;
          const edge = date === value.from || date === value.to;
          return <button ref={(node) => { if (node) dayRefs.current.set(date, node); else dayRefs.current.delete(date); }} key={date} type="button" role="gridcell" tabIndex={date === focusDate ? 0 : -1} disabled={unavailable} aria-label={fullDate(date)} aria-selected={inRange} data-outside={outside || undefined} data-range={inRange || undefined} data-edge={edge || undefined} onFocus={() => setFocusDate(date)} onKeyDown={(event) => moveFocus(date, event)} onClick={() => select(date)}>{Number(date.slice(8))}</button>;
        })}
      </div>
    </section>}
  </div>;
}

function parseDate(value: string) { return new Date(`${value}T00:00:00Z`); }
function isoDate(value: Date) { return value.toISOString().slice(0, 10); }
function addDays(value: string, amount: number) { const date = parseDate(value); date.setUTCDate(date.getUTCDate() + amount); return isoDate(date); }
function addMonths(month: string, amount: number) { const date = parseDate(`${month}-01`); date.setUTCMonth(date.getUTCMonth() + amount); return isoDate(date).slice(0, 7); }
function sameDayOtherMonth(value: string, amount: number) { const date = parseDate(value); const day = date.getUTCDate(); date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + amount); const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate(); date.setUTCDate(Math.min(day, lastDay)); return isoDate(date); }
function formatDate(value: string) { return parseDate(value).toLocaleDateString("en-BD", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }); }
function fullDate(value: string) { return parseDate(value).toLocaleDateString("en-BD", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
function formatMonth(value: string) { return parseDate(`${value}-01`).toLocaleDateString("en-BD", { timeZone: "UTC", month: "long", year: "numeric" }); }
