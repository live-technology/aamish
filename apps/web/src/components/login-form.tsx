"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username, password }) });
    const payload = await response.json(); setLoading(false);
    if (!response.ok) return setError(payload.error === "INVALID_CREDENTIALS" ? "That username or password is incorrect." : "Login is unavailable. Check the server logs.");
    window.location.assign(payload.redirectTo);
  }
  return <main className="login-page"><section className="login-brand"><Image src="/brand/amish-logo-01.png" alt="Aamish" width={160} height={54} priority /><div><p>Corporate meal management</p><h1>Every lunch, properly planned.</h1><span>Coordinate menus, teams, locations, and quality feedback from one calm operational workspace.</span></div><small>© 2026 Aamish</small></section><section className="login-panel"><form onSubmit={submit}><p className="eyebrow">WELCOME BACK</p><h2>Sign in to Aamish</h2><span className="form-intro">Use the username and password issued by your administrator.</span><label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label><label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required /></label>{error && <p className="form-error">{error}</p>}<button className="primary login-submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button></form></section></main>;
}
