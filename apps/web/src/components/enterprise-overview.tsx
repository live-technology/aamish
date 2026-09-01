import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Star, Users } from "lucide-react";
import { AppShell } from "@/components/ui/app-shell";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { enterpriseNavigation } from "@/lib/enterprise-navigation";
import styles from "./enterprise-experience.module.css";

export type EnterpriseOverviewMetrics = {
  employee_count: number;
  location_count: number;
  today_orders: number;
  upcoming_meal_days: number;
  average_rating: number | null;
};

export type EnterpriseUpcomingMeal = {
  schedule_id: string;
  schedule_date: string;
  status: string;
  order_count: number;
};

export function EnterpriseOverview({ enterpriseName, fullName, metrics, upcomingMeals }: { enterpriseName: string; fullName: string; metrics: EnterpriseOverviewMetrics; upcomingMeals: EnterpriseUpcomingMeal[] }) {
  return <AppShell workspace={enterpriseName} fullName={fullName} roleLabel="Enterprise administrator" currentPath="/enterprise" navigation={enterpriseNavigation}>
    <PageHeader eyebrow="Enterprise overview" title={`Welcome, ${firstName(fullName)}.`} description="See today’s confirmed meals and what is scheduled next for your organization." actions={<Link className={styles.primaryLink} href="/enterprise/meals">View meal plan <ArrowRight size={16} aria-hidden="true" /></Link>} />

    <section className={styles.metrics} aria-label="Organization meal summary">
      <Metric icon={CalendarDays} value={metrics.today_orders} label="Meals confirmed today" />
      <Metric icon={Users} value={metrics.employee_count} label="Employees on roster" />
      <Metric icon={MapPin} value={metrics.location_count} label="Delivery locations" />
      <Metric icon={Star} value={metrics.average_rating === null ? "—" : metrics.average_rating.toFixed(1)} label="30-day average rating" />
    </section>

    <div className={styles.overviewGrid}>
      <section>
        <div className={styles.sectionHeading}><div><p>Next services</p><h2>{metrics.upcoming_meal_days} upcoming meal {metrics.upcoming_meal_days === 1 ? "day" : "days"}</h2></div><Link href="/enterprise/meals">View all</Link></div>
        {upcomingMeals.length === 0 ? <EmptyState icon={<CalendarDays size={25} aria-hidden="true" />} title="No upcoming service" description="Aamish has not published a meal service for your organization in the next 14 days." /> : <Card className={styles.upcomingList} padded={false}>{upcomingMeals.map((meal) => <article className={styles.upcomingRow} key={meal.schedule_id}><time dateTime={meal.schedule_date}><strong>{formatDay(meal.schedule_date)}</strong><span>{formatDate(meal.schedule_date)}</span></time><div><strong>{meal.order_count} confirmed meals</strong><span>Across active delivery locations and menu options</span></div><StatusBadge tone={meal.status === "PUBLISHED" ? "success" : "neutral"}>{meal.status}</StatusBadge></article>)}</Card>}
      </section>

      <Card className={styles.todayCard}>
        <span className={styles.todayIcon}><CalendarDays size={22} aria-hidden="true" /></span>
        <p>Today</p>
        <strong>{metrics.today_orders}</strong>
        <h2>confirmed meals</h2>
        <span>{metrics.today_orders > 0 ? "Open the meal plan for the location and option breakdown." : "No employees are currently receiving a scheduled meal today."}</span>
        <Link href="/enterprise/meals">Open meal plan <ArrowRight size={15} aria-hidden="true" /></Link>
      </Card>
    </div>
  </AppShell>;
}

function Metric({ icon: Icon, value, label }: { icon: typeof CalendarDays; value: number | string; label: string }) { return <Card className={styles.metric}><span><Icon size={18} aria-hidden="true" /></span><div><strong>{value}</strong><small>{label}</small></div></Card>; }
function firstName(value: string) { return value.trim().split(/\s+/)[0] || "there"; }
function parseDate(value: string) { return new Date(`${value}T00:00:00`); }
function formatDay(value: string) { return parseDate(value).toLocaleDateString("en-BD", { weekday: "short" }); }
function formatDate(value: string) { return parseDate(value).toLocaleDateString("en-BD", { day: "numeric", month: "short" }); }
