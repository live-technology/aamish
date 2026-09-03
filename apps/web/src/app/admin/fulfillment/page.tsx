import { redirect } from "next/navigation";
import { OperationsDashboard } from "@/components/operations-dashboard";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/auth-navigation";
import { presetRange, validFulfillmentRange } from "@/lib/fulfillment";
import { listFulfillmentRows } from "@/lib/fulfillment-query";

export default async function FulfillmentPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const session = await currentSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role !== "SUPER_ADMIN") redirect(session.role === "ENTERPRISE_ADMIN" ? "/enterprise" : "/employee");
  const params = await searchParams;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const initialRange = validFulfillmentRange(params.from, params.to) || presetRange("TODAY", today);
  const rows = await listFulfillmentRows(initialRange.from, initialRange.to);
  return <OperationsDashboard fullName={session.fullName} initialRows={[...rows]} initialRange={initialRange} />;
}
