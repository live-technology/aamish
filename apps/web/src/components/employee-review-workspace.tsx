"use client";

import Image from "next/image";
import { Mic, Square, Star, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { EmployeeSchedule } from "@/components/employee-portal";
import { Alert, Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { clientErrorMessage, validateImage } from "@/lib/client-errors";
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

export function EmployeeReviewWorkspace({ schedules, onSaved }: { schedules: EmployeeSchedule[]; onSaved: (scheduleId: string, review: Partial<EmployeeSchedule>) => void }) {
  const reviewable = schedules.filter((item) => item.can_review).sort((a, b) => b.schedule_date.localeCompare(a.schedule_date));
  const initialTarget = reviewable[0];
  const [selectedId, setSelectedId] = useState(initialTarget?.id || "");
  const target = reviewable.find((item) => item.id === selectedId) || reviewable[0];
  const [rating, setRating] = useState(initialTarget?.review_rating || 0);
  const [comment, setComment] = useState(initialTarget?.review_comment || "");
  const [photos, setPhotos] = useState<ReviewPhoto[]>(initialTarget?.review_photos || []);
  const [voice, setVoice] = useState<ReviewVoice | null>(initialTarget?.review_voice_url && initialTarget.review_voice_public_id && initialTarget.review_voice_duration_seconds ? { publicId: initialTarget.review_voice_public_id, url: initialTarget.review_voice_url, durationSeconds: initialTarget.review_voice_duration_seconds } : null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState("");
  const [duration, setDuration] = useState(0);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger" | "info"; text: string } | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const readOnly = Boolean(target?.review_id && target.review_created_at && !reviewIsEditable(target.review_created_at));

  useEffect(() => () => { if (audioPreview) URL.revokeObjectURL(audioPreview); streamRef.current?.getTracks().forEach((track) => track.stop()); }, [audioPreview]);
  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => {
      const state = recordingTime((Date.now() - startedAtRef.current) / 1000, MAX_VOICE_SECONDS);
      setDuration(state.elapsed);
      if (state.complete && recorderRef.current?.state === "recording") recorderRef.current.stop();
    }, 500);
    return () => window.clearInterval(timer);
  }, [recording]);

  function clearVoice() {
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    setAudioFile(null); setAudioPreview(""); setDuration(0); setVoice(null);
  }

  function chooseTarget(item: EmployeeSchedule) {
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    recorderRef.current?.stop(); setSelectedId(item.id); setRating(item.review_rating || 0); setComment(item.review_comment || ""); setPhotos(item.review_photos || []);
    setVoice(item.review_voice_url && item.review_voice_public_id && item.review_voice_duration_seconds ? { publicId: item.review_voice_public_id, url: item.review_voice_url, durationSeconds: item.review_voice_duration_seconds } : null);
    setAudioFile(null); setAudioPreview(""); setDuration(0); setMessage(null);
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
    const selected = [...files].slice(0, 5 - photos.length); const invalid = selected.map((file) => validateImage(file)).find(Boolean);
    if (invalid) return setMessage({ tone: "danger", text: invalid });
    setBusy(true);
    try { const uploaded = await Promise.all(selected.map(uploadPhoto)); setPhotos((current) => [...current, ...uploaded]); }
    catch (error) { setMessage({ tone: "danger", text: clientErrorMessage(error instanceof Error ? error.message : "UPLOAD_FAILED") }); }
    finally { setBusy(false); }
  }

  async function saveReview() {
    if (!target || !rating || readOnly) return;
    setBusy(true); setMessage(null);
    try {
      let savedVoice = voice;
      if (audioFile) { const uploaded = await upload(audioFile, "video"); savedVoice = { publicId: uploaded.public_id, url: uploaded.secure_url, durationSeconds: duration }; }
      const response = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scheduleId: target.id, rating, comment, tags: [], photos, voice: savedVoice }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw { code: data.error, requestId: data.requestId };
      const review = { review_id: data.reviewId, review_rating: rating, review_comment: comment, review_created_at: data.createdAt, review_updated_at: new Date().toISOString(), review_photos: photos, review_voice_public_id: savedVoice?.publicId || null, review_voice_url: savedVoice?.url || null, review_voice_duration_seconds: savedVoice?.durationSeconds || null };
      onSaved(target.id, review); setVoice(savedVoice); setAudioFile(null); setMessage({ tone: "success", text: data.updated ? "Review updated. The original 24-hour deadline is unchanged." : "Review submitted. You can edit it for exactly 24 hours." });
    } catch (caught) {
      const error = caught as { code?: string; requestId?: string };
      setMessage({ tone: "danger", text: `${clientErrorMessage(error.code || "REVIEW_FAILED", "The review could not be saved.")}${error.requestId ? ` Request ID: ${error.requestId}.` : ""}` });
    } finally { setBusy(false); }
  }

  return <><PageHeader eyebrow="Reviews" title="Your received meals" description="Submit a review for any previous received meal. After first submission, edits remain open for exactly 24 hours."/>{!target ? <EmptyState icon={<Star size={25}/>} title="No received meal to review" description="Past skipped meals stay visible in your meal calendar but cannot be reviewed."/> : <div className={styles.reviewWorkspace}><section className={styles.reviewHistory} aria-label="Received meal history">{reviewable.map((item) => <button type="button" className={item.id === target.id ? styles.activeReview : ""} onClick={() => chooseTarget(item)} key={item.id}><span><strong>{formatDate(item.schedule_date)}</strong><small>{item.options.find((option) => option.id === item.selected_option_id)?.title || "Received meal"}</small></span><StatusBadge tone={item.review_id ? "success" : "info"}>{item.review_id ? `${item.review_rating}/5` : "Review"}</StatusBadge></button>)}</section><Card className={styles.review}><div className={styles.reviewHeading}><div><p>Meal on {formatDate(target.schedule_date)}</p><h2>{target.options.find((option) => option.id === target.selected_option_id)?.title || "Received meal"}</h2></div><StatusBadge tone={readOnly ? "neutral" : "info"}>{target.review_id ? readOnly ? "Read only" : "Editable for 24h" : "Open anytime"}</StatusBadge></div>{target.review_id && target.review_created_at && <Alert tone={readOnly ? "info" : "warning"} title={readOnly ? "Review history protected" : "Original edit deadline"}>{readOnly ? "This review can no longer be changed or deleted." : `Edits close ${formatTimestamp(new Date(new Date(target.review_created_at).valueOf() + 24 * 60 * 60 * 1000).toISOString())}. Re-submitting does not extend the deadline.`}</Alert>}<fieldset className={styles.stars} disabled={readOnly}><legend className="sr-only">Meal rating</legend>{[1,2,3,4,5].map((value) => <button type="button" aria-label={`${value} stars`} className={value <= rating ? styles.lit : ""} onClick={() => setRating(value)} key={value}><Star size={27} fill="currentColor"/></button>)}</fieldset><label className={styles.comment}><span>Comments <small>Optional</small></span><textarea disabled={readOnly} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Taste, portion, hygiene, or packaging notes" rows={4}/></label><div className={styles.photos}>{photos.map((photo) => <span key={photo.publicId}><Image src={photo.thumbnailUrl} alt="Attached meal" width={96} height={72}/>{!readOnly && <button type="button" aria-label="Remove attached photo" onClick={() => setPhotos((current) => current.filter((item) => item.publicId !== photo.publicId))}><Trash2 size={13}/></button>}</span>)}</div>{!readOnly && <label className={styles.upload}><Upload size={16}/>{busy ? "Uploading…" : `Add photos (${photos.length}/5)`}<input type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={busy || photos.length >= 5} onChange={(event) => void addPhotos(event.target.files)}/></label>}<section className={styles.voice}><div><strong>Voice review</strong><small>Optional · up to one minute</small></div>{recording ? <Button type="button" variant="secondary" onClick={() => recorderRef.current?.stop()}><Square size={14} fill="currentColor"/>Stop · {formatRecordingTime(MAX_VOICE_SECONDS - duration)} left</Button> : !readOnly && !voice && !audioFile && <Button type="button" variant="secondary" onClick={() => void startRecording()}><Mic size={15}/>Record</Button>}</section>{(voice?.url || audioPreview) && <div className={styles.voicePreview}><audio controls preload="metadata" src={audioPreview || voice?.url}/><span>{formatRecordingTime(duration || voice?.durationSeconds || 0)}</span>{!readOnly && <button type="button" onClick={clearVoice} aria-label="Remove voice review"><Trash2 size={15}/></button>}</div>}{!readOnly && <Button loading={busy} loadingLabel={audioFile ? "Uploading voice…" : "Saving review…"} disabled={busy || recording || !rating} onClick={saveReview}>{target.review_id ? "Update review" : "Submit review"}</Button>}{message && <Alert tone={message.tone} title={message.tone === "success" ? "Review saved" : message.tone === "danger" ? "Review not saved" : "Review information"}>{message.text}</Alert>}</Card></div>}</>;
}

function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-BD", { day: "numeric", month: "long", year: "numeric" }); }
function formatTimestamp(value: string) { return new Date(value).toLocaleString("en-BD", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" }); }
