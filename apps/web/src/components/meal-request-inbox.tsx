"use client";

import { Mic, ArrowUpRight } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SelectField, StatusBadge } from "./ui/primitives";
import { requestStatuses, type RequestStatus } from "@/lib/meal-requests";
import styles from "./meal-request-inbox.module.css";

export type MealRequestRow = { id: string; requirement: string | null; contact: string; contact_type: "email" | "phone"; status: RequestStatus; created_at: string; has_audio: boolean; audio_duration_seconds: number | null };
const labels = { new: "New", contacted: "Contacted", closed: "Closed" };

function RequestRow({ row }: { row: MealRequestRow }) {
  const [status, setStatus] = useState(row.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [audioError, setAudioError] = useState(false);
  const [audioAttempt, setAudioAttempt] = useState(0);
  async function update(next: RequestStatus) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/meal-requests/${row.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.success !== true) throw new Error(body.error || "Couldn’t update the status.");
      setStatus(next);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Couldn’t update the status. Try again."); }
    finally { setBusy(false); }
  }
  return <tr>
    <td data-label="Contact"><a className={styles.contact} href={`${row.contact_type === "email" ? "mailto:" : "tel:"}${row.contact}`}>{row.contact}<ArrowUpRight size={15} aria-hidden="true" /></a><span className={styles.contactType}>{row.contact_type === "email" ? "Email enquiry" : "Phone enquiry"}</span></td>
    <td data-label="Requirement"><details className={styles.details}><summary><span>{row.requirement || "Voice message"}</span><small>Open request {row.has_audio && <Mic size={14} aria-label="Includes voice message" />}</small></summary><div className={styles.fullRequest}>{row.requirement && <p>{row.requirement}</p>}{row.has_audio && <div className={styles.voice}><span><Mic size={15} aria-hidden="true" /> Voice message · {Math.ceil(row.audio_duration_seconds || 0)} seconds</span><audio key={audioAttempt} controls preload="none" src={`/api/admin/meal-requests/${row.id}/audio`} aria-label={`Voice requirement from ${row.contact}`} onError={() => setAudioError(true)} />{audioError && <p role="alert">Couldn’t play this recording. <button onClick={() => { setAudioError(false); setAudioAttempt(value => value + 1); }}>Retry playback</button></p>}</div>}</div></details></td>
    <td data-label="Received"><time dateTime={row.created_at}>{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka" }).format(new Date(row.created_at))}<small>{new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dhaka" }).format(new Date(row.created_at))} · Dhaka</small></time></td>
    <td data-label="Follow-up"><StatusBadge tone={status === "new" ? "warning" : status === "contacted" ? "info" : "success"}>{labels[status]}</StatusBadge><div className={styles.statusControl}><SelectField name={`status-${row.id}`} label="Follow-up status" value={status} disabled={busy} onChange={event => void update(event.target.value as RequestStatus)}>{requestStatuses.map(value => <option key={value} value={value}>{labels[value]}</option>)}</SelectField></div>{busy && <small role="status">Saving…</small>}{error && <p className={styles.error} role="alert">{error}</p>}</td>
  </tr>;
}

export function MealRequestInbox({ rows }: { rows: MealRequestRow[] }) {
  return <div className={styles.inbox}><div className={styles.inboxTitle}><h2>The enquiry table</h2><span>Newest first · {rows.length} on this page</span></div><table><caption className={styles.srOnly}>Meal enquiries and follow-up status</caption><thead><tr><th>Contact</th><th>Requirement</th><th>Received</th><th>Follow-up</th></tr></thead><tbody>{rows.map(row => <RequestRow key={`${row.id}:${row.status}`} row={row} />)}</tbody></table></div>;
}

export function RefreshMealRequests() {
  const router = useRouter();
  const [pending, refresh] = useTransition();
  return <button type="button" className={styles.refresh} disabled={pending} onClick={() => refresh(() => router.refresh())}>{pending ? "Refreshing…" : "Refresh requests"}</button>;
}
