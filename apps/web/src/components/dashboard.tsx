"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, CalendarDays, ChevronRight, Clock3, MapPin, Star, UtensilsCrossed } from "lucide-react";
import { useState } from "react";

type Role = "admin" | "enterprise" | "employee";

const content = {
  admin: { workspace: "Aamish Operations", title: "Good morning, Aamish team.", description: "The lunch operation is on track. Two locations are ready for kitchen handoff." },
  enterprise: { workspace: "Live Technologies", title: "Your lunch roster, at a glance.", description: "Keep your team, delivery locations, and daily allocation in one clear view." },
  employee: { workspace: "Employee workspace", title: "Lunch is looking good today.", description: "Your meal is reserved. You can update your preference before the kitchen cutoff." },
} as const;
const locations = [["Notun Bazar", "20"], ["Uttarkhan", "10"], ["Baridhara", "8"]];

function Metric({ label, value, note, warm }: { label: string; value: string; note: string; warm?: boolean }) {
  return <article className={warm ? "metric metric-warm" : "metric"}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

export function Dashboard({ role }: { role: Role }) {
  const [optedIn, setOptedIn] = useState(true);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const isEmployee = role === "employee";
  const details = content[role];
  function togglePreference() {
    const next = !optedIn;
    setOptedIn(next); setMessage(next ? "Your lunch is restored and included in the kitchen count." : "Today’s lunch is skipped. The kitchen count has been updated.");
    console.info(JSON.stringify({ service: "aamish-web", event: "meal.preference.changed", optedIn: next, timestamp: new Date().toISOString() }));
  }
  return <div className="app-shell">
    <aside className="sidebar"><Link className="brand" href="/admin"><Image src="/brand/amish-logo-01.png" alt="Aamish" width={126} height={42} priority /></Link><p className="workspace-label">{details.workspace}</p><nav className="nav-list"><a className="active" href="#overview">Overview</a><a href="#menu">Menu calendar</a><a href="#allocation">Daily allocation</a><a href="#feedback">Feedback &amp; quality</a></nav><div className="sidebar-bottom"><div className="help"><b>Need a hand?</b><span>Our operations desk is here for your lunch service.</span><button>Contact support <ChevronRight size={14} /></button></div><div className="profile"><span>SA</span><div><b>Samira Ahmed</b><small>{isEmployee ? "Live Technologies" : "Operations lead"}</small></div></div></div></aside>
    <main className="main-content"><header className="topbar"><div className="portal-switch"><Link className={role === "admin" ? "selected" : ""} href="/admin">Aamish Ops</Link><Link className={role === "enterprise" ? "selected" : ""} href="/enterprise">Enterprise</Link><Link className={role === "employee" ? "selected" : ""} href="/employee">Employee</Link></div><div className="top-actions"><span><CalendarDays size={16} /> 30 Aug 2026</span><button aria-label="Notifications"><Bell size={19} /></button></div></header>
      <div className="page-content" id="overview"><section className="intro"><div><p>MONDAY, 30 AUGUST 2026</p><h1>{details.title}</h1><span>{details.description}</span></div><div className="cutoff"><span className="cutoff-icon"><Clock3 size={19} /></span><div><small>Today’s kitchen cutoff</small><b>10:00 AM</b></div><em><i /> Open</em></div></section>
        {!isEmployee && <section className="metric-grid"><Metric label="Active meals" value="38" note="2 employees opted out" warm /><Metric label="Delivery locations" value="3" note="All locations confirmed" /><Metric label="Today’s CSAT" value="4.6" note="24 reviews received" /><Metric label="Review participation" value="63%" note="Up 8% from last week" /></section>}
        <section className={isEmployee ? "split split-employee" : "split"}><article className="panel meal-panel" id="menu"><div className="panel-title"><div><p>TODAY’S MENU</p><h2>Special Bengali Polao &amp; Sonali Roast</h2></div><span className="tag">Chef’s selection</span></div><div className="meal-body"><div className="meal-art"><div className="plate"><i /><b /><span /></div></div><div className="meal-copy"><p>Fragrant chinigura polao, Sonali chicken roast, boiled egg, cucumber salad, and sweet curd.</p><div className="meal-points"><span><UtensilsCrossed size={16} /> Regular lunch</span><span><MapPin size={16} /> Delivered warm</span></div>{isEmployee && <><div className="preference"><div><b>{optedIn ? "Your lunch is reserved" : "You have skipped today’s lunch"}</b><span>{optedIn ? "Delivered to Notun Bazar Office" : "Restore it before the 10:00 AM cutoff"}</span></div><button onClick={togglePreference} className={optedIn ? "switch on" : "switch"} aria-label="Toggle meal preference"><i /></button></div>{message && <div className="message">✓ {message}</div>}</>}</div></div></article>
          {isEmployee ? <article className="panel review-panel" id="feedback"><div className="panel-title"><div><p>AFTER LUNCH</p><h2>How was your meal?</h2></div></div><span className="review-copy">Your feedback goes directly to the kitchen team.</span><div className="stars">{[1,2,3,4,5].map((star) => <button key={star} className={star <= rating ? "lit" : ""} onClick={() => { setRating(star); console.info(JSON.stringify({ service: "aamish-web", event: "review.rating.selected", rating: star })); }} aria-label={`${star} star rating`}><Star size={23} fill="currentColor" /></button>)}</div><button className="primary" onClick={() => setMessage(rating ? `Thanks — your ${rating}-star review is ready for details.` : "Choose a rating first.")}>Continue to review <ChevronRight size={17} /></button></article> : <article className="panel allocation" id="allocation"><div className="panel-title"><div><p>KITCHEN HANDOFF</p><h2>Live meal allocation</h2></div><button className="outline">Export sheet</button></div><div className="table"><div className="row head"><span>MENU</span><span>NOTUN BAZAR</span><span>UTTARKHAN</span><span>BARIDHARA</span><span>TOTAL</span></div><div className="row"><b>Polao &amp; Sonali Roast</b><span>20</span><span>10</span><span>8</span><b>38</b></div></div><div className="live-note"><i /> Counts refresh when an employee updates their preference.</div></article>}</section>
        {!isEmployee && <section className="bottom-grid"><article className="panel locations"><div className="panel-title"><div><p>DISPATCH READINESS</p><h2>Location status</h2></div><button className="link-button">Open operations <ChevronRight size={16} /></button></div>{locations.map(([name, count]) => <div className="location" key={name}><span><MapPin size={18} /></span><div><b>{name}</b><small>{count} meals assigned</small></div><em><i /> Ready</em></div>)}</article><article className="panel feedback"><div className="panel-title"><div><p>QUALITY PULSE</p><h2>Feedback worth reviewing</h2></div><div className="score">4.6 <Star size={16} fill="currentColor" /></div></div><div className="feedback-line"><span>TR</span><p><b>Tanvir Rahman</b><small>“Food was fresh and warm. Great portion size.”</small></p><strong>5.0</strong></div><div className="feedback-line flagged"><span>NA</span><p><b>Nusrat Ahmed</b><small>“Vegetable was slightly undercooked.”</small></p><strong>2.0</strong></div></article></section>}</div></main>
  </div>;
}
