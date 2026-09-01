"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Alert, Button, TextField } from "@/components/ui/primitives";
import { isRoleDestination } from "@/lib/auth-navigation";
import {
  type LoginFailure,
  type LoginPayload,
  loginFailure,
  networkLoginFailure,
} from "@/lib/login-feedback";
import styles from "./login.module.css";

type LoginFormProps = {
  sessionEnded?: boolean;
};

export function LoginForm({ sessionEnded = false }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<LoginFailure | null>(null);
  const [loading, setLoading] = useState(false);

  function clearError() {
    if (error) setError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const payload = (await response.json().catch(() => ({}))) as LoginPayload;

      if (!response.ok) {
        setError(loginFailure(response.status, payload));
        return;
      }

      if (!isRoleDestination(payload.redirectTo)) {
        setError(loginFailure(500, payload));
        return;
      }

      window.location.assign(payload.redirectTo);
    } catch {
      setError(networkLoginFailure);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.story} aria-label="About Aamish">
        <Image
          className={styles.storyLogo}
          src="/brand/amish-logo-01.png"
          alt="Aamish"
          width={138}
          height={60}
          priority
        />
        <div className={styles.storyContent}>
          <span className={styles.betaBadge}>Internal testing beta</span>
          <strong>One lunch operation. Three clear workspaces.</strong>
          <p>
            Plan services, coordinate teams, and close the feedback loop from one
            calm operational platform.
          </p>
          <ul className={styles.storyPoints}>
            <li>
              <CheckCircle2 size={18} aria-hidden="true" />
              Aamish operations and quality
            </li>
            <li>
              <CheckCircle2 size={18} aria-hidden="true" />
              Enterprise people and meal visibility
            </li>
            <li>
              <CheckCircle2 size={18} aria-hidden="true" />
              Employee choices and reviews
            </li>
          </ul>
        </div>
        <span className={styles.storyFooter}>
          Internal testing only · Not ready for production use
        </span>
      </section>

      <section className={styles.task}>
        <div className={styles.taskInner}>
          <Image
            className={styles.mobileLogo}
            src="/brand/amish-logo-01.png"
            alt="Aamish"
            width={112}
            height={49}
            priority
          />
          <p className={styles.eyebrow}>Welcome back</p>
          <h1>Sign in to Aamish</h1>
          <p className={styles.intro}>
            Use the username and password issued by your administrator. We’ll
            take you to the correct workspace automatically.
          </p>

          {sessionEnded && (
            <div className={styles.notice}>
              <Alert tone="info" title="Your session ended">
                Sign in again to continue where you left off.
              </Alert>
            </div>
          )}

          <form
            className={styles.form}
            onSubmit={submit}
            aria-busy={loading}
          >
            <TextField
              label="Username"
              name="username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                clearError();
              }}
              autoComplete="username"
              inputMode="text"
              required
              disabled={loading}
            />
            <TextField
              label="Password"
              name="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                clearError();
              }}
              type="password"
              autoComplete="current-password"
              required
              disabled={loading}
            />

            {error && (
              <Alert tone="danger" title={error.title}>
                {error.description}
                {error.requestId && (
                  <code className={styles.requestId}>
                    Request ID: {error.requestId}
                  </code>
                )}
              </Alert>
            )}

            <Button
              className={styles.submit}
              type="submit"
              size="large"
              loading={loading}
              loadingLabel="Signing in…"
            >
              Sign in
            </Button>
          </form>

          <p className={styles.support}>
            <strong>Need access help?</strong> Contact the person who issued your
            Aamish credentials.
          </p>
        </div>
      </section>
    </main>
  );
}
