"use client";

import Image from "next/image";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, IconButton, uiStyles } from "@/components/ui/primitives";
import { createFeedbackQrPoster } from "@/lib/feedback-qr";
import { useModalDialog } from "@/lib/use-modal-dialog";
import styles from "./feedback-qr-dialog.module.css";

export function FeedbackQrDialog({ url, enterpriseName, enterpriseId, onClose }: { url: string; enterpriseName: string; enterpriseId: string; onClose: () => void }) {
  const dialogRef = useModalDialog<HTMLElement>(true, onClose);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";
    createFeedbackQrPoster(url, enterpriseName).then(blob => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob); setPreview(objectUrl);
    }).catch(() => { if (!cancelled) setError("We couldn’t prepare the QR image. Please try again."); });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url, enterpriseName, attempt]);
  const filename = `aamish-feedback-${enterpriseId}.png`;
  return <div className={styles.backdrop}>
    <section ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="feedback-qr-title" tabIndex={-1}>
      <header className={styles.header}><div><h2 id="feedback-qr-title">Your feedback QR</h2><p>{enterpriseName}</p></div><IconButton aria-label="Close QR preview" onClick={onClose}><X size={20} /></IconButton></header>
      <div className={styles.content}>
        {preview ? <Image className={styles.poster} src={preview} alt={`Aamish feedback QR poster for ${enterpriseName}`} width={1800} height={2400} unoptimized /> : error ? <div className={styles.placeholder}><p role="alert">{error}</p><Button variant="secondary" onClick={() => { setError(""); setAttempt(value => value + 1); }}>Try again</Button></div> : <p className={styles.placeholder} role="status">Preparing your QR…</p>}
        <p className={styles.destination}>Opens <a href={url} target="_blank" rel="noreferrer">{url}</a></p>
      </div>
      <footer className={styles.footer}><span>High-resolution PNG · ready to print</span>{preview ? <a className={`${uiStyles.button} ${uiStyles.primary}`} href={preview} download={filename}><Download size={17} aria-hidden="true" />Download PNG</a> : <Button disabled><Download size={17} aria-hidden="true" />Download PNG</Button>}</footer>
    </section>
  </div>;
}
