"use client";

import Image from "next/image";
import { CalendarDays, Flag, Mic, Search, Square, Star, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EmployeeSchedule } from "@/components/employee-portal";
import { Alert, Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { clientErrorMessage, validateImage } from "@/lib/client-errors";
import { mealsForHistory } from "@/lib/employee-meals";
import { formatRecordingTime, recordingTime } from "@/lib/recording-timer";
import { reviewIsEditable, type ReviewPhoto, type ReviewVoice } from "@/lib/reviews";
import styles from "./employee-experience.module.css";

const MAX_VOICE_SECONDS = 60;
const MAX_VOICE_BYTES = 10 * 1024 * 1024;

async function upload(file: File, resourceType: "image" | "video") {
  const signatureResponse = await fetch("/api/uploads/signature", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "review" }) });
  const signed = await signatureResponse.json();
  if (!signatureResponse.ok) throw new Error(signed.error || "UPLOAD_SIGNATURE_FAILED");
  const form = new FormData();
  form.set("file", file); form.set("api_key", signed.apiKey); form.set("timestamp", String(signed.timestamp)); form.set("signature", signed.signature); form.set("folder", signed.folder);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/${resourceType}/upload`, { method: "POST", body: form });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "UPLOAD_FAILED");
  return data as { public_id: string; secure_url: string };
}

async function uploadPhoto(file: File): Promise<ReviewPhoto> {
  const data = await upload(file, "image");
  return { publicId: data.public_id, url: data.secure_url, thumbnailUrl: data.secure_url.replace("/upload/", "/upload/c_fill,w_320,h_240,q_auto,f_auto/") };
}

export function EmployeeReviewWorkspace({ schedules, today, onSaved }: { schedules: EmployeeSchedule[]; today: string; onSaved: (scheduleId: string, review: Partial<EmployeeSchedule>) => void }) {
  const history = useMemo(() => schedules.filter((item) => item.schedule_date < today).sort((a, b) => b.schedule_date.localeCompare(a.schedule_date)), [schedules, today]);
  const initialTarget = history.find((item) => item.can_review) || history[0];
  const [selectedId, setSelectedId] = useState(initialTarget?.id || "");
  const target = history.find((item) => item.id === selectedId) || initialTarget;
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [nowMs, setNowMs] = useState(0);
  const [rating, setRating] = useState(initialTarget?.review_rating || 0);
  const [comment, setComment] = useState(initialTarget?.review_comment || "");
  const [photos, setPhotos] = useState<ReviewPhoto[]>(initialTarget?.review_photos || []);
  const [voice, setVoice] = useState<ReviewVoice | null>(reviewVoice(initialTarget));
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState("");
  const [duration, setDuration] = useState(0);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger" | "info"; text: string } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [reportStatus, setReportStatus] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const checkingEditWindow = Boolean(target?.review_id && !nowMs);
  const readOnly = Boolean(target?.review_id && target.review_created_at && (!nowMs || !reviewIsEditable(target.review_created_at, new Date(nowMs))));
  const filteredHistory = mealsForHistory(schedules, today, { query, from: fromDate, to: toDate });

  useEffect(() => () => { if (audioPreview) URL.revokeObjectURL(audioPreview); streamRef.current?.getTracks().forEach((track) => track.stop()); }, [audioPreview]);
  useEffect(() => { const kickoff = window.setTimeout(() => setNowMs(Date.now()), 0); const timer = window.setInterval(() => setNowMs(Date.now()), 30_000); return () => { window.clearTimeout(kickoff); window.clearInterval(timer); }; }, []);
  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => {
      const state = recordingTime((Date.now() - startedAtRef.current) / 1000, MAX_VOICE_SECONDS);
      setDuration(state.elapsed);
      if (state.complete && recorderRef.current?.state === "recording") recorderRef.current.stop();
    }, 500);
    return () => window.clearInterval(timer);
  }, [recording]);

  function clearVoice() { if (audioPreview) URL.revokeObjectURL(audioPreview); setAudioFile(null); setAudioPreview(""); setDuration(0); setVoice(null); }
  function chooseTarget(item: EmployeeSchedule) {
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    recorderRef.current?.stop(); setSelectedId(item.id); setRating(item.review_rating || 0); setComment(item.review_comment || ""); setPhotos(item.review_photos || []);
    setVoice(reviewVoice(item)); setAudioFile(null); setAudioPreview(""); setDuration(0); setMessage(null); setReportOpen(false); setReportMessage(""); setReportStatus(null);
  }

  async function startRecording() {
    setMessage(null); clearVoice();
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return setMessage({ tone: "danger", text: "Voice recording is not supported in this browser." });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferred = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined;
      const recorder = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined);
      recorderRef.current = recorder; chunksRef.current = []; startedAtRef.current = Date.now();
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const seconds = Math.min(MAX_VOICE_SECONDS, Math.max(1, Math.ceil((Date.now() - startedAtRef.current) / 1000)));
        const type = recorder.mimeType || "audio/webm"; const blob = new Blob(chunksRef.current, { type });
        stream.getTracks().forEach((track) => track.stop()); streamRef.current = null; recorderRef.current = null; setRecording(false); setDuration(seconds);
        if (blob.size > MAX_VOICE_BYTES) return setMessage({ tone: "danger", text: "That recording is larger than 10 MB. Please record a shorter note." });
        const extension = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        setAudioFile(new File([blob], `aamish-review-${Date.now()}.${extension}`, { type })); setAudioPreview(URL.createObjectURL(blob));
      };
      recorder.start(1000); setDuration(0); setRecording(true);
    } catch { setMessage({ tone: "danger", text: "Microphone access was not available. You can still submit text and photos." }); }
  }

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    if (files.length > 5 - photos.length) return setMessage({ tone: "danger", text: `You can attach up to five photos. Choose ${5 - photos.length} or fewer.` });
    const selected = [...files]; const invalid = selected.map((file) => validateImage(file, 10)).find(Boolean);
    if (invalid) return setMessage({ tone: "danger", text: invalid });
    setBusy(true); setMessage(null);
    try { const uploaded = await Promise.all(selected.map(uploadPhoto)); setPhotos((current) => [...current, ...uploaded]); }
    catch (error) { setMessage({ tone: "danger", text: clientErrorMessage(error instanceof Error ? error.message : "UPLOAD_FAILED") }); }
    finally { setBusy(false); }
  }

  async function saveReview() {
    if (!target || !rating || readOnly || !target.can_review) return;
    setBusy(true); setMessage(null);
    try {
      let savedVoice = voice;
      if (audioFile) { const uploaded = await upload(audioFile, "video"); savedVoice = { publicId: uploaded.public_id, url: uploaded.secure_url, durationSeconds: duration }; }
      const response = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scheduleId: target.id, rating, comment, tags: [], photos, voice: savedVoice }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw { code: data.error, requestId: data.requestId };
      const review = { review_id: data.reviewId, review_rating: rating, review_comment: comment, review_created_at: data.createdAt, review_updated_at: new Date().toISOString(), review_photos: photos, review_voice_public_id: savedVoice?.publicId || null, review_voice_url: savedVoice?.url || null, review_voice_duration_seconds: savedVoice?.durationSeconds || null };
      onSaved(target.id, review); setVoice(savedVoice); setAudioFile(null); setNowMs(Date.now()); setMessage({ tone: "success", text: data.updated ? "Review updated. The original 24-hour deadline is unchanged." : "Review submitted. You can edit it for exactly 24 hours." });
    } catch (caught) {
      const error = caught as { code?: string; requestId?: string };
      setMessage({ tone: "danger", text: `${clientErrorMessage(error.code || "REVIEW_FAILED", "The review could not be saved.")}${error.requestId ? ` Request ID: ${error.requestId}.` : ""}` });
    } finally { setBusy(false); }
  }

  async function submitQualityReport() {
    if (!target || !target.can_review || reportMessage.trim().length < 3) return;
    setReportBusy(true); setReportStatus(null);
    try {
      const response = await fetch("/api/food-quality-reports", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scheduleId: target.id, message: reportMessage }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw { code: data.error, requestId: data.requestId };
      setReportMessage(""); setReportStatus({ tone: "success", text: "Issue sent to the food-quality team." });
    } catch (caught) {
      const error = caught as { code?: string; requestId?: string };
      setReportStatus({ tone: "danger", text: `${clientErrorMessage(error.code || "FOOD_QUALITY_REPORT_FAILED")}${error.requestId ? ` Request ID: ${error.requestId}.` : ""}` });
    } finally { setReportBusy(false); }
  }

  return <>
    <PageHeader eyebrow="Meal history" title="History & reviews" description="Find any past meal and share feedback whenever you are ready. After first submission, edits remain open for exactly 24 hours."/>
    {history.length === 0 ? <EmptyState icon={<CalendarDays size={25}/>} title="No meal history yet" description="Past meals will appear here after your first scheduled service."/> : <div className={styles.historyWorkspace}>
      <aside className={styles.historyPanel} aria-label="Past meal history">
        <div className={styles.historyFilters}><label className={styles.historySearch}><Search size={15}/><span className="sr-only">Search meal history</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search meal or location"/></label><div className={styles.historyDates}><label><span>From</span><input type="date" max={today} value={fromDate} onChange={(event) => setFromDate(event.target.value)}/></label><label><span>To</span><input type="date" max={today} value={toDate} onChange={(event) => setToDate(event.target.value)}/></label></div></div>
        <p className={styles.historyCount}>{filteredHistory.length} {filteredHistory.length === 1 ? "meal" : "meals"}</p>
        <div className={styles.reviewHistory}>{filteredHistory.map((item) => { const state = reviewState(item, nowMs); return <button type="button" className={item.id === target?.id ? styles.activeReview : ""} onClick={() => chooseTarget(item)} key={item.id} aria-current={item.id === target?.id ? "true" : undefined}><span><strong>{formatDate(item.schedule_date)}</strong><small>{selectedMeal(item)} · {item.location_name}</small></span><span className={styles.historyStatus}><StatusBadge tone={state.tone}>{state.label}</StatusBadge>{state.detail && <small>{state.detail}</small>}</span></button>; })}{filteredHistory.length === 0 && <div className={styles.noHistoryResults}><strong>No matching meals</strong><span>Try a different search or date range.</span></div>}</div>
      </aside>
      {target && !target.can_review ? <Card className={styles.historyDetail}><div className={styles.reviewHeading}><div><p>Meal on {formatDate(target.schedule_date)}</p><h2>{selectedMeal(target)}</h2><span className={styles.detailLocation}>{target.location_name}</span></div><StatusBadge tone="neutral">Skipped</StatusBadge></div><EmptyState icon={<CalendarDays size={24}/>} title="No meal received" description="You skipped this meal, so there is nothing to review."/></Card> : target && <Card className={styles.review}>
        <div className={styles.reviewHeading}><div><p>Meal on {formatDate(target.schedule_date)}</p><h2>{selectedMeal(target)}</h2><span className={styles.detailLocation}>{target.location_name}</span></div><StatusBadge tone={readOnly || checkingEditWindow ? "neutral" : "info"}>{target.review_id ? checkingEditWindow ? "Checking status…" : readOnly ? "Read only" : editTimeRemaining(target.review_created_at!, nowMs) : "Review anytime"}</StatusBadge></div>
        {target.review_id && target.review_created_at && !checkingEditWindow && <Alert tone={readOnly ? "info" : "warning"} title={readOnly ? "Review history protected" : "Original edit deadline"}>{readOnly ? `The 24-hour edit window closed ${formatTimestamp(new Date(new Date(target.review_created_at).valueOf() + 86_400_000).toISOString())}. This review cannot be changed or deleted.` : `Edits close ${formatTimestamp(new Date(new Date(target.review_created_at).valueOf() + 86_400_000).toISOString())}. Re-submitting does not extend the deadline.`}</Alert>}
        <fieldset className={styles.stars} disabled={readOnly || checkingEditWindow}><legend>Meal rating</legend>{[1,2,3,4,5].map((value) => <button type="button" aria-label={`${value} stars`} aria-pressed={value === rating} className={value <= rating ? styles.lit : ""} onClick={() => setRating(value)} key={value}><Star size={27} fill="currentColor"/></button>)}</fieldset>
        <label className={styles.comment}><span>Comments <small>Optional</small></span><textarea disabled={readOnly || checkingEditWindow} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Taste, portion, hygiene, or packaging notes" rows={4}/></label>
        <div className={styles.photos}>{photos.map((photo) => <span key={photo.publicId}><Image src={photo.thumbnailUrl} alt="Attached meal" width={112} height={84}/>{!readOnly && !checkingEditWindow && <button type="button" aria-label="Remove attached photo" onClick={() => setPhotos((current) => current.filter((item) => item.publicId !== photo.publicId))}><Trash2 size={13}/></button>}</span>)}</div>
        {!readOnly && !checkingEditWindow && <div className={styles.uploadGroup}><label className={styles.upload}><Upload size={16}/>{busy ? "Uploading…" : `Add photos (${photos.length}/5)`}<input type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={busy || photos.length >= 5} onChange={(event) => void addPhotos(event.target.files)}/></label><small>JPG, PNG or WebP · max 10 MB each</small></div>}
        <section className={styles.voice}><div><strong>Voice review</strong><small>Optional · up to one minute</small></div>{recording ? <Button type="button" variant="secondary" onClick={() => recorderRef.current?.stop()}><Square size={14} fill="currentColor"/>Stop · {formatRecordingTime(MAX_VOICE_SECONDS - duration)} left</Button> : !readOnly && !checkingEditWindow && !voice && !audioFile && <Button type="button" variant="secondary" onClick={() => void startRecording()}><Mic size={15}/>Record</Button>}</section>
        {(voice?.url || audioPreview) && <div className={styles.voicePreview}><audio controls preload="metadata" src={audioPreview || voice?.url}/><span>{formatRecordingTime(duration || voice?.durationSeconds || 0)}</span>{!readOnly && !checkingEditWindow && <button type="button" onClick={clearVoice} aria-label="Remove voice review"><Trash2 size={15}/></button>}</div>}
        {!readOnly && !checkingEditWindow && <Button loading={busy} loadingLabel={audioFile ? "Uploading voice…" : "Saving review…"} disabled={busy || recording || !rating} onClick={saveReview}>{target.review_id ? "Update review" : "Submit review"}</Button>}
        {message && <Alert tone={message.tone} title={message.tone === "success" ? "Review saved" : message.tone === "danger" ? "Review not saved" : "Review information"}>{message.text}</Alert>}
        <section className={styles.qualityReport}><div><Flag size={17}/><div><strong>Was there a food-quality problem?</strong><span>Send an operational issue separately from your review.</span></div></div>{!reportOpen ? <Button type="button" size="small" variant="quiet" onClick={() => setReportOpen(true)}>Report food-quality issue</Button> : <div className={styles.qualityReportForm}><label><span>What went wrong?</span><textarea rows={3} maxLength={2000} value={reportMessage} onChange={(event) => setReportMessage(event.target.value)} placeholder="For example: unusual smell, undercooked food, contamination, or damaged packaging"/></label><div><Button type="button" size="small" variant="secondary" onClick={() => { setReportOpen(false); setReportMessage(""); setReportStatus(null); }}>Cancel</Button><Button type="button" size="small" loading={reportBusy} loadingLabel="Sending…" disabled={reportMessage.trim().length < 3} onClick={() => void submitQualityReport()}>Send issue</Button></div></div>}{reportStatus && <Alert tone={reportStatus.tone} title={reportStatus.tone === "success" ? "Issue reported" : "Issue not sent"}>{reportStatus.text}</Alert>}</section>
      </Card>}
    </div>}
  </>;
}

function reviewVoice(item?: EmployeeSchedule): ReviewVoice | null { return item?.review_voice_url && item.review_voice_public_id && item.review_voice_duration_seconds ? { publicId: item.review_voice_public_id, url: item.review_voice_url, durationSeconds: item.review_voice_duration_seconds } : null; }
function selectedMeal(item: EmployeeSchedule) { return item.options.find((option) => option.id === item.selected_option_id)?.title || (item.is_opted_in ? "Received meal" : "Scheduled meal"); }
function reviewState(item: EmployeeSchedule, nowMs: number): { label: string; detail?: string; tone: "neutral" | "success" | "warning" | "info" } { if (!item.can_review) return { label: "Skipped", tone: "neutral" }; if (!item.review_id) return { label: "Not reviewed", detail: "Open anytime", tone: "info" }; if (!nowMs || (item.review_created_at && reviewIsEditable(item.review_created_at, new Date(nowMs)))) return { label: "Reviewed", detail: nowMs && item.review_created_at ? editTimeRemaining(item.review_created_at, nowMs) : "Editable", tone: "warning" }; return { label: "Reviewed", detail: "Read only", tone: "success" }; }
function editTimeRemaining(createdAt: string, nowMs: number) { const minutes = Math.max(0, Math.ceil((new Date(createdAt).valueOf() + 86_400_000 - nowMs) / 60_000)); if (minutes < 1) return "<1 min to edit"; const hours = Math.floor(minutes / 60); const rest = minutes % 60; return hours ? `${hours}h${rest ? ` ${rest}m` : ""} to edit` : `${rest}m to edit`; }
function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" }); }
function formatTimestamp(value: string) { return new Date(value).toLocaleString("en-BD", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" }); }
