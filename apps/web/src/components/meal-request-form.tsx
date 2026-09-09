"use client";

import { ArrowUpRight, CheckCircle2, Mic, Square, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, TextAreaField, TextField } from "@/components/ui/primitives";
import { MAX_REQUIREMENT_LENGTH, MAX_VOICE_BYTES, MAX_VOICE_SECONDS, normalizeContact, validateRequirement } from "@/lib/meal-requests";
import styles from "./landing.module.css";

export function MealRequestForm() {
  const [requirement, setRequirement] = useState("");
  const [contact, setContact] = useState("");
  const [audio, setAudio] = useState<{ file: File; url: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ requirement?: string; contact?: string }>({});
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

  function changed() { submissionKey.current = null; setError(""); setFieldErrors({}); }
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
      setError("Voice recording isn’t available in this browser. Please type your requirement or call us.");
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
        if (mounted.current) { setRecording(false); setFinishing(false); setError("Recording stopped unexpectedly. Please record again or type your requirement."); }
      };
      instance.onstop = () => {
        media.getTracks().forEach(track => track.stop());
        if (!mounted.current) return;
        setRecording(false); setFinishing(false);
        if (failed || !total) { setError("We couldn’t keep that recording. Please try a shorter voice message or type your requirement."); return; }
        const extension = mime.includes("mp4") ? "mp4" : mime.includes("ogg") ? "ogg" : "webm";
        const file = new File(chunks, `requirement.${extension}`, { type: instance.mimeType });
        setAudio({ file, url: URL.createObjectURL(file) });
      };
      started.current = performance.now();
      setSeconds(0); setAudio(null);
      instance.start(250);
      setRecording(true);
    } catch {
      if (attempt === microphoneAttempt.current) {
        stream.current?.getTracks().forEach(track => track.stop());
        if (mounted.current) setError("We couldn’t access your microphone. Check browser permission, or type your requirement instead.");
      }
    } finally { if (mounted.current && attempt === microphoneAttempt.current) setPreparing(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current || recording || preparing || finishing) return;
    setError("");
    const errors: typeof fieldErrors = {};
    try { normalizeContact(contact); } catch (failure) { errors.contact = (failure as Error).message; }
    try { validateRequirement(requirement, Boolean(audio)); } catch (failure) { errors.requirement = (failure as Error).message; }
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      document.getElementById(errors.requirement ? "requirement" : "contact")?.focus();
      return;
    }
    busyRef.current = true; setBusy(true);
    submissionKey.current ??= crypto.randomUUID();
    const body = new FormData();
    body.set("submissionKey", submissionKey.current);
    body.set("requirement", requirement);
    body.set("contact", contact);
    if (audio) body.set("audio", audio.file);
    try {
      const response = await fetch("/api/meal-requests", { method: "POST", body, signal: AbortSignal.timeout(65000) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== true) throw new Error(payload.error || "We couldn’t confirm your request. Please try again; your details are still here.");
      setSuccess(true); setAudio(null); setContact(""); setRequirement("");
    } catch (failure) {
      setError(failure instanceof Error && failure.name !== "TimeoutError" ? failure.message : "We couldn’t confirm your request. Please try again; your details are still here.");
    } finally { busyRef.current = false; setBusy(false); }
  }

  if (success) return <div className={`${styles.requestForm} ${styles.success}`} role="status"><CheckCircle2 size={43} aria-hidden="true" /><h3 ref={successHeading} tabIndex={-1}>Thank you!</h3><p>Our representatives will contact you to discuss your requirement.</p><Button variant="secondary" onClick={() => { setSuccess(false); changed(); }}>Send another request <ArrowUpRight size={18} aria-hidden="true" /></Button></div>;

  return <form className={styles.requestForm} onSubmit={submit} noValidate aria-label="Meal enquiry" aria-busy={busy}>
    <p className={styles.formHeading}>A little about your plans</p>
    <TextAreaField name="requirement" label="Your requirement" description="Write a message, record one, or do both." rows={4} maxLength={MAX_REQUIREMENT_LENGTH} value={requirement} onChange={event => { setRequirement(event.target.value); changed(); }} disabled={busy} error={fieldErrors.requirement} placeholder="The occasion, number of people, date… tell us what you have in mind." />
    <div className={styles.voiceRow}>
      {recording ? <button type="button" className={styles.recording} onClick={stop}><Square size={16} fill="currentColor" aria-hidden="true" /> Stop recording · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</button> : <button type="button" onClick={() => { if (preparing) { microphoneAttempt.current++; setPreparing(false); } else void start(); }} disabled={busy || finishing}><Mic size={18} aria-hidden="true" />{preparing ? "Cancel microphone request" : finishing ? "Preparing recording…" : audio ? "Re-record voice message" : "Record a voice message"}</button>}
      <span>Up to 2 minutes</span>
    </div>
    {audio && <div className={styles.audioPreview}><audio controls src={audio.url} preload="metadata" aria-label="Preview your voice message" /><button type="button" aria-label="Remove voice message" disabled={busy} onClick={() => { setAudio(null); changed(); }}><Trash2 size={17} aria-hidden="true" /></button></div>}
    <TextField name="contact" label="Phone number or email" required maxLength={254} autoComplete="on" value={contact} onChange={event => { setContact(event.target.value); changed(); }} disabled={busy} error={fieldErrors.contact} placeholder="Where can we reach you?" />
    {error && <p className={styles.formError} role="alert">{error}</p>}
    <Button className={styles.submit} type="submit" loading={busy} loadingLabel={audio ? "Sending your voice message…" : "Sending your request…"} disabled={recording || preparing || finishing}>Send request <ArrowUpRight size={21} aria-hidden="true" /></Button>
    <p className={styles.privacy}>We’ll use your contact details and message to respond to this enquiry.</p>
  </form>;
}
