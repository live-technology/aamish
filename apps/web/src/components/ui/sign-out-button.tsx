"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, IconButton, uiStyles as styles } from "./primitives";

export function SignOutButton({ labelled = false }: { labelled?: boolean }) {
  const router = useRouter();
  const signOut = () => fetch("/api/auth/logout", { method: "POST" }).then(() => router.push("/login"));

  if (labelled) {
    return (
      <Button className={styles.signOutButton} type="button" variant="quiet" onClick={signOut}>
        <LogOut size={18} aria-hidden="true" />
        Sign out
      </Button>
    );
  }

  return <IconButton type="button" aria-label="Sign out" onClick={signOut}><LogOut size={18} aria-hidden="true" /></IconButton>;
}
