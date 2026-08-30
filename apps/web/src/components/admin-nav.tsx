"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, CalendarDays, ChartNoAxesColumn, LogOut, PackageOpen, Star } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminNav({ active }: { active: "enterprises" | "packages" | "calendar" | "operations" | "quality" }) {
  const router = useRouter();
  const links = [
    { key: "enterprises", href: "/admin", label: "Enterprises", icon: Building2 },
    { key: "packages", href: "/admin/packages", label: "Packages", icon: PackageOpen },
    { key: "calendar", href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
    { key: "operations", href: "/admin/operations", label: "Operations", icon: ChartNoAxesColumn },
    { key: "quality", href: "/admin/quality", label: "Quality", icon: Star },
  ] as const;
  const signOut = () => fetch("/api/auth/logout", { method: "POST" }).then(() => router.push("/login"));

  return <>
    <aside className="admin-sidebar"><Image src="/brand/amish-logo-01.png" alt="Aamish" width={130} height={44} priority /><p>Aamish Operations</p><nav>{links.map(({ key, href, label, icon: Icon }) => <Link className={active === key ? "active" : ""} href={href} key={key}><Icon size={17} /> {label === "Calendar" ? "Menu calendar" : label === "Operations" ? "Kitchen operations" : label === "Quality" ? "Quality & reviews" : label}</Link>)}</nav><button onClick={signOut}><LogOut size={16} /> Sign out</button></aside>
    <div className="admin-mobile-shell"><div className="admin-mobile-brand"><Image src="/brand/amish-logo-01.png" alt="Aamish" width={100} height={34} priority /><button onClick={signOut} aria-label="Sign out"><LogOut size={17} /></button></div><nav aria-label="Aamish admin navigation">{links.map(({ key, href, label, icon: Icon }) => <Link className={active === key ? "active" : ""} href={href} key={key}><Icon size={16} /><span>{label}</span></Link>)}</nav></div>
  </>;
}
