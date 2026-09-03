"use client";

import { MessageCircle, Mic, Send, Square, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FeedbackCategory } from "@/lib/feedback";
import { formatRecordingTime, recordingTime } from "@/lib/recording-timer";

type UploadedAudio = { publicId: string; url: string; durationSeconds: number };
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MAX_AUDIO_SECONDS = 120;

async function uploadAudio(file: File, durationSeconds: number): Promise<UploadedAudio> {
  const signatureResponse = await fetch("/api/uploads/signature", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "feedback" }) });
  const signed = await signatureResponse.json();
  if (!signatureResponse.ok) throw new Error(signed.error || "UPLOAD_SIGNATURE_FAILED");

  const form = new FormData();
  form.set("file", file);
  form.set("api_key", signed.apiKey);
  form.set("timestamp", String(signed.timestamp));
  form.set("signature", signed.signature);
  form.set("folder", signed.folder);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/video/upload`, { method: "POST", body: form });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "AUDIO_UPLOAD_FAILED");
  return { publicId: data.public_id, url: data.secure_url, durationSeconds };
}

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("BUG");
  const [message, setMessage] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);

  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); streamRef.current?.getTracks().forEach((track) => track.stop()); }, [audioUrl]);
  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => {
      const timerState = recordingTime((Date.now() - startedAtRef.current) / 1000, MAX_AUDIO_SECONDS);
      setDuration(timerState.elapsed);
      if (timerState.complete && recorderRef.current?.state === "recording") recorderRef.current.stop();
    }, 500);
    return () => window.clearInterval(timer);
  }, [recording]);

  function clearAudio() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(null);
    setAudioUrl("");
    setDuration(0);
  }

  async function startRecording() {
    setStatus("");
    clearAudio();
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return setStatus("Voice recording is not supported in this browser. You can still send written feedback.");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferredType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined;
      const recorder = new MediaRecorder(stream, preferredType ? { mimeType: preferredType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const seconds = Math.min(MAX_AUDIO_SECONDS, Math.max(1, Math.ceil((Date.now() - startedAtRef.current) / 1000)));
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setRecording(false);
        setDuration(seconds);
        if (blob.size > MAX_AUDIO_BYTES) return setStatus("That recording is larger than 10 MB. Please record a shorter message.");
        const extension = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        const file = new File([blob], `aamish-feedback-${Date.now()}.${extension}`, { type });
        setAudioFile(file);
        setAudioUrl(URL.createObjectURL(blob));
      };
      recorder.start(1000);
      setDuration(0);
      setRecording(true);
    } catch {
      setStatus("Microphone access was not available. You can still send written feedback.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function closePanel() {
    stopRecording();
    setOpen(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!message.trim() && !audioFile) return setStatus("Write a message or record a voice note first.");
    setSaving(true);
    setStatus(audioFile ? "Uploading voice note…" : "Sending feedback…");
    try {
      const audio = audioFile ? await uploadAudio(audioFile, duration) : null;
      const response = await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ category, message, audio, pagePath: window.location.pathname }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "FEEDBACK_SAVE_FAILED");
      setMessage("");
      clearAudio();
      setCategory("BUG");
      setStatus("Feedback received. Thank you for helping us improve Aamish.");
    } catch {
      setStatus("We could not save that feedback. Please keep it and try again.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="feedback-capture">
    {!open && <button className="feedback-trigger" type="button" aria-label="Share feedback" onClick={() => setOpen(true)}><MessageCircle size={18} /><span>Share feedback</span></button>}
    {open && <section className="feedback-panel" role="dialog" aria-modal="false" aria-labelledby="feedback-title">
      <header><div><span>INTERNAL BETA</span><h2 id="feedback-title">Tell us what happened</h2></div><button type="button" onClick={closePanel} aria-label="Close feedback"><X size={19} /></button></header>
      <form onSubmit={submit}>
        <fieldset><legend>Feedback type</legend><div className="feedback-types">{(["BUG", "IDEA", "QUESTION", "OTHER"] as FeedbackCategory[]).map((value) => <button type="button" aria-pressed={category === value} className={category === value ? "selected" : ""} onClick={() => setCategory(value)} key={value}>{value === "BUG" ? "Problem" : value.charAt(0) + value.slice(1).toLowerCase()}</button>)}</div></fieldset>
        <label>Message <small>Optional with voice</small><textarea rows={4} maxLength={4000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="What did you try? What did you expect?" /></label>
        <div className="voice-capture"><div><b>Voice note</b><small>Optional · up to 2 minutes</small></div>{recording ? <button className="recording" type="button" onClick={stopRecording}><Square size={14} fill="currentColor" /> Stop · {formatRecordingTime(MAX_AUDIO_SECONDS - duration)} left</button> : !audioFile && <button type="button" onClick={() => void startRecording()}><Mic size={15} /> Record</button>}</div>
        {audioUrl && <div className="voice-preview"><audio controls src={audioUrl} preload="metadata" /><small>Recorded {formatRecordingTime(duration)}</small><button type="button" onClick={clearAudio} aria-label="Remove voice note"><Trash2 size={15} /></button></div>}
        {status && <p className={status.startsWith("Feedback received") ? "feedback-status success" : "feedback-status"} role="status">{status}</p>}
        <button className="feedback-submit" disabled={saving || recording} type="submit"><Send size={15} />{saving ? "Sending…" : "Send feedback"}</button>
      </form>
    </section>}
  </div>;
}
