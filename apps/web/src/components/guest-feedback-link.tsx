"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives";
import styles from "./guest-feedback.module.css";

export function GuestFeedbackLink({ enterpriseId }: { enterpriseId: string }) {
  const [message, setMessage] = useState("");
  const path = `/feedback/${enterpriseId}`;
  return <div className={styles.share}>
    <label>Feedback link for your QR code<input aria-label="Feedback link" readOnly value={path} onFocus={event => { event.currentTarget.value = new URL(path, window.location.origin).href; event.currentTarget.select(); }} /></label>
    <Button variant="secondary" onClick={async () => {
      try { await navigator.clipboard.writeText(new URL(path, window.location.origin).href); setMessage("Link copied"); }
      catch { setMessage("Select the link and copy it manually."); }
    }}>Copy link</Button>
    <a href={path} target="_blank" rel="noreferrer">Open form</a>
    {message && <span role="status">{message}</span>}
  </div>;
}

export function RefreshGuestFeedback() {
  const router = useRouter();
  return <Button variant="secondary" onClick={() => router.refresh()}>Refresh</Button>;
}
