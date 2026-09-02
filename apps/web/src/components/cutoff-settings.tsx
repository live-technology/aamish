"use client";

import { Clock3 } from "lucide-react";
import { FormEvent, useState } from "react";
import { Alert, Button } from "@/components/ui/primitives";
import { clientErrorMessage } from "@/lib/client-errors";
import styles from "./admin-experience.module.css";

export function CutoffSettings({ initialCutoffTime }: { initialCutoffTime: string }) {
  const [cutoffTime, setCutoffTime] = useState(initialCutoffTime);
  const [savedTime, setSavedTime] = useState(initialCutoffTime);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ tone: "success" | "danger"; title: string; message: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setResult(null);
    try {
      const response = await fetch("/api/admin/settings/cutoff", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ cutoffTime }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw { code: data.error, requestId: data.requestId };
      setSavedTime(data.cutoffTime);
      setResult({ tone: "success", title: "Platform cutoff updated", message: `${data.affectedServices} current or future ${data.affectedServices === 1 ? "service was" : "services were"} recalculated immediately.` });
    } catch (caught) {
      const error = caught as { code?: string; requestId?: string };
      setResult({ tone: "danger", title: "Cutoff was not updated", message: `${clientErrorMessage(error.code || "CUTOFF_SETTING_UPDATE_FAILED", "The platform cutoff could not be saved.")}${error.requestId ? ` Request ID: ${error.requestId}.` : ""}` });
    } finally { setSaving(false); }
  }

  return <section className={styles.cutoffSettings} aria-labelledby="cutoff-settings-title"><div className={styles.cutoffHeading}><span><Clock3 size={20} aria-hidden="true" /></span><div><p>Platform setting</p><h2 id="cutoff-settings-title">Employee choice cutoff</h2><small>Applied to every organization in Dhaka time. Changing it immediately recalculates today and all future services.</small></div></div><form onSubmit={submit}><label htmlFor="platform-cutoff"><span>Cutoff time</span><input id="platform-cutoff" name="cutoffTime" type="time" required value={cutoffTime} onChange={(event) => setCutoffTime(event.target.value)} /></label><Button type="submit" disabled={cutoffTime === savedTime} loading={saving} loadingLabel="Updating…">Update cutoff</Button></form>{result && <Alert tone={result.tone} title={result.title}>{result.message}</Alert>}<p className={styles.cutoffWarning}>A later time can reopen a service that was already locked; an earlier time can lock it immediately. Historical service dates are unchanged.</p></section>;
}
