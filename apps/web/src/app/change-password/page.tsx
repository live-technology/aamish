import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/change-password-form";
import { currentSession } from "@/lib/auth";
import { destinationForRole } from "@/lib/auth-navigation";

export default async function ChangePasswordPage() {
  const session = await currentSession({ allowPendingPassword: true });
  if (!session) redirect("/login");
  if (!session.mustChangePassword) redirect(destinationForRole(session.role));
  return <ChangePasswordForm />;
}
