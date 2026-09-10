"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, uiStyles } from "@/components/ui/primitives";
import styles from "./guest-feedback.module.css";

const subscribe = () => () => {};
const readOrigin = () => window.location.origin;
const serverOrigin = () => "";

type Enterprise = { id: string; name: string; status: string };

export function GuestFeedbackTools({ enterprises, selectedId, canSelect }: { enterprises: Enterprise[]; selectedId: string | null; canSelect: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const enterprise = enterprises.find(item => item.id === selectedId);
  return <section className={styles.sharingPanel} aria-label="Share a feedback form" aria-busy={pending}>
    <div className={styles.sharingHeader}>
      <div><h2>Collect guest feedback</h2><p>{canSelect && !enterprise ? "Choose an enterprise to get its feedback link." : "Share the link or use it to create your event QR code."}</p></div>
      {canSelect && <label className={styles.enterpriseFilter}>Enterprise<select value={selectedId || ""} disabled={pending} onChange={event => {
        const id = event.target.value;
        startTransition(() => router.push(id ? `/admin/guest-feedback?enterprise=${encodeURIComponent(id)}` : "/admin/guest-feedback"));
      }}><option value="">All enterprises</option>{enterprises.map(item => <option key={item.id} value={item.id}>{item.name}{item.status !== "ACTIVE" ? " (inactive)" : ""}</option>)}</select></label>}
    </div>
    {enterprise?.status === "ACTIVE" && <GuestFeedbackLink key={enterprise.id} enterpriseId={enterprise.id} enterpriseName={enterprise.name} />}
    {enterprise && enterprise.status !== "ACTIVE" && <p className={styles.sharingNotice}>Feedback collection is unavailable while this enterprise is inactive.</p>}
    <span className={styles.srOnly} role="status">{pending ? "Updating feedback…" : ""}</span>
  </section>;
}

function GuestFeedbackLink({ enterpriseId, enterpriseName }: { enterpriseId: string; enterpriseName: string }) {
  const origin = useSyncExternalStore(subscribe, readOrigin, serverOrigin);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const path = `/feedback/${enterpriseId}`;
  const url = origin ? new URL(path, origin).href : "";
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);
  return <div className={styles.linkSection}>
    <div className={styles.linkDetails}><span className={styles.linkLabel}>{enterpriseName} · Feedback link</span><p className={styles.linkUrl} aria-label="Feedback URL">{url || "Preparing link…"}</p></div>
    <div className={styles.linkActions}>
      <Button className={styles.copyLink} disabled={!url} onClick={async () => {
        setError("");
        try { await navigator.clipboard.writeText(url); setCopied(true); }
        catch { setError("Couldn’t copy automatically. Select and copy the URL above."); }
      }}>{copied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}{copied ? "Copied" : "Copy link"}</Button>
      <a className={`${uiStyles.button} ${uiStyles.secondary}`} href={path} target="_blank" rel="noreferrer">Open form <ExternalLink size={16} aria-hidden="true" /></a>
    </div>
    <span className={styles.srOnly} role="status">{copied ? "Feedback link copied" : ""}</span>
    {error && <p className={styles.copyError} role="alert">{error}</p>}
  </div>;
}

export function RefreshGuestFeedback() {
  const router = useRouter();
  return <Button variant="secondary" onClick={() => router.refresh()}>Refresh</Button>;
}
