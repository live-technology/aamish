import { AdminNav } from "@/components/admin-nav";
import { Lightbulb, MessageCircleQuestion, MessageSquareText, Mic, TriangleAlert } from "lucide-react";

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
};

const icons = { BUG: TriangleAlert, IDEA: Lightbulb, QUESTION: MessageCircleQuestion, OTHER: MessageSquareText };

export function FeedbackInbox({ feedback }: { feedback: FeedbackRow[] }) {
  return <div className="admin-portal"><AdminNav active="feedback"/><main className="admin-main"><header className="admin-header"><div><p className="eyebrow">INTERNAL TESTING</p><h1>Feedback inbox</h1><span>Voice notes, questions, bugs, and ideas submitted from inside Aamish.</span></div></header>
    <div className="enterprise-summary"><article><strong>{feedback.length}</strong><span>Recent submissions</span></article><article><strong>{feedback.filter((item) => item.category === "BUG").length}</strong><span>Reported problems</span></article><article><strong>{feedback.filter((item) => item.audio_url).length}</strong><span>Voice notes</span></article></div>
    {feedback.length === 0 ? <section className="empty-dashboard"><div className="empty-icon"><MessageSquareText size={28}/></div><h2>No platform feedback yet</h2><p>Text and voice feedback submitted by internal testers will appear here.</p></section> : <section className="feedback-inbox-list">{feedback.map((item) => { const Icon = icons[item.category]; return <article className="feedback-inbox-card" key={item.id}><div className={`feedback-kind ${item.category.toLowerCase()}`}><Icon size={16}/><span>{item.category}</span></div><div className="feedback-inbox-body"><header><div><b>{item.submitter_name}</b><span>{item.enterprise_name || "Aamish"} · {item.submitter_role.replaceAll("_", " ").toLowerCase()} · @{item.username}</span></div><time>{new Date(item.created_at).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" })}</time></header>{item.message && <p>{item.message}</p>}{item.audio_url && <div className="inbox-audio"><Mic size={15}/><audio controls preload="none" src={item.audio_url}/><small>{item.audio_duration_seconds ?? 0}s</small></div>}<footer><code>{item.page_path}</code><em>{item.status}</em></footer></div></article>; })}</section>}
  </main></div>;
}
