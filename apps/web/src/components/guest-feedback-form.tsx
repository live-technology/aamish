"use client";

import { ArrowUpRight, CheckCircle2, Mic, Square, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, TextAreaField, TextField } from "@/components/ui/primitives";
import { MAX_REQUIREMENT_LENGTH, MAX_VOICE_BYTES, MAX_VOICE_SECONDS } from "@/lib/meal-requests";
import { validateGuestFeedback } from "@/lib/guest-feedback";
import { FeedbackRating } from "./feedback-rating";
import styles from "./guest-feedback.module.css";

export function GuestFeedbackForm({ enterpriseId }: { enterpriseId: string }) {
  const [requirement, setRequirement] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [rating, setRating] = useState(0);
  const [audio, setAudio] = useState<{ file: File; url: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const mounted = useRef(true);
  const submissionKey = useRef<string | null>(null);
  const started = useRef(0);
  const busyRef = useRef(false);
  const microphoneAttempt = useRef(0);
  const successHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach(track => track.stop());
    };
  }, []);
  useEffect(() => () => { if (audio) URL.revokeObjectURL(audio.url); }, [audio]);
  useEffect(() => { if (success) successHeading.current?.focus(); }, [success]);
  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((performance.now() - started.current) / 1000);
      setSeconds(Math.min(elapsed, MAX_VOICE_SECONDS));
      if (elapsed >= MAX_VOICE_SECONDS && recorder.current?.state === "recording") {
        setFinishing(true);
        recorder.current.stop();
        stream.current?.getTracks().forEach(track => track.stop());
        setRecording(false);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [recording]);

  function changed() { submissionKey.current = null; setError(""); }
  function stop() {
    if (recorder.current?.state === "recording") {
      setFinishing(true);
      recorder.current.stop();
      stream.current?.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  }

  async function start() {
    if (preparing || recording || busy || finishing) return;
    changed();
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice recording isn’t available in this browser. Please type your review.");
      return;
    }
    setPreparing(true);
    const attempt = ++microphoneAttempt.current;
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current || attempt !== microphoneAttempt.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media;
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find(type => MediaRecorder.isTypeSupported(type));
      if (!mime) throw new Error("UNSUPPORTED");
      const instance = new MediaRecorder(media, { mimeType: mime, audioBitsPerSecond: 64000 });
      const chunks: Blob[] = [];
      let total = 0;
      let failed = false;
      recorder.current = instance;
      instance.ondataavailable = event => {
        if (!event.data.size) return;
        total += event.data.size;
        if (total > MAX_VOICE_BYTES) {
          failed = true;
          if (instance.state === "recording") instance.stop();
          media.getTracks().forEach(track => track.stop());
        } else chunks.push(event.data);
      };
      instance.onerror = () => {
        failed = true;
        media.getTracks().forEach(track => track.stop());
        if (mounted.current) { setRecording(false); setFinishing(false); setError("Recording stopped unexpectedly. Please record again or type your review."); }
      };
      instance.onstop = () => {
        media.getTracks().forEach(track => track.stop());
        if (!mounted.current) return;
        setRecording(false); setFinishing(false);
        if (failed || !total) { setError("We couldn’t keep that recording. Please try a shorter voice message or type your review."); return; }
        const extension = mime.includes("mp4") ? "mp4" : mime.includes("ogg") ? "ogg" : "webm";
        const file = new File(chunks, `feedback.${extension}`, { type: instance.mimeType });
        setAudio({ file, url: URL.createObjectURL(file) });
      };
      started.current = performance.now();
      setSeconds(0); setAudio(null);
      instance.start(250);
      setRecording(true);
    } catch {
      if (attempt === microphoneAttempt.current) {
        stream.current?.getTracks().forEach(track => track.stop());
        if (mounted.current) setError("We couldn’t access your microphone. Check browser permission, or type your review instead.");
      }
    } finally { if (mounted.current && attempt === microphoneAttempt.current) setPreparing(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current || recording || preparing || finishing) return;
    setError("");
    const body = new FormData();
    body.set("rating", String(rating));
    body.set("review", requirement);
    body.set("anonymous", String(anonymous));
    if (!anonymous) { body.set("name", name); body.set("phone", phone); }
    try { validateGuestFeedback(body); } catch (failure) {
      setError((failure as Error).message);
      document.getElementById(!rating ? "rating-5" : !anonymous && !name.trim() ? "name" : "phone")?.focus();
      return;
    }
    busyRef.current = true; setBusy(true);
    submissionKey.current ??= crypto.randomUUID();
    body.set("submissionKey", submissionKey.current);
    if (audio) body.set("audio", audio.file);
    try {
      const response = await fetch(`/api/guest-feedback/${enterpriseId}`, { method: "POST", body, signal: AbortSignal.timeout(65000) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== true) throw new Error(payload.error || "We couldn’t confirm your feedback. Please try again; your details are still here.");
      setSuccess(true); setAudio(null); setName(""); setPhone(""); setRequirement("");
    } catch (failure) {
      setError(failure instanceof Error && failure.name !== "TimeoutError" ? failure.message : "We couldn’t confirm your feedback. Please try again; your details are still here.");
    } finally { busyRef.current = false; setBusy(false); }
  }

  if (success) return <div className={`${styles.requestForm} ${styles.success}`} role="status"><CheckCircle2 size={43} aria-hidden="true" /><h2 ref={successHeading} tabIndex={-1}>Thank you for your feedback!</h2><p>Your review has been sent to the team.</p></div>;

  return <form className={styles.requestForm} onSubmit={submit} noValidate aria-label="Guest feedback" aria-busy={busy}>
    <FeedbackRating value={rating} onChange={value => { setRating(value); changed(); }} disabled={busy} />
    <TextAreaField name="review" label="Your review" description="Optional — tell us what you enjoyed or what could be better." rows={4} maxLength={MAX_REQUIREMENT_LENGTH} value={requirement} onChange={event => { setRequirement(event.target.value); changed(); }} disabled={busy} placeholder="We’d love to hear your thoughts…" />
    <div className={styles.voiceRow}>
      {recording ? <button type="button" className={styles.recording} onClick={stop}><Square size={16} fill="currentColor" aria-hidden="true" /> Stop recording · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</button> : <button type="button" onClick={() => { if (preparing) { microphoneAttempt.current++; setPreparing(false); } else void start(); }} disabled={busy || finishing}><Mic size={18} aria-hidden="true" />{preparing ? "Cancel microphone request" : finishing ? "Preparing recording…" : audio ? "Re-record voice message" : "Add a voice message"}</button>}
      <span>Optional · up to 2 minutes</span>
    </div>
    {audio && <div className={styles.audioPreview}><audio controls src={audio.url} preload="metadata" aria-label="Preview your voice message" /><button type="button" aria-label="Remove voice message" disabled={busy} onClick={() => { setAudio(null); changed(); }}><Trash2 size={17} aria-hidden="true" /></button></div>}
    <div className={styles.identity}>
      <div className={styles.fields}>
        <TextField name="name" label="Name" required={!anonymous} maxLength={100} autoComplete="name" value={name} onChange={event => { setName(event.target.value); changed(); }} disabled={busy || anonymous} />
        <TextField name="phone" label="Phone" required={!anonymous} type="tel" maxLength={50} autoComplete="tel" value={phone} onChange={event => { setPhone(event.target.value); changed(); }} disabled={busy || anonymous} />
      </div>
      <label className={styles.anonymous}><input type="checkbox" checked={anonymous} disabled={busy} onChange={event => { setAnonymous(event.target.checked); setName(""); setPhone(""); changed(); }} />Stay anonymous</label>
      {anonymous && <p>Your name and phone number won’t be included. Avoid identifying yourself in your review or recording if you prefer to stay anonymous.</p>}
    </div>
    {error && <p className={styles.formError} role="alert">{error}</p>}
    <Button className={styles.submit} type="submit" loading={busy} loadingLabel={audio ? "Sending your voice message…" : "Sending your feedback…"} disabled={recording || preparing || finishing}>Submit feedback <ArrowUpRight size={21} aria-hidden="true" /></Button>
    <p className={styles.privacy}>Your feedback is visible only to Aamish and your enterprise’s administrators.</p>
  </form>;
}
