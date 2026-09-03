import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { currentSession } from "@/lib/auth";
import { destinationForRole } from "@/lib/auth-navigation";

type LoginPageProps = {
  searchParams: Promise<{ reason?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await currentSession({ allowPendingPassword: true });
  if (session) redirect(session.mustChangePassword ? "/change-password" : destinationForRole(session.role));

  const { reason } = await searchParams;
  return <LoginForm sessionEnded={reason === "session-ended"} />;
}
