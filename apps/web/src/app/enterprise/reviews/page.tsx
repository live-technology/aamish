import { redirect } from "next/navigation";
import { MealQualityInsights } from "@/components/meal-quality-insights";
import { AppShell } from "@/components/ui/app-shell";
import { PageHeader } from "@/components/ui/primitives";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/auth-navigation";
import { db } from "@/lib/db";
import { enterpriseNavigation } from "@/lib/enterprise-navigation";
import { qualityFiltersFrom } from "@/lib/quality-insights";
import { loadQualityInsights } from "@/lib/quality-insights-query";

export default async function EnterpriseReviewsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; location?: string; menu?: string; rating?: string }> }) {
  const session = await currentSession(); if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role === "SUPER_ADMIN") redirect("/admin"); if (session.role === "EMPLOYEE") redirect("/employee"); if (!session.enterpriseId) redirect("/login");
  const enterpriseId = session.enterpriseId;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const filters = qualityFiltersFrom(await searchParams, today);
  filters.enterprise = "";
  const [enterpriseRows, initialInsights] = await Promise.all([
    db()<{ name: string }[]>`SELECT name FROM enterprises WHERE id=${enterpriseId}`,
    loadQualityInsights(filters, enterpriseId),
  ]);
  const enterpriseName = enterpriseRows[0]?.name || "Enterprise";
  return <AppShell workspace={enterpriseName} fullName={session.fullName} roleLabel="Enterprise administrator" currentPath="/enterprise/reviews" navigation={enterpriseNavigation}><PageHeader eyebrow="Meal quality" title="Quality insights" description="Understand satisfaction, response patterns, and employee feedback across your locations and menus." /><MealQualityInsights initialData={initialInsights} role="ENTERPRISE_ADMIN" /></AppShell>;
}
