import Link from "next/link";
import { ArrowRight, Building2, CalendarCheck2, ChefHat, CircleAlert, MapPin, MessageSquareText, PackageCheck, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/ui/app-shell";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { superAdminNavigation } from "@/lib/super-admin-navigation";
import styles from "./admin-experience.module.css";

export type AdminOverviewMetrics = {
  enterprise_count: number;
  location_count: number;
  active_menu_count: number;
  upcoming_service_count: number;
  meals_today: number;
  open_quality_count: number;
  new_feedback_count: number;
};

export type RecentEnterprise = {
  id: string;
  name: string;
  status: string;
  created_at: string;
  location_count: number;
};

export function AdminOverview({ fullName, metrics, recentEnterprises }: { fullName: string; metrics: AdminOverviewMetrics; recentEnterprises: RecentEnterprise[] }) {
  const hasEnterprise = metrics.enterprise_count > 0;
  const readiness = [
    { icon: Building2, title: "Organizations", value: `${metrics.enterprise_count} active`, detail: `${metrics.location_count} delivery locations configured`, href: "/admin/organizations", ready: hasEnterprise },
    { icon: PackageCheck, title: "Menu library", value: `${metrics.active_menu_count} active`, detail: metrics.active_menu_count ? "Ready to schedule" : "Create an active package next", href: "/admin/menus", ready: metrics.active_menu_count > 0 },
    { icon: CalendarCheck2, title: "Upcoming service", value: `${metrics.upcoming_service_count} published`, detail: metrics.upcoming_service_count ? "Future meal days are visible" : "No future service is published", href: "/admin/calendar", ready: metrics.upcoming_service_count > 0 },
  ];

  return <AppShell workspace="Aamish operations" fullName={fullName} roleLabel="Aamish administrator" currentPath="/admin" navigation={superAdminNavigation}>
    <PageHeader eyebrow="Operations overview" title={`Good ${dhakaGreeting()}, ${firstName(fullName)}.`} description="See what is ready for service and where the team needs to act next." actions={<Link className={styles.primaryLink} href="/admin/organizations"><Building2 size={17} aria-hidden="true" />{hasEnterprise ? "Manage organizations" : "Add first enterprise"}</Link>} />

    {!hasEnterprise ? <EmptyState icon={<Building2 size={25} aria-hidden="true" />} title="Start with your first enterprise" description="There is no operational data yet. Add an enterprise, at least one delivery location, and its first administrator before creating menus or publishing service." action={<Link className={styles.primaryLink} href="/admin/organizations?new=enterprise">Add enterprise <ArrowRight size={16} aria-hidden="true" /></Link>} /> : <>
      <section className={styles.metricGrid} aria-label="Today’s operational summary">
        <Metric icon={ChefHat} value={metrics.meals_today} label="Meals confirmed today" />
        <Metric icon={MapPin} value={metrics.location_count} label="Active delivery locations" />
        <Metric icon={ShieldAlert} value={metrics.open_quality_count} label="Open quality reports" />
        <Metric icon={MessageSquareText} value={metrics.new_feedback_count} label="New product feedback" />
      </section>

      <div className={styles.overviewGrid}>
        <section>
          <div className={styles.sectionHeading}><div><p>Service readiness</p><h2>Move each stage toward ready</h2></div></div>
          <div className={styles.readinessList}>{readiness.map(({ icon: Icon, title, value, detail, href, ready }) => <Link className={styles.readinessItem} href={href} key={title}><span className={styles.readinessIcon}><Icon size={19} aria-hidden="true" /></span><div><strong>{title}</strong><span>{detail}</span></div><div className={styles.readinessValue}><StatusBadge tone={ready ? "success" : "warning"}>{ready ? "Ready" : "Needs setup"}</StatusBadge><b>{value}</b></div><ArrowRight size={17} aria-hidden="true" /></Link>)}</div>
        </section>

        <section>
          <div className={styles.sectionHeading}><div><p>Recently onboarded</p><h2>Organizations</h2></div><Link href="/admin/organizations">View all</Link></div>
          <Card className={styles.recentList} padded={false}>{recentEnterprises.map((enterprise) => <article className={styles.recentItem} key={enterprise.id}><span>{enterprise.name.slice(0, 2).toUpperCase()}</span><div><strong>{enterprise.name}</strong><small>{enterprise.location_count} delivery {enterprise.location_count === 1 ? "location" : "locations"}</small></div><StatusBadge tone={enterprise.status === "ACTIVE" ? "success" : "neutral"}>{enterprise.status}</StatusBadge></article>)}</Card>
        </section>
      </div>

      {(metrics.open_quality_count > 0 || metrics.new_feedback_count > 0) && <div className={styles.attention}><CircleAlert size={19} aria-hidden="true" /><div><strong>Items need review</strong><span>Quality reports and tester feedback remain separate operational queues.</span></div><Link href={metrics.open_quality_count > 0 ? "/admin/quality" : "/admin/feedback"}>Open queue</Link></div>}
    </>}
  </AppShell>;
}

function Metric({ icon: Icon, value, label }: { icon: typeof ChefHat; value: number; label: string }) {
  return <Card className={styles.metricCard}><span className={styles.metricIcon}><Icon size={19} aria-hidden="true" /></span><div><strong>{value}</strong><span>{label}</span></div></Card>;
}

function firstName(fullName: string) { return fullName.trim().split(/\s+/)[0] || "there"; }
function dhakaGreeting() { const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", hour: "2-digit", hour12: false }).format(new Date())); return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"; }
