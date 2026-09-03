"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { Alert, Button, TextField } from "@/components/ui/primitives";
import { isRoleDestination } from "@/lib/auth-navigation";
import styles from "./login.module.css";

export function ChangePasswordForm() {
  const [failure,setFailure]=useState(""); const [loading,setLoading]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFailure(""); const form=new FormData(event.currentTarget); const password=String(form.get("password")||""); const confirm=String(form.get("confirmPassword")||"");
    if(password.length<8)return setFailure("Use at least 8 characters."); if(password!==confirm)return setFailure("The passwords do not match.");
    setLoading(true);
    try { const response=await fetch("/api/auth/change-password",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({password})}); const data=await response.json().catch(()=>({})); if(!response.ok||!isRoleDestination(data.redirectTo))return setFailure("Your password could not be changed. Try again."); window.location.assign(data.redirectTo); }
    catch { setFailure("Your password could not be changed. Check your connection and try again."); } finally { setLoading(false); }
  }
  async function signOut() { await fetch("/api/auth/logout", { method:"POST" }); window.location.replace("/login"); }
  return <main className={styles.page}><section className={styles.story} aria-label="Account security"><Image className={styles.storyLogo} src="/brand/amish-logo-01.png" alt="Aamish" width={138} height={60} priority/><div className={styles.storyContent}><span className={styles.betaBadge}>Account setup</span><strong>Make this account yours.</strong><p>Temporary passwords are only for handing over access. Replace yours before entering the workspace.</p></div><span className={styles.storyFooter}>Internal testing only</span></section><section className={styles.task}><div className={styles.taskInner}><Image className={styles.mobileLogo} src="/brand/amish-logo-01.png" alt="Aamish" width={112} height={49} priority/><p className={styles.eyebrow}>First sign-in</p><h1>Create your password</h1><p className={styles.intro}>Choose a password only you know. You will use it for future sign-ins.</p><form className={styles.form} onSubmit={submit}><TextField label="New password" name="password" type="password" minLength={8} autoComplete="new-password" required/><TextField label="Confirm password" name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required/>{failure&&<Alert tone="danger" title="Password not changed">{failure}</Alert>}<Button className={styles.submit} size="large" loading={loading} loadingLabel="Saving password…">Continue to Aamish</Button></form><p className={styles.support}>Wrong account? <button type="button" onClick={() => void signOut()}>Sign out</button></p></div></section></main>;
}
