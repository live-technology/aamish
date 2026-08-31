"use client";

import { AdminNav } from "@/components/admin-nav";
import { Lightbulb, MessageCircleQuestion, MessageSquareText, Mic, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";

export type FeedbackRow = {
  id: string;
  category: "BUG" | "IDEA" | "QUESTION" | "OTHER";
  message: string | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  page_path: string;
  status: string;
  submitter_role: string;
  submitter_name: string;
  username: string;
  enterprise_name: string | null;
  created_at: string;
  transcript: string | null;
  transcript_english: string | null;
  transcription_summary: string | null;
  transcription_confidence: string | null;
  transcription_model: string | null;
  transcribed_at: string | null;
};

const icons = { BUG: TriangleAlert, IDEA: Lightbulb, QUESTION: MessageCircleQuestion, OTHER: MessageSquareText };

export function FeedbackInbox({ feedback }: { feedback: FeedbackRow[] }) {
  const [items, setItems] = useState(feedback);
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [savingId, setSavingId] = useState<string | null>(null);
  const visible = useMemo(() => items.filter((item) => (category === "ALL" || item.category === category) && (status === "ALL" || item.status === status)), [items, category, status]);
  async function changeStatus(id: string, nextStatus: string) {
    setSavingId(id);
    const response = await fetch("/api/admin/feedback", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: nextStatus }) });
    if (response.ok) setItems((current) => current.map((item) => item.id === id ? { ...item, status: nextStatus } : item));
    setSavingId(null);
  }
  return <div className="admin-portal"><AdminNav active="feedback"/><main className="admin-main"><header className="admin-header"><div><p className="eyebrow">INTERNAL TESTING</p><h1>Feedback inbox</h1><span>Voice notes, questions, bugs, and ideas submitted from inside Aamish.</span></div></header>
    <div className="enterprise-summary"><article><strong>{feedback.length}</strong><span>Recent submissions</span></article><article><strong>{feedback.filter((item) => item.category === "BUG").length}</strong><span>Reported problems</span></article><article><strong>{feedback.filter((item) => item.audio_url).length}</strong><span>Voice notes</span></article></div>
    <div className="feedback-filters"><label>Type<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="ALL">All types</option>{Object.keys(icons).map((value) => <option key={value}>{value}</option>)}</select></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All statuses</option>{["NEW", "REVIEWED", "PLANNED", "CLOSED"].map((value) => <option key={value}>{value}</option>)}</select></label></div>
    {feedback.length === 0 ? <section className="empty-dashboard"><div className="empty-icon"><MessageSquareText size={28}/></div><h2>No platform feedback yet</h2><p>Text and voice feedback submitted by internal testers will appear here.</p></section> : visible.length === 0 ? <section className="feedback-filter-empty">No feedback matches these filters.</section> : <section className="feedback-inbox-list">{visible.map((item) => { const Icon = icons[item.category]; return <article className="feedback-inbox-card" key={item.id}><div className={`feedback-kind ${item.category.toLowerCase()}`}><Icon size={16}/><span>{item.category}</span></div><div className="feedback-inbox-body"><header><div><b>{item.submitter_name}</b><span>{item.enterprise_name || "Aamish"} · {item.submitter_role.replaceAll("_", " ").toLowerCase()} · @{item.username}</span></div><time>{new Date(item.created_at).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" })}</time></header>{item.message && <p>{item.message}</p>}{item.audio_url && <div className="inbox-audio"><Mic size={15}/><audio controls preload="none" src={item.audio_url}/><small>{item.audio_duration_seconds ?? 0}s</small></div>}{item.transcript && <section className="feedback-transcript"><header><b>Voice transcript</b>{item.transcription_confidence && <span>{item.transcription_confidence} confidence</span>}</header><p>{item.transcript}</p>{item.transcript_english && item.transcript_english !== item.transcript && <><b>English translation</b><p>{item.transcript_english}</p></>}{item.transcription_summary && <small>{item.transcription_summary}</small>}</section>}<footer><code>{item.page_path}</code><select aria-label={`Status for feedback from ${item.submitter_name}`} value={item.status} disabled={savingId === item.id} onChange={(event) => void changeStatus(item.id, event.target.value)}>{["NEW", "REVIEWED", "PLANNED", "CLOSED"].map((value) => <option key={value}>{value}</option>)}</select></footer></div></article>; })}</section>}
  </main></div>;
}
