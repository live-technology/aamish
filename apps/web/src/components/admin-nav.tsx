"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, CalendarDays, ChartNoAxesColumn, LogOut, PackageOpen, Star } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminNav({ active }: { active: "enterprises" | "packages" | "calendar" | "operations" | "quality" }) {
  const router = useRouter();
  return <aside className="admin-sidebar"><Image src="/brand/amish-logo-01.png" alt="Aamish" width={130} height={44} priority /><p>Aamish Operations</p><nav><Link className={active === "enterprises" ? "active" : ""} href="/admin"><Building2 size={17} /> Enterprises</Link><Link className={active === "packages" ? "active" : ""} href="/admin/packages"><PackageOpen size={17} /> Packages</Link><Link className={active === "calendar" ? "active" : ""} href="/admin/calendar"><CalendarDays size={17} /> Menu calendar</Link><Link className={active === "operations" ? "active" : ""} href="/admin/operations"><ChartNoAxesColumn size={17} /> Kitchen operations</Link><Link className={active === "quality" ? "active" : ""} href="/admin/quality"><Star size={17} /> Quality & reviews</Link></nav><button onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => router.push("/login"))}><LogOut size={16} /> Sign out</button></aside>;
}
